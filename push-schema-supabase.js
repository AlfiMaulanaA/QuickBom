/**
 * Push Prisma Schema to Supabase
 * Creates missing tables in Supabase database
 */

const { execSync } = require('child_process');

async function pushSchemaToSupabase() {
  console.log('🚀 Pushing Prisma schema to Supabase...');

  try {
    // Set the Supabase database URL
    const supabaseUrl = 'postgresql://postgres.bficmvgkjygzoatrytvj:QuickBom123!@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

    console.log('📍 Using Supabase URL:', supabaseUrl.replace(/:([^:@]{4})[^:@]*@/, ':****@'));

    // Execute prisma db push with Supabase URL
    const command = `SUPABASE_DATABASE_URL="${supabaseUrl}" npx prisma db push --accept-data-loss`;

    console.log('⚡ Executing:', command.replace(/QuickBom123!/, '****'));

    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    console.log('✅ Schema successfully pushed to Supabase!');

  } catch (error) {
    console.error('❌ Failed to push schema to Supabase:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  pushSchemaToSupabase().catch(console.error);
}

module.exports = { pushSchemaToSupabase };