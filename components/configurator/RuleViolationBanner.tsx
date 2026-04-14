'use client'
import { useConfiguratorStore } from '@/lib/configurator/store'

export function RuleViolationBanner() {
  const violations = useConfiguratorStore(s => s.lastPriceResult?.ruleViolations ?? [])
  const nonSuggests = violations.filter(v => v.ruleType !== 'SUGGESTS')
  if (nonSuggests.length === 0) return null
  return (
    <div className="rounded border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
      <div className="mb-1 font-medium">⚠ {nonSuggests.length} rule conflict(s)</div>
      <ul className="list-disc pl-5">
        {nonSuggests.map((v, i) => (
          <li key={i}>{v.message}</li>
        ))}
      </ul>
    </div>
  )
}
