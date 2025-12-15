#!/bin/bash

# QuickBom Database Create Script (Simplified)
# This script creates the QuickBom database and sets up all tables

set -e  # Exit on any error

# Configuration - matches setup script
DB_NAME="quickbom"
DB_USER="quickbom"
DB_PASSWORD="quickbom_password"
DB_HOST="localhost"
DB_PORT="5432"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  🏗️  QuickBom Database Create Script (Simple)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Create database
echo -e "${YELLOW}Creating database '$DB_NAME'...${NC}"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo -e "${YELLOW}Database might already exist, continuing...${NC}"

# Grant privileges
echo -e "${YELLOW}Granting privileges...${NC}"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || echo -e "${YELLOW}Privileges might already be granted, continuing...${NC}"

# Update DATABASE_URL in .env file
LOCAL_DATABASE_URL="postgresql://quickbom:quickbom_password@localhost:5432/quickbom?schema=public"
LOCAL_DIRECT_URL="postgresql://quickbom:quickbom_password@localhost:5432/quickbom"

# Create .env file with required variables
cat > .env << EOF
# QuickBom Environment Variables
DATABASE_URL="$LOCAL_DATABASE_URL"
DIRECT_URL="$LOCAL_DIRECT_URL"
JWT_SECRET="quickbom-development-jwt-secret"
NEXT_PUBLIC_APP_NAME="QuickBom"
EOF

echo -e "${GREEN}✓ Updated DATABASE_URL and DIRECT_URL in .env${NC}"

# Generate Prisma client
echo -e "${YELLOW}Generating Prisma client...${NC}"
DATABASE_URL="$LOCAL_DATABASE_URL" npx prisma generate

# Create database schema (push to database)
echo -e "${YELLOW}Creating database schema...${NC}"
DATABASE_URL="$LOCAL_DATABASE_URL" npx prisma db push --accept-data-loss

# Verify tables were created
echo -e "${YELLOW}Verifying database schema...${NC}"

# List of expected tables
expected_tables=(
    "User"
    "Client"
    "Material"
    "Assembly"
    "AssemblyMaterial"
    "Template"
    "TemplateAssembly"
    "Project"
    "ProjectTimeline"
    "ProjectMilestone"
    "ProjectTask"
    "TaskDependency"
    "AssemblyCategory"
)

created_tables=0
for table in "${expected_tables[@]}"; do
    if sudo -u postgres psql -d $DB_NAME -c "\d \"$table\"" &> /dev/null; then
        echo -e "${GREEN}✓ Table '$table' exists${NC}"
        ((created_tables++))
    else
        echo -e "${RED}✗ Table '$table' missing${NC}"
    fi
done

echo ""
echo -e "${GREEN}✅ Database creation completed!${NC}"
echo -e "${GREEN}📊 Tables created: $created_tables / ${#expected_tables[@]}${NC}"

echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Run 'npm run db:seed' to populate with sample data"
echo "  2. Start the development server: npm run dev"
echo ""
echo -e "${GREEN}Database creation completed successfully! 🚀${NC}"
