'use client'
import { useEffect, useState } from 'react'

export interface FieldDef {
  key: string
  label: string
  placeholder?: string
  type?: 'text' | 'number'
}

interface Props {
  title: string
  listUrl: string
  createUrl: string
  deleteUrl: (id: number) => string
  fields: FieldDef[]
  display: (row: any) => string
  extraCreatePayload?: Record<string, unknown>
}

export function EntityPanel({ title, listUrl, createUrl, deleteUrl, fields, display, extraCreatePayload }: Props) {
  const [rows, setRows] = useState<any[]>([])
  const [form, setForm] = useState<Record<string, string>>({})

  const load = () => fetch(listUrl).then(r => r.ok ? r.json() : []).then(setRows)
  useEffect(() => { load() }, [listUrl])

  async function submit() {
    const payload: Record<string, unknown> = { ...extraCreatePayload }
    for (const f of fields) {
      const v = form[f.key]
      if (f.type === 'number') payload[f.key] = Number(v)
      else payload[f.key] = v ?? ''
    }
    const res = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({ error: 'Failed' }))
      alert(j.error ?? 'Failed')
      return
    }
    setForm({})
    load()
  }

  async function remove(id: number) {
    if (!confirm('Delete?')) return
    const res = await fetch(deleteUrl(id), { method: 'DELETE' })
    if (!res.ok) {
      const j = await res.json().catch(() => ({ error: 'Failed' }))
      alert(j.error ?? 'Failed')
      return
    }
    load()
  }

  return (
    <section className="rounded border p-3">
      <h3 className="mb-2 font-medium">{title}</h3>
      <ul className="mb-3 max-h-80 space-y-1 overflow-y-auto">
        {rows.map(r => (
          <li key={r.id} className="flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-muted">
            <span>{display(r)}</span>
            <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive">×</button>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-muted-foreground">None yet.</li>}
      </ul>
      <div className="space-y-2">
        {fields.map(f => (
          <input
            key={f.key}
            type={f.type ?? 'text'}
            className="w-full rounded border px-2 py-1 text-sm"
            placeholder={f.placeholder ?? f.label}
            value={form[f.key] ?? ''}
            onChange={e => setForm(s => ({ ...s, [f.key]: e.target.value }))}
          />
        ))}
        <button onClick={submit} className="w-full rounded border bg-primary py-1.5 text-sm text-primary-foreground">
          + Add
        </button>
      </div>
    </section>
  )
}
