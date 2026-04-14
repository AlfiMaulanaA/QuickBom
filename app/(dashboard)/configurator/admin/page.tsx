import { prisma } from '@/lib/prisma'

export default async function AdminDashboard() {
  const [groups, subGroups, categories, products, components, rules, mappings] = await Promise.all([
    prisma.productGroup.count(),
    prisma.productSubGroup.count(),
    prisma.productCategory.count(),
    prisma.product.count(),
    prisma.component.count(),
    prisma.componentRule.count(),
    prisma.productComponentMapping.count(),
  ])
  const cards = [
    { label: 'Groups', value: groups },
    { label: 'Sub Groups', value: subGroups },
    { label: 'Categories', value: categories },
    { label: 'Products', value: products },
    { label: 'Components', value: components },
    { label: 'Mappings', value: mappings },
    { label: 'Rules', value: rules },
  ]
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Catalog Admin</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(c => (
          <div key={c.label} className="rounded-lg border bg-card p-4">
            <div className="text-xs uppercase text-muted-foreground">{c.label}</div>
            <div className="mt-1 text-2xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
