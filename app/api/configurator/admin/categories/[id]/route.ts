import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import { categorySchema } from '@/lib/validators/admin'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const body = await req.json().catch(() => null)
  const p = categorySchema.partial().safeParse(body)
  if (!p.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  try {
    const updated = await prisma.productCategory.update({
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
  const compCount = await prisma.component.count({
    where: { categoryId: Number(params.id) },
  })
  const mapCount = await prisma.productComponentMapping.count({
    where: { categoryId: Number(params.id) },
  })
  if (compCount + mapCount > 0) {
    return NextResponse.json({ error: 'Category in use' }, { status: 409 })
  }
  await prisma.productCategory.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
