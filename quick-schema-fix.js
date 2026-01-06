/**
 * Quick Schema Fix for Supabase
 * Executes SQL script to add missing tables/columns
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function quickSchemaFix() {
  console.log('🚀 Starting Quick Schema Fix for Supabase...');

  // Connect to Supabase
  const prisma = new PrismaClient({
    datasourceUrl: 'postgresql://postgres.bficmvgkjygzoatrytvj:QuickBom123!@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  });

  try {
    // Test connection
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Connected to Supabase');

    // Read SQL script
    const sqlPath = path.join(__dirname, 'add-missing-tables.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Executing SQL script...');

    // Execute key SQL statements individually
    console.log('🔧 Creating AssemblyModule enum type...');
    try {
      await prisma.$queryRaw`
        DO $$ BEGIN
            CREATE TYPE "AssemblyModule" AS ENUM('ELECTRONIC', 'ELECTRICAL', 'ASSEMBLY', 'INSTALLATION', 'MECHANICAL');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
      `;
      console.log('✅ Created AssemblyModule enum type');
    } catch (err) {
      console.log('⚠️  AssemblyModule enum may already exist:', err.message);
    }

    console.log('🔧 Setting up module column in Assembly table...');
    try {
      // Check if column exists and its type
      const columnCheck = await prisma.$queryRaw`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'Assembly' AND column_name = 'module'
      `;

      if (columnCheck.length === 0) {
        // Column doesn't exist, add it with enum type
        await prisma.$queryRaw`ALTER TABLE "Assembly" ADD COLUMN "module" "AssemblyModule" NOT NULL DEFAULT 'ELECTRICAL'`;
        console.log('✅ Added module column to Assembly table');
      } else if (columnCheck[0].udt_name !== 'AssemblyModule') {
        // Column exists but wrong type, convert it
        await prisma.$queryRaw`ALTER TABLE "Assembly" ALTER COLUMN "module" DROP DEFAULT`;
        await prisma.$queryRaw`UPDATE "Assembly" SET "module" = 'ELECTRICAL' WHERE "module" NOT IN ('ELECTRONIC', 'ELECTRICAL', 'ASSEMBLY', 'INSTALLATION', 'MECHANICAL')`;
        await prisma.$queryRaw`ALTER TABLE "Assembly" ALTER COLUMN "module" TYPE "AssemblyModule" USING "module"::"AssemblyModule"`;
        await prisma.$queryRaw`ALTER TABLE "Assembly" ALTER COLUMN "module" SET DEFAULT 'ELECTRICAL'::"AssemblyModule"`;
        console.log('✅ Converted module column to enum type');
      } else {
        console.log('✅ Module column already exists with correct enum type');
      }
    } catch (err) {
      console.log('⚠️  Module column setup failed:', err.message);
    }

    console.log('🏗️ Creating AssemblyGroup table...');
    try {
      await prisma.$queryRaw`
        CREATE TABLE IF NOT EXISTS "AssemblyGroup" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "groupType" TEXT NOT NULL,
          "categoryId" INTEGER NOT NULL,
          "sortOrder" INTEGER DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log('✅ Created AssemblyGroup table');
    } catch (err) {
      console.log('⚠️  AssemblyGroup table creation failed:', err.message);
    }

    console.log('📦 Creating AssemblyGroupItem table...');
    try {
      await prisma.$queryRaw`
        CREATE TABLE IF NOT EXISTS "AssemblyGroupItem" (
          "id" TEXT PRIMARY KEY,
          "groupId" TEXT NOT NULL,
          "assemblyId" INTEGER NOT NULL,
          "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
          "conflictsWith" TEXT[] DEFAULT '{}',
          "isDefault" BOOLEAN NOT NULL DEFAULT false,
          "sortOrder" INTEGER DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log('✅ Created AssemblyGroupItem table');
    } catch (err) {
      console.log('⚠️  AssemblyGroupItem table creation failed:', err.message);
    }

    console.log('🔗 Adding foreign key constraints...');
    try {
      await prisma.$queryRaw`ALTER TABLE "AssemblyGroup" ADD CONSTRAINT IF NOT EXISTS "AssemblyGroup_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssemblyCategory"("id") ON DELETE CASCADE`;
      await prisma.$queryRaw`ALTER TABLE "AssemblyGroupItem" ADD CONSTRAINT IF NOT EXISTS "AssemblyGroupItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AssemblyGroup"("id") ON DELETE CASCADE`;
      await prisma.$queryRaw`ALTER TABLE "AssemblyGroupItem" ADD CONSTRAINT IF NOT EXISTS "AssemblyGroupItem_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly"("id") ON DELETE CASCADE`;
      console.log('✅ Added foreign key constraints');
    } catch (err) {
      console.log('⚠️  Foreign key constraints setup failed:', err.message);
    }

    console.log('🔍 Adding unique constraints...');
    try {
      await prisma.$queryRaw`ALTER TABLE "AssemblyGroupItem" ADD CONSTRAINT IF NOT EXISTS "AssemblyGroupItem_groupId_assemblyId_key" UNIQUE ("groupId", "assemblyId")`;
      console.log('✅ Added unique constraints');
    } catch (err) {
      console.log('⚠️  Unique constraints setup failed:', err.message);
    }

    console.log('🎉 Schema fix completed!');

    // Verify the changes
    console.log('\n🔍 Verifying changes...');

    try {
      const assemblyColumns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'Assembly' AND column_name = 'module'
      `;
      console.log('✅ Assembly.module column:', assemblyColumns[0] ? 'EXISTS' : 'MISSING');
    } catch (err) {
      console.log('⚠️  Could not verify Assembly.module column');
    }

    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('AssemblyGroup', 'AssemblyGroupItem')
      `;
      console.log(`✅ Tables found: ${tables.length} of 2 (AssemblyGroup, AssemblyGroupItem)`);
    } catch (err) {
      console.log('⚠️  Could not verify table existence');
    }

  } catch (error) {
    console.error('❌ Schema fix failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  quickSchemaFix().catch(console.error);
}

module.exports = { quickSchemaFix };