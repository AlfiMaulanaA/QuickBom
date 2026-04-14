'use client'
import { useEffect, useState } from 'react'

interface Props { productId: number }

export function RuleList({ productId }: Props) {
  const [rules, setRules] = useState<any[]>([])
  const [components, setComponents] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    ruleType: 'REQUIRES',
    sourceComponentId: '',
    targetComponentId: '',
    condition: '',
  })

  const load = () => {
    fetch(`/api/configurator/admin/products/${productId}/rules`)
      .then(r => r.ok ? r.json() : [])
      .then(setRules)
    fetch('/api/configurator/admin/components')
      .then(r => r.ok ? r.json() : [])
      .then(setComponents)
  }
  useEffect(load, [productId])

  async function create() {
    const payload: any = {
      ruleType: form.ruleType,
      sourceComponentId: Number(form.sourceComponentId),
      targetComponentId: Number(form.targetComponentId),
    }
    if (form.condition) payload.condition = form.condition
    const res = await fetch(`/api/configurator/admin/products/${productId}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({ error: 'Failed' }))
      alert((j.message ? `${j.error}: ${j.message}` : j.error) ?? 'Failed')
      return
    }
    setOpen(false)
    setForm({ ruleType: 'REQUIRES', sourceComponentId: '', targetComponentId: '', condition: '' })
    load()
  }

  async function remove(id: number) {
    if (!confirm('Delete rule?')) return
    await fetch(`/api/configurator/admin/rules/${id}`, { method: 'DELETE' })
    load()
  }

  const name = (id: number) => components.find(c => c.id === id)?.itemCode ?? `#${id}`

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Rules ({rules.length})</div>
        <button onClick={() => setOpen(true)} className="rounded border px-3 py-1 text-sm">+ Add rule</button>
      </div>
      <ul className="divide-y rounded border">
        {rules.map(r => (
          <li key={r.id} className="flex items-center justify-between px-3 py-2 text-sm">
            <span>
              <span className="font-mono">{name(r.sourceComponentId)}</span>
              {' '}<span className="rounded bg-muted px-1.5 py-0.5 text-xs">{r.ruleType}</span>{' '}
              <span className="font-mono">{name(r.targetComponentId)}</span>
              {r.condition && <span className="ml-2 text-xs text-muted-foreground">when {r.condition}</span>}
            </span>
            <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive">×</button>
          </li>
        ))}
        {rules.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">No rules.</li>}
      </ul>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-96 space-y-3 rounded bg-background p-4 shadow-lg">
            <div className="text-sm font-medium">Add rule</div>
            <select
              className="w-full rounded border px-2 py-1 text-sm"
              value={form.sourceComponentId}
              onChange={e => setForm(s => ({ ...s, sourceComponentId: e.target.value }))}
            >
              <option value="">Source component…</option>
              {components.map(c => <option key={c.id} value={c.id}>{c.itemCode} — {c.name}</option>)}
            </select>
            <select
              className="w-full rounded border px-2 py-1 text-sm"
              value={form.ruleType}
              onChange={e => setForm(s => ({ ...s, ruleType: e.target.value }))}
            >
              <option>REQUIRES</option>
              <option>EXCLUDES</option>
              <option>REPLACES</option>
              <option>SUGGESTS</option>
            </select>
            <select
              className="w-full rounded border px-2 py-1 text-sm"
              value={form.targetComponentId}
              onChange={e => setForm(s => ({ ...s, targetComponentId: e.target.value }))}
            >
              <option value="">Target component…</option>
              {components.map(c => <option key={c.id} value={c.id}>{c.itemCode} — {c.name}</option>)}
            </select>
            <input
              className="w-full rounded border px-2 py-1 font-mono text-xs"
              placeholder="Optional condition (e.g. offshore == true)"
              value={form.condition}
              onChange={e => setForm(s => ({ ...s, condition: e.target.value }))}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded border px-3 py-1 text-sm">Cancel</button>
              <button
                onClick={create}
                disabled={!form.sourceComponentId || !form.targetComponentId}
                className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground disabled:opacity-50"
              >Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
