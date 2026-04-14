'use client'
import { useState } from 'react'
import { useConfiguratorStore } from '@/lib/configurator/store'
import { AddCustomLineModal } from './AddCustomLineModal'

export function AdjustmentsPanel() {
  const adjustments = useConfiguratorStore(s => s.adjustments)
  const setTotal = useConfiguratorStore(s => s.setTotalDiscount)
  const removeCustom = useConfiguratorStore(s => s.removeCustomLine)
  const [open, setOpen] = useState(false)
  const totalPct =
    -1 *
    (adjustments.find(
      a => a.scope === 'TOTAL' && a.adjustmentType === 'PCT' && a.reason === '__total_discount__',
    )?.value ?? 0)

  return (
    <div className="space-y-2 border-t pt-3">
      <label className="flex items-center justify-between text-sm">
        <span>Discount %</span>
        <input
          type="number"
          className="w-20 rounded border px-2 py-1 text-right"
          value={totalPct}
          onChange={e => setTotal(Number(e.target.value))}
        />
      </label>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded border py-1.5 text-sm"
      >
        + Add custom line
      </button>
      {adjustments
        .filter(a => a.adjustmentType === 'ADD_ITEM')
        .map((a, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span>{a.reason}</span>
            <div className="flex items-center gap-2">
              <span>{a.value.toLocaleString()}</span>
              <button
                onClick={() => removeCustom(adjustments.indexOf(a))}
                className="text-muted-foreground hover:text-destructive"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      {open && <AddCustomLineModal onClose={() => setOpen(false)} />}
    </div>
  )
}
