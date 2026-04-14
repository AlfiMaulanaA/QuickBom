import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import { productSchema } from '@/lib/validators/admin'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const row = await prisma.product.findUnique({
    where: { id: Number(params.id) },
    include: { subGroup: { include: { group: true } } },
  })
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const body = await req.json().catch(() => null)
  const p = productSchema.partial().safeParse(body)
  if (!p.success) {
    return NextResponse.json({ error: 'Invalid', issues: p.error.issues }, { status: 400 })
  }
  const data: any = { ...p.data }
  if (p.data.inputSpec !== undefined) {
    data.inputSpecJson = p.data.inputSpec
    delete data.inputSpec
  }
  const updated = await prisma.product.update({
    where: { id: Number(params.id) },
    data,
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const configs = await prisma.configuration.count({
    where: { productId: Number(params.id) },
  })
  if (configs > 0) {
    return NextResponse.json({ error: 'Product has configurations' }, { status: 409 })
  }
  await prisma.product.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
