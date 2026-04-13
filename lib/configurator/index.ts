import { loadProductContext } from './loader'
import { loadDefaults } from './defaults'
import { applyRules } from './rules'
import { priceLines } from './pricing'
import type { PriceRequest, PriceResponse } from './types'

export async function price(request: PriceRequest): Promise<PriceResponse> {
  const ctx = await loadProductContext(request.productId)
  if (!ctx) throw new Error(`Product ${request.productId} not found`)

  const initial = loadDefaults(ctx.mappings, ctx.components, request.inputs, request.selections)
  const { lines: ruleLines, violations, recommendations } = applyRules(initial, ctx.rules, request.inputs, ctx.components)
  const priced = priceLines(ruleLines, request.adjustments ?? [])

  return {
    lines: priced.lines,
    subtotalList: priced.subtotalList,
    subtotalCost: priced.subtotalCost,
    marginAmount: priced.marginAmount,
    marginPct: priced.marginPct,
    ruleViolations: violations,
    recommendations,
  }
}

export type { PriceRequest, PriceResponse } from './types'
