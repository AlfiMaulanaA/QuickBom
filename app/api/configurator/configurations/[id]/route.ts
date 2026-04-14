import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { patchConfigSchema } from '@/lib/validators/configurator'

async function load(id: number, userId: string) {
  return prisma.configuration.findFirst({ where: { id, userId } })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const row = await load(Number(params.id), auth.userId)
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const existing = await load(Number(params.id), auth.userId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Cannot edit non-draft configuration' }, { status: 409 })
  }
  const body = await req.json().catch(() => null)
  const parsed = patchConfigSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }
  const update: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) update.name = parsed.data.name
  if (parsed.data.inputs !== undefined) update.inputsJson = parsed.data.inputs
  if (parsed.data.selections !== undefined) update.selectionsJson = parsed.data.selections
  if (parsed.data.adjustments !== undefined) update.adjustmentsJson = parsed.data.adjustments
  const updated = await prisma.configuration.update({ where: { id: existing.id }, data: update })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const existing = await load(Number(params.id), auth.userId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Cannot delete non-draft' }, { status: 409 })
  }
  await prisma.configuration.delete({ where: { id: existing.id } })
  return NextResponse.json({ ok: true })
}
