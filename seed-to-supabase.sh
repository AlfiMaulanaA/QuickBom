#!/bin/bash

# Seed to Supabase Script
# Usage: ./seed-to-supabase.sh

echo "🌱 Seeding data to Supabase..."

# Check if SUPABASE_DATABASE_URL is set
if [ -z "$SUPABASE_DATABASE_URL" ]; then
    echo "❌ Error: SUPABASE_DATABASE_URL environment variable is not set"
    echo "Please set your Supabase database URL:"
    echo "export SUPABASE_DATABASE_URL='postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres'"
    exit 1
fi

# Set production environment and run seeding
echo "🔗 Using Supabase URL: ${SUPABASE_DATABASE_URL//:*:@/:[HIDDEN]@}"
NODE_ENV=production SUPABASE_DATABASE_URL="$SUPABASE_DATABASE_URL" npm run db:seed

echo "✅ Seeding to Supabase completed!"
