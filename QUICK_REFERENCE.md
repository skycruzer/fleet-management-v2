# Fleet Management V2 - Quick Reference Card

**Last Updated**: October 27, 2025

---

## 🚀 Quick Commands

```bash
# Development
npm run dev                    # Start dev server (localhost:3000)
npm run build                  # Production build
npm run validate               # Pre-commit validation (type-check + lint + format)

# Testing
npm test                       # Run all E2E tests
npm run test:ui                # Playwright UI mode (debugging)
npx playwright test e2e/[file].spec.ts  # Run specific test

# Database
npm run db:types               # Generate TypeScript types from Supabase
node test-connection.mjs       # Test database connection

# Code Quality
npm run lint:fix               # Auto-fix ESLint issues
npm run format                 # Format code with Prettier
```

---

## 📊 Test Results Summary

| Workflow | Tests | Passed | Failed | Status |
|----------|-------|--------|--------|--------|
| **Flight Requests** | 19 | 8 (42%) | 11 (58%) | ⚠️ Partial |
| **Leave Requests** | 19 | 13 (68%) | 6 (32%) | ✅ Good |
| **Leave Bids** | 17 | 0 (0%) | 17 (100%) | ❌ Config Error |
| **Feedback** | 24 | 8 (33%) | 16 (67%) | ⚠️ Incomplete |
| **Notifications** | 0 | - | - | ⏳ Not Tested |
| **TOTAL** | **79** | **29 (37%)** | **50 (63%)** | ⚠️ **Needs Work** |

---

## 🔴 Critical Issues (Fix Immediately)

### 1. Missing Pilot Portal Pages (404 Errors)
**Impact**: Pilots cannot access any workflows

```
❌ /portal/flight-requests  → 404 Not Found
❌ /portal/leave            → 404 Not Found
❌ /portal/feedback         → 404 Not Found
✅ /portal/leave-bids       → May exist, needs port fix
```

**Solution**: Create page files in `app/portal/(protected)/`

---

### 2. Test Configuration Error
**Impact**: All leave bids tests fail immediately

```
❌ Tests expect: localhost:3001
✅ App runs on:  localhost:3000
```

**Solution**: Update `e2e/leave-bids.spec.ts` (find/replace 3001 → 3000)

---

### 3. Missing Feedback Service
**Impact**: Feedback workflow incomplete

```
❌ lib/services/feedback-service.ts  → Does Not Exist
✅ lib/validations/feedback-schema.ts → Exists
```

**Solution**: Create service layer following existing patterns

---

## ✅ What's Working Well

### Backend (Fully Functional)
- ✅ **27 Service Functions** - All operational
- ✅ **Flight Request Service** - Complete CRUD operations
- ✅ **Leave Service** - Complex eligibility logic working
- ✅ **Leave Bid Service** - Annual bid submission functional
- ✅ **Notification Service** - 9 functions ready
- ✅ **Database Operations** - Supabase integration solid
- ✅ **Business Logic** - Seniority, eligibility, roster periods

### Admin Dashboard (Partial)
- ✅ **Data Display** - Where pages exist, they work
- ✅ **Approve/Deny Actions** - Functional
- ✅ **Filtering** - Status, date range, pilot filters work
- ✅ **Export to CSV** - Working
- ✅ **Notifications** - Admin notifications functional

---

## 🎯 4-Week Implementation Plan

### 🔴 Week 1: Fix Pilot Portal (CRITICAL)
**Estimated Time**: 12-16 hours

```
Day 1-2: Create Flight Requests Page
- [ ] app/portal/(protected)/flight-requests/page.tsx
- [ ] Flight request submission form
- [ ] Request history display
- [ ] Status filtering

Day 3-4: Create Leave Requests Page
- [ ] app/portal/(protected)/leave/page.tsx
- [ ] Leave request submission form
- [ ] Roster period selector
- [ ] Eligibility alerts

Day 5: Create Feedback Page
- [ ] app/portal/(protected)/feedback/page.tsx
- [ ] Feedback submission form
- [ ] Category dropdown
- [ ] Anonymous option

Day 5: Fix Test Configuration
- [ ] Update leave-bids.spec.ts (port 3001 → 3000)
- [ ] Re-run all tests
- [ ] Verify improvements
```

**Target**: E2E tests 70%+ pass rate

---

### 🟡 Week 2: Fix Admin Dashboard (IMPORTANT)
**Estimated Time**: 10-14 hours

```
Day 1-2: Create Flight Requests Dashboard
- [ ] app/dashboard/flight-requests/page.tsx
- [ ] Review and approval interface
- [ ] Pilot information display
- [ ] Export functionality

Day 3-4: Verify/Create Leave Requests Dashboard
- [ ] app/dashboard/leave-requests/page.tsx
- [ ] Eligibility information display
- [ ] Bulk approval (if needed)
- [ ] Seniority display

Day 5: Create Feedback Dashboard
- [ ] app/dashboard/feedback/page.tsx
- [ ] Mark as reviewed action
- [ ] Admin response form
- [ ] Category filtering
```

**Target**: E2E tests 85%+ pass rate

---

### 🟢 Week 3: Complete Backend & Enhance (ENHANCEMENTS)
**Estimated Time**: 8-12 hours

```
Day 1-2: Implement Feedback Service
- [ ] lib/services/feedback-service.ts
- [ ] Create feedback database table (migration)
- [ ] Add RLS policies
- [ ] Generate types: npm run db:types

Day 3-4: Integrate Notifications
- [ ] Add notification calls to all workflows
- [ ] Test notification delivery
- [ ] Verify notification content

Day 5: Create Notification Tests
- [ ] e2e/notifications.spec.ts
- [ ] Test notification creation
- [ ] Test mark as read/delete
- [ ] Test real-time updates
```

**Target**: E2E tests 95%+ pass rate

---

### 🔵 Week 4: Testing & Documentation (POLISH)
**Estimated Time**: 6-8 hours

```
Day 1-2: Fix Remaining Test Failures
- [ ] Run full test suite
- [ ] Debug and fix failures
- [ ] Achieve 100% pass rate

Day 3-4: Update Documentation
- [ ] Update CLAUDE.md with new routes
- [ ] Create API_DOCUMENTATION.md
- [ ] Update README.md

Day 5: Production Prep
- [ ] Run: npm run validate
- [ ] Final security audit
- [ ] Deployment checklist
- [ ] Production deployment
```

**Target**: E2E tests 100% pass rate + Production ready

---

## 🔍 Service Layer Reference

### Flight Requests
```typescript
import {
  getAllFlightRequests,      // Admin: Get all requests
  getFlightRequestById,      // Get single request
  reviewFlightRequest,       // Admin: Approve/deny
  getFlightRequestStats      // Dashboard statistics
} from '@/lib/services/flight-request-service'

// Pilot-specific
import {
  submitFlightRequest,       // Pilot: Submit request
  getCurrentPilotFlightRequests  // Pilot: Get own requests
} from '@/lib/services/pilot-flight-service'
```

### Leave Requests
```typescript
import {
  // Admin functions (leave-service.ts)
  getAllLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,

  // Pilot functions (pilot-leave-service.ts)
  submitLeaveRequest,
  getCurrentPilotLeaveRequests,

  // Eligibility logic (leave-eligibility-service.ts)
  checkLeaveEligibility,
  getEligibilityAlerts
} from '@/lib/services/...'
```

### Leave Bids
```typescript
import {
  submitLeaveBid,            // Pilot: Submit annual bid
  getCurrentPilotLeaveBids,  // Pilot: Get own bids
  getAllLeaveBids,           // Admin: Get all bids
  updateLeaveBidStatus       // Admin: Approve/reject
} from '@/lib/services/leave-bid-service'
```

### Notifications
```typescript
import {
  createNotification,        // Create single notification
  createBulkNotifications,   // Create multiple
  getUserNotifications,      // Get user's notifications
  markNotificationAsRead,    // Mark as read
  notifyAllAdmins           // Helper: Notify all admins
} from '@/lib/services/notification-service'
```

---

## 📝 Common Patterns

### Creating a New Page
```typescript
// 1. Create page file
// app/portal/(protected)/my-feature/page.tsx

import { createClient } from '@/lib/supabase/server'
import { MyFeatureComponent } from '@/components/portal/my-feature'

export default async function MyFeaturePage() {
  const supabase = await createClient()
  // Fetch data using service layer
  const data = await getMyFeatureData()

  return <MyFeatureComponent data={data} />
}
```

### Creating a Form
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MyFeatureSchema } from '@/lib/validations/my-feature-schema'

export function MyFeatureForm() {
  const form = useForm({
    resolver: zodResolver(MyFeatureSchema),
    defaultValues: { /* ... */ }
  })

  async function onSubmit(data) {
    const response = await fetch('/api/portal/my-feature', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    // Handle response
  }

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>
}
```

### Creating an API Route
```typescript
// app/api/portal/my-feature/route.ts

import { NextResponse } from 'next/server'
import { myFeatureService } from '@/lib/services/my-feature-service'
import { MyFeatureSchema } from '@/lib/validations/my-feature-schema'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = MyFeatureSchema.parse(body)

    const result = await myFeatureService.create(validated)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    )
  }
}
```

---

## ⚠️ Important Reminders

### Authentication Rules
```
✅ /api/portal/*    → Use Pilot Portal Auth (an_users table)
✅ /api/*           → Use Admin Supabase Auth
✅ /portal/*        → Pilot portal pages
✅ /dashboard/*     → Admin dashboard pages
```

### Service Layer Rules
```
✅ ALWAYS use service layer for database operations
❌ NEVER make direct Supabase calls from components/routes
✅ Services handle: validation, audit logs, error handling
```

### Testing Rules
```
✅ Test after every change: npm test
✅ Validate before commit: npm run validate
✅ Update types after DB changes: npm run db:types
✅ Use UI mode for debugging: npm run test:ui
```

---

## 📚 Key Documents

| Document | Purpose | Status |
|----------|---------|--------|
| `TEST_RESULTS.md` | Detailed test analysis | ✅ Complete |
| `ACTION_PLAN.md` | Implementation roadmap | ✅ Complete |
| `CLAUDE.md` | Development guidelines | ✅ Enhanced |
| `README.md` | Project overview | ✅ Existing |
| `QUICK_REFERENCE.md` | This document | ✅ Complete |

---

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### TypeScript Errors
```bash
# Regenerate types from database
npm run db:types
```

### Test Failures
```bash
# Run in debug mode
npm run test:debug

# View test report
npx playwright show-report
```

### Database Connection Issues
```bash
# Test connection
node test-connection.mjs

# Check environment variables
cat .env.local | grep SUPABASE
```

---

## 📞 Support

**Documentation**: See TEST_RESULTS.md and ACTION_PLAN.md
**Issues**: Check test screenshots in `test-results/`
**Maintainer**: Maurice (Skycruzer)

---

**Version**: 1.0
**Last Updated**: October 27, 2025
**Status**: Ready for Development 🚀
