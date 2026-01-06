const fs = require('fs');
const path = require('path');

async function seedAssemblyCategoriesFromJson(prismaInstance = null) {
  const prisma = prismaInstance; // Use provided prisma instance
  console.log('🌱 Seeding Assembly Categories from JSON...');

  // Load assembly categories from JSON file
  const categoriesPath = path.join(__dirname, '../assembly-categories.json');
  const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

  console.log(`Found ${categoriesData.length} assembly categories in JSON file`);

  const createdCategories = [];

  for (const categoryData of categoriesData) {
    try {
      const category = await prisma.assemblyCategory.upsert({
        where: { id: categoryData.id },
        update: {
          name: categoryData.name,
          description: categoryData.description,
          color: categoryData.color,
          icon: categoryData.icon,
        },
        create: {
          id: categoryData.id,
          name: categoryData.name,
          description: categoryData.description,
          color: categoryData.color,
          icon: categoryData.icon,
        },
      });

      createdCategories.push(category);
      console.log(`✅ Created/Updated category: ${category.name} (ID: ${category.id})`);

    } catch (error) {
      console.log(`⚠️  Error processing category "${categoryData.name}":`, error.message);
    }
  }

  console.log(`\n✅ Assembly Categories seeding completed! Created/Updated ${createdCategories.length} categories`);

  console.log('\n📊 Assembly Categories Summary:');
  console.log(`   Total Categories: ${createdCategories.length}`);

  // Group by color for summary
  const colorGroups = createdCategories.reduce((acc, category) => {
    const color = category.color || '#3b82f6';
    if (!acc[color]) acc[color] = [];
    acc[color].push(category);
    return acc;
  }, {});

  console.log('   Categories by Color:');
  Object.entries(colorGroups).forEach(([color, categories]) => {
    console.log(`     ${color}: ${categories.length} categories`);
  });

  return createdCategories;
}

module.exports = { seedAssemblyCategoriesFromJson };
