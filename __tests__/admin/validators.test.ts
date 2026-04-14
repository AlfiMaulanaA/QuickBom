import { describe, it, expect } from 'vitest'
import {
  groupSchema, subGroupSchema, categorySchema, productSchema,
  mappingSchema, ruleSchema, componentSchema, conditionValid,
} from '@/lib/validators/admin'

describe('admin validators', () => {
  it('group requires code + name', () => {
    expect(groupSchema.safeParse({ code: 'FS', name: 'Free Standing' }).success).toBe(true)
    expect(groupSchema.safeParse({ code: 'FS' }).success).toBe(false)
  })

  it('subGroup requires groupId', () => {
    expect(subGroupSchema.safeParse({ groupId: 1, code: 'RCP', name: 'RCP' }).success).toBe(true)
  })

  it('category requires code + name', () => {
    expect(categorySchema.safeParse({ code: 'MECH', name: 'Mechanical' }).success).toBe(true)
    expect(categorySchema.safeParse({ name: 'Mechanical' }).success).toBe(false)
  })

  it('productSchema accepts valid inputSpec', () => {
    expect(productSchema.safeParse({
      code: 'X', name: 'X', subGroupId: 1,
      inputSpec: [{ key: 'kW', type: 'float', default: 6 }],
    }).success).toBe(true)
  })

  it('productSchema rejects invalid inputSpec type', () => {
    expect(productSchema.safeParse({
      code: 'X', name: 'X', subGroupId: 1,
      inputSpec: [{ key: 'kW', type: 'weird' }],
    }).success).toBe(false)
  })

  it('ruleSchema: ruleType enum', () => {
    expect(ruleSchema.safeParse({
      ruleType: 'REQUIRES', sourceComponentId: 1, targetComponentId: 2,
    }).success).toBe(true)
    expect(ruleSchema.safeParse({
      ruleType: 'UNKNOWN', sourceComponentId: 1, targetComponentId: 2,
    }).success).toBe(false)
  })

  it('mappingSchema: defaultQty > 0', () => {
    expect(mappingSchema.safeParse({
      componentId: 1, categoryId: 1, defaultQty: 1,
    }).success).toBe(true)
    expect(mappingSchema.safeParse({
      componentId: 1, categoryId: 1, defaultQty: 0,
    }).success).toBe(false)
  })

  it('componentSchema requires itemCode + uom + categoryId', () => {
    expect(componentSchema.safeParse({
      itemCode: 'A', name: 'A', uom: 'EA', categoryId: 1,
    }).success).toBe(true)
    expect(componentSchema.safeParse({
      name: 'A', uom: 'EA', categoryId: 1,
    }).success).toBe(false)
  })

  it('conditionValid: good expression returns ok', () => {
    expect(conditionValid('kW > 4', [{ key: 'kW', type: 'float' }])).toEqual({ ok: true })
  })

  it('conditionValid: missing variable returns error', () => {
    const r = conditionValid('bogus > 4', [{ key: 'kW', type: 'float' }])
    expect(r.ok).toBe(false)
  })
})
