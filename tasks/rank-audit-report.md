# Pilot Rank Data Audit Report

**Date**: February 23, 2026
**Audited by**: 3-agent team (db-auditor, ui-tracer, view-analyzer)

---

## Executive Summary

**1 confirmed rank mismatch found and fixed.** Fotu TO'OFOHE's leave request showed "Captain" but pilot is "First Officer" — corrected in database.

**Root cause identified**: The `createLeaveRequestServer()` function defaults rank to `'Captain'` when the form doesn't supply it. Additionally, the denormalization sync trigger only fires on UPDATE (not INSERT), creating a structural vulnerability.

---

## Data Architecture: Three Copies of Rank

| Source                | Column | Updated When                | Used By                                                   |
| --------------------- | ------ | --------------------------- | --------------------------------------------------------- |
| `pilots.role`         | enum   | Admin updates pilot         | Certifications, eligibility, pilot list, dashboard stats  |
| `pilot_requests.rank` | text   | Request creation (snapshot) | Requests page, leave/flight reports, active request views |
| `pilot_users.rank`    | text   | Registration only           | Pilot portal dashboard                                    |

**Only `pilots.role` is authoritative.** The other two are denormalized copies.

---

## Confirmed Issues

### 1. FIXED: Fotu TO'OFOHE Request Rank Mismatch

| Field                            | Before                                 | After                     |
| -------------------------------- | -------------------------------------- | ------------------------- |
| `pilot_requests.rank`            | Captain (WRONG)                        | **First Officer** (FIXED) |
| `pilot_requests.name`            | (empty)                                | **Fotu TO'OFOHE** (FIXED) |
| `pilot_requests.employee_number` | (empty)                                | **6923** (FIXED)          |
| Request ID                       | `bc0aca77-3c25-44f6-98b7-332a1f89c074` | —                         |

### 2. BUG: Default to 'Captain' When Rank Missing

**File**: `lib/services/unified-request-service.ts:1285`

```typescript
rank: data.rank ?? 'Captain',  // ← Defaults to Captain when rank not provided
```

**Impact**: If the admin leave request form doesn't pass rank, every request is stored as "Captain" regardless of the pilot's actual role.

**Fix needed**: Look up `pilots.role` by `pilot_id` instead of defaulting.

### 3. BUG: Fallback to 'Captain' in Portal Path

**File**: `lib/services/pilot-leave-service.ts:87`

```typescript
rank: (pilotDetails.role as 'Captain' | 'First Officer') || 'Captain',
```

**Impact**: Lower risk — reads from `pilots.role` first (correct), but falls back to 'Captain' if role is falsy.

### 4. ARCHITECTURAL: Sync Trigger Only Fires on UPDATE

**Migration**: `20251220000003_pilot_denormalization_sync_trigger.sql`

```sql
CREATE TRIGGER pilot_denorm_sync_trigger
AFTER UPDATE ON pilots  -- Only UPDATE, not INSERT
```

**Impact**: If a pilot's role changes, existing `pilot_requests` records are updated. But if the service layer doesn't copy rank correctly at INSERT time, there's no safety net.

### 5. LOW RISK: `pilot_users.rank` Never Synced

Set at registration time, never updated when `pilots.role` changes. Currently all `pilot_users.rank` values match `pilots.role` — but this will diverge when a pilot is promoted/demoted.

---

## View Safety Analysis

### Safe Views (read `pilots.role` directly — always correct)

1. `pilot_report_summary`
2. `captain_qualifications_summary`
3. `pilot_qualification_summary`
4. `pilot_requirements_compliance`
5. `pilot_checks_overview`
6. `detailed_expiring_checks`
7. `pilot_summary_optimized`
8. `pilots_with_contract_details`
9. `compliance_dashboard`

### Vulnerable Views (read `pilot_requests.rank` — can be stale)

1. `active_leave_requests`
2. `active_flight_requests`
3. `active_rdo_sdo_requests`

### Portal Views (read `pilot_users.rank` — set at registration)

1. `pilot_user_mappings`
2. `pending_pilot_registrations`

---

## Pages Affected

| Page                       | Data Source            | Status                 |
| -------------------------- | ---------------------- | ---------------------- |
| /dashboard/pilots          | `pilots.role`          | ✅ Always correct      |
| /dashboard/certifications  | `pilots.role` via JOIN | ✅ Always correct      |
| /dashboard/requests        | `pilot_requests.rank`  | ⚠️ Can show stale rank |
| /dashboard/reports (leave) | `pilot_requests.rank`  | ⚠️ Can show stale rank |
| /dashboard/reports (certs) | `pilots.role` via JOIN | ✅ Always correct      |
| /portal/dashboard          | `pilot_users.rank`     | ⚠️ Set at registration |
| Leave eligibility          | `pilots.role` via SQL  | ✅ Always correct      |

---

## Recommended Fixes

### Priority 1: Fix Default Rank Bug (Code)

**File**: `lib/services/unified-request-service.ts:1280-1286`

Replace `rank: data.rank ?? 'Captain'` with a lookup to `pilots.role`:

```typescript
// Look up pilot's actual role from pilots table
const { data: pilot } = await supabase
  .from('pilots')
  .select('role, employee_id, first_name, last_name')
  .eq('id', data.pilot_id)
  .single()

rank: pilot?.role ?? data.rank ?? 'Captain',
name: data.name || `${pilot?.first_name} ${pilot?.last_name}`,
employee_number: data.employee_number || pilot?.employee_id || '',
```

### Priority 2: Add `pilot_users.rank` Sync (Database)

Add to the existing sync trigger function or create a new trigger:

```sql
-- When pilots.role changes, also update pilot_users.rank
CREATE OR REPLACE FUNCTION sync_pilot_users_rank()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    UPDATE pilot_users SET rank = NEW.role::TEXT
    WHERE pilot_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pilot_users_rank_sync_trigger
AFTER UPDATE ON pilots
FOR EACH ROW
EXECUTE FUNCTION sync_pilot_users_rank();
```

### Priority 3: Ongoing Monitoring

The `pilot_requests_stale_data` view already exists and catches mismatches. Consider:

- Adding a cron job to check for stale data weekly
- Alerting admins when mismatches are detected

---

## Current State (Post-Fix)

- `pilot_requests_stale_data`: **0 rows** (all clean)
- `pilot_users` ↔ `pilots`: **All ranks match**
- Total pilots: Verified across all views

---

**Report generated by rank-audit team**
**Status**: 1 mismatch fixed, 2 code bugs identified for future fix
