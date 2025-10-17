# Fleet Management V2 - Comprehensive Work Plan

**Project**: B767 Fleet Management System Rebuild
**Version**: 2.0 (Modern Stack)
**Date**: October 17, 2025
**Status**: Planning Phase

---

## Executive Summary

This work plan outlines the complete rebuild of the B767 Pilot Management System from Next.js 14 to Next.js 15 with modern architecture, while preserving access to existing production data (27 pilots, 607 certifications, 34 check types).

### Key Objectives

1. **Modernize Stack**: Upgrade to Next.js 15 + React 19 + TypeScript 5.7
2. **Preserve Data**: Connect to existing Supabase database (wgdmgvonqysflwdiiols)
3. **Improve Architecture**: Implement cleaner service layer and component structure
4. **Enhance Performance**: Use Turbopack, optimized queries, and modern patterns
5. **Maintain Features**: Port all critical features from air-niugini-pms v1

### Success Criteria

- ✅ All 27 pilots and 607 certifications accessible
- ✅ Feature parity with air-niugini-pms v1
- ✅ Improved performance (faster builds, better UX)
- ✅ Modern codebase (easier to maintain and extend)
- ✅ Comprehensive testing (Playwright E2E)
- ✅ Production deployment to Vercel

---

## Phase 1: Foundation & Authentication (Week 1)

### 1.1 Authentication System

**Priority**: Critical
**Dependencies**: None
**Estimated Time**: 2-3 days

#### Tasks:
- [ ] Create authentication pages (login, signup, forgot password)
- [ ] Implement AuthContext with Supabase Auth
- [ ] Setup protected routes middleware
- [ ] Create role-based access control (admin/manager/user)
- [ ] Build user profile management
- [ ] Add session persistence and auto-refresh

#### Deliverables:
- `app/auth/login/page.tsx` - Login page
- `app/auth/signup/page.tsx` - Signup page
- `app/auth/forgot-password/page.tsx` - Password reset
- `lib/contexts/AuthContext.tsx` - Authentication context
- `middleware.ts` - Protected routes
- `lib/auth/permissions.ts` - Role-based permissions

#### Acceptance Criteria:
- Users can log in with email/password
- Sessions persist across page refreshes
- Protected routes redirect to login
- Admin/manager/user roles work correctly
- Password reset flow functional

---

### 1.2 Layout & Navigation

**Priority**: Critical
**Dependencies**: 1.1 Authentication
**Estimated Time**: 1-2 days

#### Tasks:
- [ ] Create dashboard layout with sidebar
- [ ] Build navigation menu with role-based items
- [ ] Add user profile dropdown
- [ ] Implement breadcrumb navigation
- [ ] Create mobile-responsive hamburger menu
- [ ] Add theme switcher (light/dark)

#### Deliverables:
- `app/dashboard/layout.tsx` - Dashboard layout
- `components/layout/Sidebar.tsx` - Navigation sidebar
- `components/layout/Header.tsx` - Top header
- `components/layout/Breadcrumb.tsx` - Breadcrumb nav
- `components/layout/MobileNav.tsx` - Mobile menu

#### Acceptance Criteria:
- Dashboard layout renders correctly
- Navigation items change based on user role
- Mobile menu works on small screens
- Dark mode toggle functions
- Breadcrumbs show current location

---

## Phase 2: Core Data Management (Week 2-3)

### 2.1 Pilot Management System

**Priority**: Critical
**Dependencies**: 1.1, 1.2
**Estimated Time**: 3-4 days

#### Tasks:
- [ ] Create pilot list view with search/filter
- [ ] Build pilot detail page
- [ ] Implement pilot create/edit forms
- [ ] Add pilot profile card component
- [ ] Create seniority number management
- [ ] Build captain qualifications editor
- [ ] Add contract type management
- [ ] Implement retirement age calculations

#### Deliverables:
- `app/dashboard/pilots/page.tsx` - Pilot list
- `app/dashboard/pilots/[id]/page.tsx` - Pilot detail
- `app/dashboard/pilots/new/page.tsx` - Create pilot
- `components/pilots/PilotCard.tsx` - Pilot profile card
- `components/pilots/PilotForm.tsx` - Pilot form
- `components/pilots/QualificationsEditor.tsx` - Qualifications
- `lib/services/pilot-service.ts` - Pilot CRUD service
- `lib/utils/retirement-calculator.ts` - Retirement logic

#### Acceptance Criteria:
- Can view all 27 pilots in list
- Can search/filter pilots by name, rank, status
- Can create new pilot records
- Can edit existing pilot information
- Can manage captain qualifications (line captain, training captain, examiner)
- Seniority numbers calculate correctly
- Retirement age displays accurately

---

### 2.2 Certification Tracking System

**Priority**: Critical
**Dependencies**: 2.1
**Estimated Time**: 4-5 days

#### Tasks:
- [ ] Create certifications list view
- [ ] Build certification calendar view
- [ ] Implement expiring certifications dashboard
- [ ] Add bulk certification updates
- [ ] Create certification timeline view
- [ ] Build expiry planning tools
- [ ] Implement FAA color coding (red/yellow/green)
- [ ] Add certification renewal reminders

#### Deliverables:
- `app/dashboard/certifications/page.tsx` - Cert list
- `app/dashboard/certifications/calendar/page.tsx` - Calendar view
- `app/dashboard/certifications/expiry-planning/page.tsx` - Planning
- `app/dashboard/certifications/bulk/page.tsx` - Bulk updates
- `app/dashboard/pilots/[id]/certifications/page.tsx` - Pilot certs
- `app/dashboard/pilots/[id]/certifications/timeline/page.tsx` - Timeline
- `components/certifications/CertCard.tsx` - Cert card
- `components/certifications/ExpiryAlert.tsx` - Expiry alert
- `components/certifications/BulkEditor.tsx` - Bulk editor
- `lib/services/certification-service.ts` - Cert CRUD service
- `lib/utils/certification-status.ts` - Status logic

#### Acceptance Criteria:
- Can view all 607 certifications
- Can filter by pilot, check type, expiry status
- Calendar view shows all upcoming renewals
- Bulk updates work for multiple certifications
- Color coding matches FAA standards (red <0 days, yellow ≤30 days, green >30 days)
- Expiring certifications highlighted (30/60/90 days)

---

### 2.3 Leave Request Management

**Priority**: High
**Dependencies**: 2.1
**Estimated Time**: 3-4 days

#### Tasks:
- [ ] Create leave request form
- [ ] Build leave request list/calendar
- [ ] Implement 28-day roster period logic
- [ ] Add leave eligibility calculator (rank-separated)
- [ ] Create leave approval workflow
- [ ] Build roster planning dashboard
- [ ] Implement minimum crew validation (10 captains, 10 FOs)
- [ ] Add seniority-based prioritization

#### Deliverables:
- `app/dashboard/leave/page.tsx` - Leave list
- `app/dashboard/leave/calendar/page.tsx` - Leave calendar
- `app/dashboard/leave/roster-planning/page.tsx` - Roster planning
- `components/leave/LeaveForm.tsx` - Leave request form
- `components/leave/LeaveCalendar.tsx` - Calendar view
- `components/leave/EligibilityAlert.tsx` - Eligibility alert
- `components/leave/FinalReviewAlert.tsx` - Final review (22 days before)
- `lib/services/leave-service.ts` - Leave CRUD service
- `lib/services/leave-eligibility-service.ts` - Eligibility logic
- `lib/utils/roster-utils.ts` - Roster period calculations

#### Acceptance Criteria:
- Leave requests tied to 28-day roster periods
- Roster period auto-calculates (RP1-RP13 annual cycle)
- Captains and First Officers evaluated separately
- Minimum crew validation (10 per rank)
- Seniority-based approval (lower number = higher priority)
- Eligibility alert shows when 2+ pilots request same dates
- Final review alert appears 22 days before next roster

---

## Phase 3: Advanced Features (Week 4-5)

### 3.1 Compliance Dashboard

**Priority**: High
**Dependencies**: 2.2
**Estimated Time**: 2-3 days

#### Tasks:
- [ ] Build fleet compliance summary dashboard
- [ ] Create compliance metrics cards
- [ ] Implement expiry statistics charts
- [ ] Add pilot compliance reports
- [ ] Create category-based compliance views
- [ ] Build warning/alert system

#### Deliverables:
- `app/dashboard/page.tsx` - Main dashboard (enhanced)
- `components/dashboard/ComplianceCard.tsx` - Compliance metrics
- `components/dashboard/ExpiryChart.tsx` - Expiry charts
- `components/dashboard/AlertPanel.tsx` - Alerts
- `lib/services/dashboard-service.ts` - Dashboard data service
- `lib/services/analytics-service.ts` - Analytics processing

#### Acceptance Criteria:
- Dashboard shows fleet-wide compliance percentage
- Metrics display: total pilots, active, captains, FOs, examiners, training captains
- Charts show expiring certifications by category
- Alerts highlight critical/warning/expiring items
- Real-time updates when data changes

---

### 3.2 Documents & Forms Management

**Priority**: Medium
**Dependencies**: 2.1
**Estimated Time**: 2 days

#### Tasks:
- [ ] Create document upload system
- [ ] Build document library browser
- [ ] Implement digital forms system
- [ ] Add form version control
- [ ] Create document categories

#### Deliverables:
- `app/dashboard/documents/page.tsx` - Document library
- `app/dashboard/forms/page.tsx` - Digital forms
- `components/documents/DocumentUploader.tsx` - Upload
- `components/documents/DocumentGrid.tsx` - Document grid
- `components/forms/FormBuilder.tsx` - Form builder
- `lib/services/document-service.ts` - Document service

#### Acceptance Criteria:
- Can upload PDF, DOCX, images
- Documents categorized by type
- Forms can be filled and submitted
- Version history tracked

---

### 3.3 Flight Requests System

**Priority**: Medium
**Dependencies**: 2.1
**Estimated Time**: 2 days

#### Tasks:
- [ ] Create flight request form
- [ ] Build flight request list
- [ ] Implement approval workflow
- [ ] Add status tracking
- [ ] Create request notifications

#### Deliverables:
- `app/dashboard/flight-requests/page.tsx` - Flight requests
- `components/flight-requests/RequestForm.tsx` - Request form
- `components/flight-requests/RequestCard.tsx` - Request card
- `lib/services/flight-request-service.ts` - Request service

#### Acceptance Criteria:
- Pilots can submit flight requests
- Admins can approve/deny requests
- Status updates notify pilots
- Request history tracked

---

### 3.4 Disciplinary Actions System

**Priority**: Medium
**Dependencies**: 2.1
**Estimated Time**: 2-3 days

#### Tasks:
- [ ] Create disciplinary action form
- [ ] Build disciplinary record list
- [ ] Implement warning level system
- [ ] Add escalation automation
- [ ] Create pilot warning history view
- [ ] Build document attachment system

#### Deliverables:
- `app/dashboard/disciplinary/page.tsx` - Disciplinary list
- `app/dashboard/disciplinary/new/page.tsx` - Create action
- `app/dashboard/disciplinary/[id]/page.tsx` - Action detail
- `components/disciplinary/ActionForm.tsx` - Action form
- `components/disciplinary/WarningHistory.tsx` - Warning history
- `lib/services/disciplinary-service.ts` - Disciplinary service

#### Acceptance Criteria:
- Can record disciplinary actions
- Warning levels escalate automatically
- Documents can be attached
- Pilot warning history visible
- Expiry dates tracked

---

## Phase 4: Reports & Analytics (Week 6)

### 4.1 PDF Report Generation

**Priority**: Medium
**Dependencies**: 2.1, 2.2, 2.3
**Estimated Time**: 2-3 days

#### Tasks:
- [ ] Setup @react-pdf/renderer
- [ ] Create pilot report PDF template
- [ ] Build certification report template
- [ ] Implement fleet compliance report
- [ ] Add leave summary report
- [ ] Create custom report builder

#### Deliverables:
- `lib/pdf/pilot-report.tsx` - Pilot PDF template
- `lib/pdf/certification-report.tsx` - Cert PDF template
- `lib/pdf/fleet-report.tsx` - Fleet PDF template
- `lib/pdf/leave-report.tsx` - Leave PDF template
- `lib/services/pdf-service.ts` - PDF generation service
- `components/reports/ReportGenerator.tsx` - Report UI

#### Acceptance Criteria:
- Can generate pilot summary PDFs
- Can export certification lists to PDF
- Fleet compliance report downloadable
- Leave summaries exportable
- Reports properly formatted and branded

---

### 4.2 Analytics Dashboard

**Priority**: Low
**Dependencies**: 2.1, 2.2, 2.3
**Estimated Time**: 2 days

#### Tasks:
- [ ] Create advanced analytics page
- [ ] Build trend analysis charts
- [ ] Implement predictive analytics
- [ ] Add historical data comparison
- [ ] Create custom metric builder

#### Deliverables:
- `app/dashboard/analytics/page.tsx` - Basic analytics
- `app/dashboard/analytics/advanced/page.tsx` - Advanced analytics
- `components/analytics/TrendChart.tsx` - Trend charts
- `components/analytics/PredictiveChart.tsx` - Predictions
- `lib/services/analytics-service.ts` - Analytics service

#### Acceptance Criteria:
- Charts show certification trends over time
- Predictive analytics for expiry forecasting
- Historical comparisons (month-over-month, year-over-year)
- Custom metrics can be created

---

## Phase 5: Admin & System Management (Week 7)

### 5.1 Admin Dashboard

**Priority**: Medium
**Dependencies**: 1.1, 2.1
**Estimated Time**: 2 days

#### Tasks:
- [ ] Create admin system overview
- [ ] Build user management interface
- [ ] Implement role assignment
- [ ] Add pilot registration approval
- [ ] Create feedback moderation
- [ ] Build system settings panel

#### Deliverables:
- `app/dashboard/admin/page.tsx` - Admin overview
- `app/dashboard/admin/system/page.tsx` - System settings
- `app/dashboard/admin/pilot-registrations/page.tsx` - Registrations
- `app/dashboard/admin/feedback-moderation/page.tsx` - Feedback
- `components/admin/UserTable.tsx` - User management
- `components/admin/SettingsForm.tsx` - Settings form
- `lib/services/admin-service.ts` - Admin service

#### Acceptance Criteria:
- Admins can manage system users
- Can approve/deny pilot registrations
- Can moderate feedback submissions
- System settings configurable (roster period, retirement age, etc.)

---

### 5.2 Audit Log System

**Priority**: Low
**Dependencies**: All CRUD operations
**Estimated Time**: 1-2 days

#### Tasks:
- [ ] Create audit log viewer
- [ ] Implement audit log detail view
- [ ] Add audit log filtering
- [ ] Build audit trail for all CRUD operations
- [ ] Create automated audit cleanup

#### Deliverables:
- `app/dashboard/audit/page.tsx` - Audit log list
- `app/dashboard/audit/[id]/page.tsx` - Audit detail
- `components/audit/AuditTable.tsx` - Audit table
- `lib/services/audit-service.ts` - Audit service
- `lib/utils/audit-logger.ts` - Audit logging utility

#### Acceptance Criteria:
- All CRUD operations logged
- Audit logs filterable by entity, action, user, date
- Audit detail shows old/new values
- Automated cleanup (90 days)

---

## Phase 6: Testing & Quality Assurance (Week 8)

### 6.1 E2E Testing

**Priority**: High
**Dependencies**: All features
**Estimated Time**: 3-4 days

#### Tasks:
- [ ] Setup Playwright testing framework
- [ ] Write authentication flow tests
- [ ] Create pilot management tests
- [ ] Build certification tracking tests
- [ ] Implement leave request tests
- [ ] Add compliance dashboard tests
- [ ] Create admin function tests

#### Deliverables:
- `e2e/auth.spec.ts` - Auth tests
- `e2e/pilots.spec.ts` - Pilot tests
- `e2e/certifications.spec.ts` - Certification tests
- `e2e/leave.spec.ts` - Leave tests
- `e2e/dashboard.spec.ts` - Dashboard tests
- `e2e/admin.spec.ts` - Admin tests
- `playwright.config.ts` - Playwright config (already exists)

#### Acceptance Criteria:
- All critical user flows tested
- Tests pass consistently
- Coverage >80% for critical paths
- CI/CD integration ready

---

### 6.2 Performance Optimization

**Priority**: Medium
**Dependencies**: All features
**Estimated Time**: 1-2 days

#### Tasks:
- [ ] Implement code splitting for large components
- [ ] Add lazy loading for charts and heavy components
- [ ] Optimize database queries
- [ ] Implement caching strategies
- [ ] Run Lighthouse audits
- [ ] Fix performance bottlenecks

#### Deliverables:
- `components/lazy/LazyChart.tsx` - Lazy loaded charts
- `lib/services/cache-service.ts` - Caching service
- Performance report with Lighthouse scores

#### Acceptance Criteria:
- Lighthouse score >90 for performance
- First Contentful Paint <1.5s
- Time to Interactive <3s
- Large components lazy loaded

---

## Phase 7: Deployment & Monitoring (Week 9)

### 7.1 Production Deployment

**Priority**: Critical
**Dependencies**: 6.1, 6.2
**Estimated Time**: 1 day

#### Tasks:
- [ ] Configure Vercel deployment
- [ ] Setup environment variables
- [ ] Configure custom domain (if applicable)
- [ ] Setup CI/CD pipeline
- [ ] Implement health checks
- [ ] Add error tracking (Sentry or similar)

#### Deliverables:
- `vercel.json` - Vercel configuration
- `.github/workflows/ci.yml` - GitHub Actions workflow
- Production URL with live application

#### Acceptance Criteria:
- Application deployed to Vercel
- Environment variables configured
- CI/CD pipeline runs on push
- Health checks functional
- Error tracking active

---

### 7.2 Monitoring & Maintenance

**Priority**: High
**Dependencies**: 7.1
**Estimated Time**: Ongoing

#### Tasks:
- [ ] Setup performance monitoring
- [ ] Configure error tracking
- [ ] Create incident response plan
- [ ] Document deployment process
- [ ] Create maintenance checklist

#### Deliverables:
- Monitoring dashboard
- Error tracking configured
- `DEPLOYMENT.md` - Deployment guide
- `MAINTENANCE.md` - Maintenance checklist

#### Acceptance Criteria:
- Real-time performance metrics
- Error notifications configured
- Deployment process documented
- Maintenance schedule established

---

## Service Layer Architecture

### Critical Services to Implement

Based on air-niugini-pms CLAUDE.md, these services are MANDATORY:

1. **pilot-service.ts** - Pilot CRUD operations
2. **certification-service.ts** - Certification CRUD
3. **leave-service.ts** - Leave request CRUD
4. **leave-eligibility-service.ts** - Complex eligibility logic
5. **expiring-certifications-service.ts** - Certification expiry logic
6. **dashboard-service.ts** - Dashboard statistics
7. **analytics-service.ts** - Analytics processing
8. **pdf-service.ts** - PDF generation
9. **cache-service.ts** - Performance caching
10. **audit-service.ts** - Audit logging

### Service Layer Rules

**CRITICAL**: Never make direct database calls in API routes. Always use service functions.

```typescript
// ✅ CORRECT
// app/api/pilots/route.ts
import { getPilots } from '@/lib/services/pilot-service';
export async function GET() {
  const pilots = await getPilots();
  return NextResponse.json({ success: true, data: pilots });
}

// ❌ WRONG
// app/api/pilots/route.ts
const { data } = await supabase.from('pilots').select('*');
```

---

## Database Integration

### Existing Database Schema

**Connected to production**: `wgdmgvonqysflwdiiols`

#### Main Tables:
- `pilots` (27 records) - Pilot information
- `pilot_checks` (607 records) - Certifications
- `check_types` (34 records) - Check type definitions
- `leave_requests` (0 records) - Leave requests
- `an_users` (0 records) - System users
- `contract_types` (3 records) - Contract types
- `digital_forms` - Digital form definitions
- `disciplinary_actions` - Disciplinary records
- `disciplinary_action_documents` - Action documents
- `flight_requests` - Flight request records

#### Database Views:
- `expiring_checks` - Simplified expiring certifications
- `detailed_expiring_checks` - Detailed expiring certifications
- `compliance_dashboard` - Fleet compliance metrics
- `pilot_report_summary` - Comprehensive pilot summaries
- `captain_qualifications_summary` - Captain qualifications
- `dashboard_metrics` - Dashboard statistics

#### Database Functions:
- `calculate_years_to_retirement()`
- `calculate_years_in_service()`
- `get_fleet_compliance_summary()`
- `get_fleet_expiry_statistics()`
- `get_pilot_dashboard_metrics()`
- `get_monthly_expiry_data()`
- `check_training_currency()`

### TypeScript Types

**Already generated**: `types/supabase.ts` (2000+ lines)

---

## Critical Business Rules

From air-niugini-pms CLAUDE.md:

### 1. Roster Periods
- 28-day cycles (RP1-RP13 annual cycle)
- Known anchor: RP12/2025 starts 2025-10-11
- After RP13/YYYY → RP1/(YYYY+1)
- All leave requests within roster period boundaries

### 2. Certification Compliance
- FAA color coding: Red (expired), Yellow (≤30 days), Green (>30 days)
- Critical alerts for expired certifications
- Warning alerts for expiring soon (≤60 days)

### 3. Leave Eligibility
- **Rank-separated logic**: Captains and First Officers evaluated independently
- **Minimum crew**: 10 Captains AND 10 First Officers (per rank)
- **Priority**: Seniority number (1 = most senior) → Request submission date
- **Approval logic**:
  - Solo request: Approve if remaining ≥ 10
  - Multiple requests: Approve all if remaining ≥ 10, else approve by seniority
- **Final Review Alert**: Shows 22 days before next roster (only when pendingCount > 0)
- **Eligibility Alert**: Shows when 2+ pilots of same rank request same dates

### 4. Captain Qualifications
- Line Captain
- Training Captain
- Examiner
- RHS Captain Expiry tracking
- JSONB storage for flexible tracking

### 5. Seniority System
- Based on `commencement_date`
- Lower seniority number = higher priority
- Unique seniority numbers (1-27)

---

## Technology Stack Comparison

| Feature | air-niugini-pms (v1) | fleet-management-v2 (v2) |
|---------|---------------------|-------------------------|
| Next.js | 14.2.33 | 15.5.4 |
| React | 18.3.1 | 19.1.0 |
| TypeScript | 5.9.2 | 5.7.3 |
| Build System | Webpack | Turbopack |
| Tailwind CSS | 3.4.17 | 4.1.0 |
| TanStack Query | 5.90.2 | 5.90.2 |
| React Hook Form | 7.63.0 | 7.63.0 |
| Zod | 4.1.11 | 4.1.11 |
| Supabase | 2.47.10 | 2.47.10 |
| PWA | next-pwa 5.6.0 | TBD |
| PDF | @react-pdf/renderer 4.3.1 | TBD |
| Charts | Chart.js 4.5.0 | TBD |
| Testing | Playwright 1.55.1 + Jest 29.7.0 | Playwright 1.55.0 |

---

## Risk Assessment

### High Risk Items

1. **Data Migration**: Data already exists in Supabase, but schema may need adjustments
   - **Mitigation**: Use existing schema, add migrations only if needed

2. **Complex Business Logic**: Leave eligibility rules are intricate
   - **Mitigation**: Port existing `leave-eligibility-service.ts` carefully, add comprehensive tests

3. **Performance**: Need to maintain or improve performance with new stack
   - **Mitigation**: Use Turbopack, lazy loading, code splitting, caching

### Medium Risk Items

1. **PWA Support**: next-pwa may not work with Next.js 15
   - **Mitigation**: Research alternatives or wait for compatibility

2. **PDF Generation**: @react-pdf/renderer compatibility with React 19
   - **Mitigation**: Test early, find alternatives if needed

### Low Risk Items

1. **Authentication**: Supabase Auth works with Next.js 15
2. **Database**: TypeScript types already generated
3. **UI Components**: shadcn/ui fully compatible

---

## Success Metrics

### Quantitative Metrics

- [ ] **Performance**: Lighthouse score >90
- [ ] **Test Coverage**: E2E coverage >80% for critical paths
- [ ] **Build Time**: Production build <2 minutes
- [ ] **Page Load**: First Contentful Paint <1.5s
- [ ] **Data Integrity**: 100% of existing data accessible

### Qualitative Metrics

- [ ] **User Experience**: Improved over v1 (faster, cleaner UI)
- [ ] **Code Quality**: Modern patterns, better maintainability
- [ ] **Developer Experience**: Faster dev builds with Turbopack
- [ ] **Documentation**: Comprehensive guides for all features

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| 1. Foundation & Auth | Week 1 (5 days) | Authentication, Layout, Navigation |
| 2. Core Data | Week 2-3 (10 days) | Pilots, Certifications, Leave |
| 3. Advanced Features | Week 4-5 (10 days) | Compliance, Documents, Flight Requests, Disciplinary |
| 4. Reports & Analytics | Week 6 (5 days) | PDF Reports, Analytics |
| 5. Admin & System | Week 7 (5 days) | Admin Dashboard, Audit Logs |
| 6. Testing & QA | Week 8 (5 days) | E2E Tests, Performance Optimization |
| 7. Deployment | Week 9 (3 days) | Production Deployment, Monitoring |

**Total Estimated Time**: 9 weeks (45 days)

---

## Next Steps

1. **Create Feature Branch**: Create `feature/v2-rebuild` branch
2. **Setup Worktree**: Use Git worktree for isolated development
3. **Start Phase 1**: Begin with authentication system
4. **Iterate**: Complete each phase systematically
5. **Test Continuously**: Run tests after each major feature
6. **Deploy**: Push to production after Phase 7

---

## Appendix: Key Files from air-niugini-pms

### Service Layer Files to Port
- `src/lib/pilot-service.ts`
- `src/lib/leave-service.ts`
- `src/lib/leave-eligibility-service.ts`
- `src/lib/expiring-certifications-service.ts`
- `src/lib/dashboard-service.ts`
- `src/lib/analytics-service.ts`
- `src/lib/pdf-data-service.ts`
- `src/lib/cache-service.ts`

### Utility Files to Port
- `src/lib/roster-utils.ts` (28-day roster period logic)
- `src/lib/certification-utils.ts` (FAA color coding)
- `src/lib/auth-utils.ts` (permissions)

### Component Patterns to Follow
- `src/components/pilots/` - Pilot components
- `src/components/certifications/` - Certification components
- `src/components/leave/` - Leave components
- `src/components/dashboard/` - Dashboard widgets

---

**Document Version**: 1.0
**Last Updated**: October 17, 2025
**Author**: Claude Code (Compounding Engineering Workflow)
