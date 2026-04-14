import { describe, it, expect, beforeEach } from 'vitest'
import { createConfiguratorStore } from '@/lib/configurator/store'

describe('configuratorStore', () => {
  let store: ReturnType<typeof createConfiguratorStore>
  beforeEach(() => {
    store = createConfiguratorStore()
  })

  it('initial state is empty', () => {
    const s = store.getState()
    expect(s.product).toBeNull()
    expect(s.selections.size).toBe(0)
    expect(s.isDirty).toBe(false)
  })

  it('setInput marks dirty and updates inputs', () => {
    store.getState().setInput('rackU', 42)
    expect(store.getState().inputs.rackU).toBe(42)
    expect(store.getState().isDirty).toBe(true)
  })

  it('toggleSelection adds then removes', () => {
    store.getState().toggleSelection(10, true)
    expect(store.getState().selections.get(10)).toEqual({ componentId: 10, included: true })
    store.getState().toggleSelection(10, false)
    expect(store.getState().selections.get(10)).toEqual({ componentId: 10, included: false })
  })

  it('setSelectionQty updates qty without flipping included', () => {
    store.getState().toggleSelection(10, true)
    store.getState().setSelectionQty(10, 7)
    expect(store.getState().selections.get(10)?.qty).toBe(7)
    expect(store.getState().selections.get(10)?.included).toBe(true)
  })

  it('setTotalDiscount replaces or inserts TOTAL PCT adjustment', () => {
    store.getState().setTotalDiscount(5)
    const adjs = store.getState().adjustments
    expect(adjs).toHaveLength(1)
    expect(adjs[0]).toMatchObject({ scope: 'TOTAL', adjustmentType: 'PCT', value: -5 })
    store.getState().setTotalDiscount(10)
    expect(store.getState().adjustments).toHaveLength(1)
    expect(store.getState().adjustments[0].value).toBe(-10)
  })

  it('addCustomLine appends ADD_ITEM adjustment', () => {
    store.getState().addCustomLine('Site survey', 1500)
    const adjs = store.getState().adjustments
    expect(adjs).toHaveLength(1)
    expect(adjs[0]).toMatchObject({
      scope: 'TOTAL', adjustmentType: 'ADD_ITEM', value: 1500, reason: 'Site survey',
    })
  })

  it('markSaved clears isDirty', () => {
    store.getState().setInput('rackU', 42)
    expect(store.getState().isDirty).toBe(true)
    store.getState().markSaved()
    expect(store.getState().isDirty).toBe(false)
  })

  it('hydrate sets fields from draft row and clears dirty', () => {
    store.getState().hydrate({
      configurationId: 99,
      productId: 1,
      name: 'Draft A',
      inputs: { rackU: 42 },
      selections: [{ componentId: 10, included: true, qty: 3 }],
      adjustments: [],
      status: 'DRAFT',
    })
    const s = store.getState()
    expect(s.configurationId).toBe(99)
    expect(s.name).toBe('Draft A')
    expect(s.inputs.rackU).toBe(42)
    expect(s.selections.get(10)).toEqual({ componentId: 10, included: true, qty: 3 })
    expect(s.isDirty).toBe(false)
  })
})
