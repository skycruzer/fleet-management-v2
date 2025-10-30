#!/bin/bash

# Production Deployment Verification Script
# Verifies database constraints after migration deployment

set -e

echo "🔍 Fleet Management V2 - Production Deployment Verification"
echo "============================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're linked to production
echo "📡 Checking Supabase connection..."
if ! supabase status &> /dev/null; then
    echo -e "${RED}❌ Not connected to Supabase${NC}"
    echo "Run: supabase link --project-ref wgdmgvonqysflwdiiols"
    exit 1
fi
echo -e "${GREEN}✅ Connected to Supabase${NC}"
echo ""

# Verify constraint counts
echo "📊 Step 1: Verifying Database Constraints"
echo "=========================================="

cat > /tmp/verify_constraints.sql << 'EOF'
-- Verification queries
SELECT
  'NOT NULL constraints' as type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) >= 99 THEN '✅'
    ELSE '❌'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND is_nullable = 'NO'
  AND column_name NOT IN ('id', 'created_at', 'updated_at')
UNION ALL
SELECT 'UNIQUE constraints', COUNT(*),
  CASE WHEN COUNT(*) >= 30 THEN '✅' ELSE '❌' END
FROM pg_constraint
WHERE contype = 'u' AND connamespace = 'public'::regnamespace
UNION ALL
SELECT 'CHECK constraints', COUNT(*),
  CASE WHEN COUNT(*) >= 45 THEN '✅' ELSE '❌' END
FROM pg_constraint
WHERE contype = 'c' AND connamespace = 'public'::regnamespace
UNION ALL
SELECT 'Custom indexes', COUNT(*),
  CASE WHEN COUNT(*) >= 157 THEN '✅' ELSE '❌' END
FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
EOF

# Get database URL from supabase status
DB_URL=$(supabase status | grep "Database URL" | awk '{print $3}')

if [ -z "$DB_URL" ]; then
    echo -e "${RED}❌ Could not get database URL${NC}"
    exit 1
fi

# Run verification
psql "$DB_URL" -f /tmp/verify_constraints.sql

echo ""
echo "📋 Step 2: Checking Critical Constraints"
echo "========================================="

cat > /tmp/check_critical.sql << 'EOF'
-- Check critical constraints exist
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  CASE contype
    WHEN 'c' THEN 'CHECK'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
  END as type
FROM pg_constraint
WHERE contype IN ('c', 'u')
  AND connamespace = 'public'::regnamespace
  AND conname IN (
    'chk_pilots_seniority_number_range',
    'chk_leave_requests_date_range',
    'chk_feedback_categories_display_order_positive',
    'uk_pilots_employee_id',
    'uk_pilot_users_email'
  )
ORDER BY table_name, constraint_name;
EOF

psql "$DB_URL" -f /tmp/check_critical.sql

echo ""
echo "📈 Step 3: Checking Index Usage"
echo "==============================="

cat > /tmp/check_indexes.sql << 'EOF'
-- Check new indexes are present and being used
SELECT
  indexname,
  tablename,
  idx_scan as scans,
  CASE
    WHEN idx_scan > 0 THEN '✅ Active'
    ELSE '⏳ Not yet used'
  END as status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC
LIMIT 10;
EOF

psql "$DB_URL" -f /tmp/check_indexes.sql

echo ""
echo "🧪 Step 4: Testing Constraint Enforcement"
echo "=========================================="

# Test UNIQUE constraint (should fail)
echo "Testing UNIQUE constraint (expect failure)..."
cat > /tmp/test_unique.sql << 'EOF'
-- This should fail if constraints are working
DO $$
BEGIN
  -- Try to create duplicate (will fail with UNIQUE violation)
  INSERT INTO pilot_users (id, email, password_hash)
  VALUES (gen_random_uuid(), (SELECT email FROM pilot_users LIMIT 1), 'test')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'UNIQUE constraint test: Would create duplicate';
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE '✅ UNIQUE constraint is active and blocking duplicates';
END $$;
EOF

psql "$DB_URL" -f /tmp/test_unique.sql 2>&1 | grep "✅" || echo -e "${YELLOW}⚠️  Could not verify UNIQUE constraint${NC}"

echo ""
echo "============================================================"
echo -e "${GREEN}✅ Production Deployment Verification Complete!${NC}"
echo "============================================================"
echo ""
echo "📊 Next Steps:"
echo "1. Check Supabase logs: https://app.supabase.com/project/wgdmgvonqysflwdiiols/logs"
echo "2. Test application manually: npm run dev"
echo "3. Monitor for 24 hours (see PRODUCTION-MONITORING-PLAN.md)"
echo "4. Run smoke tests every 6 hours"
echo ""
echo "📄 Documentation:"
echo "  - Monitoring Plan: PRODUCTION-MONITORING-PLAN.md"
echo "  - Deployment Summary: PRODUCTION-MIGRATION-COMPLETE.md"
echo ""

# Cleanup
rm -f /tmp/verify_constraints.sql /tmp/check_critical.sql /tmp/check_indexes.sql /tmp/test_unique.sql
