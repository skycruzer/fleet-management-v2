# Remaining Tasks Guide - Quick Reference

**Date**: November 11, 2025
**Status**: 80% Complete - Final Integration Needed

---

## 🎯 Quick Summary

**Completed**: Phases 1-5 (~80%)
- ✅ Database schema and migrations
- ✅ Service layer (6 services)
- ✅ API endpoints (3 routes, 10+ endpoints)
- ✅ UI components (6 components)
- ✅ Reporting system with PDF export
- ✅ Conflict detection service

**Remaining**: Phases 6-8 (~20%)
- ⚠️ Integrate conflict detection into unified-request-service
- ⚠️ Data migration scripts
- ⚠️ Pilot portal form updates
- ⚠️ E2E tests
- ⚠️ Documentation

---

## 🔧 Task 1: Complete Conflict Detection Integration (30 min)

### File: `/lib/services/unified-request-service.ts`

Add this to the `createPilotRequest` function (around line 300):

```typescript
import { detectConflicts } from './conflict-detection-service'

export async function createPilotRequest(
  input: CreatePilotRequestInput
): Promise<ServiceResponse<PilotRequest>> {
  try {
    // ... existing validation code ...

    // NEW: Detect conflicts before creating request
    const conflictResult = await detectConflicts({
      pilotId: input.pilot_id,
      rank: input.rank,
      startDate: input.start_date,
      endDate: input.end_date || input.start_date,
      requestCategory: input.request_category,
    })

    logger.info('Conflict detection complete', {
      hasConflicts: conflictResult.hasConflicts,
      conflictCount: conflictResult.conflicts.length,
      canApprove: conflictResult.canApprove,
    })

    // ... existing roster period calculation ...

    // NEW: Add conflict data to insert
    const { data: request, error } = await supabase
      .from('pilot_requests')
      .insert({
        // ... existing fields ...
        conflict_flags: conflictResult.conflicts,              // NEW
        availability_impact: conflictResult.crewImpact,         // NEW
      })
      .select(
        `
        *,
        pilot:pilots(first_name, last_name, seniority_number)
      `
      )
      .single()

    // ... existing error handling ...

    return {
      success: true,
      data: request,
      message: 'Request created successfully',
      // NEW: Include conflict information in response
      conflicts: conflictResult.conflicts,
      warnings: conflictResult.warnings,
      canApprove: conflictResult.canApprove,
    }
  } catch (error: any) {
    // ... existing error handling ...
  }
}
```

### Update ServiceResponse Type:

```typescript
export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  // NEW fields
  conflicts?: Conflict[]
  warnings?: string[]
  canApprove?: boolean
}
```

---

## 📦 Task 2: Create Data Migration Scripts (1 hour)

### File: `/scripts/migrate-leave-requests.mjs`

```javascript
import { createClient } from '@supabase/supabase-js'
import { getRosterPeriodCodeFromDate, calculateRosterPeriodDates } from '../lib/services/roster-period-service.js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateLeaveRequests() {
  console.log('🚀 Starting leave_requests migration...')

  try {
    // 1. Backup existing data
    console.log('📦 Creating backup...')
    const { data: backup, error: backupError } = await supabase
      .from('leave_requests')
      .select('*')

    if (backupError) throw backupError

    // Save backup to file
    const fs = await import('fs')
    fs.writeFileSync(
      `./backups/leave_requests_backup_${Date.now()}.json`,
      JSON.stringify(backup, null, 2)
    )
    console.log(`✅ Backup saved: ${backup.length} records`)

    // 2. Fetch all leave_requests with pilot data
    console.log('📥 Fetching leave requests...')
    const { data: leaveRequests, error: fetchError } = await supabase
      .from('leave_requests')
      .select(`
        *,
        pilot:pilots(
          id,
          employee_number,
          rank,
          first_name,
          last_name,
          seniority_number
        )
      `)

    if (fetchError) throw fetchError

    console.log(`Found ${leaveRequests.length} leave requests to migrate`)

    // 3. Transform to pilot_requests format
    console.log('🔄 Transforming data...')
    const pilotRequests = leaveRequests.map((leave) => {
      const rosterPeriodCode = getRosterPeriodCodeFromDate(new Date(leave.start_date))
      const [periodNum, year] = rosterPeriodCode.replace('RP', '').split('/').map(Number)
      const periodDates = calculateRosterPeriodDates(periodNum, year)

      return {
        pilot_id: leave.pilot_id,
        employee_number: leave.pilot?.employee_number || 'UNKNOWN',
        rank: leave.pilot?.rank || 'First Officer',
        name: `${leave.pilot?.first_name || ''} ${leave.pilot?.last_name || ''}`.trim(),
        request_category: 'LEAVE',
        request_type: leave.leave_type,
        submission_channel: leave.request_method || 'PILOT_PORTAL',
        submission_date: leave.created_at,
        start_date: leave.start_date,
        end_date: leave.end_date,
        days_count: leave.days_count,
        roster_period: rosterPeriodCode,
        roster_period_start_date: periodDates.startDate.toISOString().split('T')[0],
        roster_publish_date: periodDates.publishDate.toISOString().split('T')[0],
        roster_deadline_date: periodDates.deadlineDate.toISOString().split('T')[0],
        workflow_status: mapStatus(leave.status),
        reviewed_by: leave.reviewed_by,
        reviewed_at: leave.reviewed_at,
        review_comments: leave.review_comments,
        is_late_request: calculateIsLate(leave.created_at, periodDates.deadlineDate),
        is_past_deadline: new Date(leave.created_at) > periodDates.deadlineDate,
        priority_score: leave.pilot?.seniority_number || 0,
        reason: leave.reason,
        notes: leave.notes,
        created_at: leave.created_at,
        updated_at: leave.updated_at || leave.created_at,
      }
    })

    // 4. Insert into pilot_requests in batches
    console.log('📤 Inserting into pilot_requests...')
    const batchSize = 50
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < pilotRequests.length; i += batchSize) {
      const batch = pilotRequests.slice(i, i + batchSize)
      const { error: insertError } = await supabase
        .from('pilot_requests')
        .insert(batch)

      if (insertError) {
        console.error(`❌ Batch ${i / batchSize + 1} failed:`, insertError)
        errorCount += batch.length
      } else {
        successCount += batch.length
        console.log(`✅ Batch ${i / batchSize + 1}: ${batch.length} records inserted`)
      }
    }

    console.log('\n📊 Migration Summary:')
    console.log(`✅ Successfully migrated: ${successCount} records`)
    console.log(`❌ Failed: ${errorCount} records`)
    console.log(`📦 Backup location: ./backups/leave_requests_backup_*.json`)

  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  }
}

function mapStatus(oldStatus) {
  const statusMap = {
    'pending': 'SUBMITTED',
    'approved': 'APPROVED',
    'denied': 'DENIED',
    'withdrawn': 'WITHDRAWN',
  }
  return statusMap[oldStatus?.toLowerCase()] || 'SUBMITTED'
}

function calculateIsLate(submissionDate, deadlineDate) {
  const daysDiff = Math.ceil((deadlineDate - new Date(submissionDate)) / (1000 * 60 * 60 * 24))
  return daysDiff < 21
}

// Run migration
migrateLeaveRequests()
```

### Run migration:
```bash
mkdir -p backups
node scripts/migrate-leave-requests.mjs
```

---

## 🌐 Task 3: Update Pilot Portal Forms (2 hours)

### File: `/app/portal/(protected)/leave/request/page.tsx`

Replace existing form submission logic:

```typescript
'use client'

import { useState } from 'react'
import { ConflictAlert } from '@/components/requests/conflict-alert'

export default function LeaveRequestPage() {
  const [conflicts, setConflicts] = useState([])
  const [warnings, setWarnings] = useState([])

  const handleSubmit = async (formData) => {
    // NEW: Use unified API instead of old endpoint
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pilot_id: user.pilot_id,
        employee_number: user.employee_number,
        rank: user.rank,
        name: user.name,
        request_category: 'LEAVE',
        request_type: formData.leaveType,
        submission_channel: 'PILOT_PORTAL',
        start_date: formData.startDate,
        end_date: formData.endDate,
        reason: formData.reason,
        notes: formData.notes,
      }),
    })

    const result = await response.json()

    if (result.success) {
      // NEW: Show conflicts if any
      if (result.conflicts && result.conflicts.length > 0) {
        setConflicts(result.conflicts)
        setWarnings(result.warnings || [])

        // Show warning if cannot approve
        if (!result.canApprove) {
          toast.error('Request has critical conflicts. Please review before submitting.')
          return
        }

        // Ask user to confirm submission despite warnings
        const confirmed = await confirmDialog(
          'This request has warnings. Do you want to submit anyway?'
        )
        if (!confirmed) return
      }

      toast.success('Leave request submitted successfully')
      router.push('/portal/leave')
    } else {
      toast.error(result.error || 'Failed to submit request')
    }
  }

  return (
    <div>
      {/* Show conflicts if any */}
      {conflicts.length > 0 && (
        <ConflictAlert
          conflicts={conflicts}
          warnings={warnings}
          className="mb-6"
        />
      )}

      {/* Existing form */}
      <LeaveRequestForm onSubmit={handleSubmit} />
    </div>
  )
}
```

---

## 🧪 Task 4: Create E2E Tests (2 hours)

### File: `/e2e/unified-requests.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Unified Request Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'admin@test.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should create request via quick entry', async ({ page }) => {
    await page.goto('/dashboard/requests')

    // Click quick entry button
    await page.click('button:has-text("Quick Entry")')

    // Fill form
    await page.selectOption('[name="pilot_id"]', { index: 1 })
    await page.click('[value="LEAVE"]')
    await page.click('[value="EMAIL"]')
    await page.click('button:has-text("Next")')

    await page.fill('[name="start_date"]', '2026-02-15')
    await page.fill('[name="end_date"]', '2026-02-20')
    await page.click('button:has-text("Next")')

    await page.selectOption('[name="request_type"]', 'ANNUAL')
    await page.fill('[name="reason"]', 'Test leave request')
    await page.click('button:has-text("Next")')

    // Submit
    await page.click('button:has-text("Submit Request")')

    // Verify success
    await expect(page.locator('text=Request created successfully')).toBeVisible()
  })

  test('should filter requests by roster period', async ({ page }) => {
    await page.goto('/dashboard/requests')

    // Select roster period
    await page.click('text=Roster Period')
    await page.click('text=RP01/2026')

    // Verify filter applied
    await expect(page.locator('text=RP01/2026').first()).toBeVisible()
  })

  test('should generate roster period report', async ({ page }) => {
    await page.goto('/dashboard/reports')

    // Select roster period
    await page.selectOption('[name="roster_period"]', 'RP01/2026')

    // Generate report
    await page.click('button:has-text("Generate Report")')

    // Verify report displayed
    await expect(page.locator('text=Request Summary')).toBeVisible()
    await expect(page.locator('text=Approved:')).toBeVisible()
  })

  test('should detect overlapping request conflict', async ({ page }) => {
    // Create first request
    await page.goto('/dashboard/requests')
    await page.click('button:has-text("Quick Entry")')
    // ... fill form ...
    await page.click('button:has-text("Submit Request")')

    // Create overlapping request
    await page.click('button:has-text("Quick Entry")')
    // ... fill form with overlapping dates ...

    // Verify conflict detected
    await expect(page.locator('text=Overlapping Request')).toBeVisible()
    await expect(page.locator('text=CRITICAL')).toBeVisible()
  })
})
```

---

## 📚 Task 5: Create Documentation (1 hour)

### File: `/docs/DEPLOYMENT-GUIDE.md`

```markdown
# Deployment Guide - Unified Request Management System

## Prerequisites
- Node.js 18+
- Supabase account
- Vercel account (or alternative hosting)
- Resend account (for email notifications)

## Step 1: Environment Setup

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

RESEND_API_KEY=your-resend-key
RESEND_FROM_EMAIL=no-reply@yourdomain.com

NEXT_PUBLIC_APP_URL=https://your-app.com
FLEET_MANAGER_EMAIL=manager@example.com
```

## Step 2: Database Setup

1. Deploy migrations:
```bash
supabase db push --linked
```

2. Initialize roster periods:
```bash
node scripts/initialize-roster-periods.mjs
```

3. Run data migration (if needed):
```bash
node scripts/migrate-leave-requests.mjs
node scripts/migrate-flight-requests.mjs
```

## Step 3: Install Dependencies

```bash
npm install jspdf jspdf-autotable
```

## Step 4: Build and Deploy

```bash
npm run build
npm run deploy  # or push to Vercel
```

## Step 5: Configure Cron Jobs

In `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/deadline-alerts/send",
    "schedule": "0 9 * * *"
  }]
}
```

## Step 6: Verify Deployment

- [ ] Access /dashboard/requests
- [ ] Create test request via quick entry
- [ ] Generate roster period report
- [ ] Download PDF report
- [ ] Check deadline alerts appear
- [ ] Test conflict detection

## Troubleshooting

See TROUBLESHOOTING.md for common issues and solutions.
```

---

## ✅ Final Checklist

### Before Deployment
- [ ] All migrations deployed
- [ ] Roster periods initialized
- [ ] Environment variables configured
- [ ] Dependencies installed (jspdf, jspdf-autotable)
- [ ] Build succeeds (`npm run build`)
- [ ] Tests pass (`npm test`)

### After Deployment
- [ ] Verify API endpoints work
- [ ] Test quick entry form
- [ ] Test roster report generation
- [ ] Test PDF download
- [ ] Verify deadline alerts
- [ ] Test conflict detection
- [ ] Monitor error logs

### Data Migration
- [ ] Backup created
- [ ] Migration script tested on dev
- [ ] Migration executed on production
- [ ] Data verified in pilot_requests table
- [ ] Old tables archived (not deleted)

---

## 📞 Support

For issues or questions:
1. Check TROUBLESHOOTING.md
2. Review implementation documentation
3. Check service logs in Better Stack
4. Review Supabase database logs

---

**Estimated Time to Complete**: 6-8 hours
**Difficulty**: Medium
**Priority**: High - Final integration needed for production readiness
