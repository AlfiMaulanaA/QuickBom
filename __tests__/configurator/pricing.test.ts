import { describe, it, expect } from 'vitest'
import { priceLines } from '@/lib/configurator/pricing'
import type { PricedLine, Adjustment } from '@/lib/configurator/types'

const ln = (componentId: number, qty: number, unitCost: number, unitListPrice: number, categoryCode = 'MECH'): PricedLine => ({
  componentId, itemCode: `C${componentId}`, name: `C${componentId}`,
  categoryCode, uom: 'EA', qty, unitCost, unitListPrice, lineTotal: 0,
  source: 'OPTIONAL', isService: false,
})

describe('priceLines — basic math', () => {
  it('computes lineTotal = qty * unitListPrice', () => {
    const result = priceLines([ln(1, 2, 100, 150)], [])
    expect(result.lines[0].lineTotal).toBe(300)
  })

  it('sums subtotals and margin', () => {
    const result = priceLines([ln(1, 2, 100, 150), ln(2, 1, 50, 80)], [])
    expect(result.subtotalList).toBe(380)
    expect(result.subtotalCost).toBe(250)
    expect(result.marginAmount).toBe(130)
    expect(Math.round(result.marginPct * 10) / 10).toBe(34.2)
  })

  it('returns zeros on empty lines', () => {
    const result = priceLines([], [])
    expect(result.subtotalList).toBe(0)
    expect(result.marginPct).toBe(0)
  })
})

describe('priceLines — LINE adjustments', () => {
  it('applies LINE PCT adjustment (10% off a line)', () => {
    const adj: Adjustment[] = [{ scope: 'LINE', targetId: 1, adjustmentType: 'PCT', value: -10, reason: 'promo' }]
    const result = priceLines([ln(1, 2, 100, 150)], adj)
    expect(result.lines[0].lineTotal).toBe(270)
  })

  it('applies LINE FIXED adjustment', () => {
    const adj: Adjustment[] = [{ scope: 'LINE', targetId: 1, adjustmentType: 'FIXED', value: -50, reason: 'negotiated' }]
    const result = priceLines([ln(1, 2, 100, 150)], adj)
    expect(result.lines[0].lineTotal).toBe(250)
  })
})

describe('priceLines — CATEGORY adjustments', () => {
  it('applies CATEGORY PCT using reason as category code', () => {
    const adj: Adjustment[] = [{ scope: 'CATEGORY', adjustmentType: 'PCT', value: -5, reason: 'MECH' }]
    const lines = [ln(1, 2, 100, 150, 'MECH'), ln(2, 1, 50, 80, 'ELEC')]
    const result = priceLines(lines, adj)
    // MECH: 300 * 0.95 = 285; ELEC unaffected: 80
    expect(result.lines[0].lineTotal).toBe(285)
    expect(result.lines[1].lineTotal).toBe(80)
    expect(result.subtotalList).toBe(365)
  })
})

describe('priceLines — TOTAL adjustments', () => {
  it('applies TOTAL PCT adjustment to subtotal', () => {
    const adj: Adjustment[] = [{ scope: 'TOTAL', adjustmentType: 'PCT', value: -5, reason: 'deal discount' }]
    const result = priceLines([ln(1, 2, 100, 150)], adj)
    expect(result.subtotalList).toBe(285)
  })

  it('applies TOTAL FIXED adjustment', () => {
    const adj: Adjustment[] = [{ scope: 'TOTAL', adjustmentType: 'FIXED', value: -50, reason: 'round down' }]
    const result = priceLines([ln(1, 2, 100, 150)], adj)
    expect(result.subtotalList).toBe(250)
  })
})

describe('priceLines — ADD_ITEM / REMOVE_ITEM', () => {
  it('ADD_ITEM adjustment adds a synthetic ADDED line', () => {
    const adj: Adjustment[] = [{
      scope: 'TOTAL', adjustmentType: 'ADD_ITEM', value: 500, reason: 'marine packing'
    }]
    const result = priceLines([ln(1, 1, 100, 150)], adj)
    expect(result.lines.some(l => l.source === 'ADDED' && l.lineTotal === 500)).toBe(true)
    expect(result.subtotalList).toBe(650)
  })

  it('REMOVE_ITEM adjustment with targetId removes a line', () => {
    const adj: Adjustment[] = [{ scope: 'LINE', targetId: 1, adjustmentType: 'REMOVE_ITEM', value: 0, reason: 'negotiated out' }]
    const result = priceLines([ln(1, 2, 100, 150), ln(2, 1, 50, 80)], adj)
    expect(result.lines.find(l => l.componentId === 1)).toBeUndefined()
    expect(result.subtotalList).toBe(80)
  })
})
