const fs = require('fs');
const path = require('path');

async function seedAssemblyGroupsFromJson(prismaInstance = null) {
  const prisma = prismaInstance; // Use provided prisma instance
  console.log('🌱 Seeding Assembly Groups from JSON...');

  // Check if required tables exist
  try {
    await prisma.assemblyGroup.count();
    console.log('✅ AssemblyGroup table exists');
  } catch (error) {
    console.log('⚠️  AssemblyGroup table does not exist in database (skipping assembly groups seeding)');
    return [];
  }

  try {
    await prisma.assemblyGroupItem.count();
    console.log('✅ AssemblyGroupItem table exists');
  } catch (error) {
    console.log('⚠️  AssemblyGroupItem table does not exist in database (skipping assembly groups seeding)');
    return [];
  }

  // Check if assembly categories exist first
  const categoryCount = await prisma.assemblyCategory.count();
  console.log(`Found ${categoryCount} assembly categories in database`);

  if (categoryCount === 0) {
    console.log('⚠️  No assembly categories found. Please run assembly-categories seeder first.');
    console.log('   Run: npm run db:seed:assembly-categories');
    return [];
  }

  // Check if assemblies exist
  const assemblyCount = await prisma.assembly.count();
  console.log(`Found ${assemblyCount} assemblies in database`);

  if (assemblyCount === 0) {
    console.log('⚠️  No assemblies found. Please run assemblies seeder first.');
    console.log('   Run: npm run db:seed:assemblies');
    return [];
  }

  // Load assembly groups from JSON file
  const groupsPath = path.join(__dirname, '../assembly-groups.json');
  const groupsData = JSON.parse(fs.readFileSync(groupsPath, 'utf8'));

  console.log(`Found ${groupsData.length} assembly groups in JSON file`);

  const createdGroups = [];

  for (const groupData of groupsData) {
    try {
      console.log(`Processing group: ${groupData.name} (${groupData.groupType})`);

      // Create or update the assembly group
      const group = await prisma.assemblyGroup.upsert({
        where: { id: groupData.id },
        update: {
          name: groupData.name,
          description: groupData.description,
          groupType: groupData.groupType,
          categoryId: groupData.categoryId,
          sortOrder: groupData.sortOrder,
        },
        create: {
          id: groupData.id,
          name: groupData.name,
          description: groupData.description,
          groupType: groupData.groupType,
          categoryId: groupData.categoryId,
          sortOrder: groupData.sortOrder,
        },
      });

      console.log(`✅ Created/Updated group: ${group.name} (ID: ${group.id})`);

      // Process group items
      const createdItems = [];
      for (const itemData of groupData.items) {
        try {
          // Verify assembly exists
          const assembly = await prisma.assembly.findUnique({
            where: { id: itemData.assemblyId }
          });

          if (!assembly) {
            console.log(`⚠️  Assembly ${itemData.assemblyId} not found, skipping item`);
            continue;
          }

          // Create or update the group item
          const item = await prisma.assemblyGroupItem.upsert({
            where: { id: itemData.id },
            update: {
              groupId: group.id, // Fix: Also update groupId in case it was wrong
              assemblyId: itemData.assemblyId,
              quantity: parseInt(itemData.quantity),
              conflictsWith: itemData.conflictsWith || [],
              isDefault: itemData.isDefault || false,
              sortOrder: itemData.sortOrder || 0,
            },
            create: {
              id: itemData.id,
              groupId: group.id,
              assemblyId: itemData.assemblyId,
              quantity: parseInt(itemData.quantity),
              conflictsWith: itemData.conflictsWith || [],
              isDefault: itemData.isDefault || false,
              sortOrder: itemData.sortOrder || 0,
            },
            include: {
              assembly: {
                select: {
                  name: true,
                  module: true,
                }
              }
            }
          });

          createdItems.push(item);
          console.log(`   ✓ ${item.assembly.name} (${item.quantity}x)`);

        } catch (itemError) {
          console.log(`⚠️  Error processing item for assembly ${itemData.assemblyId}:`, itemError.message);
        }
      }

      createdGroups.push({
        ...group,
        items: createdItems,
        itemCount: createdItems.length,
      });

    } catch (error) {
      console.log(`⚠️  Error processing group "${groupData.name}":`, error.message);
    }
  }

  console.log(`\n✅ Assembly Groups seeding completed! Created/Updated ${createdGroups.length} groups`);

  // Summary by group type
  const typeSummary = createdGroups.reduce((acc, group) => {
    const type = group.groupType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(group);
    return acc;
  }, {});

  console.log('\n📊 Assembly Groups Summary:');
  console.log(`   Total Groups: ${createdGroups.length}`);
  console.log('   By Type:');
  Object.entries(typeSummary).forEach(([type, groups]) => {
    console.log(`     ${type}: ${groups.length} groups`);
  });

  // Total items summary
  const totalItems = createdGroups.reduce((sum, group) => sum + group.itemCount, 0);
  console.log(`   Total Items: ${totalItems}`);

  return createdGroups;
}

module.exports = { seedAssemblyGroupsFromJson };
