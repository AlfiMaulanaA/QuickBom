import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { useMemo } from 'react'
import type {
  Adjustment, InputScope, InputValue, PriceResponse, Selection,
} from './types'

export interface ConfiguratorState {
  product: {
    id: number
    code: string
    name: string
    inputSpec: Array<{ key: string; type: string; default?: unknown }>
  } | null
  configurationId: number | null
  name: string
  inputs: InputScope
  selections: Map<number, Selection>
  adjustments: Adjustment[]
  lastPriceResult: PriceResponse | null
  isPricing: boolean
  status: 'DRAFT' | 'QUOTED' | 'APPROVED' | 'LOCKED'
  isDirty: boolean

  setProduct: (p: ConfiguratorState['product']) => void
  hydrate: (draft: {
    configurationId: number
    productId: number
    name: string | null
    inputs: InputScope
    selections: Selection[]
    adjustments: Adjustment[]
    status: ConfiguratorState['status']
  }) => void
  setInput: (key: string, value: InputValue) => void
  toggleSelection: (componentId: number, included: boolean) => void
  setSelectionQty: (componentId: number, qty: number) => void
  setTotalDiscount: (pct: number) => void
  addCustomLine: (name: string, price: number) => void
  removeCustomLine: (index: number) => void
  setName: (name: string) => void
  setPriceResult: (r: PriceResponse) => void
  setPricing: (v: boolean) => void
  setStatus: (s: ConfiguratorState['status']) => void
  markSaved: () => void
}

export function createConfiguratorStore() {
  return createStore<ConfiguratorState>((set) => ({
    product: null,
    configurationId: null,
    name: '',
    inputs: {},
    selections: new Map(),
    adjustments: [],
    lastPriceResult: null,
    isPricing: false,
    status: 'DRAFT',
    isDirty: false,

    setProduct: p => set({ product: p }),

    hydrate: d => set({
      configurationId: d.configurationId,
      name: d.name ?? '',
      inputs: d.inputs,
      selections: new Map(d.selections.map(s => [s.componentId, s])),
      adjustments: d.adjustments,
      status: d.status,
      isDirty: false,
    }),

    setInput: (key, value) => set(s => ({
      inputs: { ...s.inputs, [key]: value },
      isDirty: true,
    })),

    toggleSelection: (componentId, included) => set(s => {
      const next = new Map(s.selections)
      const prev = next.get(componentId)
      next.set(componentId, { ...(prev ?? { componentId }), included })
      return { selections: next, isDirty: true }
    }),

    setSelectionQty: (componentId, qty) => set(s => {
      const next = new Map(s.selections)
      const prev = next.get(componentId) ?? { componentId, included: true }
      next.set(componentId, { ...prev, qty })
      return { selections: next, isDirty: true }
    }),

    setTotalDiscount: pct => set(s => {
      const others = s.adjustments.filter(a => !(
        a.scope === 'TOTAL' &&
        a.adjustmentType === 'PCT' &&
        a.reason === '__total_discount__'
      ))
      if (pct === 0) return { adjustments: others, isDirty: true }
      return {
        adjustments: [
          ...others,
          { scope: 'TOTAL', adjustmentType: 'PCT', value: -pct, reason: '__total_discount__' },
        ],
        isDirty: true,
      }
    }),

    addCustomLine: (name, price) => set(s => ({
      adjustments: [
        ...s.adjustments,
        { scope: 'TOTAL', adjustmentType: 'ADD_ITEM', value: price, reason: name },
      ],
      isDirty: true,
    })),

    removeCustomLine: index => set(s => ({
      adjustments: s.adjustments.filter((_, i) => i !== index),
      isDirty: true,
    })),

    setName: name => set({ name, isDirty: true }),

    setPriceResult: r => set({ lastPriceResult: r, isPricing: false }),

    setPricing: v => set({ isPricing: v }),

    setStatus: status => set({ status }),

    markSaved: () => set({ isDirty: false }),
  }))
}

let _storeSingleton: ReturnType<typeof createConfiguratorStore> | null = null

export function getConfiguratorStore() {
  if (!_storeSingleton) _storeSingleton = createConfiguratorStore()
  return _storeSingleton
}

export function useConfiguratorStore<T>(selector: (s: ConfiguratorState) => T): T {
  const store = useMemo(() => getConfiguratorStore(), [])
  return useStore(store, selector)
}

export function resetConfiguratorStore() {
  _storeSingleton = null
}
