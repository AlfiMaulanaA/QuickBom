'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type InputEntry = { key: string; type: string; default?: any; min?: number; max?: number }

interface Props {
  mode: 'create' | 'edit'
  initial?: any
}

export function ProductForm({ mode, initial }: Props) {
  const router = useRouter()
  const [code, setCode] = useState(initial?.code ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [brand, setBrand] = useState(initial?.brand ?? '')
  const [subGroupId, setSubGroupId] = useState<number | ''>(initial?.subGroupId ?? '')
  const [isActive, setIsActive] = useState<boolean>(initial?.isActive ?? true)
  const [inputSpec, setInputSpec] = useState<InputEntry[]>(
    Array.isArray(initial?.inputSpecJson) ? initial.inputSpecJson : [],
  )
  const [subGroups, setSubGroups] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/configurator/admin/subgroups')
      .then(r => r.ok ? r.json() : [])
      .then(setSubGroups)
  }, [])

  async function submit() {
    if (!code || !name || !subGroupId) {
      alert('code, name, subGroup required')
      return
    }
    const payload = { code, name, brand: brand || null, subGroupId: Number(subGroupId), isActive, inputSpec }
    const url = mode === 'create'
      ? '/api/configurator/admin/products'
      : `/api/configurator/admin/products/${initial.id}`
    const method = mode === 'create' ? 'POST' : 'PATCH'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({ error: 'Failed' }))
      alert(j.error ?? 'Failed')
      return
    }
    const row = await res.json()
    if (mode === 'create') router.push(`/configurator/admin/products/${row.id}`)
    else router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <L label="Code"><input className="inp" value={code} onChange={e => setCode(e.target.value)} /></L>
        <L label="Name"><input className="inp" value={name} onChange={e => setName(e.target.value)} /></L>
        <L label="Brand"><input className="inp" value={brand} onChange={e => setBrand(e.target.value)} /></L>
        <L label="Sub Group">
          <select className="inp" value={subGroupId} onChange={e => setSubGroupId(Number(e.target.value))}>
            <option value="">—</option>
            {subGroups.map(sg => (
              <option key={sg.id} value={sg.id}>{sg.code} — {sg.name}</option>
            ))}
          </select>
        </L>
        <L label="Active">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
        </L>
      </div>

      <div className="rounded border p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium">Input spec</div>
          <button
            type="button"
            onClick={() => setInputSpec(s => [...s, { key: '', type: 'float' }])}
            className="rounded border px-2 py-0.5 text-xs"
          >+ Add input</button>
        </div>
        <div className="space-y-2">
          {inputSpec.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <input
                className="inp w-32"
                placeholder="key"
                value={f.key}
                onChange={e => setInputSpec(s => s.map((x, j) => j === i ? { ...x, key: e.target.value } : x))}
              />
              <select
                className="inp w-28"
                value={f.type}
                onChange={e => setInputSpec(s => s.map((x, j) => j === i ? { ...x, type: e.target.value } : x))}
              >
                <option value="int">int</option>
                <option value="float">float</option>
                <option value="bool">bool</option>
                <option value="string">string</option>
                <option value="enum">enum</option>
              </select>
              <input
                className="inp w-28"
                placeholder="default"
                value={f.default ?? ''}
                onChange={e => setInputSpec(s => s.map((x, j) => j === i ? { ...x, default: coerce(e.target.value, x.type) } : x))}
              />
              <button
                type="button"
                onClick={() => setInputSpec(s => s.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-destructive"
              >×</button>
            </div>
          ))}
          {inputSpec.length === 0 && <div className="text-xs text-muted-foreground">No inputs defined.</div>}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={submit} className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
          {mode === 'create' ? 'Create' : 'Save'}
        </button>
      </div>

      <style jsx>{`
        :global(.inp) {
          padding: 4px 8px;
          border: 1px solid var(--border, #d4d4d8);
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}

function coerce(v: string, type: string) {
  if (type === 'int' || type === 'float') return v === '' ? undefined : Number(v)
  if (type === 'bool') return v === 'true'
  return v
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
