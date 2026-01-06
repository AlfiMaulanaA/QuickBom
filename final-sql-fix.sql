-- Final SQL Fix for Supabase Schema
-- Run these commands in Supabase SQL Editor

-- 1. Create AssemblyGroupType enum (if not exists)
DO $$ BEGIN
    CREATE TYPE "AssemblyGroupType" AS ENUM('REQUIRED', 'CHOOSE_ONE', 'OPTIONAL', 'CONFLICT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update AssemblyGroup table groupType column to use enum
ALTER TABLE "AssemblyGroup" ALTER COLUMN "groupType" TYPE "AssemblyGroupType" USING "groupType"::"AssemblyGroupType";

-- 3. Add foreign key constraints (Supabase compatible)
DO $$
BEGIN
    ALTER TABLE "AssemblyGroup" ADD CONSTRAINT "AssemblyGroup_categoryId_fkey"
        FOREIGN KEY ("categoryId") REFERENCES "AssemblyCategory"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    ALTER TABLE "AssemblyGroupItem" ADD CONSTRAINT "AssemblyGroupItem_groupId_fkey"
        FOREIGN KEY ("groupId") REFERENCES "AssemblyGroup"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    ALTER TABLE "AssemblyGroupItem" ADD CONSTRAINT "AssemblyGroupItem_assemblyId_fkey"
        FOREIGN KEY ("assemblyId") REFERENCES "Assembly"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Add unique constraint (Supabase compatible)
DO $$
BEGIN
    ALTER TABLE "AssemblyGroupItem" ADD CONSTRAINT "AssemblyGroupItem_groupId_assemblyId_key"
        UNIQUE ("groupId", "assemblyId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. Verify all changes
SELECT 'Assembly table check:' as check_type;
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'Assembly' AND column_name = 'module';

SELECT 'Template table check:' as check_type;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Template' AND column_name = 'assemblySelections';

SELECT 'AssemblyGroup table check:' as check_type;
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'AssemblyGroup' AND column_name = 'groupType';

SELECT 'All tables exist:' as check_type;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('Assembly', 'AssemblyCategory', 'AssemblyGroup', 'AssemblyGroupItem', 'Template', 'User', 'Client', 'Material')
ORDER BY table_name;