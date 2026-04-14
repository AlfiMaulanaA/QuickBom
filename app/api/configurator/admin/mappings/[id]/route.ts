import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import { mappingSchema } from '@/lib/validators/admin'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const body = await req.json().catch(() => null)
  const p = mappingSchema.partial().safeParse(body)
  if (!p.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  const updated = await prisma.productComponentMapping.update({
    where: { id: Number(params.id) },
    data: p.data,
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  await prisma.productComponentMapping.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
