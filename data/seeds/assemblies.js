const fs = require('fs');
const path = require('path');

async function seedAssemblies(prismaInstance = null) {
  const prisma = prismaInstance; // Use provided prisma instance
  console.log('🏗️ Seeding Assemblies...');

  // Load assemblies from JSON file
  const assembliesPath = path.join(__dirname, '../../data/assemblies.json');
  const assembliesData = JSON.parse(fs.readFileSync(assembliesPath, 'utf8'));

  // Get all materials first
  const materials = await prisma.material.findMany();
  console.log(`Found ${materials.length} materials in database`);

  // Create a map for easy lookup
  const materialMap = {};
  materials.forEach(material => {
    materialMap[material.name] = material;
  });

  const assemblies = assembliesData.map(assembly => ({
    name: assembly.name,
    description: assembly.description || '',
    materials: assembly.materials.map(am => ({
      name: am.material.name,
      quantity: parseFloat(am.quantity) || 0,
    })),
  }));

  const createdAssemblies = [];

  for (const assemblyData of assemblies) {
    try {
      // Validate that all materials exist
      const assemblyMaterials = [];
      for (const materialRef of assemblyData.materials) {
        const material = materialMap[materialRef.name];
        if (!material) {
          console.log(`⚠️  Warning: Material "${materialRef.name}" not found, skipping this assembly`);
          continue;
        }
        assemblyMaterials.push({
          materialId: material.id,
          quantity: materialRef.quantity,
        });
      }

      if (assemblyMaterials.length === 0) {
        console.log(`⚠️  Skipping assembly "${assemblyData.name}" - no valid materials found`);
        continue;
      }

      const assembly = await prisma.assembly.upsert({
        where: { name: assemblyData.name },
        update: {
          description: assemblyData.description,
          categoryId: 1, // Containment category
          docs: [], // Empty docs array
          materials: {
            deleteMany: {}, // Remove existing materials
            create: assemblyMaterials,
          },
        },
        create: {
          name: assemblyData.name,
          description: assemblyData.description,
          categoryId: 1, // Containment category
          docs: [], // Empty docs array
          materials: {
            create: assemblyMaterials,
          },
        },
        include: {
          materials: {
            include: {
              material: true,
            },
          },
        },
      });

      createdAssemblies.push(assembly);
      console.log(`✓ Created assembly: ${assembly.name} (${assembly.materials.length} materials)`);

      // Log material details for this assembly
      assembly.materials.forEach(am => {
        console.log(`   - ${am.material.name}: ${am.quantity} ${am.material.unit}`);
      });

    } catch (error) {
      console.log(`⚠️  Skipping duplicate or invalid assembly: ${assemblyData.name}`);
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log(`\n✅ Assemblies seeding completed! Created ${createdAssemblies.length} assemblies`);

  console.log('\n📊 Assemblies Summary:');
  console.log(`   Total Assemblies: ${createdAssemblies.length}`);

  // Group by category
  const categories = {
    'Electrical': ['Pemasangan Kabel', 'Pemasangan Terminal', 'Pemasangan Saklar'],
    'Lighting': ['Pemasangan Lampu', 'Pemasangan Buzzer'],
    'Safety': ['Pemasangan Emergency', 'Pemasangan Fingerprint'],
    'Networking': ['Pemasangan RJ45', 'Pemasangan Switch'],
    'Power': ['Pemasangan Power Supply'],
    'Sensors': ['Pemasangan Temperature'],
  };

  Object.entries(categories).forEach(([category, keywords]) => {
    const count = createdAssemblies.filter(assembly =>
      keywords.some(keyword => assembly.name.includes(keyword))
    ).length;
    if (count > 0) {
      console.log(`   ${category}: ${count} assemblies`);
    }
  });

  // Calculate total materials used across all assemblies
  const totalMaterialsUsed = createdAssemblies.reduce((total, assembly) => total + assembly.materials.length, 0);
  console.log(`   Total Material Relationships: ${totalMaterialsUsed}`);

  return createdAssemblies;
}

module.exports = { seedAssemblies };
