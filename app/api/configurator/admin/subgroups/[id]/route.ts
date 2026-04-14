import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import { subGroupSchema } from '@/lib/validators/admin'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const body = await req.json().catch(() => null)
  const p = subGroupSchema.partial().safeParse(body)
  if (!p.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  try {
    const updated = await prisma.productSubGroup.update({
      where: { id: Number(params.id) },
      data: p.data,
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const count = await prisma.product.count({
    where: { subGroupId: Number(params.id) },
  })
  if (count > 0) return NextResponse.json({ error: 'Has products' }, { status: 409 })
  await prisma.productSubGroup.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
