#!/bin/bash

# =============================================================================
#  QUICKBOM DOCKER TEST SCRIPT
# =============================================================================
# Script untuk test setup Docker QuickBom dengan Supabase
# =============================================================================

set -e  # Exit on any error

echo "🐳 Testing QuickBom Docker Setup with Supabase"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Docker is running
echo "1. Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running"
    exit 1
fi
print_status "Docker is running"

# Check if docker-compose exists
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed"
    exit 1
fi
print_status "docker-compose is available"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found"
    echo "Please create .env file with Supabase credentials"
    exit 1
fi
print_status ".env file exists"

# Check environment variables
echo "2. Checking environment variables..."
source .env

REQUIRED_VARS=("DATABASE_URL" "NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "JWT_SECRET")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set"
        exit 1
    fi
done
print_status "All required environment variables are set"

# Test Supabase connection
echo "3. Testing Supabase connection..."
if docker-compose run --rm migration npx prisma db push --accept-data-loss > /dev/null 2>&1; then
    print_status "Supabase database connection successful"
else
    print_error "Cannot connect to Supabase database"
    echo "Please check your DATABASE_URL and credentials"
    exit 1
fi

# Build the application
echo "4. Building Docker image..."
if docker-compose build > /dev/null 2>&1; then
    print_status "Docker image built successfully"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Start the application
echo "5. Starting application..."
if docker-compose up -d > /dev/null 2>&1; then
    print_status "Application started successfully"
else
    print_error "Failed to start application"
    exit 1
fi

# Wait for application to be ready
echo "6. Waiting for application to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    if curl -f http://localhost:4000/api/health > /dev/null 2>&1; then
        print_status "Application is ready and responding"
        break
    fi

    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        print_error "Application failed to start within expected time"
        echo "Check logs with: docker-compose logs quickbom"
        exit 1
    fi

    echo "   Attempt $ATTEMPT/$MAX_ATTEMPTS - waiting..."
    sleep 2
    ((ATTEMPT++))
done

# Test basic endpoints
echo "7. Testing API endpoints..."
if curl -f http://localhost:4000 > /dev/null 2>&1; then
    print_status "Main application endpoint is accessible"
else
    print_warning "Main application endpoint not accessible (may be normal for SPA)"
fi

# Final status
echo ""
echo -e "${GREEN}🎉 QuickBom Docker setup test completed successfully!${NC}"
echo ""
echo "Application is running at: http://localhost:4000"
echo "Supabase Dashboard: https://supabase.com/dashboard"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose logs -f quickbom"
echo "  Stop app: docker-compose down"
echo "  Restart: docker-compose restart quickbom"
echo ""
echo "To run database migrations:"
echo "  docker-compose --profile migration up"
echo ""
echo "To seed initial data:"
echo "  docker-compose run --rm migration npm run db:seed"
