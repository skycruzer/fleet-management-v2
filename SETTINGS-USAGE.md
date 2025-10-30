# Settings Utilization Documentation

## Overview

This document describes how the Fleet Management V2 application utilizes the `settings` table in the database to provide dynamic, admin-configurable behavior across the entire application.

**Last Updated**: October 25, 2025

---

## Settings Table Structure

The `settings` table stores key-value pairs for system-wide configuration:

```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

---

## Available Settings

### 1. App Title (`app_title`)

**Type**: String
**Default**: "Fleet Office Management"
**Purpose**: Customizable application title displayed throughout the UI

**Usage Locations**:
- Page metadata (browser tab titles)
- Sidebar header
- Header navigation
- Email templates
- PDF reports

**Code References**:
- `lib/services/admin-service.ts:354` - `getAppTitle()`
- `app/dashboard/layout.tsx:11-16` - Metadata generation
- `components/layout/professional-sidebar.tsx:7` - Sidebar display
- `components/layout/professional-sidebar-client.tsx:125` - Client-side display

**Example**:
```typescript
import { getAppTitle } from '@/lib/services/admin-service'

export async function generateMetadata(): Promise<Metadata> {
  const appTitle = await getAppTitle()
  return {
    title: `Admin Dashboard | ${appTitle}`,
    description: 'Administrative dashboard for fleet management'
  }
}
```

---

### 2. Pilot Requirements (`pilot_requirements`)

**Type**: Object
**Purpose**: Define fleet staffing requirements and ratios

**Structure**:
```typescript
{
  pilot_retirement_age: number        // Retirement age for pilots (default: 65)
  number_of_aircraft: number          // Total aircraft in fleet (default: 2)
  captains_per_hull: number           // Required captains per aircraft (default: 7)
  first_officers_per_hull: number     // Required first officers per aircraft (default: 7)
  minimum_captains_per_hull: number   // Minimum captains for operations (default: 10)
  minimum_first_officers_per_hull: number // Minimum FOs for operations (default: 10)
  training_captains_per_pilots: number   // Ratio: 1 training captain per X pilots (default: 11)
  examiners_per_pilots: number           // Ratio: 1 examiner per X pilots (default: 11)
}
```

**Default Values**:
```typescript
{
  pilot_retirement_age: 65,
  number_of_aircraft: 2,
  captains_per_hull: 7,
  first_officers_per_hull: 7,
  minimum_captains_per_hull: 10,
  minimum_first_officers_per_hull: 10,
  training_captains_per_pilots: 11,
  examiners_per_pilots: 11
}
```

**Usage Locations**:
- Dashboard pilot requirements card
- Analytics calculations
- Leave eligibility verification
- Staffing reports

**Code References**:
- `lib/services/admin-service.ts:373-398` - `getPilotRequirements()`
- `components/dashboard/pilot-requirements-card.tsx:73-85` - Display required vs actual staffing
- `lib/services/leave-eligibility-service.ts` - Minimum crew validation

**Example**:
```typescript
import { getPilotRequirements } from '@/lib/services/admin-service'

export async function PilotRequirementsCard() {
  const requirements = await getPilotRequirements()

  // Calculate required total pilots
  const requiredTotalPilots =
    (requirements.captains_per_hull + requirements.first_officers_per_hull) *
    requirements.number_of_aircraft

  // Calculate required examiners
  const requiredExaminers = Math.ceil(
    totalPilots / requirements.examiners_per_pilots
  )

  // Display compliance status
  return (
    <div>
      <p>Required: {requiredTotalPilots} pilots</p>
      <p>Actual: {actualPilots} pilots</p>
      <p>Status: {actualPilots >= requiredTotalPilots ? 'Compliant' : 'Understaffed'}</p>
    </div>
  )
}
```

---

### 3. Alert Thresholds (`alert_thresholds`)

**Type**: Object
**Purpose**: Configure certification expiry warning thresholds

**Structure**:
```typescript
{
  critical_days: number           // Critical alert (default: 7 days)
  urgent_days: number             // Urgent alert (default: 14 days)
  warning_30_days: number         // Standard warning (default: 30 days)
  warning_60_days: number         // Early warning (default: 60 days)
  early_warning_90_days: number   // Very early warning (default: 90 days)
}
```

**Default Values**:
```typescript
{
  critical_days: 7,
  urgent_days: 14,
  warning_30_days: 30,
  warning_60_days: 60,
  early_warning_90_days: 90
}
```

**Usage Locations**:
- Certification expiry calculations
- Dashboard alerts
- Email notifications
- Compliance reports

**Code References**:
- `lib/services/admin-service.ts:423-467` - `getAlertThresholds()`
- `lib/services/expiring-certifications-service.ts:21-35` - `getCertificationStatus()`
- `components/dashboard/expiring-certifications-banner-server.tsx` - Display expiring certifications

**Example**:
```typescript
import { getAlertThresholds } from '@/lib/services/admin-service'

async function getCertificationStatus(expiryDate: Date) {
  const thresholds = await getAlertThresholds()
  const today = new Date()
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysUntilExpiry < 0) {
    return { color: 'red', label: 'Expired', daysUntilExpiry }
  }
  if (daysUntilExpiry <= thresholds.warning_30_days) {
    return { color: 'yellow', label: 'Expiring Soon', daysUntilExpiry }
  }
  return { color: 'green', label: 'Current', daysUntilExpiry }
}
```

---

## Service Layer Architecture

All settings access **MUST** go through the `admin-service.ts` service layer. Never query the settings table directly from components or API routes.

### ✅ Correct Pattern

```typescript
// In a Server Component or API Route
import { getAppTitle } from '@/lib/services/admin-service'

export async function MyComponent() {
  const appTitle = await getAppTitle()
  return <h1>{appTitle}</h1>
}
```

### ❌ Incorrect Pattern

```typescript
// NEVER DO THIS - Direct database access
import { createClient } from '@/lib/supabase/server'

export async function MyComponent() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'app_title')
    .single()

  return <h1>{data?.value}</h1>
}
```

---

## Admin Configuration

### Where to Update Settings

Settings can be managed through:
- **UI**: `Admin → Settings` page (`/dashboard/admin/settings`)
- **Database**: Direct SQL updates (for initial setup)

### Settings Page Location

`/dashboard/admin/settings` provides a user-friendly interface for admins to update all system settings without touching the database directly.

### Database Query Examples

**View current settings**:
```sql
SELECT key, value, description
FROM settings
ORDER BY key;
```

**Update app title**:
```sql
UPDATE settings
SET value = '"Air Niugini Flight Operations"'::jsonb,
    updated_at = NOW()
WHERE key = 'app_title';
```

**Update pilot requirements**:
```sql
UPDATE settings
SET value = '{
  "pilot_retirement_age": 65,
  "number_of_aircraft": 3,
  "captains_per_hull": 8,
  "first_officers_per_hull": 8,
  "minimum_captains_per_hull": 10,
  "minimum_first_officers_per_hull": 10,
  "training_captains_per_pilots": 10,
  "examiners_per_pilots": 10
}'::jsonb,
    updated_at = NOW()
WHERE key = 'pilot_requirements';
```

**Update alert thresholds**:
```sql
UPDATE settings
SET value = '{
  "critical_days": 5,
  "urgent_days": 10,
  "warning_30_days": 30,
  "warning_60_days": 60,
  "early_warning_90_days": 90
}'::jsonb,
    updated_at = NOW()
WHERE key = 'alert_thresholds';
```

---

## Adding New Settings

### 1. Add Setting to Database

```sql
INSERT INTO settings (key, value, description)
VALUES (
  'new_setting_key',
  '{"setting_value": "default"}'::jsonb,
  'Description of what this setting does'
);
```

### 2. Create Service Function

Add to `lib/services/admin-service.ts`:

```typescript
export async function getNewSetting(): Promise<string> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'new_setting_key')
      .single()

    if (error) {
      console.error('Error fetching new setting:', error)
      return 'default_value'
    }

    return data?.value || 'default_value'
  } catch (error) {
    console.error('Error getting new setting:', error)
    return 'default_value'
  }
}
```

### 3. Use in Components

```typescript
import { getNewSetting } from '@/lib/services/admin-service'

export async function MyComponent() {
  const newSetting = await getNewSetting()
  // Use the setting...
}
```

### 4. Update Settings UI

Add the new setting to the Admin Settings page to allow admins to configure it.

---

## Best Practices

### 1. Always Use Service Functions

Never query settings directly - always use the service layer functions from `admin-service.ts`.

### 2. Provide Sensible Defaults

All settings should have reasonable default values in case the database query fails or the setting doesn't exist.

### 3. Type Safety

Define TypeScript interfaces for complex settings to ensure type safety:

```typescript
export interface PilotRequirements {
  pilot_retirement_age: number
  number_of_aircraft: number
  captains_per_hull: number
  first_officers_per_hull: number
  // ... etc
}
```

### 4. Caching Considerations

Settings are fetched on each page load. For high-traffic applications, consider implementing caching:

```typescript
import { getCachedData, setCachedData } from '@/lib/services/cache-service'

export async function getAppTitle(): Promise<string> {
  const cacheKey = 'settings:app_title'
  const cached = await getCachedData<string>(cacheKey)
  if (cached) return cached

  // Fetch from database...
  const title = await fetchFromDatabase()

  await setCachedData(cacheKey, title, 3600) // Cache for 1 hour
  return title
}
```

### 5. Validation

Always validate settings values to prevent invalid configurations:

```typescript
export async function getPilotRequirements(): Promise<PilotRequirements> {
  const data = await fetchFromDatabase()

  // Validate number of aircraft is positive
  if (data.number_of_aircraft <= 0) {
    console.warn('Invalid number_of_aircraft, using default')
    return getDefaultPilotRequirements()
  }

  return data
}
```

---

## Implementation Status

### ✅ Completed

- [x] App title in metadata
- [x] App title in sidebar
- [x] Pilot requirements dashboard card
- [x] Alert thresholds in certification expiry logic

### 🔄 In Progress

- [ ] Settings management UI (`/dashboard/admin/settings`)
- [ ] Email template customization
- [ ] PDF report header customization

### 📋 Planned

- [ ] Fleet-specific settings (aircraft registration numbers, etc.)
- [ ] Notification preferences
- [ ] Report generation schedules
- [ ] Custom compliance thresholds per check type

---

## Troubleshooting

### Settings Not Loading

**Problem**: Settings returning default values instead of database values

**Solutions**:
1. Check database connection is working
2. Verify settings exist in database: `SELECT * FROM settings;`
3. Check for errors in server console
4. Ensure service functions are being called from server components

### Stale Settings

**Problem**: Settings changes not reflecting immediately

**Solutions**:
1. Clear browser cache
2. Restart dev server: `npm run dev`
3. Check cache TTL if caching is implemented
4. Verify database update was successful

### Type Errors

**Problem**: TypeScript errors when accessing settings

**Solutions**:
1. Check interface definitions match database structure
2. Update TypeScript types if settings structure changed
3. Run `npm run db:types` to regenerate Supabase types

---

## References

### Code Files

- `lib/services/admin-service.ts` - Settings service layer
- `components/dashboard/pilot-requirements-card.tsx` - Pilot requirements display
- `lib/services/expiring-certifications-service.ts` - Alert thresholds usage
- `app/dashboard/layout.tsx` - Metadata generation
- `components/layout/professional-sidebar.tsx` - Sidebar title

### Database

- Table: `settings`
- Project: `wgdmgvonqysflwdiiols`
- Access: https://app.supabase.com/project/wgdmgvonqysflwdiiols

---

**Maintainer**: Maurice (Skycruzer)
**Version**: 1.0.0
**Last Updated**: October 25, 2025
