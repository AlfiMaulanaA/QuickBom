import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import { ruleSchema, conditionValid } from '@/lib/validators/admin'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const body = await req.json().catch(() => null)
  const p = ruleSchema.partial().safeParse(body)
  if (!p.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  if (p.data.condition) {
    const rule = await prisma.componentRule.findUnique({
      where: { id: Number(params.id) },
    })
    if (!rule) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const product = await prisma.product.findUnique({ where: { id: rule.productId } })
    const spec = (Array.isArray(product?.inputSpecJson) ? product!.inputSpecJson : []) as any[]
    const v = conditionValid(p.data.condition, spec)
    if (!v.ok) {
      return NextResponse.json({ error: 'Invalid condition', message: v.message }, { status: 400 })
    }
  }
  const updated = await prisma.componentRule.update({
    where: { id: Number(params.id) },
    data: p.data,
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  await prisma.componentRule.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
