'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminProductsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [includeInactive, setIncludeInactive] = useState(false)

  const load = () => {
    const q = includeInactive ? '?includeInactive=true' : ''
    fetch(`/api/configurator/admin/products${q}`)
      .then(r => r.ok ? r.json() : [])
      .then(setRows)
  }
  useEffect(load, [includeInactive])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link
          href="/configurator/admin/products/new"
          className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground"
        >
          + New product
        </Link>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={includeInactive}
          onChange={e => setIncludeInactive(e.target.checked)}
        />
        Show inactive
      </label>
      <table className="w-full overflow-hidden rounded border text-sm">
        <thead className="bg-muted text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Code</th>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2 text-left">Group</th>
            <th className="px-3 py-2 text-left">Active</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(p => (
            <tr key={p.id} className="border-t">
              <td className="px-3 py-2 font-mono text-xs">{p.code}</td>
              <td className="px-3 py-2">{p.name}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground">
                {p.subGroup.group.name} · {p.subGroup.name}
              </td>
              <td className="px-3 py-2">{p.isActive ? '✓' : '—'}</td>
              <td className="px-3 py-2">
                <Link
                  href={`/configurator/admin/products/${p.id}`}
                  className="text-primary underline"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">No products.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
