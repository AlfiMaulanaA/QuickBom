import { describe, it, expect } from 'vitest'
import { loadDefaults } from '@/lib/configurator/defaults'
import type { Selection } from '@/lib/configurator/types'

type MappingFixture = {
  id: number
  componentId: number
  categoryId: number
  isMandatory: boolean
  isDefaultSelected: boolean
  defaultQty: number
  qtyFormula: string | null
  sortOrder: number
  remarks: string | null
}
type ComponentFixture = {
  id: number
  itemCode: string
  name: string
  uom: string
  isService: boolean
  currentUnitCost: number
  currentListPrice: number
  category: { code: string }
}

const comp = (overrides: Partial<ComponentFixture> & { id: number; itemCode: string }): ComponentFixture => ({
  id: overrides.id,
  itemCode: overrides.itemCode,
  name: overrides.itemCode,
  uom: 'EA',
  isService: false,
  currentUnitCost: 0,
  currentListPrice: 0,
  category: { code: 'MECH' },
  ...overrides,
})

const mapping = (overrides: Partial<MappingFixture> & { id: number; componentId: number }): MappingFixture => ({
  id: overrides.id,
  componentId: overrides.componentId,
  categoryId: 1,
  isMandatory: false,
  isDefaultSelected: false,
  defaultQty: 1,
  qtyFormula: null,
  sortOrder: 0,
  remarks: null,
  ...overrides,
})

describe('loadDefaults', () => {
  it('includes mandatory lines as DEFAULT-LOCKED', () => {
    const mappings = [mapping({ id: 1, componentId: 10, isMandatory: true, defaultQty: 1 })]
    const components = [comp({ id: 10, itemCode: 'M-FRM' })]
    const lines = loadDefaults(mappings, components, {}, [])
    expect(lines).toHaveLength(1)
    expect(lines[0].source).toBe('DEFAULT-LOCKED')
    expect(lines[0].qty).toBe(1)
  })

  it('includes default-selected optional as DEFAULT', () => {
    const mappings = [mapping({ id: 2, componentId: 20, isDefaultSelected: true })]
    const components = [comp({ id: 20, itemCode: 'M-SIDE' })]
    const lines = loadDefaults(mappings, components, {}, [])
    expect(lines[0].source).toBe('DEFAULT')
  })

  it('excludes optional lines when not selected', () => {
    const mappings = [mapping({ id: 3, componentId: 30 })]
    const components = [comp({ id: 30, itemCode: 'M-CM' })]
    const lines = loadDefaults(mappings, components, {}, [])
    expect(lines).toHaveLength(0)
  })

  it('includes optional when user selects it', () => {
    const mappings = [mapping({ id: 3, componentId: 30 })]
    const components = [comp({ id: 30, itemCode: 'M-CM' })]
    const selections: Selection[] = [{ componentId: 30, included: true }]
    const lines = loadDefaults(mappings, components, {}, selections)
    expect(lines[0].source).toBe('OPTIONAL')
  })

  it('excludes default-selected when user explicitly unselects', () => {
    const mappings = [mapping({ id: 2, componentId: 20, isDefaultSelected: true })]
    const components = [comp({ id: 20, itemCode: 'M-SIDE' })]
    const selections: Selection[] = [{ componentId: 20, included: false }]
    const lines = loadDefaults(mappings, components, {}, selections)
    expect(lines).toHaveLength(0)
  })

  it('keeps mandatory lines even when user tries to unselect', () => {
    const mappings = [mapping({ id: 1, componentId: 10, isMandatory: true })]
    const components = [comp({ id: 10, itemCode: 'M-FRM' })]
    const selections: Selection[] = [{ componentId: 10, included: false }]
    const lines = loadDefaults(mappings, components, {}, selections)
    expect(lines).toHaveLength(1)
    expect(lines[0].source).toBe('DEFAULT-LOCKED')
  })

  it('evaluates qtyFormula against inputs', () => {
    const mappings = [mapping({ id: 4, componentId: 40, isMandatory: true, qtyFormula: 'ceil(kW / 4)', defaultQty: 1 })]
    const components = [comp({ id: 40, itemCode: 'E-PDU' })]
    const lines = loadDefaults(mappings, components, { kW: 6 }, [])
    expect(lines[0].qty).toBe(2)
    expect(lines[0].formulaUsed).toBe('ceil(kW / 4)')
  })

  it('falls back to defaultQty when formula fails', () => {
    const mappings = [mapping({ id: 5, componentId: 50, isMandatory: true, qtyFormula: 'ceil(missing)', defaultQty: 3 })]
    const components = [comp({ id: 50, itemCode: 'E-X' })]
    const lines = loadDefaults(mappings, components, {}, [])
    expect(lines[0].qty).toBe(3)
  })

  it('honors explicit qty override in selection', () => {
    const mappings = [mapping({ id: 6, componentId: 60 })]
    const components = [comp({ id: 60, itemCode: 'M-BP' })]
    const selections: Selection[] = [{ componentId: 60, included: true, qty: 7 }]
    const lines = loadDefaults(mappings, components, {}, selections)
    expect(lines[0].qty).toBe(7)
  })

  it('sorts lines by mapping sortOrder', () => {
    const mappings = [
      mapping({ id: 1, componentId: 10, isMandatory: true, sortOrder: 2 }),
      mapping({ id: 2, componentId: 20, isMandatory: true, sortOrder: 1 }),
    ]
    const components = [comp({ id: 10, itemCode: 'A' }), comp({ id: 20, itemCode: 'B' })]
    const lines = loadDefaults(mappings, components, {}, [])
    expect(lines.map(l => l.itemCode)).toEqual(['B', 'A'])
  })
})
