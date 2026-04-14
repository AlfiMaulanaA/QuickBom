import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import { productSchema } from '@/lib/validators/admin'

export async function GET(req: NextRequest) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const includeInactive = req.nextUrl.searchParams.get('includeInactive') === 'true'
  const where = includeInactive ? {} : { isActive: true }
  const rows = await prisma.product.findMany({
    where,
    include: { subGroup: { include: { group: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const body = await req.json().catch(() => null)
  const p = productSchema.safeParse(body)
  if (!p.success) {
    return NextResponse.json({ error: 'Invalid', issues: p.error.issues }, { status: 400 })
  }
  const data: any = { ...p.data }
  if (p.data.inputSpec !== undefined) {
    data.inputSpecJson = p.data.inputSpec
    delete data.inputSpec
  }
  const created = await prisma.product.create({ data })
  return NextResponse.json(created, { status: 201 })
}
