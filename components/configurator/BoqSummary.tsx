'use client'
import { useConfiguratorStore } from '@/lib/configurator/store'
import { AdjustmentsPanel } from './AdjustmentsPanel'

export function BoqSummary() {
  const result = useConfiguratorStore(s => s.lastPriceResult)
  const isPricing = useConfiguratorStore(s => s.isPricing)
  const configurationId = useConfiguratorStore(s => s.configurationId)
  const status = useConfiguratorStore(s => s.status)
  const subtotal = result?.subtotalList ?? 0
  const cost = result?.subtotalCost ?? 0

  return (
    <div className="space-y-3 rounded border p-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="font-medium">BOQ Summary</div>
        {isPricing && <span className="text-xs text-muted-foreground">calculating…</span>}
      </div>
      <div className="space-y-1">
        <Row label="Items" value={result?.lines.length ?? 0} />
        <Row label="Subtotal cost" value={cost.toLocaleString()} />
        <Row label="Subtotal list" value={subtotal.toLocaleString()} />
        <Row label="Margin" value={(result?.marginPct ?? 0).toFixed(1) + '%'} />
      </div>
      <AdjustmentsPanel />
      {status !== 'DRAFT' && configurationId && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <a
            href={`/api/configurator/configurations/${configurationId}/export/quotation-pdf`}
            className="rounded border px-3 py-1.5 text-center text-sm hover:bg-muted"
          >
            Download Quotation (PDF)
          </a>
          <a
            href={`/api/configurator/configurations/${configurationId}/export/boq-xlsx`}
            className="rounded border px-3 py-1.5 text-center text-sm hover:bg-muted"
          >
            Download BOQ (Excel)
          </a>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  )
}
