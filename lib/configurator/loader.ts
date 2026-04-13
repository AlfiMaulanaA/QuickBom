import { prisma } from '@/lib/prisma'
import type { MappingLike, ComponentLike } from './defaults'
import type { RuleLike } from './rules'

export interface ProductContext {
  product: {
    id: number
    code: string
    name: string
    inputSpec: Array<{ key: string; type: string; default?: unknown }>
  }
  mappings: MappingLike[]
  components: ComponentLike[]
  rules: RuleLike[]
}

export async function loadProductContext(productId: number): Promise<ProductContext | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      mappings: {
        include: {
          component: { include: { category: true } },
        },
        orderBy: { sortOrder: 'asc' },
      },
      rules: true,
    },
  })
  if (!product) return null

  const componentMap = new Map<number, ComponentLike>()
  const mappings: MappingLike[] = product.mappings.map(m => {
    if (!componentMap.has(m.component.id)) {
      componentMap.set(m.component.id, {
        id: m.component.id,
        itemCode: m.component.itemCode,
        name: m.component.name,
        uom: m.component.uom,
        isService: m.component.isService,
        currentUnitCost: Number(m.component.currentUnitCost),
        currentListPrice: Number(m.component.currentListPrice),
        category: { code: m.component.category.code },
      })
    }
    return {
      id: m.id,
      componentId: m.componentId,
      categoryId: m.categoryId,
      isMandatory: m.isMandatory,
      isDefaultSelected: m.isDefaultSelected,
      defaultQty: Number(m.defaultQty),
      qtyFormula: m.qtyFormula,
      sortOrder: m.sortOrder,
      remarks: m.remarks,
    }
  })

  const ruleTargetIds = Array.from(new Set(product.rules.map(r => r.targetComponentId)))
  const extraTargets = await prisma.component.findMany({
    where: { id: { in: ruleTargetIds } },
    include: { category: true },
  })
  for (const c of extraTargets) {
    if (!componentMap.has(c.id)) {
      componentMap.set(c.id, {
        id: c.id,
        itemCode: c.itemCode,
        name: c.name,
        uom: c.uom,
        isService: c.isService,
        currentUnitCost: Number(c.currentUnitCost),
        currentListPrice: Number(c.currentListPrice),
        category: { code: c.category.code },
      })
    }
  }

  const rules: RuleLike[] = product.rules.map(r => ({
    id: r.id,
    ruleType: r.ruleType as RuleLike['ruleType'],
    sourceComponentId: r.sourceComponentId,
    targetComponentId: r.targetComponentId,
    condition: r.condition,
  }))

  const inputSpec = Array.isArray(product.inputSpecJson) ? (product.inputSpecJson as any[]) : []

  return {
    product: { id: product.id, code: product.code, name: product.name, inputSpec },
    mappings,
    components: Array.from(componentMap.values()),
    rules,
  }
}
