import { describe, it, expect, beforeAll } from 'vitest'
import { price } from '@/lib/configurator'
import { prisma } from '@/lib/prisma'

let productId: number

beforeAll(async () => {
  const p = await prisma.product.findUnique({ where: { code: 'RCP-SCH-42U' } })
  if (!p) throw new Error('Run `node data/seeds/seed.js configurator` before integration tests')
  productId = p.id
})

describe('price() — RCP-Schneider worked example (§G)', () => {
  it('defaults-only priced matches mandatory-only subtotal', async () => {
    const result = await price({
      productId,
      inputs: { rackU: 42, kW: 6, offshore: false },
      selections: [],
    })
    // Mandatory: FRM 24000 + SIDE 3200 + CBL 1400 + PACK-STD 500 + PDU*2 25000 + EARTH 900 + SENSOR 4500 + QC 2500 = 62000
    expect(result.subtotalList).toBe(62000)
    expect(result.lines.every(l => l.source === 'DEFAULT-LOCKED')).toBe(true)
  })

  it('full §G selection reproduces totals (128,000–130,000 range)', async () => {
    const getId = async (code: string) =>
      (await prisma.component.findUnique({ where: { itemCode: code } }))!.id
    const optionalCodes = ['MEC-BP-1U', 'MEC-VCM', 'ELX-KVM-8', 'SVC-INST-D1', 'SVC-AMC-Y1']
    const selections = await Promise.all(
      optionalCodes.map(async code => ({
        componentId: await getId(code),
        included: true,
      })),
    )

    const result = await price({
      productId,
      inputs: { rackU: 42, kW: 6, offshore: false },
      selections,
    })

    // Expected raw list (with REQUIRES-added CAT6 qty=1 per SP1 simplification):
    // Mandatory 62,000 + BP-1U*7@350 = 2,450 + VCM*2@2800 = 5,600 + KVM 18,000
    // + INST 22,000 + AMC 9,000 + CAT6 250  = ~129,300. §G reports 128,950 (approximate).
    expect(result.subtotalList).toBeGreaterThanOrEqual(128000)
    expect(result.subtotalList).toBeLessThanOrEqual(130000)

    expect(
      result.lines.some(l => l.itemCode === 'ELE-PATCH-CAT6' && l.source === 'RULE-ADDED'),
    ).toBe(true)
    expect(result.recommendations.some(r => r.componentId)).toBe(true)

    const withDiscount = await price({
      productId,
      inputs: { rackU: 42, kW: 6, offshore: false },
      selections,
      adjustments: [
        { scope: 'TOTAL', adjustmentType: 'PCT', value: -5, reason: 'standard discount' },
      ],
    })
    expect(withDiscount.subtotalList).toBeCloseTo(result.subtotalList * 0.95, 0)
  })

  it('offshore=true triggers REPLACES: STD → MARINE packing', async () => {
    const result = await price({
      productId,
      inputs: { rackU: 42, kW: 6, offshore: true },
      selections: [],
    })
    const codes = result.lines.map(l => l.itemCode)
    expect(codes).toContain('MEC-PACK-MAR')
    expect(codes).not.toContain('MEC-PACK-STD')
  })

  it('ADD_ITEM adjustment adds synthetic line to subtotal', async () => {
    const result = await price({
      productId,
      inputs: { rackU: 42, kW: 6, offshore: false },
      selections: [],
      adjustments: [
        { scope: 'TOTAL', adjustmentType: 'ADD_ITEM', value: 1500, reason: 'offshore premium' },
      ],
    })
    expect(result.lines.some(l => l.source === 'ADDED' && l.lineTotal === 1500)).toBe(true)
    expect(result.subtotalList).toBe(63500) // 62000 + 1500
  })

  it('qtyFormula "ceil(kW/4)" responds to kW input', async () => {
    const lowKw = await price({
      productId,
      inputs: { rackU: 42, kW: 2, offshore: false },
      selections: [],
    })
    const highKw = await price({
      productId,
      inputs: { rackU: 42, kW: 16, offshore: false },
      selections: [],
    })
    const pduLow = lowKw.lines.find(l => l.itemCode === 'ELE-PDU-32A')!
    const pduHigh = highKw.lines.find(l => l.itemCode === 'ELE-PDU-32A')!
    expect(pduLow.qty).toBe(1)
    expect(pduHigh.qty).toBe(4)
  })
})
