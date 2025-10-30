# Materialized View Quick Reference

**For**: Developers maintaining Fleet Management V2
**Purpose**: Quick guide to using and maintaining `pilot_dashboard_metrics` materialized view

---

## 🚀 Quick Start

### Deploy (First Time)
```bash
# 1. Open Supabase SQL Editor
# https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql

# 2. Copy and paste this file:
supabase/migrations/20251027_create_dashboard_materialized_view.sql

# 3. Execute

# 4. Verify
SELECT * FROM pilot_dashboard_metrics;
```

### Use in Code
```typescript
import { getDashboardMetrics } from '@/lib/services/dashboard-service'

// Fetch metrics (uses materialized view)
const metrics = await getDashboardMetrics()

// Refresh after mutation
import { refreshDashboardMetrics } from '@/lib/services/dashboard-service'
await refreshDashboardMetrics()
```

### Refresh via API
```bash
# Manual refresh
curl -X POST http://localhost:3000/api/dashboard/refresh

# Health check
curl http://localhost:3000/api/dashboard/refresh
```

---

## 📊 What's Inside

Single row with all dashboard metrics:

| Column | Type | Description |
|--------|------|-------------|
| `total_pilots` | int | Total pilots in fleet |
| `active_pilots` | int | Currently active pilots |
| `total_captains` | int | Captain count |
| `total_first_officers` | int | First Officer count |
| `training_captains` | int | Training Captains |
| `examiners` | int | Check Examiners |
| `total_certifications` | int | All certification records |
| `current_certifications` | int | Valid certifications |
| `expiring_certifications` | int | Expiring ≤30 days |
| `expired_certifications` | int | Expired certifications |
| `expiring_this_week` | int | Expiring ≤7 days |
| `compliance_rate` | numeric | Overall compliance % |
| `pending_leave` | int | Pending leave requests |
| `approved_leave` | int | Approved leave requests |
| `denied_leave` | int | Denied leave requests |
| `leave_this_month` | int | Leave this month |
| `critical_alerts` | int | Expired certifications |
| `warning_alerts` | int | Expiring this week |
| `overdue_retirement` | int | Pilots past retirement |
| `retirement_due_soon` | int | Retiring in 2 years |
| `pilots_nearing_retirement` | int | Retiring in 5 years |
| `category_compliance` | jsonb | Compliance by category |
| `last_refreshed` | timestamp | Last refresh time |
| `schema_version` | text | Version: v1.0.0 |

---

## ⚡ Performance

**Before** (v2.0): 9+ queries, ~800ms
**After** (v3.0): 1 query, ~10ms
**Improvement**: 98.75% faster

**Refresh Time**: 50-100ms (acceptable overhead)
**Cache TTL**: 60 seconds

---

## 🔧 Common Operations

### Refresh After Mutations
```typescript
// In API routes after data changes
import { refreshDashboardMetrics } from '@/lib/services/dashboard-service'

export async function PUT(request: Request) {
  // Update pilot data...
  await updatePilot(id, data)

  // Refresh materialized view
  await refreshDashboardMetrics()

  return NextResponse.json({ success: true })
}
```

### Check View Health
```typescript
import { checkMaterializedViewHealth } from '@/lib/services/dashboard-service'

const isHealthy = await checkMaterializedViewHealth()
if (!isHealthy) {
  await refreshDashboardMetrics()
}
```

### Manual Refresh (SQL)
```sql
-- Option 1: Use function (preferred)
SELECT refresh_dashboard_metrics();

-- Option 2: Direct refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY pilot_dashboard_metrics;
```

---

## 🐛 Troubleshooting

### View returns no data
```sql
-- Check if view exists
SELECT COUNT(*) FROM pilot_dashboard_metrics;
-- Should return 1

-- If 0, refresh it
SELECT refresh_dashboard_metrics();
```

### Stale data showing
```sql
-- Check last refresh time
SELECT last_refreshed FROM pilot_dashboard_metrics;
-- Should be within last 10 minutes

-- If old, refresh it
SELECT refresh_dashboard_metrics();
```

### Metrics don't match reality
```sql
-- Compare with actual data
SELECT COUNT(*) FROM pilots;
-- vs
SELECT total_pilots FROM pilot_dashboard_metrics;

-- If mismatch, refresh
SELECT refresh_dashboard_metrics();
```

### Function not found error
```
ERROR: function refresh_dashboard_metrics() does not exist
```

**Fix**: Re-run migration script
```bash
# Copy and paste migration file contents
supabase/migrations/20251027_create_dashboard_materialized_view.sql
```

---

## 📅 Refresh Strategies

### 1. On-Demand (Current)
Call `refreshDashboardMetrics()` after mutations

**Pros**: Only refresh when needed
**Cons**: Must remember to call

### 2. Scheduled (Optional)
Add cron job to refresh every 5 minutes

**Pros**: Always fresh data
**Cons**: Unnecessary refreshes

### 3. Trigger-Based (Future)
Auto-refresh on table changes

**Pros**: Always up-to-date
**Cons**: More complex

---

## 📝 When to Refresh

**MUST Refresh After**:
- ✅ Pilot CRUD operations (create, update, delete)
- ✅ Certification updates
- ✅ Leave request changes (approve, deny, create, delete)
- ✅ System settings modifications (retirement age)

**No Need to Refresh**:
- ❌ Read-only operations
- ❌ Dashboard page loads (uses cache)
- ❌ User authentication
- ❌ Viewing reports

---

## 🔐 Security

**RLS Policies**: View respects existing table RLS policies
**Access**: All authenticated users can read
**Refresh**: Only authenticated users can refresh

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20251027_create_dashboard_materialized_view.sql` | Migration script |
| `lib/services/dashboard-service.ts` | Service layer (v3.0) |
| `lib/services/dashboard-service-v2-backup.ts` | Old version backup |
| `app/api/dashboard/refresh/route.ts` | Refresh API endpoint |
| `SPRINT-2-WEEK-3-DAY-1-MATERIALIZED-VIEW.md` | Full documentation |
| `MATERIALIZED-VIEW-QUICK-REFERENCE.md` | This file |

---

## 🎯 Key Takeaways

1. **Single Query**: View replaces 9+ queries
2. **Refresh After Mutations**: Always refresh after data changes
3. **60s Cache**: Application caches for 1 minute
4. **Health Checks**: Monitor view freshness
5. **Concurrent Refresh**: No blocking during refresh

---

**Version**: 1.0.0
**Last Updated**: October 27, 2025
**Maintainer**: Maurice Rondeau
