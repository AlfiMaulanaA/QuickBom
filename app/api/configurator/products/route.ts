import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { subGroup: { include: { group: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(products.map(p => ({
    id: p.id,
    code: p.code,
    name: p.name,
    brand: p.brand,
    groupCode: p.subGroup.group.code,
    groupName: p.subGroup.group.name,
    subGroupCode: p.subGroup.code,
    subGroupName: p.subGroup.name,
  })))
}
