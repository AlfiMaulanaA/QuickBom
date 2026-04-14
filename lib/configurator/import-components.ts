import { z } from 'zod'

const rowSchema = z.object({
  itemCode: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  uom: z.string().min(1),
  manufacturer: z.string().optional().nullable(),
  categoryCode: z.string().min(1),
  currentUnitCost: z.coerce.number().optional(),
  currentListPrice: z.coerce.number().optional(),
  isService: z.coerce.boolean().optional(),
})

export interface ImportReport {
  inserted: number
  updated: number
  errors: Array<{ row: number; message: string }>
}

export async function importComponentRows(prisma: any, rows: unknown[]): Promise<ImportReport> {
  const categories = await prisma.productCategory.findMany()
  const byCode = new Map<string, number>(categories.map((c: any) => [c.code, c.id]))

  const candidateCodes: string[] = []
  for (const r of rows) {
    const anyR = r as any
    if (typeof anyR?.itemCode === 'string' && anyR.itemCode) candidateCodes.push(anyR.itemCode)
  }
  const existingRows: Array<{ itemCode: string }> = await prisma.component.findMany({
    where: { itemCode: { in: candidateCodes } },
    select: { itemCode: true },
  })
  const existing = new Set(existingRows.map(r => r.itemCode))

  const report: ImportReport = { inserted: 0, updated: 0, errors: [] }

  for (let i = 0; i < rows.length; i++) {
    const parsed = rowSchema.safeParse(rows[i])
    if (!parsed.success) {
      report.errors.push({
        row: i + 2,
        message: parsed.error.issues.map(x => x.message).join('; '),
      })
      continue
    }
    const catId = byCode.get(parsed.data.categoryCode)
    if (!catId) {
      report.errors.push({
        row: i + 2,
        message: `Unknown categoryCode "${parsed.data.categoryCode}"`,
      })
      continue
    }
    const data = {
      itemCode: parsed.data.itemCode,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      uom: parsed.data.uom,
      manufacturer: parsed.data.manufacturer ?? null,
      categoryId: catId,
      isService: parsed.data.isService ?? false,
      currentUnitCost: parsed.data.currentUnitCost ?? 0,
      currentListPrice: parsed.data.currentListPrice ?? 0,
    }
    const wasUpdate = existing.has(parsed.data.itemCode)
    await prisma.component.upsert({
      where: { itemCode: parsed.data.itemCode },
      update: data,
      create: data,
    })
    if (wasUpdate) report.updated++
    else report.inserted++
  }
  return report
}
