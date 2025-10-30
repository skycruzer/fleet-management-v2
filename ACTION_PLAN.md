# Fleet Management V2 - Action Plan
**Priority-Based Implementation Roadmap**

**Date Created**: October 27, 2025
**Status**: Ready for Implementation
**Estimated Timeline**: 4 weeks

---

## 🔴 CRITICAL - Week 1 (Fix Pilot Portal)

### Priority 1: Create Missing Pilot Portal Pages

#### 1.1 Flight Requests Page
**File**: `app/portal/(protected)/flight-requests/page.tsx`

**Requirements**:
- Display pilot's flight requests history
- Submit new flight request button
- Filter by status (PENDING, APPROVED, DENIED)
- View request details
- Request types: Additional Flight, Route Change, Schedule Swap, Training

**Service Available**: ✅ `lib/services/pilot-flight-service.ts`
**API Endpoint**: ✅ `/api/portal/flight-requests`

**Implementation Checklist**:
- [ ] Create page file
- [ ] Add flight request form component
- [ ] Connect to API endpoint
- [ ] Add filtering functionality
- [ ] Display request history
- [ ] Show approval status with color coding
- [ ] Add form validation (Zod schema exists)

---

#### 1.2 Leave Requests Page
**File**: `app/portal/(protected)/leave/page.tsx`

**Requirements**:
- Display pilot's leave requests
- Submit new leave request
- Filter by roster period and status
- View eligibility alerts
- Show competing requests warnings

**Service Available**: ✅ `lib/services/pilot-leave-service.ts`
**API Endpoint**: ✅ `/api/portal/leave-requests`

**Implementation Checklist**:
- [ ] Create page file
- [ ] Add leave request form component
- [ ] Implement roster period selector
- [ ] Add leave type dropdown (ANNUAL, SICK, RDO, SDO, LSL, etc.)
- [ ] Display eligibility alerts
- [ ] Show seniority-based priority
- [ ] Add date range validation

---

#### 1.3 Feedback Page
**File**: `app/portal/(protected)/feedback/page.tsx`

**Requirements**:
- Display pilot's feedback history
- Submit new feedback
- Support anonymous submissions
- Categories: General, Operations, Safety, Training, Scheduling, System/IT, Other

**Service Needed**: ❌ **CREATE** `lib/services/feedback-service.ts`
**API Endpoint**: ❌ **CREATE** `/api/portal/feedback`

**Implementation Checklist**:
- [ ] Create feedback service layer
- [ ] Create API endpoint
- [ ] Create page file
- [ ] Add feedback form component
- [ ] Implement category dropdown
- [ ] Add anonymous option checkbox
- [ ] Display feedback history
- [ ] Show admin responses

---

#### 1.4 Leave Bids Page (Fix Port Configuration)
**File**: `app/portal/(protected)/leave-bids/page.tsx` (may already exist)

**Requirements**:
- Fix test port configuration (3001 → 3000)
- Verify page is accessible
- Test bid submission workflow

**Service Available**: ✅ `lib/services/leave-bid-service.ts`
**API Endpoint**: ✅ `/api/portal/leave-bids`

**Implementation Checklist**:
- [ ] Fix test configuration in `e2e/leave-bids.spec.ts`
- [ ] Change all `localhost:3001` → `localhost:3000`
- [ ] Verify page renders correctly
- [ ] Test bid submission
- [ ] Re-run E2E tests

---

## 🟡 IMPORTANT - Week 2 (Admin Dashboard Routes)

### Priority 2: Create Missing Admin Dashboard Pages

#### 2.1 Flight Requests Dashboard
**File**: `app/dashboard/flight-requests/page.tsx`

**Requirements**:
- Display all flight requests from all pilots
- Filter by status, type, pilot, date range
- Approve/deny requests with comments
- View pilot information
- Export to CSV

**Service Available**: ✅ `lib/services/flight-request-service.ts`
**API Endpoint**: ✅ `/api/flight-requests`

**Implementation Checklist**:
- [ ] Create page file
- [ ] Add data table with filters
- [ ] Implement approve/deny actions
- [ ] Add reviewer comments field
- [ ] Show pilot details
- [ ] Add export functionality
- [ ] Create notification on status change

---

#### 2.2 Leave Requests Dashboard
**File**: `app/dashboard/leave-requests/page.tsx` (verify if exists)

**Requirements**:
- Display all leave requests
- Filter by roster period, status, rank
- Show eligibility information
- Approve/reject with reasons
- Display seniority priority
- Export to CSV

**Service Available**: ✅ `lib/services/leave-service.ts`
**API Endpoint**: ✅ `/api/leave-requests`

**Implementation Checklist**:
- [ ] Verify page exists or create
- [ ] Add roster period filter
- [ ] Show eligibility alerts prominently
- [ ] Implement bulk approval (if needed)
- [ ] Display competing requests warning
- [ ] Add seniority information
- [ ] Create notifications on approval/denial

---

#### 2.3 Feedback Dashboard
**File**: `app/dashboard/feedback/page.tsx`

**Requirements**:
- Display all feedback submissions
- Filter by category, status, date
- Mark as reviewed
- Add admin responses
- View anonymous submissions differently
- Export to CSV

**Service Needed**: ❌ **CREATE** `lib/services/feedback-service.ts`
**API Endpoint**: ❌ **CREATE** `/api/feedback`

**Implementation Checklist**:
- [ ] Create feedback service layer (admin functions)
- [ ] Create admin API endpoint
- [ ] Create page file
- [ ] Add feedback table with filters
- [ ] Implement "Mark as Reviewed" action
- [ ] Add admin response form
- [ ] Show anonymous indicator
- [ ] Export functionality

---

## 🟢 ENHANCEMENTS - Week 3 (Service Layer & Notifications)

### Priority 3: Implement Feedback Service

#### 3.1 Create Feedback Service
**File**: `lib/services/feedback-service.ts`

**Functions Required**:
```typescript
// Pilot functions
createFeedback(feedbackData: FeedbackInput): Promise<ServiceResponse>
getCurrentPilotFeedback(): Promise<ServiceResponse<Feedback[]>>
getFeedbackById(id: string): Promise<ServiceResponse<Feedback>>

// Admin functions
getAllFeedback(filters?: FeedbackFilters): Promise<ServiceResponse<Feedback[]>>
updateFeedbackStatus(id: string, status: 'REVIEWED' | 'PENDING'): Promise<ServiceResponse>
addAdminResponse(id: string, response: string): Promise<ServiceResponse>
getFeedbackByCategory(category: string): Promise<ServiceResponse<Feedback[]>>
exportFeedbackToCSV(): Promise<ServiceResponse<string>>
```

**Implementation Checklist**:
- [ ] Create service file
- [ ] Implement pilot functions
- [ ] Implement admin functions
- [ ] Add error handling
- [ ] Create audit logging
- [ ] Add validation (use existing schema)
- [ ] Test with Supabase database

---

#### 3.2 Create Feedback Database Table
**File**: Supabase migration

**Schema**:
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pilot_id UUID NOT NULL REFERENCES pilots(id),
  category TEXT NOT NULL CHECK (category IN ('GENERAL', 'OPERATIONS', 'SAFETY', 'TRAINING', 'SCHEDULING', 'SYSTEM_IT', 'OTHER')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWED')),
  admin_response TEXT,
  reviewed_by UUID REFERENCES an_users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Implementation Checklist**:
- [ ] Create migration file
- [ ] Apply migration to database
- [ ] Add Row Level Security (RLS) policies
- [ ] Generate TypeScript types: `npm run db:types`
- [ ] Test database operations

---

### Priority 4: Enhance Notification System

#### 4.1 Create Notification E2E Tests
**File**: `e2e/notifications.spec.ts`

**Test Coverage**:
- Notification creation on flight request submission
- Notification creation on leave request submission
- Notification creation on feedback submission
- Admin notification for new submissions
- Pilot notification for approval/denial
- Mark as read functionality
- Delete notifications
- Unread count display

**Implementation Checklist**:
- [ ] Create test file
- [ ] Test notification bell component
- [ ] Test notification list display
- [ ] Test mark as read
- [ ] Test delete notifications
- [ ] Test real-time updates (if using subscriptions)
- [ ] Verify notification persistence

---

#### 4.2 Integrate Notifications with Workflows

**Integration Points**:
1. **Flight Request Workflow**
   - Pilot submits → Notify all admins
   - Admin approves/denies → Notify pilot

2. **Leave Request Workflow**
   - Pilot submits → Notify all admins
   - Admin approves/denies → Notify pilot
   - Eligibility alert → Notify affected pilots

3. **Leave Bid Workflow**
   - Pilot submits bid → Notify all admins
   - Admin approves/rejects → Notify pilot

4. **Feedback Workflow**
   - Pilot submits feedback → Notify all admins
   - Admin responds → Notify pilot

**Implementation Checklist**:
- [ ] Add notification calls in flight request API
- [ ] Add notification calls in leave request API
- [ ] Add notification calls in leave bid API
- [ ] Add notification calls in feedback API
- [ ] Test notification delivery
- [ ] Verify notification content is clear

---

## 🔧 POLISH - Week 4 (Testing & Documentation)

### Priority 5: Fix Test Configuration

#### 5.1 Update Leave Bids Tests
**File**: `e2e/leave-bids.spec.ts`

**Changes Required**:
- Change all `localhost:3001` to `localhost:3000`
- Verify pilot credentials
- Update base URL in Playwright config

**Implementation Checklist**:
- [ ] Find and replace port numbers
- [ ] Re-run tests
- [ ] Verify all tests pass
- [ ] Update screenshots directory path

---

#### 5.2 Add Missing Test Suites

**New Test Files Needed**:
1. `e2e/notifications.spec.ts` - Notification system
2. `e2e/admin-feedback.spec.ts` - Admin feedback dashboard
3. `e2e/integration/workflow-integration.spec.ts` - End-to-end workflows

**Implementation Checklist**:
- [ ] Create notification tests
- [ ] Create admin feedback tests
- [ ] Create integration tests
- [ ] Run full test suite
- [ ] Fix any failures
- [ ] Update test coverage report

---

### Priority 6: Update Documentation

#### 6.1 Update CLAUDE.md
**File**: `CLAUDE.md`

**Updates Needed**:
- Add new routes documentation
- Document feedback workflow
- Update service layer list (add feedback-service)
- Add troubleshooting section for common issues

**Implementation Checklist**:
- [ ] Document new pilot portal routes
- [ ] Document new admin dashboard routes
- [ ] Add feedback service to service list
- [ ] Update architecture diagrams (if any)
- [ ] Add feedback workflow to business rules

---

#### 6.2 Create API Documentation
**File**: `API_DOCUMENTATION.md`

**Content**:
- All API endpoints
- Request/response schemas
- Authentication requirements
- Error codes
- Example requests

**Implementation Checklist**:
- [ ] Document flight request endpoints
- [ ] Document leave request endpoints
- [ ] Document leave bid endpoints
- [ ] Document feedback endpoints
- [ ] Document notification endpoints
- [ ] Add Postman collection (optional)

---

## 📊 Success Metrics

### Week 1 Completion Criteria
- [ ] All pilot portal pages accessible (no 404 errors)
- [ ] Flight request submission working
- [ ] Leave request submission working
- [ ] Feedback submission working (after service creation)
- [ ] E2E test pass rate > 70%

### Week 2 Completion Criteria
- [ ] All admin dashboard pages accessible
- [ ] Admin can review and approve/deny all request types
- [ ] Notifications sent on status changes
- [ ] E2E test pass rate > 85%

### Week 3 Completion Criteria
- [ ] Feedback service fully functional
- [ ] Notification integration complete
- [ ] All workflows tested end-to-end
- [ ] E2E test pass rate > 95%

### Week 4 Completion Criteria
- [ ] All E2E tests passing (100%)
- [ ] Documentation updated
- [ ] Test coverage report generated
- [ ] Production deployment ready

---

## 🚨 Known Issues & Solutions

### Issue 1: Port Mismatch in Leave Bids Tests
**Problem**: Tests expect `localhost:3001`, app runs on `localhost:3000`
**Solution**: Update all port references in `e2e/leave-bids.spec.ts`
**Priority**: High
**Estimated Time**: 10 minutes

### Issue 2: Pilot Portal 404 Errors
**Problem**: Routes `/portal/flight-requests`, `/portal/leave`, `/portal/feedback` return 404
**Solution**: Create missing page files in `app/portal/(protected)/`
**Priority**: Critical
**Estimated Time**: 2-3 hours per page

### Issue 3: Missing Feedback Service
**Problem**: No `lib/services/feedback-service.ts` exists
**Solution**: Create service following existing service layer pattern
**Priority**: High
**Estimated Time**: 2 hours

### Issue 4: Admin Dashboard 404 Errors
**Problem**: Some admin routes return 404
**Solution**: Create missing dashboard pages
**Priority**: High
**Estimated Time**: 2-3 hours per page

### Issue 5: Notification Tests Missing
**Problem**: No E2E tests for notification system
**Solution**: Create `e2e/notifications.spec.ts`
**Priority**: Medium
**Estimated Time**: 1-2 hours

---

## 📝 Development Checklist

### Before Starting Development
- [ ] Read TEST_RESULTS.md thoroughly
- [ ] Review existing service layer code
- [ ] Understand dual authentication architecture
- [ ] Set up local development environment
- [ ] Ensure database connection works: `node test-connection.mjs`

### During Development
- [ ] Follow service layer pattern (NEVER direct Supabase calls)
- [ ] Use existing validation schemas (Zod)
- [ ] Add error handling to all functions
- [ ] Create audit logs for CRUD operations
- [ ] Test on local environment before committing
- [ ] Run `npm run validate` before commits

### After Development
- [ ] Run full E2E test suite: `npm test`
- [ ] Fix any failing tests
- [ ] Update documentation
- [ ] Create pull request with clear description
- [ ] Request code review

---

## 🎯 Quick Start Commands

```bash
# Run all E2E tests
npm test

# Run specific workflow tests
npx playwright test e2e/flight-requests.spec.ts
npx playwright test e2e/leave-requests.spec.ts
npx playwright test e2e/leave-bids.spec.ts
npx playwright test e2e/feedback.spec.ts

# Run tests in UI mode (debugging)
npm run test:ui

# Generate TypeScript types from database
npm run db:types

# Run validation (pre-commit checks)
npm run validate

# Start development server
npm run dev

# Test database connection
node test-connection.mjs
```

---

## 📧 Support & Resources

**Documentation**:
- `TEST_RESULTS.md` - Detailed test results
- `CLAUDE.md` - Development guidelines
- `README.md` - Project overview
- `package.json` - Available scripts

**Key Files**:
- Service Layer: `lib/services/*.ts`
- Validation: `lib/validations/*.ts`
- E2E Tests: `e2e/*.spec.ts`
- API Routes: `app/api/**/*.ts`

**External Resources**:
- Next.js 16 Docs: https://nextjs.org/docs
- Playwright Docs: https://playwright.dev
- Supabase Docs: https://supabase.com/docs
- Zod Validation: https://zod.dev

---

**Action Plan Version**: 1.0
**Last Updated**: October 27, 2025
**Maintainer**: Maurice (Skycruzer)
**Status**: Ready for Implementation 🚀
