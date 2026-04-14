import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import { componentSchema } from '@/lib/validators/admin'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const row = await prisma.component.findUnique({
    where: { id: Number(params.id) },
    include: { category: true },
  })
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const body = await req.json().catch(() => null)
  const p = componentSchema.partial().safeParse(body)
  if (!p.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  const updated = await prisma.component.update({
    where: { id: Number(params.id) },
    data: p.data,
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const id = Number(params.id)
  const maps = await prisma.productComponentMapping.count({ where: { componentId: id } })
  const rulesFrom = await prisma.componentRule.count({ where: { sourceComponentId: id } })
  const rulesTo = await prisma.componentRule.count({ where: { targetComponentId: id } })
  if (maps + rulesFrom + rulesTo > 0) {
    return NextResponse.json({ error: 'Component in use' }, { status: 409 })
  }
  await prisma.component.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
