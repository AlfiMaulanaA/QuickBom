import { z } from 'zod'
import { evaluateBool, FormulaError } from '@/lib/configurator/formula'

export const groupSchema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(120),
  sortOrder: z.number().int().optional(),
  isDefault: z.boolean().optional(),
})

export const subGroupSchema = z.object({
  groupId: z.number().int(),
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(120),
  sortOrder: z.number().int().optional(),
})

export const categorySchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(120),
  sortOrder: z.number().int().optional(),
})

const inputSpecEntrySchema = z.object({
  key: z.string().min(1),
  type: z.enum(['int', 'float', 'bool', 'string', 'enum']),
  min: z.number().optional(),
  max: z.number().optional(),
  default: z.any().optional(),
  values: z.array(z.any()).optional(),
})

export const productSchema = z.object({
  code: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  brand: z.string().max(80).nullable().optional(),
  subGroupId: z.number().int(),
  basePrice: z.number().nonnegative().optional(),
  specJson: z.unknown().optional(),
  dimensionsJson: z.unknown().optional(),
  inputSpec: z.array(inputSpecEntrySchema).optional(),
  isActive: z.boolean().optional(),
})

export const mappingSchema = z.object({
  componentId: z.number().int(),
  categoryId: z.number().int(),
  isMandatory: z.boolean().optional(),
  isDefaultSelected: z.boolean().optional(),
  defaultQty: z.number().positive(),
  qtyFormula: z.string().nullable().optional(),
  minQty: z.number().optional(),
  maxQty: z.number().optional(),
  sortOrder: z.number().int().optional(),
  remarks: z.string().nullable().optional(),
})

export const ruleSchema = z.object({
  ruleType: z.enum(['REQUIRES', 'EXCLUDES', 'REPLACES', 'SUGGESTS']),
  sourceComponentId: z.number().int(),
  targetComponentId: z.number().int(),
  condition: z.string().nullable().optional(),
})

export const componentSchema = z.object({
  itemCode: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  uom: z.string().min(1).max(20),
  manufacturer: z.string().nullable().optional(),
  categoryId: z.number().int(),
  isService: z.boolean().optional(),
  currentUnitCost: z.number().nonnegative().optional(),
  currentListPrice: z.number().nonnegative().optional(),
})

export function conditionValid(expr: string, inputSpec: Array<{ key: string; type: string }>) {
  const scope: Record<string, any> = {}
  for (const e of inputSpec) scope[e.key] = e.type === 'bool' ? false : 0
  try {
    evaluateBool(expr, scope)
    return { ok: true as const }
  } catch (err) {
    if (err instanceof FormulaError) return { ok: false as const, message: err.message }
    throw err
  }
}
