'use client'
import { useConfiguratorStore } from '@/lib/configurator/store'

type Props = {
  mapping: {
    id: number
    componentId: number
    isMandatory: boolean
    isDefaultSelected: boolean
    defaultQty: number | string
    qtyFormula: string | null
    remarks: string | null
    component: {
      id: number
      itemCode: string
      name: string
      uom: string
      currentListPrice: number | string
    }
  }
}

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

export function ComponentRow({ mapping }: Props) {
  const sel = useConfiguratorStore(s => s.selections.get(mapping.componentId))
  const toggle = useConfiguratorStore(s => s.toggleSelection)
  const setQty = useConfiguratorStore(s => s.setSelectionQty)
  const lastLine = useConfiguratorStore(s =>
    s.lastPriceResult?.lines.find(l => l.componentId === mapping.componentId),
  )

  const included = mapping.isMandatory
    ? true
    : sel?.included ?? mapping.isDefaultSelected
  const qty = lastLine?.qty ?? sel?.qty ?? Number(mapping.defaultQty)
  const priceRow =
    lastLine?.lineTotal ?? Number(mapping.component.currentListPrice) * Number(qty)
  const locked = mapping.isMandatory

  return (
    <div className="flex items-center gap-3 border-b py-2 text-sm last:border-b-0">
      <input
        type="checkbox"
        checked={included}
        disabled={locked}
        onChange={e => toggle(mapping.componentId, e.target.checked)}
      />
      <div className="flex-1">
        <div className="font-medium">{mapping.component.name}</div>
        <div className="text-xs text-muted-foreground">
          {mapping.component.itemCode}
          {mapping.qtyFormula && <span title={mapping.qtyFormula}> · 📐</span>}
          {locked && (
            <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px]">Included</span>
          )}
          {lastLine?.source === 'RULE-ADDED' && (
            <span className="ml-2 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] text-purple-700">
              Auto
            </span>
          )}
          {lastLine?.source === 'RULE-REPLACED' && (
            <span className="ml-2 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] text-purple-700">
              Replaced
            </span>
          )}
        </div>
      </div>
      <input
        type="number"
        min={0}
        className="w-16 rounded border px-2 py-1"
        value={Number(qty)}
        disabled={!included}
        onChange={e => setQty(mapping.componentId, Number(e.target.value))}
      />
      <div className="w-24 text-right text-muted-foreground">{formatMoney(priceRow)}</div>
    </div>
  )
}
