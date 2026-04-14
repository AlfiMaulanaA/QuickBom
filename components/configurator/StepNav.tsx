'use client'
import { useConfiguratorStore } from '@/lib/configurator/store'

export function StepNav() {
  const status = useConfiguratorStore(s => s.status)
  const steps = [
    { n: 1, label: 'Group', done: true },
    { n: 2, label: 'Sub Group', done: true },
    { n: 3, label: 'Product', done: true },
    { n: 4, label: 'Configure', done: status !== 'DRAFT' },
    { n: 5, label: 'Review', done: status === 'QUOTED' || status === 'APPROVED' || status === 'LOCKED' },
  ]
  return (
    <ol className="mb-4 space-y-1 text-sm">
      {steps.map(s => (
        <li key={s.n} className={s.done ? 'text-foreground' : 'text-muted-foreground'}>
          <span className="inline-block w-6">{s.done ? '✓' : s.n}</span>
          {s.label}
        </li>
      ))}
    </ol>
  )
}
