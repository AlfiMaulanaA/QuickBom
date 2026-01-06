const fs = require('fs');
const path = require('path');

async function seedMaterials(prismaInstance = null) {
  const prisma = prismaInstance; // Use provided prisma instance
  console.log('🔧 Seeding Materials...');

  // Load materials from JSON file
  const materialsPath = path.join(__dirname, '../../data/materials.json');
  const materialsData = JSON.parse(fs.readFileSync(materialsPath, 'utf8'));

  // Map JSON data to seed format, omitting id, createdAt, updatedAt
  const boqMaterials = materialsData.map(material => ({
    name: material.name,
    partNumber: material.partNumber,
    manufacturer: material.manufacturer,
    unit: material.unit,
    price: parseFloat(material.price) || 0,
    purchaseUrl: material.purchaseUrl,
    datasheetFile: material.datasheetFile,
  }));

  // Add some dummy/placeholder materials for testing
  const dummyMaterials = [
    {
      name: "DUMMY MATERIAL - PLACEHOLDER",
      partNumber: "DUMMY-001",
      manufacturer: "DUMMY",
      unit: "EACH",
      price: 0,
      purchaseUrl: null,
      datasheetFile: null,
    },
    {
      name: "BLANK MATERIAL - FOR TESTING",
      partNumber: "BLANK-001",
      manufacturer: "BLANK",
      unit: "EACH",
      price: 0,
      purchaseUrl: null,
      datasheetFile: null,
    },
    {
      name: "NODE MATERIAL - PLACEHOLDER",
      partNumber: "NODE-001",
      manufacturer: "NODE",
      unit: "EACH",
      price: 0,
      purchaseUrl: null,
      datasheetFile: null,
    }
  ];

  const allMaterials = [...boqMaterials, ...dummyMaterials];
  const createdMaterials = [];

  for (const material of allMaterials) {
    try {
      const createdMaterial = await prisma.material.upsert({
        where: { name: material.name },
        update: material,
        create: material,
      });
      createdMaterials.push(createdMaterial);
      console.log(`✓ Created material: ${createdMaterial.name} (${createdMaterial.unit}) - ${createdMaterial.manufacturer}`);
    } catch (error) {
      console.log(`⚠️  Skipping duplicate material: ${material.name}`);
    }
  }

  console.log(`\n✅ Materials seeding completed! Created ${createdMaterials.length} materials`);

  console.log('\n📊 Materials Summary:');
  console.log(`   BOQ Electrical Materials: ${boqMaterials.length}`);
  console.log(`   Total Materials: ${createdMaterials.length}`);

  // Group by manufacturer for summary
  const manufacturers = {};
  createdMaterials.forEach(material => {
    manufacturers[material.manufacturer] = (manufacturers[material.manufacturer] || 0) + 1;
  });

  console.log('\n🏭 Top Manufacturers:');
  Object.entries(manufacturers)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([manufacturer, count]) => {
      console.log(`   ${manufacturer}: ${count} items`);
    });

  return createdMaterials;
}

module.exports = { seedMaterials };
