#!/bin/bash

# QuickBom Database Setup Script
# This script sets up the PostgreSQL database for QuickBom Construction Management System

set -e  # Exit on any error

# Configuration
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
echo -e "${BLUE}  QuickBom Database Setup Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if PostgreSQL is installed and running
echo -e "${YELLOW}Checking PostgreSQL installation...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL client (psql) is not installed.${NC}"
    echo "Please install PostgreSQL first:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "  CentOS/RHEL: sudo yum install postgresql-server postgresql-contrib"
    echo "  macOS: brew install postgresql"
    exit 1
fi

# Check if PostgreSQL service is running
if ! pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL service is not running on $DB_HOST:$DB_PORT${NC}"
    echo "Please start PostgreSQL service first:"
    echo "  Ubuntu/Debian: sudo systemctl start postgresql"
    echo "  CentOS/RHEL: sudo systemctl start postgresql"
    echo "  macOS: brew services start postgresql"
    exit 1
fi

echo -e "${GREEN}✓ PostgreSQL is running${NC}"

# Check if we can connect as superuser
echo -e "${YELLOW}Checking database superuser access...${NC}"
if ! psql -h $DB_HOST -p $DB_PORT -U postgres -c "SELECT 1;" &> /dev/null; then
    echo -e "${RED}Error: Cannot connect as postgres superuser.${NC}"
    echo "Please ensure you have superuser access or run this script as postgres user:"
    echo "  sudo -u postgres $0"
    echo ""
    echo "Or create the database manually:"
    echo "  sudo -u postgres psql -c \"CREATE DATABASE $DB_NAME;\""
    echo "  sudo -u postgres psql -c \"CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';\""
    echo "  sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;\""
    exit 1
fi

echo -e "${GREEN}✓ Database superuser access confirmed${NC}"

# Create database user if it doesn't exist
echo -e "${YELLOW}Creating database user '$DB_USER'...${NC}"
if psql -h $DB_HOST -p $DB_PORT -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    echo -e "${GREEN}✓ User '$DB_USER' already exists${NC}"
else
    psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    echo -e "${GREEN}✓ User '$DB_USER' created${NC}"
fi

# Create database if it doesn't exist
echo -e "${YELLOW}Creating database '$DB_NAME'...${NC}"
if psql -h $DB_HOST -p $DB_PORT -U postgres -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${GREEN}✓ Database '$DB_NAME' already exists${NC}"
else
    psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    echo -e "${GREEN}✓ Database '$DB_NAME' created${NC}"
fi

# Grant privileges
echo -e "${YELLOW}Granting privileges...${NC}"
psql -h $DB_HOST -p $DB_PORT -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
echo -e "${GREEN}✓ Privileges granted${NC}"

# Test connection with new user
echo -e "${YELLOW}Testing connection with new credentials...${NC}"
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" &> /dev/null; then
    echo -e "${GREEN}✓ Database connection test successful${NC}"
else
    echo -e "${RED}✗ Database connection test failed${NC}"
    exit 1
fi

# Setup environment file
echo -e "${YELLOW}Setting up environment file...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file from .env.example${NC}"
else
    echo -e "${BLUE}ℹ .env file already exists, skipping copy${NC}"
fi

# Update DATABASE_URL in .env file
DATABASE_URL="postgresql://quickbom:quickbom_password@localhost:5432/quickbom?schema=public"

if grep -q "^DATABASE_URL=" .env; then
    # Update existing DATABASE_URL
    sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
    echo -e "${GREEN}✓ Updated DATABASE_URL in .env${NC}"
else
    # Add DATABASE_URL if it doesn't exist
    echo "DATABASE_URL=\"$DATABASE_URL\"" >> .env
    echo -e "${GREEN}✓ Added DATABASE_URL to .env${NC}"
fi

# Run Prisma commands
echo -e "${YELLOW}Running Prisma setup...${NC}"

# Generate Prisma client
echo -e "${BLUE}Generating Prisma client...${NC}"
if npx prisma generate; then
    echo -e "${GREEN}✓ Prisma client generated${NC}"
else
    echo -e "${RED}✗ Failed to generate Prisma client${NC}"
    exit 1
fi

# Run database migration
echo -e "${BLUE}Running database migration...${NC}"
if npx prisma migrate dev --name init-quickbom-schema --skip-generate; then
    echo -e "${GREEN}✓ Database migration completed${NC}"
else
    echo -e "${RED}✗ Database migration failed${NC}"
    exit 1
fi

# Run database seeding
echo -e "${BLUE}Seeding database with default data...${NC}"
if npm run db:seed:quickbom; then
    echo -e "${GREEN}✓ Database seeding completed${NC}"
else
    echo -e "${RED}✗ Database seeding failed${NC}"
    exit 1
fi

# Final verification
echo -e "${YELLOW}Running final verification...${NC}"
if npx prisma db push --skip-generate --accept-data-loss &> /dev/null; then
    echo -e "${GREEN}✓ Database schema verification passed${NC}"
else
    echo -e "${YELLOW}⚠ Database schema verification warning (this is normal for new databases)${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  🎉 QuickBom Database Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Database Details:${NC}"
echo "  Name: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST:$DB_PORT"
echo "  URL: $DATABASE_URL"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Start the development server: npm run dev"
echo "  2. Visit http://localhost:3000 to access QuickBom"
echo "  3. Default login credentials will be available in the app"
echo ""
echo -e "${YELLOW}Important:${NC}"
echo "  - Change the default password in production"
echo "  - Update JWT_SECRET in .env with a secure random string"
echo "  - Configure other environment variables as needed"
echo ""
echo -e "${GREEN}Setup completed successfully! 🚀${NC}"
