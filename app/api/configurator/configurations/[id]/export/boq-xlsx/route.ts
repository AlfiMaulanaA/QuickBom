import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildBoqXlsx } from '@/lib/configurator/exports/boq-xlsx'
import { readBrandingFromEnv } from '@/lib/configurator/exports/branding'
import { isAdminRole } from '@/lib/auth/admin'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const config = await prisma.configuration.findUnique({
    where: { id: Number(params.id) },
    include: {
      lines: { orderBy: { sortOrder: 'asc' } },
      product: true,
    },
  })
  if (!config) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (config.userId !== auth.userId && !isAdminRole(auth.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (config.status === 'DRAFT') {
    return NextResponse.json(
      { error: 'Generate quote before exporting' },
      { status: 409 },
    )
  }

  const subtotalCost = config.lines.reduce(
    (s, l) => s + Number(l.qty) * Number(l.unitCost),
    0,
  )
  const subtotalList = config.lines.reduce((s, l) => s + Number(l.lineTotal), 0)
  const marginPct =
    subtotalList === 0 ? 0 : ((subtotalList - subtotalCost) / subtotalList) * 100
  const branding = readBrandingFromEnv()

  const buf = buildBoqXlsx({
    configurationId: config.id,
    productCode: config.product.code,
    productName: config.product.name,
    lines: config.lines.map(l => ({
      itemCode: l.itemCode,
      name: l.name,
      categoryCode: l.categoryCode,
      qty: Number(l.qty),
      uom: l.uom,
      unitCost: Number(l.unitCost),
      unitListPrice: Number(l.unitListPrice),
      lineTotal: Number(l.lineTotal),
      source: l.source,
      remarks: l.remarks,
    })),
    subtotalCost,
    subtotalList,
    marginPct,
    currency: branding.currency,
  })

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return new NextResponse(buf, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=boq-${config.id}-${date}.xlsx`,
    },
  })
}
