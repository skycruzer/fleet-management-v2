# Fleet Management V2 - Quick Reference Guide

## Dashboard Data Accuracy - Quick Reference

### Settings Storage
- **Table**: `settings`
- **Key**: `'pilot_requirements'`
- **Type**: JSONB (JSON with PostgreSQL extensions)

### Current Requirements (from settings)
```json
{
  "pilot_retirement_age": 65,
  "number_of_aircraft": 2,
  "captains_per_hull": 7,
  "first_officers_per_hull": 7,
  "minimum_captains_per_hull": 10,
  "minimum_first_officers_per_hull": 10,
  "training_captains_per_pilots": 11,
  "examiners_per_pilots": 11
}
```

### Current Pilot Counts
- **Total Active**: 26 pilots
- **Captains**: 19 (required: 14 per hull ratio)
- **First Officers**: 7 (required: 14 per hull ratio)
- **Examiners**: 3 (Captains with 'examiner' qualification)
- **Training Captains**: 5 (Captains with 'training_captain' qualification)

### Services That Use Requirements

| Service | Function | Location |
|---------|----------|----------|
| Admin Service | `getPilotRequirements()` | lib/services/admin-service.ts:358 |
| Dashboard Service | `computeDashboardMetrics()` | lib/services/dashboard-service.ts:106 |
| Leave Eligibility | `getCrewRequirements()` | lib/services/leave-eligibility-service.ts:165 |

### Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| PilotRequirementsCard | Display staffing levels | components/dashboard/pilot-requirements-card.tsx |
| Dashboard Page | Aggregate all metrics | app/dashboard/page.tsx |
| Settings Admin | Update requirements | app/dashboard/admin/settings/ |

### Calculation Examples

**Total Pilots Requirement**:
- (7 captains/hull + 7 FO/hull) × 2 aircraft = 28 total required
- Actual: 26 → 93% compliance (Yellow warning)

**Examiners Required**:
- 26 total pilots ÷ 11 ratio = 2.36 → ceil = 3 required
- Actual: 3 → 100% compliance (Green)

**Training Captains Required**:
- 26 total pilots ÷ 11 ratio = 2.36 → ceil = 3 required
- Actual: 5 → 167% compliance (Green - exceeds)

### Critical Business Rules

**Minimum Crew (Leave Eligibility)**:
- Minimum Captains: 10 per hull × 2 aircraft = 20 captains
- Minimum First Officers: 10 per hull × 2 aircraft = 20 first officers

**Current Crew Status**:
- Captains: 19 (BELOW minimum of 20) ⚠️
- First Officers: 7 (BELOW minimum of 20) ⚠️

### Data Flow Diagram

```
User Views Dashboard
         ↓
getDashboardMetrics() (with 5-min cache)
         ↓
computeDashboardMetrics()
         ↓
5 Parallel Queries:
  • pilots (role, qualifications)
  • pilot_checks (certifications)
  • leave_requests (status)
  • pilots (retirement dates)
  • getPilotRequirements() ← from settings table
         ↓
Return DashboardMetrics object
         ↓
PilotRequirementsCard component displays:
  • Actual vs Required pilots (93%)
  • Actual vs Required examiners (100%)
  • Actual vs Required training captains (167%)
```

### Type Safety

**Qualification Parsing** (dashboard-service.ts:169-176):
```typescript
const qualifications = (
  Array.isArray(pilot.captain_qualifications) 
    ? pilot.captain_qualifications 
    : []
) as string[]
```

**Settings Validation** (admin-service.ts:389-410):
```typescript
// Each field type-checked:
typeof value.captains_per_hull === 'number' ? value.captains_per_hull : 7
```

### Cache Behavior

- **Duration**: 5 minutes (300,000 ms)
- **Cache Key**: `'dashboard_metrics'`
- **Invalidation**: After 5 minutes or manual call to `invalidateDashboardCache()`
- **Fallback**: Recalculates if cache fails

### Error Handling

**getPilotRequirements()**:
- Catches all errors silently
- Logs to console.error()
- Returns hardcoded defaults (never throws)
- Ensures dashboard never crashes

**getDashboardMetrics()**:
- Checks each query result for errors
- Throws error if query fails (not silent)
- Includes performance metrics

### Database Verification Queries

**Check Settings Exists**:
```sql
SELECT id, key, value FROM settings 
WHERE key = 'pilot_requirements' AND value IS NOT NULL
```

**Check Pilot Counts**:
```sql
SELECT role, is_active, COUNT(*) FROM pilots 
GROUP BY role, is_active ORDER BY role, is_active
```

**Check Qualifications**:
```sql
SELECT COUNT(*) as examiners FROM pilots 
WHERE role = 'Captain' AND captain_qualifications ? 'examiner'
```

### Files to Review for Accuracy

1. **Data Source**:
   - `/lib/services/admin-service.ts` - getPilotRequirements() (line 358)

2. **Data Processing**:
   - `/lib/services/dashboard-service.ts` - getDashboardMetrics() (line 77)
   - `/lib/services/leave-eligibility-service.ts` - getCrewRequirements() (line 165)

3. **Display**:
   - `/components/dashboard/pilot-requirements-card.tsx` - PilotRequirementsCard (line 72)

4. **Settings Management**:
   - `/app/dashboard/admin/settings/` - Admin update panel

### Troubleshooting

**Dashboard shows wrong pilot counts**:
1. Verify `pilots.role` is correct ('Captain' or 'First Officer')
2. Verify `pilots.is_active` is correct (true/false)
3. Verify `captain_qualifications` is array, not string or null

**Dashboard shows wrong requirements**:
1. Verify `settings` table contains pilot_requirements record
2. Check `settings.value` is valid JSONB
3. Verify all 8 fields are numbers, not strings

**Leave requests always denied**:
1. Check minimum crew calculation: 10 per hull × 2 aircraft = 20 required
2. Current: 19 Captains < 20 required = Cannot approve any Captain leave
3. Current: 7 First Officers < 20 required = Cannot approve any FO leave
4. Solution: Add more pilots or adjust minimum_X_per_hull settings

### Performance Notes

- Dashboard queries execute in parallel (not sequential)
- Estimated load time: 100-300ms without cache
- Estimated load time: <10ms with cache hit
- 5-minute cache reduces database load significantly

