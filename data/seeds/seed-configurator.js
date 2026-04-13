const { PrismaClient } = require('@prisma/client')
const path = require('path')
const fs = require('fs')

async function seedConfigurator(prisma) {
  const fixturePath = path.resolve(__dirname, '../configurator/rcp-schneider.json')
  const raw = fs.readFileSync(fixturePath, 'utf-8')
  const fx = JSON.parse(raw)

  // Categories
  const categories = {}
  for (const c of fx.categories) {
    categories[c.code] = await prisma.productCategory.upsert({
      where: { code: c.code },
      update: { name: c.name, sortOrder: c.sortOrder },
      create: c,
    })
  }

  // Group + subGroup
  const group = await prisma.productGroup.upsert({
    where: { code: fx.group.code },
    update: fx.group,
    create: fx.group,
  })
  const subGroup = await prisma.productSubGroup.upsert({
    where: { groupId_code: { groupId: group.id, code: fx.subGroup.code } },
    update: { name: fx.subGroup.name, sortOrder: fx.subGroup.sortOrder },
    create: { ...fx.subGroup, groupId: group.id },
  })

  // Components
  const componentsByCode = {}
  for (const c of fx.components) {
    const data = {
      itemCode: c.itemCode, name: c.name, uom: c.uom,
      categoryId: categories[c.category].id,
      manufacturer: c.manufacturer ?? null,
      currentUnitCost: c.currentUnitCost,
      currentListPrice: c.currentListPrice,
      isService: c.isService ?? false,
    }
    componentsByCode[c.itemCode] = await prisma.component.upsert({
      where: { itemCode: c.itemCode },
      update: data,
      create: data,
    })
  }

  // Product
  const product = await prisma.product.upsert({
    where: { code: fx.product.code },
    update: {
      name: fx.product.name, brand: fx.product.brand, basePrice: fx.product.basePrice,
      dimensionsJson: fx.product.dimensionsJson, inputSpecJson: fx.product.inputSpecJson,
      subGroupId: subGroup.id, isActive: true,
    },
    create: {
      code: fx.product.code, name: fx.product.name, brand: fx.product.brand,
      basePrice: fx.product.basePrice, dimensionsJson: fx.product.dimensionsJson,
      inputSpecJson: fx.product.inputSpecJson, subGroupId: subGroup.id,
    },
  })

  // Mappings
  for (const m of fx.mappings) {
    const comp = componentsByCode[m.itemCode]
    if (!comp) throw new Error('Missing component for mapping: ' + m.itemCode)
    const categoryCode = fx.components.find(c => c.itemCode === m.itemCode).category
    await prisma.productComponentMapping.upsert({
      where: { productId_componentId: { productId: product.id, componentId: comp.id } },
      update: {
        isMandatory: m.isMandatory ?? false,
        isDefaultSelected: m.isDefaultSelected ?? false,
        defaultQty: m.defaultQty ?? 1,
        qtyFormula: m.qtyFormula ?? null,
        sortOrder: m.sortOrder ?? 0,
        categoryId: categories[categoryCode].id,
      },
      create: {
        productId: product.id,
        componentId: comp.id,
        categoryId: categories[categoryCode].id,
        isMandatory: m.isMandatory ?? false,
        isDefaultSelected: m.isDefaultSelected ?? false,
        defaultQty: m.defaultQty ?? 1,
        qtyFormula: m.qtyFormula ?? null,
        sortOrder: m.sortOrder ?? 0,
      },
    })
  }

  // Rules — delete then recreate for idempotency
  await prisma.componentRule.deleteMany({ where: { productId: product.id } })
  for (const r of fx.rules) {
    const src = componentsByCode[r.source]
    const tgt = componentsByCode[r.target]
    if (!src || !tgt) throw new Error('Missing component for rule')
    await prisma.componentRule.create({
      data: {
        productId: product.id,
        ruleType: r.ruleType,
        sourceComponentId: src.id,
        targetComponentId: tgt.id,
        condition: r.condition,
      },
    })
  }

  console.log('[SEED] Configurator: RCP-Schneider seeded')
}

module.exports = { seedConfigurator }

if (require.main === module) {
  const prisma = new PrismaClient()
  seedConfigurator(prisma).catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
}
