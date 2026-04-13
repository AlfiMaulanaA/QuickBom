export type InputValue = number | boolean | string
export type InputScope = Record<string, InputValue>

export type LineSource =
  | 'DEFAULT'        // default-selected optional
  | 'DEFAULT-LOCKED' // mandatory
  | 'OPTIONAL'       // user-added optional
  | 'ADDED'          // user-added custom line (SP2+)
  | 'RULE-ADDED'     // auto-added by REQUIRES rule
  | 'RULE-REPLACED'  // introduced by REPLACES rule

export interface Selection {
  componentId: number
  qty?: number
  included: boolean
}

export type AdjustmentScope = 'LINE' | 'CATEGORY' | 'TOTAL'
export type AdjustmentType = 'PCT' | 'FIXED' | 'ADD_ITEM' | 'REMOVE_ITEM'

export interface Adjustment {
  scope: AdjustmentScope
  targetId?: number
  adjustmentType: AdjustmentType
  value: number
  reason: string
}

export interface PricedLine {
  componentId: number
  itemCode: string
  name: string
  categoryCode: string
  uom: string
  qty: number
  unitCost: number
  unitListPrice: number
  lineTotal: number
  source: LineSource
  isService: boolean
  formulaUsed?: string
  remarks?: string
}

export interface RuleViolation {
  ruleId: number
  ruleType: string
  sourceComponentId: number
  targetComponentId: number
  message: string
}

export interface Recommendation {
  componentId: number
  reason: string
}

export interface PriceRequest {
  productId: number
  inputs: InputScope
  selections: Selection[]
  adjustments?: Adjustment[]
}

export interface PriceResponse {
  lines: PricedLine[]
  subtotalList: number
  subtotalCost: number
  marginAmount: number
  marginPct: number
  ruleViolations: RuleViolation[]
  recommendations: Recommendation[]
}
