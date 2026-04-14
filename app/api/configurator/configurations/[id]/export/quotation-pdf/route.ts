import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildQuotationPdf } from '@/lib/configurator/exports/quotation-pdf'
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

  const inputs = (config.inputsJson ?? {}) as Record<string, unknown>
  const inputsSummary = Object.entries(inputs).map(([k, v]) => `${k}=${v}`).join(', ')

  const buf = await buildQuotationPdf({
    configurationId: config.id,
    productCode: config.product.code,
    productName: config.product.name,
    draftName: config.name,
    inputsSummary,
    lines: config.lines.map(l => ({
      itemCode: l.itemCode,
      name: l.name,
      categoryCode: l.categoryCode,
      qty: Number(l.qty),
      uom: l.uom,
      unitListPrice: Number(l.unitListPrice),
      lineTotal: Number(l.lineTotal),
      source: l.source,
    })),
    subtotalList: config.lines.reduce((s, l) => s + Number(l.lineTotal), 0),
    branding: readBrandingFromEnv(),
  })

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=quotation-${config.id}-${date}.pdf`,
    },
  })
}
