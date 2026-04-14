'use client'
import { useConfiguratorStore } from '@/lib/configurator/store'

export function InputsForm() {
  const product = useConfiguratorStore(s => s.product)
  const inputs = useConfiguratorStore(s => s.inputs)
  const setInput = useConfiguratorStore(s => s.setInput)
  if (!product) return null
  return (
    <div className="space-y-3 rounded border p-3">
      <div className="text-xs font-medium text-muted-foreground">Inputs</div>
      {product.inputSpec.map((f: any) => {
        const val = inputs[f.key]
        if (f.type === 'bool') {
          return (
            <label key={f.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!val}
                onChange={e => setInput(f.key, e.target.checked)}
              />
              {f.key}
            </label>
          )
        }
        return (
          <label key={f.key} className="block text-sm">
            <span className="text-muted-foreground">{f.key}</span>
            <input
              type="number"
              className="mt-1 w-full rounded border px-2 py-1"
              value={typeof val === 'number' ? val : (val as any) ?? ''}
              onChange={e => setInput(f.key, Number(e.target.value))}
            />
          </label>
        )
      })}
    </div>
  )
}
