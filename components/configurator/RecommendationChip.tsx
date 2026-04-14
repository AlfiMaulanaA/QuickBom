'use client'
import { useConfiguratorStore } from '@/lib/configurator/store'

export function RecommendationChip() {
  const recs = useConfiguratorStore(s => s.lastPriceResult?.recommendations ?? [])
  const toggle = useConfiguratorStore(s => s.toggleSelection)
  if (recs.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {recs.map(r => (
        <button
          key={r.componentId}
          onClick={() => toggle(r.componentId, true)}
          className="rounded-full border border-sky-400 bg-sky-50 px-3 py-1 text-xs text-sky-900"
        >
          ✨ {r.reason} — add
        </button>
      ))}
    </div>
  )
}
