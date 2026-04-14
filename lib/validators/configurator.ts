import { z } from 'zod'

const inputValueSchema = z.union([z.number(), z.boolean(), z.string()])
const inputsSchema = z.record(z.string(), inputValueSchema)
const selectionSchema = z.object({
  componentId: z.number().int(),
  qty: z.number().optional(),
  included: z.boolean(),
})
const adjustmentSchema = z.object({
  scope: z.enum(['LINE', 'CATEGORY', 'TOTAL']),
  targetId: z.number().int().optional(),
  adjustmentType: z.enum(['PCT', 'FIXED', 'ADD_ITEM', 'REMOVE_ITEM']),
  value: z.number(),
  reason: z.string(),
})

export const createConfigSchema = z.object({
  productId: z.number().int().positive(),
  name: z.string().max(200).optional(),
})

export const patchConfigSchema = z.object({
  name: z.string().max(200).nullable().optional(),
  inputs: inputsSchema.optional(),
  selections: z.array(selectionSchema).optional(),
  adjustments: z.array(adjustmentSchema).optional(),
})

export type CreateConfigInput = z.infer<typeof createConfigSchema>
export type PatchConfigInput = z.infer<typeof patchConfigSchema>
