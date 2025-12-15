/**
 * QuickBom Assembly Categories Seeder
 */

const log = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

const error = (message, err = null) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`);
  if (err) {
    console.error(err);
  }
};

// Default assembly categories data with hardcoded IDs
const defaultAssemblyCategories = [
  {
    id: 1,
    name: 'Containment',
    description: 'Server room containment systems and environmental controls',
    color: '#3b82f6',
    icon: 'Building'
  },
  {
    id: 2,
    name: 'Container',
    description: 'Shipping containers and modular container solutions',
    color: '#10b981',
    icon: 'Package'
  },
  {
    id: 3,
    name: 'Smart Rack',
    description: 'Intelligent server racks with monitoring and management systems',
    color: '#f59e0b',
    icon: 'Server'
  }
];

async function seedAssemblyCategories(prisma) {
  log('🌱 Starting Assembly Categories seeding...');

  try {
    const existingCategories = await prisma.assemblyCategory.count();
    log(`Found ${existingCategories} existing assembly categories`);

    if (existingCategories > 0) {
      log('⏭️  Assembly categories already exist, skipping seeding');
      return await prisma.assemblyCategory.findMany();
    }

    log(`Creating ${defaultAssemblyCategories.length} default assembly categories...`);

    const createdCategories = [];

    for (const categoryData of defaultAssemblyCategories) {
      try {
        const category = await prisma.assemblyCategory.create({
          data: categoryData
        });

        createdCategories.push(category);
        log(`✅ Created category: ${category.name}`);

      } catch (err) {
        if (err.code === 'P2002') {
          log(`⚠️  Category "${categoryData.name}" already exists, skipping`);
        } else {
          error(`❌ Failed to create category "${categoryData.name}":`, err);
          throw err;
        }
      }
    }

    const totalCategories = await prisma.assemblyCategory.count();
    log(`🎉 Assembly Categories seeding completed! Total: ${totalCategories} categories`);

    return createdCategories;

  } catch (err) {
    error('❌ Assembly Categories seeding failed:', err);
    throw err;
  }
}

module.exports = {
  seedAssemblyCategories
};
