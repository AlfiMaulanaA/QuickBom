import { prisma } from '@/lib/prisma'
import { ProductPicker } from '@/components/configurator/ProductPicker'

export default async function ConfiguratorPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { subGroup: { include: { group: true } } },
    orderBy: { name: 'asc' },
  })
  const shaped = products.map(p => ({
    id: p.id,
    code: p.code,
    name: p.name,
    brand: p.brand,
    groupCode: p.subGroup.group.code,
    groupName: p.subGroup.group.name,
    subGroupCode: p.subGroup.code,
    subGroupName: p.subGroup.name,
  }))
  return <ProductPicker products={shaped} />
}
