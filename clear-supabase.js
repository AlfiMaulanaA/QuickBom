/**
 * Clear Supabase Database Script
 * Removes all data from QuickBom Supabase database
 */

const { PrismaClient } = require('@prisma/client');

// Environment-aware database configuration
const getDatabaseConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
    if (!supabaseUrl) {
      throw new Error('SUPABASE_DATABASE_URL or DATABASE_URL environment variable is required in production');
    }

    console.log('[CLEAR] Using Supabase database for clearing');
    return supabaseUrl;
  } else {
    throw new Error('This script is only for production/Supabase. Use clear-database.sh for local PostgreSQL');
  }
};

const prisma = new PrismaClient({
  datasourceUrl: getDatabaseConfig(),
});

async function clearDatabase() {
  console.log('🗑️ Starting Supabase database clearing...');

  try {
    // Test connection first
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');

    // Get counts before clearing
    console.log('\n📊 Current data counts:');
    const tables = [
      'User', 'Client', 'Material', 'Assembly', 'AssemblyMaterial',
      'Template', 'TemplateAssembly', 'Project', 'ProjectTimeline',
      'ProjectMilestone', 'ProjectTask', 'TaskDependency',
      'AssemblyGroupItem', 'AssemblyGroup'
    ];

    let totalRecords = 0;
    const existingTables = [];

    for (const table of tables) {
      try {
        const count = await prisma[table].count();
        console.log(`  ${table}: ${count} records`);
        totalRecords += count;
        existingTables.push(table);
      } catch (err) {
        console.log(`  ${table}: Table does not exist in database (skipping)`);
      }
    }

    if (totalRecords === 0) {
      console.log('\n✅ Database is already empty!');
      return;
    }

    // Confirm deletion
    console.log(`\n⚠️  About to delete ${totalRecords} records from ${tables.length} tables`);
    console.log('This action cannot be undone!');

    // For safety, only proceed if explicitly confirmed via environment variable
    if (process.env.CONFIRM_DELETE !== 'yes') {
      console.log('\n🛡️ Safety check: Set CONFIRM_DELETE=yes to proceed with deletion');
      console.log('Example: CONFIRM_DELETE=yes NODE_ENV=production node clear-supabase.js');
      return;
    }

    console.log('\n🗑️ Clearing database...');

    // Filter clearOrder to only include existing tables
    const clearOrder = [
      'TaskDependency',
      'ProjectTask',
      'ProjectMilestone',
      'ProjectTimeline',
      'Project',
      'TemplateAssembly',
      'Template',
      'AssemblyGroupItem',  // Must be before Assembly (references Assembly and AssemblyGroup)
      'AssemblyMaterial',
      'Assembly',           // Now safe to delete after AssemblyGroupItem is cleared
      'AssemblyGroup',      // After AssemblyGroupItem is cleared
      'Material',
      'Client',
      'User'
    ].filter(table => existingTables.includes(table));

    let deletedTotal = 0;

    for (const table of clearOrder) {
      try {
        const countBefore = await prisma[table].count();
        if (countBefore > 0) {
          const result = await prisma[table].deleteMany();
          console.log(`✅ Cleared ${result.count} records from ${table}`);
          deletedTotal += result.count;
        }
      } catch (err) {
        console.log(`⚠️ Error clearing ${table}:`, err.message);
      }
    }

    console.log(`\n🎉 Successfully cleared ${deletedTotal} records from Supabase database!`);

    // Verify all tables are empty
    console.log('\n🔍 Verifying...');
    let allEmpty = true;
    for (const table of tables) {
      try {
        const count = await prisma[table].count();
        if (count > 0) {
          console.log(`⚠️ ${table} still has ${count} records`);
          allEmpty = false;
        }
      } catch (err) {
        // Table might not exist, skip
      }
    }

    if (allEmpty) {
      console.log('✅ All tables are now empty');
    }

  } catch (error) {
    console.error('❌ Error during database clearing:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  clearDatabase().catch(console.error);
}

module.exports = { clearDatabase };
