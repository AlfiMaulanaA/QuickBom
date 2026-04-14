'use client'
import { useEffect, useRef } from 'react'
import { useConfiguratorStore, getConfiguratorStore } from './store'
import type { PriceRequest, PriceResponse } from './types'

const DEBOUNCE_MS = 300

export function usePricingQuery(productId: number | null) {
  const inputs = useConfiguratorStore(s => s.inputs)
  const selections = useConfiguratorStore(s => s.selections)
  const adjustments = useConfiguratorStore(s => s.adjustments)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!productId) return
    if (timer.current) clearTimeout(timer.current)
    const store = getConfiguratorStore()
    store.getState().setPricing(true)
    timer.current = setTimeout(async () => {
      const body: PriceRequest = {
        productId,
        inputs,
        selections: Array.from(selections.values()),
        adjustments,
      }
      try {
        const r = await fetch('/api/configurator/price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!r.ok) { store.getState().setPricing(false); return }
        const data = (await r.json()) as PriceResponse
        store.getState().setPriceResult(data)
      } catch {
        store.getState().setPricing(false)
      }
    }, DEBOUNCE_MS)

    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [productId, inputs, selections, adjustments])
}
