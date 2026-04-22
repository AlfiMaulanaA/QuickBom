'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getConfiguratorStore, useConfiguratorStore } from '@/lib/configurator/store'
import { usePricingQuery } from '@/lib/configurator/usePricingQuery'
import { useAutosave } from '@/lib/configurator/useAutosave'
import { StepNav } from '@/components/configurator/StepNav'
import { InputsForm } from '@/components/configurator/InputsForm'
import { CategoryAccordion } from '@/components/configurator/CategoryAccordion'
import { BoqSummary } from '@/components/configurator/BoqSummary'
import { RuleViolationBanner } from '@/components/configurator/RuleViolationBanner'
import { RecommendationChip } from '@/components/configurator/RecommendationChip'
import { StatusPill } from '@/components/configurator/StatusPill'

export function ConfiguratorClient({ product, draft }: { product: any; draft: any | null }) {
  const router = useRouter()
  const params = useSearchParams()
  const status = useConfiguratorStore(s => s.status)
  const name = useConfiguratorStore(s => s.name)
  const isDirty = useConfiguratorStore(s => s.isDirty)

  usePricingQuery(product.id)
  const { saveNow } = useAutosave()

  useEffect(() => {
    const store = getConfiguratorStore()
    store.getState().setProduct({
      id: product.id,
      code: product.code,
      name: product.name,
      inputSpec: Array.isArray(product.inputSpecJson) ? product.inputSpecJson : [],
    })

    if (draft) {
      store.getState().hydrate({
        configurationId: draft.id,
        productId: product.id,
        name: draft.name,
        inputs: draft.inputsJson ?? {},
        selections: Array.isArray(draft.selectionsJson) ? draft.selectionsJson : [],
        adjustments: Array.isArray(draft.adjustmentsJson) ? draft.adjustmentsJson : [],
        status: draft.status,
      })
      return
    }

    const spec = Array.isArray(product.inputSpecJson) ? product.inputSpecJson : []
    for (const entry of spec) {
      if (entry.default !== undefined) store.getState().setInput(entry.key, entry.default)
    }
    store.getState().markSaved()

    fetch('/api/configurator/configurations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id }),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(row => {
        if (!row) return
        const currentStore = getConfiguratorStore().getState()
        getConfiguratorStore().getState().hydrate({
          configurationId: row.id,
          productId: product.id,
          name: row.name,
          inputs: currentStore.inputs,
          selections: Array.from(currentStore.selections.values()),
          adjustments: currentStore.adjustments,
          status: row.status,
        })
        const q = new URLSearchParams(params?.toString() ?? '')
        q.set('config', String(row.id))
        router.replace(`/configurator/${product.id}?${q.toString()}`)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, draft?.id])

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-4 border-b pb-3">
        <div>
          <div className="text-sm text-muted-foreground">{product.code}</div>
          <h1 className="text-xl font-semibold">{name || product.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={status} />
          {isDirty && <span className="text-xs text-muted-foreground">Unsaved</span>}
          <button
            onClick={() => void saveNow()}
            className="rounded border px-3 py-1.5 text-sm"
          >
            Save
          </button>
          <GenerateQuoteButton />
        </div>
      </header>

      <RuleViolationBanner />
      <RecommendationChip />

      <div className="grid grid-cols-[280px_1fr_360px] gap-4">
        <aside>
          <StepNav />
          <InputsForm />
        </aside>
        <main>
          <CategoryAccordion product={product} />
        </main>
        <aside>
          <BoqSummary />
        </aside>
      </div>
    </div>
  )
}

function GenerateQuoteButton() {
  const configurationId = useConfiguratorStore(s => s.configurationId)
  const status = useConfiguratorStore(s => s.status)
  const lastPriceResult = useConfiguratorStore(s => s.lastPriceResult)
  const violations = lastPriceResult?.ruleViolations ?? []
  const disabled =
    !configurationId || status !== 'DRAFT' || violations.some(v => v.ruleType !== 'SUGGESTS')
  return (
    <button
      disabled={disabled}
      onClick={async () => {
        if (!configurationId) return
        const r = await fetch(
          `/api/configurator/configurations/${configurationId}/quote`,
          { method: 'POST' },
        )
        if (r.ok) {
          const row = await r.json()
          getConfiguratorStore().getState().setStatus(row.status)
        }
      }}
      className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
    >
      Generate Quote
    </button>
  )
}
