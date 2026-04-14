import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import { ruleSchema, conditionValid } from '@/lib/validators/admin'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const rows = await prisma.componentRule.findMany({
    where: { productId: Number(params.id) },
    orderBy: { id: 'asc' },
  })
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const body = await req.json().catch(() => null)
  const p = ruleSchema.safeParse(body)
  if (!p.success) {
    return NextResponse.json({ error: 'Invalid', issues: p.error.issues }, { status: 400 })
  }
  if (p.data.condition) {
    const product = await prisma.product.findUnique({
      where: { id: Number(params.id) },
    })
    const spec = (Array.isArray(product?.inputSpecJson) ? product!.inputSpecJson : []) as any[]
    const v = conditionValid(p.data.condition, spec)
    if (!v.ok) {
      return NextResponse.json({ error: 'Invalid condition', message: v.message }, { status: 400 })
    }
  }
  const created = await prisma.componentRule.create({
    data: {
      productId: Number(params.id),
      ruleType: p.data.ruleType,
      sourceComponentId: p.data.sourceComponentId,
      targetComponentId: p.data.targetComponentId,
      condition: p.data.condition ?? null,
    },
  })
  return NextResponse.json(created, { status: 201 })
}
