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

    // Check Column Types for Project and Template
    console.log('\n🔍 Checking Column Types:');

    const result = await prisma.$queryRaw`
      SELECT table_name, column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name IN ('Project', 'Template') 
      AND column_name IN ('qualityCheckDocs', 'docs', 'schematicDocs', 'assemblySelections')
      ORDER BY table_name, column_name;
    `;

    console.table(result);

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