import { describe, it, expect } from 'vitest'
import { applyRules, type RuleLike } from '@/lib/configurator/rules'
import type { PricedLine } from '@/lib/configurator/types'
import type { ComponentLike } from '@/lib/configurator/defaults'

const comp = (id: number, code: string): ComponentLike => ({
  id, itemCode: code, name: code, uom: 'EA',
  isService: false, currentUnitCost: 0, currentListPrice: 0,
  category: { code: 'MECH' },
})

const line = (componentId: number, itemCode: string, source: PricedLine['source'] = 'OPTIONAL'): PricedLine => ({
  componentId, itemCode, name: itemCode, categoryCode: 'MECH',
  uom: 'EA', qty: 1, unitCost: 0, unitListPrice: 0, lineTotal: 0,
  source, isService: false,
})

const rule = (overrides: Partial<RuleLike> & { id: number; ruleType: RuleLike['ruleType']; sourceComponentId: number; targetComponentId: number }): RuleLike => ({
  condition: null,
  ...overrides,
})

describe('applyRules — REQUIRES', () => {
  it('auto-adds target when source present and target missing', () => {
    const lines = [line(1, 'KVM')]
    const rules = [rule({ id: 1, ruleType: 'REQUIRES', sourceComponentId: 1, targetComponentId: 2 })]
    const components = [comp(1, 'KVM'), comp(2, 'CAT6')]
    const result = applyRules(lines, rules, {}, components)
    expect(result.lines.map(l => l.itemCode)).toContain('CAT6')
    expect(result.lines.find(l => l.itemCode === 'CAT6')?.source).toBe('RULE-ADDED')
  })

  it('does nothing when target already present', () => {
    const lines = [line(1, 'KVM'), line(2, 'CAT6')]
    const rules = [rule({ id: 1, ruleType: 'REQUIRES', sourceComponentId: 1, targetComponentId: 2 })]
    const components = [comp(1, 'KVM'), comp(2, 'CAT6')]
    const result = applyRules(lines, rules, {}, components)
    expect(result.lines).toHaveLength(2)
  })

  it('does not fire when source is absent', () => {
    const lines: PricedLine[] = []
    const rules = [rule({ id: 1, ruleType: 'REQUIRES', sourceComponentId: 1, targetComponentId: 2 })]
    const components = [comp(1, 'KVM'), comp(2, 'CAT6')]
    const result = applyRules(lines, rules, {}, components)
    expect(result.lines).toHaveLength(0)
  })

  it('honors condition when false (does not fire)', () => {
    const lines = [line(1, 'KVM')]
    const rules = [rule({ id: 1, ruleType: 'REQUIRES', sourceComponentId: 1, targetComponentId: 2, condition: 'offshore == true' })]
    const components = [comp(1, 'KVM'), comp(2, 'CAT6')]
    const result = applyRules(lines, rules, { offshore: false }, components)
    expect(result.lines).toHaveLength(1)
  })
})

describe('applyRules — EXCLUDES', () => {
  it('emits violation when user-included target conflicts', () => {
    const lines = [line(1, 'A'), line(2, 'B', 'OPTIONAL')]
    const rules = [rule({ id: 1, ruleType: 'EXCLUDES', sourceComponentId: 1, targetComponentId: 2 })]
    const components = [comp(1, 'A'), comp(2, 'B')]
    const result = applyRules(lines, rules, {}, components)
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0].ruleType).toBe('EXCLUDES')
  })

  it('silently removes target if it was rule-added', () => {
    const lines = [line(1, 'A'), line(2, 'B', 'RULE-ADDED')]
    const rules = [rule({ id: 1, ruleType: 'EXCLUDES', sourceComponentId: 1, targetComponentId: 2 })]
    const components = [comp(1, 'A'), comp(2, 'B')]
    const result = applyRules(lines, rules, {}, components)
    expect(result.lines.find(l => l.itemCode === 'B')).toBeUndefined()
    expect(result.violations).toHaveLength(0)
  })
})

describe('applyRules — REPLACES', () => {
  it('swaps source with target when condition holds', () => {
    const lines = [line(1, 'STD-PACK')]
    const rules = [rule({ id: 1, ruleType: 'REPLACES', sourceComponentId: 1, targetComponentId: 2, condition: 'offshore == true' })]
    const components = [comp(1, 'STD-PACK'), comp(2, 'MARINE-PACK')]
    const result = applyRules(lines, rules, { offshore: true }, components)
    expect(result.lines.map(l => l.itemCode)).toEqual(['MARINE-PACK'])
    expect(result.lines[0].source).toBe('RULE-REPLACED')
  })

  it('does not swap when condition false', () => {
    const lines = [line(1, 'STD-PACK')]
    const rules = [rule({ id: 1, ruleType: 'REPLACES', sourceComponentId: 1, targetComponentId: 2, condition: 'offshore == true' })]
    const components = [comp(1, 'STD-PACK'), comp(2, 'MARINE-PACK')]
    const result = applyRules(lines, rules, { offshore: false }, components)
    expect(result.lines.map(l => l.itemCode)).toEqual(['STD-PACK'])
  })
})

describe('applyRules — SUGGESTS', () => {
  it('emits recommendation without adding line', () => {
    const lines = [line(1, 'SENSOR')]
    const rules = [rule({ id: 1, ruleType: 'SUGGESTS', sourceComponentId: 1, targetComponentId: 2 })]
    const components = [comp(1, 'SENSOR'), comp(2, 'GATEWAY')]
    const result = applyRules(lines, rules, {}, components)
    expect(result.lines).toHaveLength(1)
    expect(result.recommendations).toHaveLength(1)
    expect(result.recommendations[0].componentId).toBe(2)
  })

  it('does not recommend if target already included', () => {
    const lines = [line(1, 'SENSOR'), line(2, 'GATEWAY')]
    const rules = [rule({ id: 1, ruleType: 'SUGGESTS', sourceComponentId: 1, targetComponentId: 2 })]
    const components = [comp(1, 'SENSOR'), comp(2, 'GATEWAY')]
    const result = applyRules(lines, rules, {}, components)
    expect(result.recommendations).toHaveLength(0)
  })
})

describe('applyRules — iteration and cycles', () => {
  it('handles chain REQUIRES: A→B, B→C', () => {
    const lines = [line(1, 'A')]
    const rules = [
      rule({ id: 1, ruleType: 'REQUIRES', sourceComponentId: 1, targetComponentId: 2 }),
      rule({ id: 2, ruleType: 'REQUIRES', sourceComponentId: 2, targetComponentId: 3 }),
    ]
    const components = [comp(1, 'A'), comp(2, 'B'), comp(3, 'C')]
    const result = applyRules(lines, rules, {}, components)
    expect(result.lines.map(l => l.itemCode).sort()).toEqual(['A', 'B', 'C'])
  })

  it('detects cycle and emits violation', () => {
    const lines = [line(1, 'A')]
    const rules = [
      rule({ id: 1, ruleType: 'REQUIRES', sourceComponentId: 1, targetComponentId: 2 }),
      rule({ id: 2, ruleType: 'EXCLUDES', sourceComponentId: 2, targetComponentId: 1 }),
    ]
    const components = [comp(1, 'A'), comp(2, 'B')]
    const result = applyRules(lines, rules, {}, components)
    expect(result.violations.some(v => v.message.toLowerCase().includes('cycle') || v.message.toLowerCase().includes('converge'))).toBe(true)
  })
})
