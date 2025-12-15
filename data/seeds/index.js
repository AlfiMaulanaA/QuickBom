/**
 * QuickBom Legacy Database Seeder (Updated)
 * Now supports both PostgreSQL (development) and Supabase (production)
 */

const { PrismaClient } = require('@prisma/client');
const { seedUsers } = require('./users');
const { seedClients } = require('./clients');
const { seedMaterials } = require('./materials');
const { seedAssemblyCategories } = require('./assembly-categories');
const { seedAssemblies } = require('./assemblies');
const { seedTemplates } = require('./templates');


// Environment-aware database configuration (same as new system)
const getDatabaseConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Production: Use Supabase
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
    if (!supabaseUrl) {
      throw new Error('SUPABASE_DATABASE_URL or DATABASE_URL environment variable is required in production');
    }

    console.log('[SEED-LEGACY] Using Supabase database for production seeding');
    return {
      datasourceUrl: supabaseUrl,
      connectionConfig: {
        connection_limit: 5, // Supabase has connection limits
        pool_timeout: 30,
        connection_timeout: 20,
        ssl: { rejectUnauthorized: false },
      }
    };
  } else {
    // Development: Use local PostgreSQL
    const localUrl = process.env.DATABASE_URL;
    if (!localUrl) {
      throw new Error('DATABASE_URL environment variable is required in development');
    }

    console.log('[SEED-LEGACY] Using local PostgreSQL database for development seeding');
    return {
      datasourceUrl: localUrl,
      connectionConfig: {
        connection_limit: 10,
        pool_timeout: 20,
        connection_timeout: 10,
        ssl: false, // Local PostgreSQL usually doesn't need SSL
      }
    };
  }
};

// Create Prisma client with environment-specific configuration
const createPrismaClient = () => {
  const config = getDatabaseConfig();

  return new PrismaClient({
    datasourceUrl: config.datasourceUrl,
    // Note: Connection config is handled via URL parameters in the new system
  });
};

// Global prisma instance
const prisma = createPrismaClient();

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
async function testConnection() {
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
async function getSeedingStats() {
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

async function seedAll() {
  const startTime = Date.now();
  log('🚀 Starting QuickBom Legacy Database Seeding...');
  log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  log(`Database URL: ${getDatabaseConfig().datasourceUrl.replace(/:[^:]+@/, ':***@')}`);

  try {
    // Test database connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed - aborting seeding');
    }

    // Get stats before seeding
    const statsBefore = await getSeedingStats();
    log('Stats before seeding:', statsBefore);

    // Seed in order of dependencies
    log('🌱 Starting seeding process...\n');

    console.log('='.repeat(50));
    const users = await seedUsers(prisma);
    console.log('='.repeat(50) + '\n');

    console.log('='.repeat(50));
    const clients = await seedClients(prisma);
    console.log('='.repeat(50) + '\n');

    console.log('='.repeat(50));
    const materials = await seedMaterials(prisma);
    console.log('='.repeat(50) + '\n');

    console.log('='.repeat(50));
    const assemblyCategories = await seedAssemblyCategories(prisma);
    console.log('='.repeat(50) + '\n');

    console.log('='.repeat(50));
    const assemblies = await seedAssemblies(prisma);
    console.log('='.repeat(50) + '\n');

    console.log('='.repeat(50));
    const templates = await seedTemplates(prisma);
    console.log('='.repeat(50) + '\n');

    // Final summary
    console.log('🎉 ALL SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📊 FINAL DATABASE SUMMARY:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   🏢 Clients: ${clients.length}`);
    console.log(`   🔧 Materials: ${materials.length}`);
    console.log(`   📂 Assembly Categories: ${assemblyCategories.length}`);
    console.log(`   🏗️  Assemblies: ${assemblies.length}`);
    console.log(`   📋 Templates: ${templates.length}`);

    console.log('\n🔐 DEFAULT LOGIN CREDENTIALS:');
    console.log('Admin: admin@gmail.com / admin123');
    console.log('Alfi: alfi@gmail.com / alfi123');
    console.log('Jonathan: jonathan@gmail.com / jonathan123');
    console.log('Hilmi: hilmi@gmail.com / hilmi123');

    // Get stats after seeding
    const statsAfter = await getSeedingStats();
    log('Stats after seeding:', statsAfter);

    const duration = Date.now() - startTime;
    log(`✅ Database seeding completed successfully in ${duration}ms`);
    console.log('\n🚀 Ready to start development server: npm run dev');
    console.log('📱 Access dashboard at: http://localhost:3000');

  } catch (error) {
    const duration = Date.now() - startTime;
    error(`❌ Database seeding failed after ${duration}ms:`, error);
    process.exit(1);
  }
}

// Export individual seeders for separate execution
module.exports = {
  seedAll,
  seedUsers,
  seedClients,
  seedMaterials,
  seedAssemblyCategories,
  seedAssemblies,
  seedTemplates,
};

// Run all seeders if this file is executed directly
if (require.main === module) {
  seedAll()
    .catch((e) => {
      console.error('❌ Seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$disconnect();
    });
}
