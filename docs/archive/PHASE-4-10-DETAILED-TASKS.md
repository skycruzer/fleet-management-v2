# Phases 4-10: Detailed Task Breakdown

**Fleet Management V2 - Unified Request Management System**
**Author**: Maurice Rondeau
**Date**: November 11, 2025
**Status**: In Progress

---

## 📋 Overview

Complete breakdown of all remaining tasks from Phase 4 through Phase 10, including the new aviation design system implementation.

---

## ✅ Phase 4: Unified Requests Dashboard (IN PROGRESS)

**Goal**: Complete the main requests dashboard page with all filtering, sorting, and bulk operations.

### 4.1 Fix Build Errors (CURRENT) ⚡
- [ ] Fix `QuickEntryButton` props error in requests page
- [ ] Verify all TypeScript types compile correctly
- [ ] Run `npm run build` successfully
- [ ] Run `npm run validate` successfully

**Estimated Time**: 30 minutes

### 4.2 Complete Requests Table Component
- [x] Basic table structure with sorting
- [x] Request status badges with color coding
- [x] Row selection for bulk actions
- [ ] Test pagination with 50+ requests
- [ ] Verify sorting on all columns
- [ ] Test bulk approve/deny actions

**Estimated Time**: 1 hour

### 4.3 Complete Request Filters Component
- [x] Roster period filter dropdown
- [x] Status multiselect (PENDING, APPROVED, DENIED)
- [x] Category filter (LEAVE, FLIGHT, BID)
- [x] Channel filter (PORTAL, EMAIL, PHONE, ORACLE, ADMIN)
- [x] Search by pilot name/employee number
- [ ] Test filter combinations
- [ ] Verify URL query param updates
- [ ] Test filter clear functionality

**Estimated Time**: 30 minutes

### 4.4 Complete Quick Entry Button/Form
- [x] Quick entry button component
- [x] Quick entry form modal
- [ ] Fetch pilot list from API
- [ ] Add form validation
- [ ] Test request submission
- [ ] Verify success/error handling

**Estimated Time**: 1 hour

### 4.5 Integration Testing
- [ ] Test full dashboard page load
- [ ] Verify DeadlineWidget displays correctly
- [ ] Test request CRUD operations
- [ ] Test filter + sort combinations
- [ ] Test bulk operations
- [ ] Verify mobile responsiveness

**Estimated Time**: 1 hour

**Phase 4 Total**: 4 hours

---

## 🔄 Phase 5: Advanced Reporting & PDF Generation

**Goal**: Implement roster period report generation with PDF export and email delivery.

### 5.1 Complete Roster Report Service
- [x] Service layer created (`roster-report-service.ts`)
- [ ] Test report data aggregation
- [ ] Verify conflict detection integration
- [ ] Test statistics calculation
- [ ] Add error handling

**Estimated Time**: 1 hour

### 5.2 Complete Roster PDF Service
- [x] Service layer created (`roster-pdf-service.ts`)
- [ ] Test PDF generation with jsPDF
- [ ] Verify formatting and layout
- [ ] Test with different roster periods
- [ ] Add company branding/logo
- [ ] Test PDF download functionality

**Estimated Time**: 2 hours

### 5.3 Create Report API Endpoints
- [ ] Create `GET /api/roster-reports/[period]` endpoint
- [ ] Create `POST /api/roster-reports/[period]/email` endpoint
- [ ] Add authentication and permissions
- [ ] Test report generation
- [ ] Test email delivery

**Estimated Time**: 1 hour

### 5.4 Create Report UI Components
- [ ] Create "Generate Report" button in dashboard
- [ ] Create report preview modal
- [ ] Add email delivery form
- [ ] Test report download
- [ ] Test email sending

**Estimated Time**: 2 hours

### 5.5 Integration Testing
- [ ] Test full report generation flow
- [ ] Verify PDF formatting
- [ ] Test email delivery to multiple recipients
- [ ] Verify error handling
- [ ] Test with different roster periods (OPEN, CLOSED)

**Estimated Time**: 1 hour

**Phase 5 Total**: 7 hours

---

## 🔍 Phase 6: Conflict Detection Integration

**Goal**: Integrate real-time conflict detection into the unified request flow.

### 6.1 Complete Conflict Detection Service
- [x] Service layer created (`conflict-detection-service.ts`)
- [ ] Test crew availability calculations (Captain vs FO)
- [ ] Test overlapping request detection
- [ ] Test late submission flagging
- [ ] Verify threshold warnings (< 10 crew)

**Estimated Time**: 1 hour

### 6.2 Integrate into Unified Request Service
- [ ] Add conflict check to `createPilotRequest()`
- [ ] Add conflict check to `updatePilotRequestStatus()`
- [ ] Update `conflict_flags` JSONB field
- [ ] Update `availability_impact` JSONB field
- [ ] Test conflict detection on create
- [ ] Test conflict detection on approve/deny

**Estimated Time**: 2 hours

### 6.3 Update Conflict Alert Component
- [x] Component created (`conflict-alert.tsx`)
- [ ] Test with different conflict severities
- [ ] Add visual conflict timeline
- [ ] Test conflict resolution suggestions
- [ ] Verify animation and styling

**Estimated Time**: 1 hour

### 6.4 Add Real-Time Conflict Checking
- [ ] Add conflict check API endpoint: `POST /api/requests/check-conflicts`
- [ ] Integrate with QuickEntryForm
- [ ] Show real-time warnings during form entry
- [ ] Test conflict detection performance
- [ ] Add debouncing for date changes

**Estimated Time**: 2 hours

### 6.5 Integration Testing
- [ ] Test conflict scenarios (captain shortage, FO shortage)
- [ ] Test overlapping requests (2+ pilots, same dates)
- [ ] Test seniority-based resolution
- [ ] Verify conflict alerts display correctly
- [ ] Test conflict resolution workflows

**Estimated Time**: 1 hour

**Phase 6 Total**: 7 hours

---

## 👨‍✈️ Phase 7: Pilot Portal Form Updates

**Goal**: Update pilot portal forms to use the unified request API.

### 7.1 Update Leave Request Form
- [ ] Update `/portal/leave-request/page.tsx`
- [ ] Change API call to use `/api/requests` (POST)
- [ ] Update validation to match unified schema
- [ ] Add real-time conflict checking
- [ ] Test submission workflow
- [ ] Verify success redirects to request list

**Estimated Time**: 1.5 hours

### 7.2 Update Flight Request Form
- [ ] Update `/portal/flight-request/page.tsx`
- [ ] Change API call to use `/api/requests` (POST)
- [ ] Update validation for flight-specific fields
- [ ] Add real-time conflict checking
- [ ] Test submission workflow
- [ ] Verify success redirects to request list

**Estimated Time**: 1.5 hours

### 7.3 Update Leave Bid Form
- [ ] Update `/portal/leave-bids/page.tsx`
- [ ] Integrate with roster periods
- [ ] Change API to use unified request system
- [ ] Test annual leave bid submission
- [ ] Verify multi-period bid handling

**Estimated Time**: 1 hour

### 7.4 Update Pilot Request List View
- [ ] Show all request types in single list
- [ ] Add filter by category (LEAVE, FLIGHT, BID)
- [ ] Add status badges
- [ ] Test pagination
- [ ] Test mobile responsiveness

**Estimated Time**: 1 hour

### 7.5 Integration Testing
- [ ] Test end-to-end leave request submission
- [ ] Test end-to-end flight request submission
- [ ] Test end-to-end leave bid submission
- [ ] Verify pilot notifications
- [ ] Test mobile workflows

**Estimated Time**: 1 hour

**Phase 7 Total**: 6 hours

---

## 🧪 Phase 8: E2E Testing & Deployment Prep

**Goal**: Complete comprehensive E2E testing and prepare for production deployment.

### 8.1 Complete E2E Test Suite
- [ ] Write `e2e/requests.spec.ts` (CRUD operations)
- [ ] Write `e2e/roster-periods.spec.ts` (period management)
- [ ] Write `e2e/deadline-alerts.spec.ts` (alert system)
- [ ] Write `e2e/conflict-detection.spec.ts` (conflict scenarios)
- [ ] Write `e2e/bulk-operations.spec.ts` (bulk approve/deny)
- [ ] Write `e2e/reports.spec.ts` (PDF generation, email)
- [ ] Run full test suite: `npm test`

**Estimated Time**: 4 hours

### 8.2 Fix Any Failing Tests
- [ ] Review test results
- [ ] Fix failing tests
- [ ] Re-run test suite
- [ ] Achieve 100% E2E test pass rate

**Estimated Time**: 2 hours

### 8.3 Load Testing
- [ ] Install load testing tool (Artillery or k6)
- [ ] Create load test scenarios
- [ ] Test API endpoints with 100 concurrent users
- [ ] Test bulk operations (100+ requests)
- [ ] Verify database performance
- [ ] Check rate limiting effectiveness

**Estimated Time**: 2 hours

### 8.4 Production Environment Setup
- [ ] Verify all environment variables in Vercel
- [ ] Configure cron job for deadline alerts (vercel.json)
- [ ] Set up Better Stack logging dashboard
- [ ] Configure email templates with branding
- [ ] Set up monitoring alerts

**Estimated Time**: 2 hours

### 8.5 Pre-Deployment Checklist
- [ ] Run `npm run validate` (type-check, lint, format)
- [ ] Run `npm run validate:naming`
- [ ] Run `npm run build` successfully
- [ ] Run `npm test` (100% pass rate)
- [ ] Review security headers in `next.config.js`
- [ ] Review RLS policies in Supabase
- [ ] Test PWA installation on mobile
- [ ] Review CLAUDE.md documentation

**Estimated Time**: 1 hour

### 8.6 Initial Deployment
- [ ] Deploy to Vercel production
- [ ] Run smoke tests on production URL
- [ ] Verify cron job execution
- [ ] Test email notifications
- [ ] Monitor logs for errors
- [ ] Verify PWA functionality

**Estimated Time**: 1 hour

**Phase 8 Total**: 12 hours

---

## 🎨 Phase 9: Aviation Design System Foundation (NEW)

**Goal**: Implement the aviation-themed design system to create a unique, memorable UI.

### 9.1 Create Design Foundation Files
- [ ] Create `lib/design/aviation-theme.ts` (design tokens)
- [ ] Add custom animations to `app/globals.css`
- [ ] Create `lib/design/animations.ts` (helper functions)
- [ ] Add aviation icon set (lucide-react + custom SVGs)
- [ ] Test design token imports

**Estimated Time**: 2 hours

### 9.2 Implement ControlTowerWidget Component
- [ ] Create `components/aviation/control-tower-widget.tsx`
- [ ] Add large metric numbers (48px font)
- [ ] Add color-coded status indicators
- [ ] Add gradient backgrounds
- [ ] Add animated count-up on load
- [ ] Add real-time refresh indicator
- [ ] Create Storybook story

**Estimated Time**: 3 hours

### 9.3 Implement BoardingPassCard Component
- [ ] Create `components/aviation/boarding-pass-card.tsx`
- [ ] Add perforated edge styling (dashed border)
- [ ] Add barcode aesthetic for request ID
- [ ] Add color-coded status stripe
- [ ] Add tear-off action buttons
- [ ] Add responsive mobile layout
- [ ] Create Storybook story

**Estimated Time**: 3 hours

### 9.4 Implement FlightPlanForm Component
- [ ] Create `components/aviation/flight-plan-form.tsx`
- [ ] Add sectioned layout with icons
- [ ] Add progress indicator (steps 1/2/3)
- [ ] Add "Clearance" submit button
- [ ] Add "Abort" cancel button
- [ ] Add auto-save draft functionality
- [ ] Create Storybook story

**Estimated Time**: 3 hours

### 9.5 Implement TurbulenceAlert Component
- [ ] Create `components/aviation/turbulence-alert.tsx`
- [ ] Add animated turbulence wave icon
- [ ] Add color-coded severity levels
- [ ] Add conflict timeline visualization
- [ ] Add "Request Clearance" override button
- [ ] Add sound effects (optional)
- [ ] Create Storybook story

**Estimated Time**: 2 hours

### 9.6 Implement CrewAvailabilityTimeline Component
- [ ] Create `components/aviation/crew-availability-timeline.tsx`
- [ ] Add horizontal timeline with date markers
- [ ] Add color-coded availability bars
- [ ] Add threshold line at 10 crew
- [ ] Add hover tooltips
- [ ] Add zoom controls
- [ ] Create Storybook story

**Estimated Time**: 3 hours

### 9.7 Implement DeadlineProgressRing Component
- [ ] Create `components/aviation/deadline-progress-ring.tsx`
- [ ] Add circular progress bar
- [ ] Add large central countdown
- [ ] Add milestone markers
- [ ] Add color transitions (blue → yellow → red)
- [ ] Add pulse animation when urgent
- [ ] Create Storybook story

**Estimated Time**: 2 hours

### 9.8 Component Testing
- [ ] Test all components in Storybook
- [ ] Test responsive behavior
- [ ] Test animations and interactions
- [ ] Test accessibility (keyboard nav, screen readers)
- [ ] Fix any bugs

**Estimated Time**: 2 hours

**Phase 9 Total**: 20 hours

---

## 🎯 Phase 10: Page Integration & Production Launch (NEW)

**Goal**: Integrate aviation components into pages and launch to production.

### 10.1 Update Dashboard Overview Page
- [ ] Replace generic stats with ControlTowerWidget
- [ ] Add aviation-themed layout
- [ ] Test responsive behavior
- [ ] Verify real-time updates

**Estimated Time**: 1 hour

### 10.2 Update Requests Dashboard Page
- [ ] Replace RequestsTable with BoardingPassCard list
- [ ] Replace DeadlineWidget with DeadlineProgressRing
- [ ] Update conflict alerts to TurbulenceAlert
- [ ] Add CrewAvailabilityTimeline
- [ ] Test all interactions

**Estimated Time**: 3 hours

### 10.3 Update Quick Entry Page
- [ ] Replace generic form with FlightPlanForm
- [ ] Add real-time conflict checking with TurbulenceAlert
- [ ] Test form submission workflow
- [ ] Verify validation and error handling

**Estimated Time**: 2 hours

### 10.4 Mobile Optimization
- [ ] Add bottom navigation bar (< 768px)
- [ ] Implement swipeable actions on cards
- [ ] Add collapsible filter panel
- [ ] Optimize touch targets (44px min)
- [ ] Test on iOS/Android devices
- [ ] Test PWA installation

**Estimated Time**: 4 hours

### 10.5 Accessibility Audit
- [ ] Run WAVE accessibility checker
- [ ] Test keyboard navigation flow
- [ ] Test with screen readers (NVDA, JAWS, VoiceOver)
- [ ] Verify color contrast (all combinations)
- [ ] Add missing ARIA labels
- [ ] Fix any violations

**Estimated Time**: 3 hours

### 10.6 Final Testing & QA
- [ ] Run full E2E test suite
- [ ] Manual testing on all browsers (Chrome, Safari, Firefox)
- [ ] Mobile device testing (iOS/Android)
- [ ] Performance testing (Lighthouse)
- [ ] Load testing (100+ concurrent users)
- [ ] Security scan

**Estimated Time**: 3 hours

### 10.7 Production Deployment
- [ ] Final `npm run validate`
- [ ] Final `npm run build`
- [ ] Deploy to Vercel production
- [ ] Verify cron job execution
- [ ] Test email notifications
- [ ] Monitor logs for 24 hours
- [ ] Gather initial user feedback

**Estimated Time**: 2 hours

### 10.8 Post-Launch Monitoring (Week 1)
- [ ] Monitor Better Stack logs daily
- [ ] Track email delivery rates
- [ ] Track user adoption metrics
- [ ] Address any critical issues
- [ ] Gather feedback from fleet manager
- [ ] Gather feedback from pilots

**Estimated Time**: 5 hours (spread over 7 days)

**Phase 10 Total**: 23 hours

---

## 📊 Total Time Estimates

| Phase | Description | Hours | Status |
|-------|-------------|-------|--------|
| **Phase 4** | Unified Requests Dashboard | 4 | In Progress |
| **Phase 5** | Advanced Reporting & PDF | 7 | Pending |
| **Phase 6** | Conflict Detection Integration | 7 | Pending |
| **Phase 7** | Pilot Portal Form Updates | 6 | Pending |
| **Phase 8** | E2E Testing & Deployment Prep | 12 | Pending |
| **Phase 9** | Aviation Design System | 20 | Pending |
| **Phase 10** | Page Integration & Launch | 23 | Pending |
| **TOTAL** | | **79 hours** | |

---

## 🎯 Current Priority: Phase 4

**Next Immediate Tasks**:
1. ✅ Fix `QuickEntryButton` props error (~15 min)
2. ✅ Complete requests table testing (~30 min)
3. ✅ Complete request filters testing (~30 min)
4. ✅ Test full dashboard integration (~1 hour)

**Expected Completion**: End of today (November 11, 2025)

---

## 📝 Notes

- **Phases 4-8** are critical path for production deployment
- **Phases 9-10** are enhancements that significantly improve UX
- Aviation design system can be implemented post-launch if needed
- Total project is **85% complete** (Phases 1-3 done)
- Estimated **79 hours** remaining to 100% completion
- With aviation design system: ~10-12 days of work
- Without aviation design system: ~5-6 days of work

---

**Status**: 📍 Currently on Phase 4.1 - Fixing build errors
**Next Milestone**: Complete Phase 4 by end of day

