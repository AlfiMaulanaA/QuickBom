import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const g = await requireAdmin(req)
  if (!g.ok) return g.response
  const rows = await prisma.component.findMany({
    include: { category: true },
    orderBy: { itemCode: 'asc' },
  })
  const data = rows.map(r => ({
    itemCode: r.itemCode,
    name: r.name,
    description: r.description ?? '',
    uom: r.uom,
    manufacturer: r.manufacturer ?? '',
    categoryCode: r.category.code,
    currentUnitCost: Number(r.currentUnitCost),
    currentListPrice: Number(r.currentListPrice),
    isService: r.isService,
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Components')
  const out = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(out, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=components.xlsx',
    },
  })
}
