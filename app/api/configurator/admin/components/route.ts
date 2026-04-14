import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import { componentSchema } from '@/lib/validators/admin'

export async function GET(req: NextRequest) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const where = q
    ? {
        OR: [
          { itemCode: { contains: q, mode: 'insensitive' as const } },
          { name: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {}
  const rows = await prisma.component.findMany({
    where,
    include: { category: true },
    orderBy: { itemCode: 'asc' },
    take: 500,
  })
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const body = await req.json().catch(() => null)
  const p = componentSchema.safeParse(body)
  if (!p.success) {
    return NextResponse.json({ error: 'Invalid', issues: p.error.issues }, { status: 400 })
  }
  try {
    const created = await prisma.component.create({ data: p.data })
    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'itemCode already exists' }, { status: 409 })
    }
    throw err
  }
}
