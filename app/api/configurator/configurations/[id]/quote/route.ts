import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { price } from '@/lib/configurator'
import type { Selection, Adjustment, InputScope } from '@/lib/configurator/types'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const existing = await prisma.configuration.findFirst({
    where: { id: Number(params.id), userId: auth.userId },
    include: { lines: true },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.status === 'QUOTED' || existing.status === 'APPROVED' || existing.status === 'LOCKED') {
    return NextResponse.json(existing)
  }

  const result = await price({
    productId: existing.productId,
    inputs: existing.inputsJson as InputScope,
    selections: existing.selectionsJson as unknown as Selection[],
    adjustments: existing.adjustmentsJson as unknown as Adjustment[],
  })

  if (result.ruleViolations.some(v => v.ruleType !== 'SUGGESTS')) {
    return NextResponse.json(
      { error: 'Cannot quote with unresolved rule violations', violations: result.ruleViolations },
      { status: 409 },
    )
  }

  const updated = await prisma.$transaction(async tx => {
    await tx.configurationLine.deleteMany({ where: { configurationId: existing.id } })
    await tx.configurationLine.createMany({
      data: result.lines.map((l, i) => ({
        configurationId: existing.id,
        componentId: l.componentId > 0 ? l.componentId : null,
        itemCode: l.itemCode,
        name: l.name,
        categoryCode: l.categoryCode,
        uom: l.uom,
        qty: l.qty,
        unitCost: l.unitCost,
        unitListPrice: l.unitListPrice,
        lineTotal: l.lineTotal,
        source: l.source,
        isService: l.isService,
        formulaUsed: l.formulaUsed ?? null,
        remarks: l.remarks ?? null,
        sortOrder: i,
      })),
    })
    return tx.configuration.update({
      where: { id: existing.id },
      data: { status: 'QUOTED', quotedAt: new Date() },
      include: { lines: true },
    })
  })

  return NextResponse.json(updated)
}
