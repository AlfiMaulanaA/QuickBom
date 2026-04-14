import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import { mappingSchema } from '@/lib/validators/admin'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const rows = await prisma.productComponentMapping.findMany({
    where: { productId: Number(params.id) },
    include: { component: { include: { category: true } }, category: true },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const body = await req.json().catch(() => null)
  const p = mappingSchema.safeParse(body)
  if (!p.success) {
    return NextResponse.json({ error: 'Invalid', issues: p.error.issues }, { status: 400 })
  }
  try {
    const created = await prisma.productComponentMapping.create({
      data: { ...p.data, productId: Number(params.id) },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Component already mapped' }, { status: 409 })
    }
    throw err
  }
}
