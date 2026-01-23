
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
});

async function main() {
    console.log('🔧 Starting schema fix for Project table...');

    try {
        // 1. Fix qualityCheckDocs column
        console.log('1️⃣  Migrating qualityCheckDocs column from TEXT to JSONB...');
        await prisma.$executeRawUnsafe(`
      ALTER TABLE "Project"
      ALTER COLUMN "qualityCheckDocs" TYPE JSONB
      USING CASE
        -- Handle NULL or empty strings
        WHEN "qualityCheckDocs" IS NULL OR "qualityCheckDocs" = '' THEN '[]'::jsonb
        
        -- Handle data that is ALREADY valid JSON (starts with [ or {)
        WHEN "qualityCheckDocs" LIKE '[%' OR "qualityCheckDocs" LIKE '{%' THEN "qualityCheckDocs"::jsonb
        
        -- Handle legacy path strings (e.g. "/docs/file.docx") -> Convert to DocumentFile[] format
        ELSE jsonb_build_array(
          jsonb_build_object(
            'name', substring("qualityCheckDocs" from '[^/]+$'),
            'url', "qualityCheckDocs",
            'size', 0,
            'type', 'application/octet-stream',
            'uploadedAt', to_json(now())
          )
        )
      END;
    `);
        console.log('✅ qualityCheckDocs migrated successfully.');

        // 2. Fix schematicDocs column
        console.log('2️⃣  Migrating schematicDocs column from TEXT to JSONB...');
        await prisma.$executeRawUnsafe(`
      ALTER TABLE "Project"
      ALTER COLUMN "schematicDocs" TYPE JSONB
      USING CASE
        -- Handle NULL or empty strings
        WHEN "schematicDocs" IS NULL OR "schematicDocs" = '' THEN '[]'::jsonb
        
        -- Handle data that is ALREADY valid JSON (starts with [ or {)
        WHEN "schematicDocs" LIKE '[%' OR "schematicDocs" LIKE '{%' THEN "schematicDocs"::jsonb
        
        -- Handle legacy path strings
        ELSE jsonb_build_array(
          jsonb_build_object(
            'name', substring("schematicDocs" from '[^/]+$'),
            'url', "schematicDocs",
            'size', 0,
            'type', 'application/octet-stream',
            'uploadedAt', to_json(now())
          )
        )
      END;
    `);
        console.log('✅ schematicDocs migrated successfully.');

        console.log('\n🎉 Schema fix completed! The columns are now properly typed as JSONB.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
