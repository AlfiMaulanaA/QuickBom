#!/bin/bash

# QuickBom Database Clear Script
# This script deletes all data from the QuickBom database tables
# Use with caution - this will permanently delete all data!

set -e  # Exit on any error

# Database connection details (adjust if needed)
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="quickbom"
DB_USER="quickbom"
DB_PASSWORD="quickbom_password"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run SQL commands
run_sql() {
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$1" 2>/dev/null
}

# Function to get row count
get_count() {
    run_sql "SELECT COUNT(*) FROM \"$1\";" | head -3 | tail -1 | tr -d ' '
}

# Function to show table info
show_table_info() {
    local table=$1
    local count=$(get_count "$table")
    echo -e "${BLUE}📊 $table:${NC} $count records"
}

# Confirmation prompt
echo -e "${RED}⚠️  WARNING: This will delete ALL data from the QuickBom database!${NC}"
echo -e "${RED}This action cannot be undone!${NC}"
echo ""
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm
if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Operation cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🔍 Checking current database state...${NC}"

# Show current counts
echo "Current data in database:"
show_table_info "User"
show_table_info "Client"
show_table_info "Material"
show_table_info "Assembly"
show_table_info "AssemblyMaterial"
show_table_info "Template"
show_table_info "TemplateAssembly"
show_table_info "Project"
show_table_info "ProjectTimeline"
show_table_info "ProjectMilestone"
show_table_info "ProjectTask"
show_table_info "TaskDependency"

echo ""
echo -e "${YELLOW}🗑️  Starting data deletion...${NC}"

# Delete in correct order (respecting foreign key constraints)
tables=(
    "TaskDependency"
    "ProjectTask"
    "ProjectMilestone"
    "ProjectTimeline"
    "Project"
    "TemplateAssembly"
    "Template"
    "AssemblyMaterial"
    "Assembly"
    "Material"
    "Client"
    "User"
)

total_deleted=0

for table in "${tables[@]}"; do
    count_before=$(get_count "$table")

    if [ "$count_before" -gt 0 ]; then
        echo -e "${BLUE}Deleting from $table...${NC} ($count_before records)"

        # Delete all records from the table
        run_sql "DELETE FROM \"$table\";" >/dev/null

        count_after=$(get_count "$table")
        deleted=$((count_before - count_after))
        total_deleted=$((total_deleted + deleted))

        echo -e "${GREEN}✓ Deleted $deleted records from $table${NC}"
    else
        echo -e "${BLUE}Skipping $table...${NC} (already empty)"
    fi
done

echo ""
echo -e "${GREEN}✅ Database clearing completed!${NC}"
echo -e "${GREEN}📊 Total records deleted: $total_deleted${NC}"

# Verify all tables are empty
echo ""
echo -e "${BLUE}🔍 Verifying database is clean...${NC}"

all_empty=true
for table in "${tables[@]}"; do
    count=$(get_count "$table")
    if [ "$count" -gt 0 ]; then
        echo -e "${RED}❌ $table still has $count records${NC}"
        all_empty=false
    fi
done

if [ "$all_empty" = true ]; then
    echo -e "${GREEN}✅ All tables are now empty${NC}"
else
    echo -e "${RED}❌ Some tables still contain data${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Database has been successfully cleared!${NC}"
echo -e "${BLUE}💡 Tip: Run 'npm run db:seed' to repopulate with sample data${NC}"
echo ""

# Optional: Reset auto-increment sequences
echo -e "${BLUE}🔄 Resetting auto-increment sequences...${NC}"

sequences=(
    "User_id_seq"
    "Material_id_seq"
    "Assembly_id_seq"
    "Template_id_seq"
    "Project_id_seq"
)

for seq in "${sequences[@]}"; do
    run_sql "ALTER SEQUENCE \"$seq\" RESTART WITH 1;" >/dev/null 2>&1 && \
    echo -e "${GREEN}✓ Reset $seq${NC}" || \
    echo -e "${YELLOW}⚠️  Could not reset $seq (may not exist)${NC}"
done

echo ""
echo -e "${GREEN}🏁 Database clear operation completed successfully!${NC}"
