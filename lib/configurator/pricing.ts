import type { Adjustment, PricedLine } from './types'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function priceLines(
  input: PricedLine[],
  adjustments: Adjustment[] = [],
): {
  lines: PricedLine[]
  subtotalList: number
  subtotalCost: number
  marginAmount: number
  marginPct: number
} {
  let lines: PricedLine[] = input.map(l => ({ ...l, lineTotal: round2(l.qty * l.unitListPrice) }))

  // Phase 1: ADD_ITEM / REMOVE_ITEM
  for (const adj of adjustments) {
    if (adj.adjustmentType === 'REMOVE_ITEM' && adj.scope === 'LINE' && adj.targetId !== undefined) {
      lines = lines.filter(l => l.componentId !== adj.targetId)
    } else if (adj.adjustmentType === 'ADD_ITEM') {
      lines.push({
        componentId: -1 * (Math.floor(Math.random() * 1_000_000) + 1),
        itemCode: 'ADJ-' + adj.reason.slice(0, 12),
        name: adj.reason,
        categoryCode: 'SVC',
        uom: 'lot',
        qty: 1,
        unitCost: 0,
        unitListPrice: adj.value,
        lineTotal: adj.value,
        source: 'ADDED',
        isService: true,
        remarks: adj.reason,
      })
    }
  }

  // Phase 2: LINE PCT/FIXED
  for (const adj of adjustments) {
    if (adj.scope !== 'LINE') continue
    if (adj.adjustmentType !== 'PCT' && adj.adjustmentType !== 'FIXED') continue
    const idx = lines.findIndex(l => l.componentId === adj.targetId)
    if (idx < 0) continue
    if (adj.adjustmentType === 'PCT') {
      lines[idx] = { ...lines[idx], lineTotal: round2(lines[idx].lineTotal * (1 + adj.value / 100)) }
    } else {
      lines[idx] = { ...lines[idx], lineTotal: round2(lines[idx].lineTotal + adj.value) }
    }
  }

  // Phase 3: CATEGORY PCT/FIXED (category code lives in adj.reason for SP1)
  for (const adj of adjustments) {
    if (adj.scope !== 'CATEGORY') continue
    if (adj.adjustmentType !== 'PCT' && adj.adjustmentType !== 'FIXED') continue
    lines = lines.map(l => {
      if (l.categoryCode !== adj.reason) return l
      if (adj.adjustmentType === 'PCT') return { ...l, lineTotal: round2(l.lineTotal * (1 + adj.value / 100)) }
      return { ...l, lineTotal: round2(l.lineTotal + adj.value) }
    })
  }

  // Totals before TOTAL-scoped adjustments.
  let subtotalList = lines.reduce((s, l) => s + l.lineTotal, 0)
  const subtotalCost = lines.reduce((s, l) => s + l.qty * l.unitCost, 0)

  // Phase 4: TOTAL PCT/FIXED
  for (const adj of adjustments) {
    if (adj.scope !== 'TOTAL') continue
    if (adj.adjustmentType === 'PCT') subtotalList = round2(subtotalList * (1 + adj.value / 100))
    else if (adj.adjustmentType === 'FIXED') subtotalList = round2(subtotalList + adj.value)
  }

  subtotalList = round2(subtotalList)
  const marginAmount = round2(subtotalList - subtotalCost)
  const marginPct = subtotalList === 0 ? 0 : round2((marginAmount / subtotalList) * 100)

  return { lines, subtotalList, subtotalCost: round2(subtotalCost), marginAmount, marginPct }
}
