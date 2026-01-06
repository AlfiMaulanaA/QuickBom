-- Fix AssemblyModule enum type and column conversion
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing default constraint temporarily
ALTER TABLE "Assembly" ALTER COLUMN "module" DROP DEFAULT;

-- Step 2: Update existing values to valid enum values
UPDATE "Assembly" SET "module" = 'ELECTRICAL' WHERE "module" NOT IN ('ELECTRONIC', 'ELECTRICAL', 'ASSEMBLY', 'INSTALLATION', 'MECHANICAL');

-- Step 3: Change column type to enum
ALTER TABLE "Assembly" ALTER COLUMN "module" TYPE "AssemblyModule" USING "module"::"AssemblyModule";

-- Step 4: Set the default back
ALTER TABLE "Assembly" ALTER COLUMN "module" SET DEFAULT 'ELECTRICAL'::"AssemblyModule";

-- Step 5: Verify the changes
SELECT
  column_name,
  data_type,
  udt_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'Assembly'
AND column_name = 'module';