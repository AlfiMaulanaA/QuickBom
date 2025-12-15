#!/bin/bash

# QuickBom Database Drop Script
# This script completely drops the QuickBom database
# WARNING: This will permanently delete the entire database and all its data!

set -e  # Exit on any error

# Configuration - matches setup script
DB_NAME="quickbom"
DB_USER="quickbom"
DB_HOST="localhost"
DB_PORT="5432"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}========================================${NC}"
echo -e "${RED}  ⚠️  DANGER ZONE: DROP DATABASE${NC}"
echo -e "${RED}========================================${NC}"
echo ""
echo -e "${RED}This will COMPLETELY DELETE the '$DB_NAME' database!${NC}"
echo -e "${RED}All data, tables, and the database itself will be lost forever!${NC}"
echo ""
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo ""

# Double confirmation
read -p "Are you absolutely sure? (type 'yes' to continue): " confirm1
if [ "$confirm1" != "yes" ]; then
    echo -e "${YELLOW}Operation cancelled.${NC}"
    exit 0
fi

read -p "This is your LAST CHANCE. Type 'DROP_DATABASE' to confirm: " confirm2
if [ "$confirm2" != "DROP_DATABASE" ]; then
    echo -e "${YELLOW}Operation cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔍 Checking if database exists...${NC}"

# Check if database exists
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${BLUE}Found database '$DB_NAME'${NC}"

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

    echo -e "${RED}🗑️  Dropping database '$DB_NAME'...${NC}"

    # Drop the database
    sudo -u postgres psql -c "DROP DATABASE $DB_NAME;"

    echo -e "${GREEN}✅ Database '$DB_NAME' has been completely dropped!${NC}"

else
    echo -e "${YELLOW}Database '$DB_NAME' does not exist${NC}"
fi

# Check if user exists and drop it too (optional)
echo ""
echo -e "${YELLOW}🔍 Checking if database user exists...${NC}"

if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    echo -e "${BLUE}Found user '$DB_USER'${NC}"

    read -p "Also drop the database user '$DB_USER'? (y/N): " drop_user
    if [[ $drop_user =~ ^[Yy]$ ]]; then
        echo -e "${RED}🗑️  Dropping user '$DB_USER'...${NC}"
        sudo -u postgres psql -c "DROP USER $DB_USER;"
        echo -e "${GREEN}✅ User '$DB_USER' has been dropped${NC}"
    else
        echo -e "${BLUE}User '$DB_USER' preserved${NC}"
    fi
else
    echo -e "${BLUE}User '$DB_USER' does not exist${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  🗑️  DATABASE DROP COMPLETED${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}What to do next:${NC}"
echo "  • Run './create-database.sh' to recreate the database"
echo "  • Run './setup-quickbom-db.sh' for full setup"
echo ""
echo -e "${GREEN}Operation completed successfully!${NC}"
