import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createConfigSchema } from '@/lib/validators/configurator'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const parsed = createConfigSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }
  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } })
  if (!product || !product.isActive) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
  const created = await prisma.configuration.create({
    data: {
      productId: parsed.data.productId,
      userId: auth.userId,
      name: parsed.data.name ?? null,
    },
  })
  return NextResponse.json(created, { status: 201 })
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const mine = req.nextUrl.searchParams.get('mine') === 'true'
  if (!mine) return NextResponse.json({ error: 'Use ?mine=true' }, { status: 400 })
  const rows = await prisma.configuration.findMany({
    where: { userId: auth.userId, status: { not: 'LOCKED' } },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(rows)
}
