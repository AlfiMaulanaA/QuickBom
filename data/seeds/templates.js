const fs = require('fs');
const path = require('path');

async function seedTemplates(prismaInstance = null) {
  const prisma = prismaInstance; // Use provided prisma instance
  console.log('📋 Seeding Templates...');

  // Load templates from JSON file
  const templatesPath = path.join(__dirname, '../../data/templates.json');
  const templatesData = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));

  // Get all assemblies first
  const assemblies = await prisma.assembly.findMany();
  console.log(`Found ${assemblies.length} assemblies in database`);

  // Create a map for easy lookup
  const assemblyMap = {};
  assemblies.forEach(assembly => {
    assemblyMap[assembly.name] = assembly;
  });

  const templates = templatesData.map(template => ({
    name: template.name,
    description: template.description,
    assemblies: template.assemblies.map(ta => ({
      name: ta.assembly.name,
      quantity: parseFloat(ta.quantity) || 0,
    })),
  }));

  const createdTemplates = [];

  for (const templateData of templates) {
    try {
      // Validate that all assemblies exist
      const templateAssemblies = [];
      for (const assemblyRef of templateData.assemblies) {
        const assembly = assemblyMap[assemblyRef.name];
        if (!assembly) {
          console.log(`⚠️  Warning: Assembly "${assemblyRef.name}" not found, skipping from template`);
          continue;
        }
        templateAssemblies.push({
          assemblyId: assembly.id,
          quantity: assemblyRef.quantity,
        });
      }

      if (templateAssemblies.length === 0) {
        console.log(`⚠️  Skipping template "${templateData.name}" - no valid assemblies found`);
        continue;
      }

      const template = await prisma.template.upsert({
        where: { name: templateData.name },
        update: {
          description: templateData.description,
          docs: [], // Empty docs array
          assemblies: {
            deleteMany: {}, // Remove existing assemblies
            create: templateAssemblies,
          },
        },
        create: {
          name: templateData.name,
          description: templateData.description,
          docs: [], // Empty docs array
          assemblies: {
            create: templateAssemblies,
          },
        },
        include: {
          assemblies: {
            include: {
              assembly: true,
            },
          },
        },
      });

      createdTemplates.push(template);
      console.log(`✓ Created template: ${template.name} (${template.assemblies.length} assemblies)`);

      // Log assembly details for this template
      template.assemblies.forEach(ta => {
        console.log(`   - ${ta.assembly.name}: ${ta.quantity} units`);
      });

    } catch (error) {
      console.log(`⚠️  Skipping duplicate or invalid template: ${templateData.name}`);
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log(`\n✅ Templates seeding completed! Created ${createdTemplates.length} templates`);

  console.log('\n📊 Templates Summary:');
  console.log(`   Total Templates: ${createdTemplates.length}`);

  // Group by category
  const categories = {
    'Electrical': ['Instalasi Listrik', 'Safety & Security'],
    'Office': ['Kantor', 'Ruang Meeting'],
    'Industrial': ['Pabrik', 'Gudang'],
    'Custom': ['Custom'],
  };

  Object.entries(categories).forEach(([category, keywords]) => {
    const count = createdTemplates.filter(template =>
      keywords.some(keyword => template.name.includes(keyword))
    ).length;
    if (count > 0) {
      console.log(`   ${category}: ${count} templates`);
    }
  });

  // Calculate total assemblies used across all templates
  const totalAssembliesUsed = createdTemplates.reduce((total, template) => total + template.assemblies.length, 0);
  console.log(`   Total Assembly Relationships: ${totalAssembliesUsed}`);

  return createdTemplates;
}

module.exports = { seedTemplates };
