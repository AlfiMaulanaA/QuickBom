CREATE TYPE "AssemblyModule" AS ENUM ('ELECTRONIC', 'ELECTRICAL', 'ASSEMBLY', 'INSTALLATION', 'MECHANICAL');
Error: Failed to run sql query: ERROR: 42710: type "AssemblyModule" already exists

ALTER TABLE "Assembly" ALTER COLUMN "module" TYPE "AssemblyModule" USING "module"::"AssemblyModule";
Error: Failed to run sql query: ERROR: 42804: default for column "module" cannot be cast automatically to type "AssemblyModule"