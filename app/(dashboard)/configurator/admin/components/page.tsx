'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ComponentsAdminPage() {
  const [rows, setRows] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [importResult, setImportResult] = useState<any | null>(null)
  const [form, setForm] = useState<{ itemCode: string; name: string; uom: string; categoryId: string; currentUnitCost: string; currentListPrice: string }>({
    itemCode: '', name: '', uom: '', categoryId: '', currentUnitCost: '0', currentListPrice: '0',
  })
  const [categories, setCategories] = useState<any[]>([])

  const load = () => {
    const url = q ? `/api/configurator/admin/components?q=${encodeURIComponent(q)}` : '/api/configurator/admin/components'
    fetch(url).then(r => r.ok ? r.json() : []).then(setRows)
  }

  useEffect(() => { load() }, [q])
  useEffect(() => {
    fetch('/api/configurator/admin/categories').then(r => r.ok ? r.json() : []).then(setCategories)
  }, [])

  async function createComponent() {
    const payload = {
      itemCode: form.itemCode,
      name: form.name,
      uom: form.uom,
      categoryId: Number(form.categoryId),
      currentUnitCost: Number(form.currentUnitCost),
      currentListPrice: Number(form.currentListPrice),
    }
    const res = await fetch('/api/configurator/admin/components', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({ error: 'Failed' }))
      alert(j.error ?? 'Failed'); return
    }
    setForm({ itemCode: '', name: '', uom: '', categoryId: '', currentUnitCost: '0', currentListPrice: '0' })
    load()
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/configurator/admin/components/import', { method: 'POST', body: fd })
    const report = await res.json()
    setImportResult(report)
    load()
    e.target.value = ''
  }

  async function remove(id: number) {
    if (!confirm('Delete component?')) return
    const res = await fetch(`/api/configurator/admin/components/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const j = await res.json().catch(() => ({ error: 'Failed' }))
      alert(j.error ?? 'Failed'); return
    }
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Components</h1>
        <div className="flex items-center gap-2">
          <a
            href="/api/configurator/admin/components/export"
            className="rounded border px-3 py-1.5 text-sm"
          >Export Excel</a>
          <label className="rounded border px-3 py-1.5 text-sm cursor-pointer">
            Import Excel
            <input type="file" accept=".xlsx" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </div>

      {importResult && (
        <div className="rounded border bg-muted/50 p-3 text-sm">
          <div className="font-medium">Import result</div>
          <div>Inserted: {importResult.inserted} · Updated: {importResult.updated} · Errors: {importResult.errors?.length ?? 0}</div>
          {importResult.errors?.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs">
              {importResult.errors.slice(0, 10).map((e: any, i: number) => <li key={i}>Row {e.row}: {e.message}</li>)}
              {importResult.errors.length > 10 && <li>…and {importResult.errors.length - 10} more</li>}
            </ul>
          )}
        </div>
      )}

      <input
        className="w-full rounded border px-2 py-1 text-sm"
        placeholder="Search by code or name"
        value={q}
        onChange={e => setQ(e.target.value)}
      />

      <table className="w-full overflow-hidden rounded border text-sm">
        <thead className="bg-muted text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-2 py-2 text-left">Code</th>
            <th className="px-2 py-2 text-left">Name</th>
            <th className="px-2 py-2 text-left">Category</th>
            <th className="px-2 py-2 text-right">Unit cost</th>
            <th className="px-2 py-2 text-right">List price</th>
            <th className="px-2 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(c => (
            <tr key={c.id} className="border-t">
              <td className="px-2 py-1 font-mono text-xs">{c.itemCode}</td>
              <td className="px-2 py-1">{c.name}</td>
              <td className="px-2 py-1 text-xs">{c.category?.code}</td>
              <td className="px-2 py-1 text-right">{Number(c.currentUnitCost).toLocaleString()}</td>
              <td className="px-2 py-1 text-right">{Number(c.currentListPrice).toLocaleString()}</td>
              <td className="px-2 py-1 text-right">
                <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive">×</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={6} className="px-2 py-4 text-center text-muted-foreground">No components.</td></tr>
          )}
        </tbody>
      </table>

      <div className="rounded border p-3 text-sm">
        <div className="mb-2 font-medium">Quick add</div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
          <input className="rounded border px-2 py-1" placeholder="itemCode" value={form.itemCode} onChange={e => setForm({ ...form, itemCode: e.target.value })} />
          <input className="rounded border px-2 py-1" placeholder="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="rounded border px-2 py-1" placeholder="uom" value={form.uom} onChange={e => setForm({ ...form, uom: e.target.value })} />
          <select className="rounded border px-2 py-1" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">category…</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
          <input type="number" className="rounded border px-2 py-1" placeholder="cost" value={form.currentUnitCost} onChange={e => setForm({ ...form, currentUnitCost: e.target.value })} />
          <input type="number" className="rounded border px-2 py-1" placeholder="list price" value={form.currentListPrice} onChange={e => setForm({ ...form, currentListPrice: e.target.value })} />
        </div>
        <button onClick={createComponent} className="mt-2 rounded bg-primary px-4 py-1.5 text-sm text-primary-foreground">Add component</button>
      </div>
    </div>
  )
}
