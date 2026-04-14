import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import { subGroupSchema } from '@/lib/validators/admin'

export async function GET(req: NextRequest) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const groupId = req.nextUrl.searchParams.get('groupId')
  const where = groupId ? { groupId: Number(groupId) } : {}
  return NextResponse.json(
    await prisma.productSubGroup.findMany({ where, orderBy: { sortOrder: 'asc' } }),
  )
}

export async function POST(req: NextRequest) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const body = await req.json().catch(() => null)
  const p = subGroupSchema.safeParse(body)
  if (!p.success) {
    return NextResponse.json({ error: 'Invalid', issues: p.error.issues }, { status: 400 })
  }
  const created = await prisma.productSubGroup.create({ data: p.data })
  return NextResponse.json(created, { status: 201 })
}
