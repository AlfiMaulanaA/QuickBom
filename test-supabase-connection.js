/**
 * Test Supabase Connection
 * Simple script to verify database connection
 */

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');

  const prisma = new PrismaClient({
    datasourceUrl: 'postgresql://postgres.bficmvgkjygzoatrytvj:QuickBom123!@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  });

  try {
    // Test basic connection
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');

    // List existing tables
    console.log('\n📋 Existing tables:');
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    console.log(`\n📊 Total tables: ${tables.length}`);

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  testConnection().catch(console.error);
}

module.exports = { testConnection };