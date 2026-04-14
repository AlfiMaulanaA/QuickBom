import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ConfiguratorClient } from './ConfiguratorClient'

interface Props {
  params: { productId: string }
  searchParams: { config?: string }
}

export default async function ConfiguratorProductPage({ params, searchParams }: Props) {
  const productId = Number(params.productId)
  if (!Number.isFinite(productId)) redirect('/configurator')

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      mappings: {
        include: { component: { include: { category: true } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })
  if (!product || !product.isActive) redirect('/configurator')

  let draft: any = null
  if (searchParams.config) {
    const row = await prisma.configuration.findUnique({
      where: { id: Number(searchParams.config) },
    })
    if (row && row.productId === productId) draft = row
  }

  const plainProduct = JSON.parse(JSON.stringify(product))
  const plainDraft = draft ? JSON.parse(JSON.stringify(draft)) : null
  return <ConfiguratorClient product={plainProduct} draft={plainDraft} />
}
