#!/bin/bash

# QuickBom Database Create Script
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
echo -e "${BLUE}  🏗️  QuickBom Database Create Script${NC}"
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
if ! sudo -u postgres psql -c "SELECT 1;" &> /dev/null; then
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

# Check if database already exists
echo -e "${YELLOW}Checking if database already exists...${NC}"
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${YELLOW}⚠️  Database '$DB_NAME' already exists${NC}"

    read -p "Drop existing database and recreate? (y/N): " recreate
    if [[ $recreate =~ ^[Yy]$ ]]; then
        echo -e "${RED}🗑️  Dropping existing database...${NC}"

        # Check if there are active connections
        active_connections=$(sudo -u postgres psql -d $DB_NAME -tAc "SELECT COUNT(*) FROM pg_stat_activity WHERE datname='$DB_NAME' AND pid <> pg_backend_pid();")

        if [ "$active_connections" -gt 0 ]; then
            echo -e "${YELLOW}⚠️  There are $active_connections active connections to the database${NC}"
            echo -e "${YELLOW}Terminating active connections...${NC}"

            # Terminate active connections
            sudo -u postgres psql -c "
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
            " >/dev/null 2>&1

            echo -e "${GREEN}✓ Active connections terminated${NC}"
        fi

        sudo -u postgres psql -c "DROP DATABASE $DB_NAME;"
        echo -e "${GREEN}✓ Database dropped${NC}"
        SHOULD_CREATE_DB=true
    else
        echo -e "${YELLOW}Using existing database${NC}"
        SHOULD_CREATE_DB=false
    fi
else
    SHOULD_CREATE_DB=true
fi

# Create database user if it doesn't exist
echo -e "${YELLOW}Creating/checking database user '$DB_USER'...${NC}"
if sudo -u postgres psql -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    echo -e "${GREEN}✓ User '$DB_USER' already exists${NC}"
else
    sudo -u postgres psql -d postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    echo -e "${GREEN}✓ User '$DB_USER' created${NC}"
fi

# Create database if needed
if [ "$SHOULD_CREATE_DB" = true ]; then
    echo -e "${YELLOW}Creating database '$DB_NAME'...${NC}"
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    echo -e "${GREEN}✓ Database '$DB_NAME' created${NC}"
else
    # Ensure user has access to existing database
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    echo -e "${GREEN}✓ Database permissions granted${NC}"
fi

# Grant privileges
echo -e "${YELLOW}Granting privileges...${NC}"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
echo -e "${GREEN}✓ Privileges granted${NC}"

# Test connection with new user (using postgres user to verify)
echo -e "${YELLOW}Testing database access...${NC}"
if sudo -u postgres psql -d $DB_NAME -c "SELECT version();" &> /dev/null; then
    echo -e "${GREEN}✓ Database access test successful${NC}"
else
    echo -e "${RED}✗ Database access test failed${NC}"
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
LOCAL_DATABASE_URL="postgresql://quickbom:quickbom_password@localhost:5432/quickbom?schema=public"

if grep -q "^DATABASE_URL=" .env; then
    # Update existing DATABASE_URL
    sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=\"$LOCAL_DATABASE_URL\"|" .env
    echo -e "${GREEN}✓ Updated DATABASE_URL in .env${NC}"
else
    # Add DATABASE_URL if it doesn't exist
    echo "DATABASE_URL=\"$LOCAL_DATABASE_URL\"" >> .env
    echo -e "${GREEN}✓ Added DATABASE_URL to .env${NC}"
fi

# Verify the DATABASE_URL was set correctly
CURRENT_DB_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2- | tr -d '"')
if [[ "$CURRENT_DB_URL" == "$LOCAL_DATABASE_URL" ]]; then
    echo -e "${GREEN}✓ DATABASE_URL verification passed${NC}"
else
    echo -e "${RED}✗ DATABASE_URL verification failed${NC}"
    echo "Expected: $LOCAL_DATABASE_URL"
    echo "Found: $CURRENT_DB_URL"
    exit 1
fi

# Generate Prisma client
echo -e "${YELLOW}Generating Prisma client...${NC}"
if DATABASE_URL="$LOCAL_DATABASE_URL" npx prisma generate; then
    echo -e "${GREEN}✓ Prisma client generated${NC}"
else
    echo -e "${RED}✗ Failed to generate Prisma client${NC}"
    exit 1
fi

# Create database schema (push to database)
echo -e "${YELLOW}Creating database schema...${NC}"
if DATABASE_URL="$LOCAL_DATABASE_URL" npx prisma db push --accept-data-loss; then
    echo -e "${GREEN}✓ Database schema created${NC}"
else
    echo -e "${RED}✗ Failed to create database schema${NC}"
    exit 1
fi

# Verify tables were created
echo -e "${YELLOW}Verifying database schema...${NC}"

# Debug: List all tables in the database
echo -e "${BLUE}Debug: Listing all tables in database...${NC}"
sudo -u postgres psql -d $DB_NAME -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

# List of expected tables
expected_tables=(
    "user"
    "client"
    "material"
    "assembly"
    "assemblymaterial"
    "template"
    "templateassembly"
    "project"
    "projecttimeline"
    "projectmilestone"
    "projecttask"
    "taskdependency"
    "assemblycategory"
)

created_tables=0
missing_tables=()

for table in "${expected_tables[@]}"; do
    if sudo -u postgres psql -d $DB_NAME -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table' LIMIT 1;" | grep -q 1; then
        echo -e "${GREEN}✓ Table '$table' exists${NC}"
        ((created_tables++))
    else
        echo -e "${RED}✗ Table '$table' missing${NC}"
        missing_tables+=("$table")
    fi
done

echo ""
echo -e "${GREEN}✅ Database creation completed!${NC}"
echo -e "${GREEN}📊 Tables created: $created_tables / ${#expected_tables[@]}${NC}"

if [ ${#missing_tables[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Missing tables: ${missing_tables[*]}${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Database Details:${NC}"
echo "  Name: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST:$DB_PORT"
echo "  URL: $DATABASE_URL"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Run 'npm run db:seed' to populate with sample data"
echo "  2. Start the development server: npm run dev"
echo "  3. Visit http://localhost:3000 to access QuickBom"
echo ""
echo -e "${GREEN}Database creation completed successfully! 🚀${NC}"
