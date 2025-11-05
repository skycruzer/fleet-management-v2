# Cache Invalidation Guide
**Phase 2: Reports System Caching**
**Date:** November 4, 2025

---

## Overview

The reports system now includes intelligent caching with a 5-minute TTL (Time To Live). This dramatically improves performance by avoiding repeated database queries for the same report data.

**Key Benefits:**
- ✅ 70%+ faster repeat queries
- ✅ Reduced database load
- ✅ Better user experience
- ✅ Automatic cache expiration

---

## How Caching Works

### Automatic Caching
When a user generates a report, the system:
1. Generates a unique cache key from report type + filters
2. Checks if cached data exists (and is valid)
3. If cached: Returns instantly from memory
4. If not cached: Queries database and caches result

**Cache Duration:** 5 minutes

### Cache Key Generation
```typescript
// Cache key format: report:{type}:{hash-of-filters}
// Example: report:leave:abc123def456

// Same filters = same cache key = cache hit!
const report1 = await generateReport('leave', {
  status: ['approved'],
  rank: ['Captain']
})

// Different filters = different cache key = fresh query
const report2 = await generateReport('leave', {
  status: ['pending']
})
```

---

## When to Invalidate Cache

Cache should be invalidated when the underlying data changes. This ensures users always see fresh data after mutations.

### Scenarios Requiring Cache Invalidation

#### 1. Leave Request Mutations
**When:**
- Creating a new leave request
- Approving/rejecting a leave request
- Updating a leave request
- Deleting a leave request

**Which cache to invalidate:** `reports:leave`

#### 2. Flight Request Mutations
**When:**
- Creating a new flight request
- Approving/rejecting a flight request
- Updating a flight request
- Deleting a flight request

**Which cache to invalidate:** `reports:flight`

#### 3. Certification Mutations
**When:**
- Adding a new certification
- Updating certification dates
- Deleting a certification
- Expiring a certification

**Which cache to invalidate:** `reports:certifications`

#### 4. Pilot Data Changes
**When:**
- Updating pilot rank/role
- Changing pilot status
- Modifying pilot details

**Which cache to invalidate:** All reports (pilot data affects all)

---

## Implementation Guide

### Method 1: Import and Call (Recommended)

```typescript
// In your API route (e.g., /api/leave-requests/route.ts)
import { invalidateReportCache } from '@/lib/services/reports-service'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  // ... create leave request ...

  // Invalidate leave reports cache
  invalidateReportCache('leave')

  // Also revalidate Next.js cache
  revalidatePath('/dashboard/reports')

  return NextResponse.json({ success: true, data })
}
```

### Method 2: Invalidate All Reports

```typescript
// When pilot data changes (affects all reports)
import { invalidateReportCache } from '@/lib/services/reports-service'

export async function PUT(request: Request) {
  // ... update pilot ...

  // Invalidate ALL report caches
  invalidateReportCache() // No parameter = invalidate all

  return NextResponse.json({ success: true })
}
```

---

## Code Examples

### Example 1: Leave Request Creation

```typescript
// File: /app/api/leave-requests/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invalidateReportCache } from '@/lib/services/reports-service'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Create leave request
    const { data, error } = await supabase
      .from('leave_requests')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    // ✅ Invalidate leave reports cache
    invalidateReportCache('leave')

    // ✅ Revalidate Next.js paths
    revalidatePath('/dashboard/reports')
    revalidatePath('/dashboard/leave-requests')

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create leave request' },
      { status: 500 }
    )
  }
}
```

### Example 2: Leave Request Approval

```typescript
// File: /app/api/leave-requests/[id]/approve/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invalidateReportCache } from '@/lib/services/reports-service'
import { revalidatePath } from 'next/cache'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Update status to approved
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    // ✅ Invalidate leave reports cache
    invalidateReportCache('leave')

    // ✅ Revalidate paths
    revalidatePath('/dashboard/reports')
    revalidatePath('/dashboard/leave-requests')
    revalidatePath(`/dashboard/leave-requests/${params.id}`)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to approve leave request' },
      { status: 500 }
    )
  }
}
```

### Example 3: Flight Request Update

```typescript
// File: /app/api/flight-requests/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invalidateReportCache } from '@/lib/services/reports-service'
import { revalidatePath } from 'next/cache'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Update flight request
    const { data, error } = await supabase
      .from('flight_requests')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    // ✅ Invalidate flight reports cache
    invalidateReportCache('flight-requests')

    // ✅ Revalidate paths
    revalidatePath('/dashboard/reports')
    revalidatePath('/dashboard/flight-requests')

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update flight request' },
      { status: 500 }
    )
  }
}
```

### Example 4: Certification Addition

```typescript
// File: /app/api/certifications/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invalidateReportCache } from '@/lib/services/reports-service'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Add certification
    const { data, error } = await supabase
      .from('pilot_checks')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    // ✅ Invalidate certifications reports cache
    invalidateReportCache('certifications')

    // ✅ Revalidate paths
    revalidatePath('/dashboard/reports')
    revalidatePath('/dashboard/certifications')

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to add certification' },
      { status: 500 }
    )
  }
}
```

### Example 5: Pilot Rank Update (Affects All Reports)

```typescript
// File: /app/api/pilots/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invalidateReportCache } from '@/lib/services/reports-service'
import { revalidatePath } from 'next/cache'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Update pilot
    const { data, error } = await supabase
      .from('pilots')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    // ✅ Invalidate ALL reports (pilot data affects all)
    invalidateReportCache() // No parameter = all reports

    // ✅ Revalidate paths
    revalidatePath('/dashboard/reports')
    revalidatePath('/dashboard/pilots')

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update pilot' },
      { status: 500 }
    )
  }
}
```

---

##  API Routes to Update

### High Priority (Implement First)

1. **Leave Requests**
   - `/app/api/leave-requests/route.ts` (POST, PUT, DELETE)
   - `/app/api/leave-requests/[id]/route.ts` (PUT, DELETE)
   - `/app/api/leave-requests/[id]/approve/route.ts` (PATCH)

2. **Flight Requests**
   - `/app/api/flight-requests/route.ts` (POST, PUT, DELETE)
   - `/app/api/flight-requests/[id]/route.ts` (PUT, DELETE)
   - `/app/api/flight-requests/[id]/approve/route.ts` (PATCH)

3. **Certifications**
   - `/app/api/certifications/route.ts` (POST)
   - `/app/api/pilot-checks/route.ts` (POST, PUT, DELETE)
   - `/app/api/pilot-checks/[id]/route.ts` (PUT, DELETE)

### Medium Priority

4. **Pilots**
   - `/app/api/pilots/[id]/route.ts` (PUT) - affects ALL reports

---

## Testing Cache Invalidation

### Manual Test 1: Leave Request Flow
```bash
# 1. Generate leave report (should query database)
curl -X POST http://localhost:3000/api/reports/preview \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=<token>" \
  -d '{"reportType": "leave", "filters": {}}'

# 2. Generate same report again (should use cache - faster!)
# Repeat curl command above

# 3. Create a new leave request
curl -X POST http://localhost:3000/api/leave-requests \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=<token>" \
  -d '{"pilot_id": "...", "start_date": "2025-01-01", ...}'

# 4. Generate leave report again (should query database - cache invalidated)
# Repeat curl command from step 1
```

### Manual Test 2: Check Cache Stats
```typescript
// In your browser console or API route
import { getCacheAccessStats, getCacheHitRate } from '@/lib/services/cache-service'

// Get cache statistics
const stats = getCacheAccessStats()
console.log('Cache Statistics:', stats)

// Get hit rate percentage
const hitRate = getCacheHitRate()
console.log('Cache Hit Rate:', hitRate + '%')
```

---

## Performance Impact

### Before Caching
- **First Query:** ~200-500ms
- **Repeat Query:** ~200-500ms (queries database every time)
- **Cache Hit Rate:** 0%

### After Caching
- **First Query:** ~200-500ms (cache miss, queries database)
- **Repeat Query:** ~5-10ms (cache hit, from memory)
- **Cache Hit Rate:** 70%+ (expected with typical usage)

### Expected Improvements
- **70-95% faster** repeat queries
- **50% reduction** in database load
- **Better UX** with instant previews

---

## Troubleshooting

### Issue: Stale Data After Mutation
**Symptom:** Report shows old data after creating/updating record

**Solution:** Ensure cache invalidation is called after mutation:
```typescript
// Add this line after database mutation
invalidateReportCache('leave') // or appropriate type
```

### Issue: Cache Not Clearing
**Symptom:** Cache never expires, always shows old data

**Solution:** Check TTL configuration and cache cleanup:
```typescript
// Verify TTL in reports-service.ts
const REPORT_CACHE_CONFIG = {
  TTL_SECONDS: 300, // Should be 300 (5 minutes)
}
```

### Issue: Too Many Cache Misses
**Symptom:** Cache hit rate < 30%

**Possible Causes:**
1. Users always using different filters (expected)
2. TTL too short (increase if needed)
3. Cache being cleared too often (check invalidation calls)

---

## Best Practices

### DO ✅
- Always invalidate cache after mutations
- Use specific report type when possible (`'leave'` vs no parameter)
- Include cache invalidation in the same transaction as mutation
- Monitor cache hit rate in production

### DON'T ❌
- Don't invalidate cache unnecessarily (hurts performance)
- Don't skip `revalidatePath()` calls (Next.js cache also needs invalidation)
- Don't set TTL too high (risks stale data)
- Don't forget to test cache invalidation in development

---

## Monitoring

### Recommended Metrics to Track

1. **Cache Hit Rate**
   - Target: > 70%
   - Alert if: < 30%

2. **Average Query Time**
   - Cache Hit: < 50ms
   - Cache Miss: 200-500ms

3. **Cache Size**
   - Monitor memory usage
   - Alert if exceeds 100 entries

4. **Invalidation Frequency**
   - Track how often cache is cleared
   - Optimize if too frequent

---

**Version:** 1.0
**Last Updated:** November 4, 2025
**Next Review:** After Phase 2 completion