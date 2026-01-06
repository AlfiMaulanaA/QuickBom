#!/usr/bin/env node

/**
 * QuickBom Individual Seeder Runner
 *
 * Run individual seed files without running the full seeding process
 *
 * Usage:
 *   node data/seeds/run-seed.js <seeder-name>
 *
 * Examples:
 *   node data/seeds/run-seed.js users
 *   node data/seeds/run-seed.js materials
 *   node data/seeds/run-seed.js assemblies
 *   node data/seeds/run-seed.js all  # Run all seeders
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

// Environment-aware database configuration
const getDatabaseConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Production: Use Supabase
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
    if (!supabaseUrl) {
      throw new Error('SUPABASE_DATABASE_URL or DATABASE_URL environment variable is required in production');
    }

    console.log('[SEED-RUNNER] Using Supabase database for production seeding');
    return {
      datasourceUrl: supabaseUrl,
    };
  } else {
    // Development: Use local PostgreSQL
    const localUrl = process.env.DATABASE_URL;
    if (!localUrl) {
      throw new Error('DATABASE_URL environment variable is required in development');
    }

    console.log('[SEED-RUNNER] Using local PostgreSQL database for development seeding');
    return {
      datasourceUrl: localUrl,
    };
  }
};

// Create Prisma client
const createPrismaClient = () => {
  const config = getDatabaseConfig();
  return new PrismaClient({
    datasourceUrl: config.datasourceUrl,
  });
};

// Available seeders mapping with dependencies
const SEEDERS = {
  users: {
    file: './users.js',
    function: 'seedUsers',
    dependencies: []
  },
  clients: {
    file: './clients.js',
    function: 'seedClients',
    dependencies: []
  },
  materials: {
    file: './materials.js',
    function: 'seedMaterials',
    dependencies: []
  },
  'assembly-categories': {
    file: './assembly-categories.js',
    function: 'seedAssemblyCategories',
    dependencies: []
  },
  assemblies: {
    file: './assemblies.js',
    function: 'seedAssemblies',
    dependencies: ['assembly-categories', 'materials']
  },
  'assembly-groups': {
    file: './assembly-groups-seed.js',
    function: 'seedAssemblyGroupsFromJson',
    dependencies: ['assemblies']
  },
  templates: {
    file: './templates.js',
    function: 'seedTemplates',
    dependencies: ['assemblies']
  },
};

// Utility functions
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

// Test database connection
async function testConnection(prisma) {
  log('Testing database connection...');

  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    log('✅ Database connection successful');
    return true;
  } catch (err) {
    error('❌ Database connection failed:', err);
    return false;
  }
}

// Get seeding stats
async function getSeedingStats(prisma) {
  try {
    const userCount = await prisma.user.count();
    const materialCount = await prisma.material.count();
    const assemblyCount = await prisma.assembly.count();
    const templateCount = await prisma.template.count();
    const projectCount = await prisma.project.count();
    const clientCount = await prisma.client.count();

    return {
      users: userCount,
      materials: materialCount,
      assemblies: assemblyCount,
      templates: templateCount,
      projects: projectCount,
      clients: clientCount,
    };
  } catch (err) {
    error('Failed to get seeding stats:', err);
    return null;
  }
}

// Check if dependencies are satisfied
async function checkDependencies(seederName, prisma) {
  const seederConfig = SEEDERS[seederName];

  if (!seederConfig || seederConfig.dependencies.length === 0) {
    return true; // No dependencies or unknown seeder
  }

  log(`🔍 Checking dependencies for ${seederName}...`);

  for (const dependency of seederConfig.dependencies) {
    try {
      let hasData = false;

      // Check based on dependency type
      switch (dependency) {
        case 'assembly-categories':
          const categoryCount = await prisma.assemblyCategory.count();
          hasData = categoryCount > 0;
          break;
        case 'materials':
          const materialCount = await prisma.material.count();
          hasData = materialCount > 0;
          break;
        case 'assemblies':
          const assemblyCount = await prisma.assembly.count();
          hasData = assemblyCount > 0;
          break;
        default:
          // For other dependencies, assume they exist if no specific check
          hasData = true;
      }

      if (!hasData) {
        log(`⚠️  Dependency "${dependency}" not satisfied, running it first...`);
        const depResult = await runSeeder(dependency, prisma);
        if (depResult === null) {
          error(`Failed to run dependency "${dependency}"`);
          return false;
        }
      } else {
        log(`✅ Dependency "${dependency}" satisfied`);
      }
    } catch (err) {
      error(`Error checking dependency "${dependency}":`, err);
      return false;
    }
  }

  return true;
}

// Run a single seeder
async function runSeeder(seederName, prisma) {
  const seederConfig = SEEDERS[seederName];

  if (!seederConfig) {
    error(`Unknown seeder: ${seederName}`);
    console.log('Available seeders:', Object.keys(SEEDERS).join(', '));
    return null;
  }

  try {
    // Check dependencies first
    const dependenciesOk = await checkDependencies(seederName, prisma);
    if (!dependenciesOk) {
      error(`Cannot run ${seederName} seeder - dependencies not satisfied`);
      return null;
    }

    log(`🌱 Running ${seederName} seeder...`);

    // Load the seeder module
    const seederPath = path.join(__dirname, seederConfig.file);
    const seederModule = require(seederPath);

    if (!seederModule[seederConfig.function]) {
      error(`Function ${seederConfig.function} not found in ${seederConfig.file}`);
      return null;
    }

    // Run the seeder
    const result = await seederModule[seederConfig.function](prisma);
    log(`✅ ${seederName} seeding completed successfully`);

    return result;
  } catch (err) {
    error(`❌ ${seederName} seeding failed:`, err);
    return null;
  }
}

// Run all seeders in dependency order
async function runAllSeeders(prisma) {
  const startTime = Date.now();
  log('🚀 Running all seeders in dependency order...');

  const seedOrder = ['users', 'clients', 'materials', 'assembly-categories', 'assemblies', 'templates'];
  const results = {};

  for (const seederName of seedOrder) {
    const result = await runSeeder(seederName, prisma);
    if (result !== null) {
      results[seederName] = result;
    } else {
      error(`Stopping due to failure in ${seederName}`);
      break;
    }
  }

  const duration = Date.now() - startTime;
  log(`✅ All seeding completed in ${duration}ms`);

  return results;
}

// Display usage information
function showUsage() {
  console.log(`
QuickBom Individual Seeder Runner

Usage:
  node data/seeds/run-seed.js <seeder-name>

Available seeders:
  ${Object.keys(SEEDERS).join('\n  ')}

Special commands:
  all     - Run all seeders in dependency order
  list    - List all available seeders
  stats   - Show current database statistics

Examples:
  node data/seeds/run-seed.js users
  node data/seeds/run-seed.js materials
  node data/seeds/run-seed.js assemblies
  node data/seeds/run-seed.js all
  node data/seeds/run-seed.js stats

Environment Variables:
  DATABASE_URL              - Database connection URL (required)
  SUPABASE_DATABASE_URL     - Supabase database URL (production)
  NODE_ENV                  - Environment (development/production)
`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('❌ No seeder specified');
    showUsage();
    process.exit(1);
  }

  const command = args[0].toLowerCase();
  const prisma = createPrismaClient();

  try {
    // Test connection
    const isConnected = await testConnection(prisma);
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    if (command === 'list') {
      console.log('Available seeders:');
      Object.keys(SEEDERS).forEach(name => {
        console.log(`  - ${name}`);
      });
      return;
    }

    if (command === 'stats') {
      const stats = await getSeedingStats(prisma);
      console.log('\n📊 Current Database Statistics:');
      console.log(`   👥 Users: ${stats.users}`);
      console.log(`   🏢 Clients: ${stats.clients}`);
      console.log(`   🔧 Materials: ${stats.materials}`);
      console.log(`   🏗️  Assemblies: ${stats.assemblies}`);
      console.log(`   📋 Templates: ${stats.templates}`);
      console.log(`   📊 Projects: ${stats.projects}`);
      return;
    }

    if (command === 'all') {
      const results = await runAllSeeders(prisma);
      console.log('\n🎉 All seeding completed!');
      console.log('Results:', Object.keys(results).reduce((acc, key) => {
        acc[key] = Array.isArray(results[key]) ? `${results[key].length} items` : 'completed';
        return acc;
      }, {}));
    } else {
      const result = await runSeeder(command, prisma);
      if (result !== null) {
        console.log(`\n✅ ${command} seeding completed!`);
        if (Array.isArray(result)) {
          console.log(`Created/Updated ${result.length} items`);
        }
      } else {
        process.exit(1);
      }
    }

  } catch (err) {
    error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
}

// Export for use as module
module.exports = {
  runSeeder,
  runAllSeeders,
  SEEDERS,
  getSeedingStats,
};
