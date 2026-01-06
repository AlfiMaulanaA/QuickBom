-- Quick SQL Script to Add Missing Tables/Columns to Supabase
-- Run this in Supabase SQL Editor for faster schema update

-- Add module column to Assembly table
ALTER TABLE "Assembly" ADD COLUMN IF NOT EXISTS "module" TEXT NOT NULL DEFAULT 'ELECTRICAL';

-- Create AssemblyModule enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "AssemblyModule" AS ENUM('ELECTRONIC', 'ELECTRICAL', 'ASSEMBLY', 'INSTALLATION', 'MECHANICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the module column to use the enum
ALTER TABLE "Assembly" ALTER COLUMN "module" TYPE "AssemblyModule" USING "module"::"AssemblyModule";

-- Create AssemblyGroup table
CREATE TABLE IF NOT EXISTS "AssemblyGroup" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "groupType" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "sortOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("categoryId") REFERENCES "AssemblyCategory"("id") ON DELETE CASCADE
);

-- Create AssemblyGroupItem table
CREATE TABLE IF NOT EXISTS "AssemblyGroupItem" (
    "id" TEXT PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "assemblyId" INTEGER NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "conflictsWith" TEXT[] DEFAULT '{}',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("groupId") REFERENCES "AssemblyGroup"("id") ON DELETE CASCADE,
    FOREIGN KEY ("assemblyId") REFERENCES "Assembly"("id") ON DELETE CASCADE
);

-- Add unique constraint
ALTER TABLE "AssemblyGroupItem" ADD CONSTRAINT IF NOT EXISTS "AssemblyGroupItem_groupId_assemblyId_key" UNIQUE ("groupId", "assemblyId");

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Assembly_categoryId_idx" ON "Assembly"("categoryId");
CREATE INDEX IF NOT EXISTS "Assembly_module_idx" ON "Assembly"("module");
CREATE INDEX IF NOT EXISTS "AssemblyGroup_categoryId_idx" ON "AssemblyGroup"("categoryId");

-- Verify the changes
SELECT 'Assembly table columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Assembly'
ORDER BY ordinal_position;

SELECT 'New tables created:' as info;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('AssemblyGroup', 'AssemblyGroupItem')
ORDER BY table_name;