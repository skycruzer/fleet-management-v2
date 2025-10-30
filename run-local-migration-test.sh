#!/bin/bash
set -e

echo "🧪 Fleet Management V2 - Local Migration Testing"
echo "================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Check Supabase connection
echo "📡 Checking Supabase connection..."
if supabase status &> /dev/null; then
    echo -e "${GREEN}✅ Connected to Supabase${NC}"
else
    echo -e "${YELLOW}⚠️  Not connected. Starting local Supabase...${NC}"
    supabase start
fi
echo ""

# Get database URL
DB_URL=$(supabase status | grep "DB URL" | awk '{print $3}')
echo "🔗 Database URL: $DB_URL"
echo ""

# Step 1: Pre-migration validation
echo "📋 Step 1: Pre-Migration Validation"
echo "===================================="
if [ -f "test-migration-validation.sql" ]; then
    echo "Running validation queries..."
    psql "$DB_URL" -f test-migration-validation.sql
    echo ""
    echo -e "${YELLOW}⚠️  Review the output above for any issues${NC}"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to abort..."
else
    echo -e "${RED}❌ test-migration-validation.sql not found${NC}"
    exit 1
fi

# Step 2: Apply migrations
echo ""
echo "🚀 Step 2: Applying Migrations"
echo "==============================="
echo "This will apply 4 migrations:"
echo "  1. NOT NULL constraints"
echo "  2. UNIQUE constraints"
echo "  3. CHECK constraints"
echo "  4. Performance indexes"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo "Applying migrations..."
supabase db push

echo ""
echo -e "${GREEN}✅ Migrations applied${NC}"

# Step 3: Regenerate types
echo ""
echo "🔄 Step 3: Regenerating TypeScript Types"
echo "========================================="
npm run db:types
echo -e "${GREEN}✅ Types regenerated${NC}"

# Step 4: Run tests
echo ""
echo "🧪 Step 4: Running Tests"
echo "========================"
npm run type-check
echo ""
npm run lint
echo ""
echo "Running E2E tests (this may take a few minutes)..."
npm test -- --reporter=line

echo ""
echo "================================================="
echo -e "${GREEN}✅ Migration Testing Complete!${NC}"
echo "================================================="
echo ""
echo "📊 Next Steps:"
echo "1. Review test results above"
echo "2. Check types/supabase.ts for updated schema"
echo "3. Test application manually: npm run dev"
echo "4. If all looks good, deploy to staging"
echo ""
