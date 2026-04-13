import { evaluateNumber, FormulaError } from './formula'
import type { InputScope, PricedLine, Selection, LineSource } from './types'

export interface MappingLike {
  id: number
  componentId: number
  categoryId: number
  isMandatory: boolean
  isDefaultSelected: boolean
  defaultQty: number
  qtyFormula: string | null
  sortOrder: number
  remarks: string | null
}

export interface ComponentLike {
  id: number
  itemCode: string
  name: string
  uom: string
  isService: boolean
  currentUnitCost: number
  currentListPrice: number
  category: { code: string }
}

export function loadDefaults(
  mappings: MappingLike[],
  components: ComponentLike[],
  inputs: InputScope,
  selections: Selection[],
): PricedLine[] {
  const componentById = new Map(components.map(c => [c.id, c]))
  const selectionByComponent = new Map(selections.map(s => [s.componentId, s]))

  const lines: Array<PricedLine & { _sortOrder: number }> = []

  for (const m of mappings) {
    const sel = selectionByComponent.get(m.componentId)
    const component = componentById.get(m.componentId)
    if (!component) continue

    let source: LineSource
    if (m.isMandatory) {
      source = 'DEFAULT-LOCKED'
    } else if (sel && sel.included === false) {
      continue
    } else if (sel && sel.included === true) {
      source = 'OPTIONAL'
    } else if (m.isDefaultSelected) {
      source = 'DEFAULT'
    } else {
      continue
    }

    let qty = m.defaultQty
    let formulaUsed: string | undefined
    if (m.qtyFormula) {
      try {
        qty = evaluateNumber(m.qtyFormula, inputs)
        formulaUsed = m.qtyFormula
      } catch (err) {
        if (!(err instanceof FormulaError)) throw err
        qty = m.defaultQty
      }
    }
    if (sel && typeof sel.qty === 'number') qty = sel.qty

    lines.push({
      componentId: component.id,
      itemCode: component.itemCode,
      name: component.name,
      categoryCode: component.category.code,
      uom: component.uom,
      qty,
      unitCost: component.currentUnitCost,
      unitListPrice: component.currentListPrice,
      lineTotal: 0,
      source,
      isService: component.isService,
      formulaUsed,
      remarks: m.remarks ?? undefined,
      _sortOrder: m.sortOrder,
    })
  }

  lines.sort((a, b) => a._sortOrder - b._sortOrder)
  return lines.map(({ _sortOrder, ...rest }) => rest)
}
