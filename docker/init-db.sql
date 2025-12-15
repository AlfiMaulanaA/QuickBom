-- =============================================================================
--  QUICKBOM DATABASE INITIALIZATION
-- =============================================================================
-- PostgreSQL initialization script for QuickBom application
-- This script runs when the PostgreSQL container starts for the first time
-- =============================================================================

-- -----------------------------------------------------------------------------
--  CREATE EXTENSIONS (if needed)
-- -----------------------------------------------------------------------------
-- Enable UUID extension (if using UUIDs in your schema)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS extension (if you need geospatial features)
-- CREATE EXTENSION IF NOT EXISTS "postgis";

-- Enable pg_trgm extension (for text search optimization)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable btree_gin extension (for index optimization)
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- -----------------------------------------------------------------------------
--  CREATE DATABASE USER (if different from default)
-- -----------------------------------------------------------------------------
-- Note: The user is already created via environment variables in docker-compose.yml
-- This is just for reference if you need additional setup

-- -----------------------------------------------------------------------------
--  SET UP DATABASE CONFIGURATION
-- -----------------------------------------------------------------------------
-- Set timezone to Asia/Jakarta for consistency
SET timezone = 'Asia/Jakarta';

-- Set default transaction isolation level
SET default_transaction_isolation = 'read committed';

-- -----------------------------------------------------------------------------
--  CREATE SCHEMAS (if using multiple schemas)
-- -----------------------------------------------------------------------------
-- CREATE SCHEMA IF NOT EXISTS quickbom;
-- SET search_path TO quickbom, public;

-- -----------------------------------------------------------------------------
--  OPTIMIZATION SETTINGS
-- -----------------------------------------------------------------------------
-- Set connection limits and timeouts
ALTER SYSTEM SET max_connections = '100';
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.max = '10000';
ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- -----------------------------------------------------------------------------
--  LOGGING SETUP (for development)
-- -----------------------------------------------------------------------------
-- Enable query logging for development (disable in production)
-- ALTER SYSTEM SET log_statement = 'all';
-- ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';

-- -----------------------------------------------------------------------------
--  MAINTENANCE SETTINGS
-- -----------------------------------------------------------------------------
-- Set autovacuum settings for better performance
ALTER SYSTEM SET autovacuum = 'on';
ALTER SYSTEM SET autovacuum_max_workers = '3';
ALTER SYSTEM SET autovacuum_naptime = '20s';
ALTER SYSTEM SET autovacuum_vacuum_threshold = '50';
ALTER SYSTEM SET autovacuum_analyze_threshold = '50';
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = '0.02';
ALTER SYSTEM SET autovacuum_analyze_scale_factor = '0.01';

-- -----------------------------------------------------------------------------
--  CREATE ADDITIONAL USERS/ROLES (if needed)
-- -----------------------------------------------------------------------------
-- Create readonly user for analytics/reporting (optional)
-- CREATE USER quickbom_readonly WITH PASSWORD 'readonly_password';
-- GRANT CONNECT ON DATABASE quickbom_db TO quickbom_readonly;
-- GRANT USAGE ON SCHEMA public TO quickbom_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO quickbom_readonly;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO quickbom_readonly;

-- -----------------------------------------------------------------------------
--  CREATE INDEXES FOR PERFORMANCE (will be created by Prisma migrations)
-- -----------------------------------------------------------------------------
-- Note: Indexes are created automatically by Prisma migrations
-- These are just examples of what gets created:

-- CREATE INDEX CONCURRENTLY "User_email_idx" ON "User"("email");
-- CREATE INDEX CONCURRENTLY "User_role_idx" ON "User"("role");
-- CREATE INDEX CONCURRENTLY "User_status_idx" ON "User"("status");
-- CREATE INDEX CONCURRENTLY "Client_companyName_idx" ON "Client"("companyName");
-- CREATE INDEX CONCURRENTLY "Client_status_idx" ON "Client"("status");
-- CREATE INDEX CONCURRENTLY "Project_clientId_idx" ON "Project"("clientId");
-- CREATE INDEX CONCURRENTLY "Project_status_idx" ON "Project"("status");

-- -----------------------------------------------------------------------------
--  CREATE VIEWS (optional - for reporting/analytics)
-- -----------------------------------------------------------------------------
-- Example view for project summaries
-- CREATE OR REPLACE VIEW project_summaries AS
-- SELECT
--     p.id,
--     p.name,
--     p.status,
--     p.totalPrice,
--     p.createdAt,
--     c.companyName,
--     c.contactPerson,
--     u.name as creator_name
-- FROM "Project" p
-- LEFT JOIN "Client" c ON p.clientId = c.id
-- LEFT JOIN "User" u ON p.createdBy = u.id;

-- -----------------------------------------------------------------------------
--  SETUP BACKUP USER (optional)
-- -----------------------------------------------------------------------------
-- Create user for automated backups
-- CREATE USER quickbom_backup WITH PASSWORD 'backup_password';
-- GRANT CONNECT ON DATABASE quickbom_db TO quickbom_backup;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO quickbom_backup;

-- -----------------------------------------------------------------------------
--  LOG INITIALIZATION COMPLETION
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    RAISE NOTICE 'QuickBom database initialization completed successfully at %', now();
END $$;
