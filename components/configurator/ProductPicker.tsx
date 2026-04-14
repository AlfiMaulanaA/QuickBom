import Link from 'next/link'

type Product = {
  id: number
  code: string
  name: string
  brand: string | null
  groupCode: string
  groupName: string
  subGroupCode: string
  subGroupName: string
}

export function ProductPicker({ products }: { products: Product[] }) {
  const groups = new Map<string, { name: string; items: Product[] }>()
  for (const p of products) {
    const key = p.groupCode
    if (!groups.has(key)) groups.set(key, { name: p.groupName, items: [] })
    groups.get(key)!.items.push(p)
  }
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Configurator</h1>
      {products.length === 0 && (
        <p className="text-sm text-muted-foreground">No active products. Ask an admin to publish some.</p>
      )}
      {Array.from(groups.entries()).map(([code, group]) => (
        <section key={code}>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">{group.name}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map(p => (
              <Link
                key={p.id}
                href={`/configurator/${p.id}`}
                className="rounded-lg border bg-card p-4 transition hover:border-primary hover:shadow-sm"
              >
                <div className="text-sm text-muted-foreground">
                  {p.subGroupName} · {p.brand ?? '—'}
                </div>
                <div className="mt-1 font-medium">{p.name}</div>
                <div className="mt-2 font-mono text-xs text-muted-foreground">{p.code}</div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
