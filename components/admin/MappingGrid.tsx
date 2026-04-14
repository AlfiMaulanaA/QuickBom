'use client'
import { useEffect, useState } from 'react'

interface Props { productId: number }

export function MappingGrid({ productId }: Props) {
  const [rows, setRows] = useState<any[]>([])
  const [components, setComponents] = useState<any[]>([])
  const [addComponentId, setAddComponentId] = useState<number | ''>('')

  const load = () => {
    fetch(`/api/configurator/admin/products/${productId}/mappings`)
      .then(r => r.ok ? r.json() : [])
      .then(setRows)
    fetch('/api/configurator/admin/components')
      .then(r => r.ok ? r.json() : [])
      .then(setComponents)
  }
  useEffect(load, [productId])

  async function addMapping() {
    if (!addComponentId) return
    const comp = components.find(c => c.id === addComponentId)
    if (!comp) return
    const payload = {
      componentId: addComponentId,
      categoryId: comp.categoryId,
      isMandatory: false,
      isDefaultSelected: false,
      defaultQty: 1,
      qtyFormula: null,
      sortOrder: rows.length + 1,
    }
    const res = await fetch(`/api/configurator/admin/products/${productId}/mappings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({ error: 'Failed' }))
      alert(j.error ?? 'Failed')
      return
    }
    setAddComponentId('')
    load()
  }

  async function patch(id: number, patch: Record<string, unknown>) {
    const res = await fetch(`/api/configurator/admin/mappings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) alert('Update failed')
    load()
  }

  async function remove(id: number) {
    if (!confirm('Delete mapping?')) return
    await fetch(`/api/configurator/admin/mappings/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-3">
      <table className="w-full overflow-hidden rounded border text-sm">
        <thead className="bg-muted text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-2 py-2 text-left">Component</th>
            <th className="px-2 py-2">Mandatory</th>
            <th className="px-2 py-2">Default</th>
            <th className="px-2 py-2">Qty</th>
            <th className="px-2 py-2 text-left">Formula</th>
            <th className="px-2 py-2">Order</th>
            <th className="px-2 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(m => (
            <tr key={m.id} className="border-t">
              <td className="px-2 py-1">{m.component.itemCode} — {m.component.name}</td>
              <td className="px-2 py-1 text-center">
                <input
                  type="checkbox"
                  checked={m.isMandatory}
                  onChange={e => patch(m.id, { isMandatory: e.target.checked })}
                />
              </td>
              <td className="px-2 py-1 text-center">
                <input
                  type="checkbox"
                  checked={m.isDefaultSelected}
                  onChange={e => patch(m.id, { isDefaultSelected: e.target.checked })}
                />
              </td>
              <td className="px-2 py-1">
                <input
                  type="number"
                  className="w-16 rounded border px-1 py-0.5 text-right"
                  defaultValue={Number(m.defaultQty)}
                  onBlur={e => patch(m.id, { defaultQty: Number(e.target.value) })}
                />
              </td>
              <td className="px-2 py-1">
                <input
                  type="text"
                  className="w-40 rounded border px-1 py-0.5 font-mono text-xs"
                  placeholder="—"
                  defaultValue={m.qtyFormula ?? ''}
                  onBlur={e => patch(m.id, { qtyFormula: e.target.value || null })}
                />
              </td>
              <td className="px-2 py-1">
                <input
                  type="number"
                  className="w-14 rounded border px-1 py-0.5"
                  defaultValue={m.sortOrder}
                  onBlur={e => patch(m.id, { sortOrder: Number(e.target.value) })}
                />
              </td>
              <td className="px-2 py-1">
                <button onClick={() => remove(m.id)} className="text-muted-foreground hover:text-destructive">×</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={7} className="px-2 py-4 text-center text-muted-foreground">No mappings.</td></tr>
          )}
        </tbody>
      </table>

      <div className="flex items-center gap-2">
        <select
          className="rounded border px-2 py-1 text-sm"
          value={addComponentId}
          onChange={e => setAddComponentId(Number(e.target.value))}
        >
          <option value="">Add component…</option>
          {components.map(c => (
            <option key={c.id} value={c.id}>{c.itemCode} — {c.name}</option>
          ))}
        </select>
        <button onClick={addMapping} className="rounded border px-3 py-1 text-sm">Add</button>
      </div>
    </div>
  )
}
