'use client'
import { useEffect, useState } from 'react'
import { ProductForm } from '@/components/admin/ProductForm'
import { MappingGrid } from '@/components/admin/MappingGrid'
import { RuleList } from '@/components/admin/RuleList'

export default function EditProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<any | null>(null)
  const [tab, setTab] = useState<'meta' | 'mappings' | 'rules'>('meta')

  useEffect(() => {
    fetch(`/api/configurator/admin/products/${params.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setProduct)
  }, [params.id])

  if (!product) return <div>Loading…</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <div className="text-xs text-muted-foreground">{product.code}</div>
      </div>
      <div className="border-b">
        {([
          ['meta', 'Metadata + Inputs'],
          ['mappings', 'Mappings'],
          ['rules', 'Rules'],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm ${tab === k ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'meta' && <ProductForm mode="edit" initial={product} />}
      {tab === 'mappings' && <MappingGrid productId={product.id} />}
      {tab === 'rules' && <RuleList productId={product.id} />}
    </div>
  )
}
