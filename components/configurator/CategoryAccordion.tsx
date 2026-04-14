'use client'
import { useState } from 'react'
import { ComponentRow } from './ComponentRow'

export function CategoryAccordion({ product }: { product: any }) {
  const mappings: any[] = product.mappings ?? []
  const byCategory = new Map<string, any[]>()
  for (const m of mappings) {
    const code = m.component.category.code
    if (!byCategory.has(code)) byCategory.set(code, [])
    byCategory.get(code)!.push(m)
  }
  const order = ['MECH', 'ELEC', 'ELX', 'SVC']
  const sections = order
    .filter(c => byCategory.has(c))
    .map(c => ({ code: c, items: byCategory.get(c)! }))

  const [open, setOpen] = useState<Record<string, boolean>>({
    MECH: true, ELEC: true, ELX: true, SVC: true,
  })

  return (
    <div className="space-y-3">
      {sections.map(sec => (
        <div key={sec.code} className="rounded border">
          <button
            type="button"
            className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium"
            onClick={() => setOpen(o => ({ ...o, [sec.code]: !o[sec.code] }))}
          >
            <span>
              {sec.code} ({sec.items.length})
            </span>
            <span>{open[sec.code] ? '▾' : '▸'}</span>
          </button>
          {open[sec.code] && (
            <div className="px-3 pb-2">
              {sec.items.map(m => (
                <ComponentRow key={m.id} mapping={m} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
