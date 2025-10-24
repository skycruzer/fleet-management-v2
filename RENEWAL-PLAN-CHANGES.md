# Renewal Plan Changes - Flight & Simulator Checks Only

**Date**: October 24, 2025
**Change Type**: Feature Enhancement
**Status**: ✅ Complete

---

## Summary

Updated the **Generate Renewal Plan** feature to focus exclusively on **Flight Checks** and **Simulator Checks** (both with 90-day grace periods). This enables even distribution of renewals across roster periods throughout the year for planning purposes.

---

## Changes Made

### 1. Frontend Changes (UI)

**File**: `app/dashboard/renewal-planning/generate/page.tsx`

#### Category Filter Restriction
```typescript
// BEFORE: All 7 categories available
const CATEGORIES = [
  'Pilot Medical',
  'Flight Checks',
  'Simulator Checks',
  'Ground Courses Refresher',
  'ID Cards',
  'Foreign Pilot Work Permit',
  'Travel Visa',
]

// AFTER: Only Flight and Simulator Checks
const CATEGORIES = [
  'Flight Checks',
  'Simulator Checks',
]
```

#### Default Selection
```typescript
// BEFORE: No categories pre-selected
const [selectedCategories, setSelectedCategories] = useState<string[]>([])

// AFTER: Both categories pre-selected by default
const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORIES)
```

#### Updated UI Text

**Page Title**:
- **Before**: "Configure and generate certification renewal schedule"
- **After**: "Generate renewal schedule for Flight and Simulator Checks (90-day grace period)"

**Category Filter Description**:
- **Before**: "Select specific categories to plan, or leave empty to plan all categories"
- **After**: "Both categories selected by default. These certifications have 90-day grace periods, allowing renewals to be evenly distributed across roster periods throughout the year."

**How It Works**:
- **Before**: Generic description
- **After**:
  - • Fetches Flight & Simulator Checks expiring in time horizon
  - • Uses 90-day grace period (renewal window = expiry - 90 days)
  - • Assigns to roster periods with lowest load
  - • Respects capacity limits (4 pilots for Flight, 6 for Simulator)
  - • Distributes renewals evenly throughout the year

---

### 2. Backend Changes (Service Layer)

**File**: `lib/services/certification-renewal-planning-service.ts`

#### Fixed Category Filtering (Critical Bug Fix)

**Problem**: The original code tried to filter nested relations directly with `.in('check_types.category', categories)`, which doesn't work in Supabase.

**Solution**: Added a two-step query:
1. First fetch `check_type_ids` for the specified categories
2. Then filter `pilot_checks` by those `check_type_ids`

```typescript
// Step 1a: If categories specified, first get the check_type_ids for those categories
let checkTypeIds: string[] | undefined
if (categories && categories.length > 0) {
  const { data: checkTypes } = await supabase
    .from('check_types')
    .select('id')
    .in('category', categories)

  checkTypeIds = checkTypes?.map((ct) => ct.id) || []

  // If no check types found for the specified categories, return empty
  if (checkTypeIds.length === 0) {
    return []
  }
}

// Then use checkTypeIds in the main query
if (checkTypeIds && checkTypeIds.length > 0) {
  query = query.in('check_type_id', checkTypeIds)
}
```

**Impact**: This fix ensures category filtering works correctly. Previously, the filter may have been ignored, causing all categories to be included.

---

## Database Analysis

### Current Data (as of October 24, 2025)

**Flight Checks**:
- Total: 43 checks
- Pilots: 26 unique pilots
- Expiry Range: Dec 17, 2025 - Oct 30, 2026

**Simulator Checks**:
- Total: 51 checks
- Pilots: 26 unique pilots
- Expiry Range: Nov 26, 2025 - Jan 13, 2027

**Combined Total**: 94 checks across 26 pilots

---

## Business Impact

### Benefits

1. **Focused Planning**: System now generates plans only for certifications with 90-day grace periods
2. **Even Distribution**: Algorithm distributes renewals across 13 roster periods to prevent clustering
3. **Operational Efficiency**: Training center utilization optimized (4 pilots/period for Flight, 6 for Simulator)
4. **Simplified UI**: Users no longer need to manually select categories - both are pre-selected

### Grace Period Logic

Both categories use the same 90-day grace period (defined in `grace-period-utils.ts:20-21`):

```typescript
'Flight Checks': 90,
'Simulator Checks': 90,
```

**Renewal Window Calculation**:
- **Window Start**: Expiry Date - 90 days
- **Window End**: Expiry Date
- **Example**: If expiry is March 31, 2026
  - Window Start: January 1, 2026
  - Window End: March 31, 2026
  - System can schedule renewal anytime in this 90-day window

---

## Capacity Management

### Capacity Limits (per Roster Period)

Defined in `roster_period_capacity` table:

```json
{
  "Flight Checks": 4,
  "Simulator Checks": 6,
  "Ground Courses Refresher": 8,  // Not used anymore
  "Pilot Medical": 4,              // Not used anymore
  "ID Cards": 2,                   // Not used anymore
  "Foreign Pilot Work Permit": 2,  // Not used anymore
  "Travel Visa": 2,                // Not used anymore
  "Non-renewal": 2                 // Not used anymore
}
```

### Utilization Calculation

For each roster period:
- **Total Capacity**: 4 + 6 = **10 pilots per period**
- **Target Utilization**: 60-70% (6-7 pilots per period)
- **High-Risk Threshold**: >80% (>8 pilots per period)

With 94 checks and 13 roster periods:
- **Average**: 94 / 13 = **7.2 checks per period** (~72% utilization)
- **Status**: 🟡 Yellow (within target range)

---

## Algorithm Behavior

### Distribution Logic

1. **Fetch Certifications**: Get all Flight & Simulator Checks expiring in next 12 months (default)
2. **Calculate Windows**: For each check, compute 90-day renewal window
3. **Find Eligible Periods**: Determine which roster periods fall within the renewal window
4. **Load Balancing**: For each certification:
   - Check current allocation for all eligible periods
   - Select period with **lowest current load**
   - Add certification to that period
5. **Capacity Check**: Warn if period capacity exceeded (but still create plan)

### Priority Scoring (0-10 scale)

Based on days until expiry:
- **10**: Expired (critical)
- **9**: ≤14 days (critical)
- **7**: ≤30 days (high)
- **5**: ≤60 days (medium)
- **3**: ≤90 days (normal)
- **1**: >90 days (low)

---

## Testing Verification

### Database Query Test

```sql
SELECT
  ct.category,
  COUNT(*) as total_checks,
  COUNT(DISTINCT pc.pilot_id) as unique_pilots,
  MIN(pc.expiry_date) as earliest_expiry,
  MAX(pc.expiry_date) as latest_expiry
FROM pilot_checks pc
JOIN check_types ct ON pc.check_type_id = ct.id
WHERE ct.category IN ('Flight Checks', 'Simulator Checks')
  AND pc.expiry_date >= CURRENT_DATE
GROUP BY ct.category
ORDER BY ct.category;
```

**Result**: ✅ Confirmed 43 Flight Checks + 51 Simulator Checks

### Expected Generation Output

When generating a plan for 12 months ahead:
- **Expected Plans**: ~70-80 (certifications expiring within 12 months with 90-day windows)
- **Roster Periods Used**: ~10-12 periods (out of 13)
- **Average per Period**: ~7 renewals

---

## User Experience Changes

### Before
1. User sees 7 categories in checkboxes
2. Must manually select Flight and Simulator Checks
3. Risk of accidentally including other categories
4. Generic description doesn't explain purpose

### After
1. User sees only 2 categories (Flight, Simulator)
2. Both pre-selected by default
3. Clear description: "90-day grace period for even distribution"
4. Focused workflow for planning purposes

---

## Removed Categories

The following categories are **no longer available** in the Generate Plan UI:

| Category | Grace Period | Reason for Removal |
|----------|--------------|-------------------|
| Pilot Medical | 28 days | Different planning cycle (shorter grace) |
| Ground Courses Refresher | 60 days | Different planning cycle |
| ID Cards | 0 days | No advance planning needed |
| Foreign Pilot Work Permit | 0 days | No advance planning needed |
| Travel Visa | 0 days | No advance planning needed |

**Note**: These categories can still be renewed manually through other system features. The Generate Plan feature now focuses exclusively on the two categories requiring strategic planning.

---

## API Contract (Unchanged)

The API endpoint remains the same:

**Endpoint**: `POST /api/renewal-planning/generate`

**Request Body**:
```json
{
  "monthsAhead": 12,
  "categories": ["Flight Checks", "Simulator Checks"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalPlans": 78,
    "byCategory": {
      "Flight Checks": 35,
      "Simulator Checks": 43
    },
    "rosterPeriodSummary": [
      { "rosterPeriod": "RP12/2025", "totalRenewals": 6 },
      { "rosterPeriod": "RP13/2025", "totalRenewals": 7 },
      ...
    ],
    "plans": [ /* First 50 plans for preview */ ]
  }
}
```

---

## Files Modified

| File | Lines Changed | Type |
|------|---------------|------|
| `app/dashboard/renewal-planning/generate/page.tsx` | ~20 | Frontend |
| `lib/services/certification-renewal-planning-service.ts` | ~20 | Backend |

**Total**: ~40 lines modified across 2 files

---

## Rollback Plan

If needed, revert changes:

```bash
git checkout HEAD~1 -- app/dashboard/renewal-planning/generate/page.tsx
git checkout HEAD~1 -- lib/services/certification-renewal-planning-service.ts
```

Or manually restore:
1. Change `CATEGORIES` array back to all 7 categories
2. Remove default selection: `useState<string[]>([])`
3. Revert service query to original (though the bug fix should be kept)

---

## Future Enhancements

Based on BMAP review recommendations:

1. **P0 - Add Transaction Safety**: Wrap bulk insert in database transaction
2. **P0 - Add Database Indexes**: Create indexes on `planned_roster_period`, `status`, `planned_renewal_date`
3. **P1 - Implement Pairing Logic**: Populate `paired_pilot_id` for check rides requiring 2 pilots
4. **P1 - Add Caching**: Cache roster period capacity (5min TTL)
5. **P2 - Preview Mode**: Show plan before committing generation

---

## Testing Checklist

- [x] ✅ UI shows only Flight and Simulator Checks
- [x] ✅ Both categories pre-selected by default
- [x] ✅ Database query filters correctly by category
- [x] ✅ Service layer fetches check_type_ids correctly
- [x] ✅ 94 checks confirmed in database (43 Flight + 51 Simulator)
- [ ] ⏳ E2E test: Generate plan and verify results (manual testing required)
- [ ] ⏳ Performance test: Measure generation time for 94 checks
- [ ] ⏳ Verify capacity distribution across roster periods

---

## Deployment Notes

**No Database Migrations Required** - Changes are code-only.

**Deployment Steps**:
1. Deploy code changes (2 files)
2. Test in staging environment
3. Generate test plan with sample data
4. Verify capacity distribution
5. Deploy to production
6. Monitor first production generation

**Monitoring**:
- Check logs for any Supabase query errors
- Verify generation time <5 seconds
- Confirm capacity utilization stays 60-80%

---

**Change Author**: Claude Code
**Reviewed By**: Maurice (Skycruzer)
**Approved**: October 24, 2025
**Status**: ✅ Ready for Deployment
