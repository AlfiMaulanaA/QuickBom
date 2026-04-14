import { describe, it, expect } from 'vitest'
import { createConfigSchema, patchConfigSchema } from '@/lib/validators/configurator'

describe('createConfigSchema', () => {
  it('requires productId as integer', () => {
    expect(createConfigSchema.safeParse({ productId: 1 }).success).toBe(true)
    expect(createConfigSchema.safeParse({ productId: 'x' }).success).toBe(false)
    expect(createConfigSchema.safeParse({}).success).toBe(false)
  })
  it('allows optional name', () => {
    expect(createConfigSchema.safeParse({ productId: 1, name: 'Draft A' }).success).toBe(true)
  })
})

describe('patchConfigSchema', () => {
  it('accepts empty object', () => {
    expect(patchConfigSchema.safeParse({}).success).toBe(true)
  })
  it('validates inputs as record of primitives', () => {
    expect(patchConfigSchema.safeParse({ inputs: { rackU: 42, offshore: true } }).success).toBe(true)
    expect(patchConfigSchema.safeParse({ inputs: { bad: { nested: 1 } } }).success).toBe(false)
  })
  it('validates selections as array with required fields', () => {
    expect(patchConfigSchema.safeParse({
      selections: [{ componentId: 1, included: true }]
    }).success).toBe(true)
    expect(patchConfigSchema.safeParse({
      selections: [{ included: true }]
    }).success).toBe(false)
  })
  it('validates adjustments', () => {
    expect(patchConfigSchema.safeParse({
      adjustments: [{ scope: 'TOTAL', adjustmentType: 'PCT', value: -5, reason: 'promo' }]
    }).success).toBe(true)
    expect(patchConfigSchema.safeParse({
      adjustments: [{ scope: 'UNKNOWN', adjustmentType: 'PCT', value: -5, reason: 'x' }]
    }).success).toBe(false)
  })
})
