# Tasks: Missing Core Features

**Input**: Design documents from `/specs/001-missing-core-features/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure) ✅ COMPLETE

**Purpose**: Project initialization and basic structure

- [x] T001 Install required dependencies per package.json (@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities)
- [x] T002 [P] Configure TypeScript strict mode settings in tsconfig.json (already configured)
- [x] T003 [P] Setup ESLint and Prettier configurations (already configured)

---

## Phase 2: Foundational (Blocking Prerequisites) ✅ COMPLETE

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**✅ COMPLETE**: All foundational infrastructure is deployed and ready

### Database Schema ✅

- [x] T004 Create database migration file: supabase/migrations/20251022153333_add_missing_core_features.sql (DEPLOYED)
- [x] T005 Add utility functions to migration: update_updated_at_column() and audit_log_trigger() (DEPLOYED)
- [x] T006 [P] Create pilot_registrations table with RLS policies and triggers (DEPLOYED as pilot_users enhancement)
- [x] T007 [P] Create pilot_notifications table with RLS policies and indexes (DEPLOYED as notifications table)
- [x] T008 [P] Create feedback_categories table with RLS policies and seed data (DEPLOYED - 6 categories)
- [x] T009 Create feedback_posts table with RLS policies, triggers, and indexes (DEPLOYED)
- [x] T010 Create feedback_comments table with RLS policies, triggers, and indexes (DEPLOYED)
- [x] T011 [P] Create flight_requests table with RLS policies, triggers, and indexes (DEPLOYED - 1 record exists)
- [x] T012 [P] Create tasks table with RLS policies, triggers (status, completed_at), and indexes (DEPLOYED - 2 records exist)
- [x] T013 [P] Create disciplinary_actions table with RLS policies, triggers, and indexes (DEPLOYED - disciplinary_matters + disciplinary_actions)
- [x] T014 Create disciplinary_actions_log table with RLS policies and indexes (DEPLOYED as disciplinary_audit_log)
- [x] T015 [P] Create audit_logs table with RLS policies and indexes (DEPLOYED - 28 audit records)
- [x] T016 Apply audit triggers to existing tables: pilot_checks, leave_requests (DEPLOYED)
- [x] T017 Apply audit triggers to new tables: flight_requests, tasks, disciplinary_actions (DEPLOYED)
- [x] T018 Deploy migration to Supabase production database (COMPLETE - verified via Supabase MCP)
- [x] T019 Generate TypeScript types: npm run db:types → types/supabase.ts (COMPLETE - 4,530 lines)
- [x] T020 Verify migration with validation queries from data-model.md (VERIFIED - all tables exist with data)

### Shared Validation Schemas ✅

- [x] T021 [P] Create lib/validations/pilot-portal-schema.ts with LoginSchema and RegistrationSchema (COMPLETE)
- [x] T022 [P] Create lib/validations/flight-request-schema.ts with FlightRequestSchema (COMPLETE)
- [x] T023 [P] Create lib/validations/task-schema.ts with TaskInputSchema and TaskUpdateSchema (COMPLETE)
- [x] T024 [P] Create lib/validations/disciplinary-schema.ts with MatterSchema and ActionSchema (COMPLETE)
- [x] T025 [P] Create lib/validations/feedback-schema.ts with PostSchema and CommentSchema (COMPLETE)

### Shared Error Handling ✅

- [x] T026 Add new error messages to lib/utils/error-messages.ts (COMPLETE - 773 lines with all new features)
- [x] T027 Update lib/utils/constraint-error-handler.ts (COMPLETE - all new constraints covered)

**✅ CHECKPOINT PASSED**: Foundation 100% ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Pilot Portal Authentication & Dashboard (Priority: P1) 🎯 MVP

**Goal**: Enable pilots to log into their own portal and view their dashboard with certification status and leave balance.

**Independent Test**: Create pilot account, log in with email/password, view dashboard showing certifications and leave requests.

### Service Layer (US1) ✅

- [x] T028 [P] [US1] Create lib/services/pilot-portal-service.ts with getPilotByUserId(), getPilotDashboardData() (COMPLETE - 14.5KB)
- [x] T029 [P] [US1] Create lib/services/pilot-notification-service.ts with createNotification(), getUnreadNotifications(), markAsRead() (COMPLETE - 13.3KB)

### API Routes (US1) ✅

- [x] T030 [P] [US1] Create app/api/pilot/login/route.ts (POST) - Supabase Auth login
- [x] T031 [P] [US1] Create app/api/pilot/logout/route.ts (POST) - Session termination
- [x] T032 [P] [US1] Create app/api/pilot/register/route.ts (POST) - Registration submission
- [x] T033 [P] [US1] Create app/api/pilot/notifications/route.ts (GET) - Fetch notifications
- [x] T034 [P] [US1] Create app/api/pilot/notifications/[id]/route.ts (PATCH) - Mark as read

### UI Pages (US1) ✅

- [x] T035 [US1] Create app/pilot/login/page.tsx - Server Component with login form
- [x] T036 [US1] Create app/pilot/register/page.tsx - Server Component with registration form
- [x] T037 [US1] Create app/pilot/dashboard/page.tsx - Server Component fetching dashboard data
- [x] T038 [US1] Create app/pilot/notifications/page.tsx - Server Component with notification list

### UI Components (US1) ✅

- [x] T039 [P] [US1] Create components/pilot/PilotLoginForm.tsx - Client Component with form validation
- [x] T040 [P] [US1] Create components/pilot/PilotRegisterForm.tsx - Client Component with registration form
- [x] T041 [P] [US1] Create components/pilot/PilotDashboardContent.tsx - Client Component with dashboard widgets
- [x] T042 [P] [US1] Create components/pilot/NotificationList.tsx - Client Component with notification cards
- [x] T043 [P] [US1] Create components/pilot/NotificationBell.tsx - Client Component with real-time updates

### Middleware & Auth (US1) ✅

- [x] T044 [US1] Update middleware.ts to add pilot role routing (COMPLETE - lib/supabase/middleware.ts:100-154)
- [x] T045 [US1] Add role field to an_users table or use Supabase user metadata for pilot role (COMPLETE - Uses existing pilot_users.registration_approved and an_users.role fields)

**✅ CHECKPOINT PASSED**: User Story 1 complete (18/18 tasks) - Pilots can log in, view dashboard with certifications/leave stats, and receive notifications. All API routes, UI pages, components, and middleware fully implemented and testable.

---

## Phase 4: User Story 2 - Pilot Leave Request Submission (Priority: P1) 🎯 MVP

**Goal**: Enable pilots to submit leave requests for specific roster periods with eligibility validation.

**Independent Test**: Log in as pilot, navigate to /pilot/leave, select roster period, choose dates, submit request. Admin can approve/deny using existing /dashboard/leave page.

### Service Layer (US2) ✅

- [x] T046 [US2] Create lib/services/pilot-leave-service.ts with submitLeaveRequest(), getPilotLeaveRequests(), checkLeaveEligibility() (COMPLETE - 7.3KB service file)

### API Routes (US2) ✅

- [x] T047 [P] [US2] Create app/api/pilot/leave/route.ts (GET, POST) - Fetch and submit leave requests (COMPLETE - app/api/pilot/leave/route.ts + [id]/route.ts)
- [x] T048 [P] [US2] Update existing app/api/leave-requests/route.ts to include pilot-submitted requests in admin view (COMPLETE - Already includes all requests via getAllLeaveRequests)

### UI Pages (US2) ✅

- [x] T049 [US2] Create app/pilot/leave/page.tsx - Server Component with leave request form and list (COMPLETE - Full page with stats grid)

### UI Components (US2) ✅

- [x] T050 [P] [US2] Create components/pilot/LeaveBidModal.tsx - Client Component with calendar and date selection (COMPLETE - Modal with roster period display)
- [x] T051 [P] [US2] Create components/pilot/LeaveRequestForm.tsx - Client Component with roster period selector (COMPLETE - React Hook Form with validation)
- [x] T052 [P] [US2] Create components/pilot/LeaveEligibilityIndicator.tsx - Client Component showing Red/Yellow/Green status (COMPLETE - Color-coded status indicator)
- [x] T053 [P] [US2] Create components/pilot/LeaveRequestsList.tsx - Client Component with request history (COMPLETE - List with cancel functionality)

### Integration (US2) ✅

- [x] T054 [US2] Reuse existing lib/utils/roster-utils.ts for roster period boundaries validation (COMPLETE - Verified 22KB utility file exists and integrated)
- [x] T055 [US2] Reuse existing lib/services/leave-eligibility-service.ts for rank-separated checking (COMPLETE - Verified 42KB service file exists with rank-separated logic)

**✅ CHECKPOINT PASSED**: User Story 2 complete (10/10 tasks) - Pilots can submit leave requests with validation, view request history, cancel pending requests, and see stats. Admin view automatically includes pilot-submitted requests. All routes, pages, and components fully implemented and testable.

---

## Phase 5: User Story 3 - Flight Request Submission & Admin Review (Priority: P1) 🎯 MVP

**Goal**: Enable pilots to submit flight requests and admins to review/approve them.

**Independent Test**: Pilot submits flight request via /pilot/flight-requests, admin reviews/approves via /dashboard/flight-requests, pilot sees updated status.

### Service Layer (US3) ✅

- [x] T056 [P] [US3] Create lib/services/flight-request-service.ts with submitFlightRequest(), getFlightRequestsByPilot(), getAllFlightRequests(), reviewFlightRequest() (COMPLETE - Admin service with review, stats, filtering. Pilot service pre-existing at pilot-flight-service.ts)

### API Routes (US3) ✅

- [x] T057 [P] [US3] Create app/api/pilot/flight-requests/route.ts (GET, POST) - Fetch and submit requests (COMPLETE - app/api/pilot/flight-requests/route.ts + [id]/route.ts for DELETE)
- [x] T058 [P] [US3] Create app/api/dashboard/flight-requests/route.ts (GET) - Admin list view (COMPLETE - With filtering and stats endpoint)
- [x] T059 [P] [US3] Create app/api/dashboard/flight-requests/[id]/route.ts (GET, PATCH) - Admin review (COMPLETE - Full review workflow with validation)

### UI Pages (US3) ✅

- [x] T060 [US3] Create app/pilot/flight-requests/page.tsx - Pilot request list and submission (COMPLETE - With 5-stat grid and integrated form/list)
- [x] T061 [US3] Create app/dashboard/flight-requests/page.tsx - Admin review dashboard (COMPLETE - With status stats and type breakdown)

### UI Components (US3) ✅

- [x] T062 [P] [US3] Create components/pilot/FlightRequestForm.tsx - Client Component with route, dates, reason (COMPLETE - React Hook Form with 4 request types and validation)
- [x] T063 [P] [US3] Create components/pilot/FlightRequestsList.tsx - Client Component with request history (COMPLETE - With status badges and cancel functionality)
- [x] T064 [P] [US3] Create components/admin/FlightRequestsTable.tsx - Client Component with admin view (COMPLETE - With filtering tabs and review modal integration)
- [x] T065 [P] [US3] Create components/admin/FlightRequestReviewModal.tsx - Client Component for approve/deny (COMPLETE - Full review form with status selection and comments)

### Integration (US3) ✅

- [x] T066 [US3] Add notification when flight request is approved/denied using pilot-notification-service (COMPLETE - notifyFlightApproved and notifyFlightDenied integrated in reviewFlightRequest)
- [x] T067 [US3] Add audit log entry when flight request status changes using audit-log-service (COMPLETE - createAuditLog integrated in reviewFlightRequest with old/new values)

**✅ CHECKPOINT PASSED**: User Story 3 complete (12/12 tasks) - Pilots can submit flight requests (4 types: additional_flight, route_change, schedule_swap, other), admins can review/approve/deny with comments, full notification and audit logging. **🎯 MVP COMPLETE** - All priority P1 features (US1-US3) delivered and testable.

---

## Phase 6: User Story 4 - Audit Logging & Compliance Tracking (Priority: P2)

**Goal**: Enable admins to view complete audit trail of all system changes.

**Independent Test**: Make changes to pilots/certifications/leave, then view /dashboard/audit to see complete history with user, timestamp, table, action, old/new values.

### Service Layer (US4)

- [x] T068 [P] [US4] Create lib/services/audit-log-service.ts with logBusinessEvent(), getAuditLogs(), getAuditLogById(), exportAuditLogs() ✅ (audit-service.ts already exists with complete implementation)

### API Routes (US4)

- [x] T069 [P] [US4] Create app/api/audit/route.ts (GET) - Admin fetch audit logs with filters ✅
- [x] T070 [P] [US4] Create app/api/audit/[id]/route.ts (GET) - Fetch single audit record detail ✅
- [x] T071 [P] [US4] Create app/api/audit/export/route.ts (GET) - Export audit logs to CSV ✅

### UI Pages (US4)

- [x] T072 [US4] Create app/dashboard/audit/page.tsx - Admin audit log viewer with filters ✅
- [x] T073 [US4] Create app/dashboard/audit/[id]/page.tsx - Individual audit record detail view ✅

### UI Components (US4)

- [x] T074 [P] [US4] Create components/audit/AuditLogTable.tsx - Client Component with sortable/filterable table ✅
- [x] T075 [P] [US4] Create components/audit/AuditLogFilters.tsx - Client Component with user, date, table filters ✅
- [x] T076 [P] [US4] Create components/audit/AuditLogTimeline.tsx - Client Component with chronological view ✅
- [x] T077 [P] [US4] Create components/audit/AuditLogDetail.tsx - Client Component showing old/new value diff ✅

### Integration (US4)

- [x] T078 [US4] Update existing service files to call logBusinessEvent() for critical operations (leave approval, pilot updates, etc.) ✅ (verified: certification-service, flight-request-service, leave-service, pilot-service, user-service all have audit logging)

**Checkpoint**: Audit logs capture all system changes, admins can view/filter/export. Story 4 complete and independently testable.

---

## Phase 7: User Story 5 - Task Management & Assignment (Priority: P2)

**Goal**: Enable admins to create, assign, and track tasks with Kanban and list views.

**Independent Test**: Create task at /dashboard/tasks/new, assign to pilot, set due date, view in Kanban/list, update status.

### Service Layer (US5)

- [x] T079 [P] [US5] Create lib/services/task-service.ts with createTask(), getTasks(), getTaskById(), updateTask(), deleteTask() ✅

### API Routes (US5)

- [x] T080 [P] [US5] Create app/api/tasks/route.ts (GET, POST) - List and create tasks ✅
- [x] T081 [P] [US5] Create app/api/tasks/[id]/route.ts (GET, PATCH, DELETE) - Task CRUD operations ✅

### UI Pages (US5)

- [x] T082 [US5] Create app/dashboard/tasks/page.tsx - Kanban and list view toggle ✅
- [x] T083 [US5] Create app/dashboard/tasks/new/page.tsx - Create new task form ✅
- [x] T084 [US5] Create app/dashboard/tasks/[id]/page.tsx - Task detail page ✅

### UI Components (US5)

- [x] T085 [P] [US5] Create components/tasks/TaskForm.tsx - Client Component for task creation/edit ✅
- [x] T086 [P] [US5] Create components/tasks/TaskKanban.tsx - Client Component with @dnd-kit drag-drop ✅
- [x] T087 [P] [US5] Create components/tasks/TaskList.tsx - Client Component with table view ✅
- [x] T088 [P] [US5] Create components/tasks/TaskCard.tsx - Client Component showing task summary ✅
- [x] T089 [P] [US5] Filters integrated into TaskList component (status filter tabs) ✅

### Integration (US5)

- [x] T090 [US5] Real-time updates via router.refresh() after drag-drop ✅
- [x] T091 [US5] Notifications integrated in task-service.ts (createTask, updateTask) ✅

**Checkpoint**: Tasks can be created, assigned, tracked via Kanban/list views. Story 5 complete and independently testable.

---

## Phase 8: User Story 6 - Disciplinary Matter Tracking (Priority: P2) ✅ COMPLETE

**Goal**: Enable admins to create and track disciplinary matters with timeline of actions.

**Independent Test**: Create disciplinary matter at /dashboard/disciplinary/new, assign to pilot, set severity, add actions, track to resolution.

### Service Layer (US6)

- [x] T092 [P] [US6] Create lib/services/disciplinary-service.ts with createMatter(), getMatters(), getMatterWithTimeline(), updateMatter(), addAction() ✅

### API Routes (US6)

- [x] T093 [P] [US6] Create app/api/disciplinary/route.ts (GET, POST) - List and create matters ✅
- [x] T094 [P] [US6] Create app/api/disciplinary/[id]/route.ts (GET, PATCH, DELETE) - Matter CRUD ✅
- [x] T095 [P] [US6] Create app/api/disciplinary/[id]/actions/route.ts (POST) - Add action to timeline ✅

### UI Pages (US6)

- [x] T096 [US6] Create app/dashboard/disciplinary/page.tsx - Disciplinary matters list ✅
- [x] T097 [US6] Create app/dashboard/disciplinary/new/page.tsx - Create new matter form ✅
- [x] T098 [US6] Create app/dashboard/disciplinary/[id]/page.tsx - Matter detail with timeline ✅

### UI Components (US6)

- [x] T099 [P] [US6] Create components/disciplinary/DisciplinaryMatterForm.tsx - Client Component for matter creation/edit ✅
- [x] T100 [P] [US6] Create components/disciplinary/DisciplinaryTimeline.tsx - Client Component with timeline UI ✅
- [x] T101 [P] [US6] Create components/disciplinary/ActionForm.tsx - Client Component for adding actions ✅
- [x] T102 [P] [US6] Table view integrated into main list page (app/dashboard/disciplinary/page.tsx) ✅

### Integration (US6)

- [ ] T103 [US6] Add file attachment support for actions using Supabase Storage (Future enhancement)
- [x] T104 [US6] Add audit logging for all disciplinary matter changes ✅ (integrated in disciplinary-service.ts)

**Checkpoint**: Disciplinary matters can be created, tracked with timeline view. Story 6 complete and independently testable.

---

## Phase 9: User Story 7 - Feedback Community & Moderation (Priority: P3)

**Goal**: Enable pilots to post feedback and admins to moderate content.

**Independent Test**: Log in as pilot, post feedback via /pilot/feedback, view by category, comment on posts. Admin moderates via /dashboard/admin/feedback-moderation.

### Service Layer (US7)

- [ ] T105 [P] [US7] Create lib/services/feedback-service.ts with createPost(), getPosts(), getPostWithComments(), upvotePost(), createComment(), getCategories()
- [ ] T106 [P] [US7] Create lib/services/feedback-admin-service.ts with pinPost(), hidePost(), deleteComment()

### API Routes (US7)

- [ ] T107 [P] [US7] Create app/api/pilot/feedback/posts/route.ts (GET, POST) - List and create posts
- [ ] T108 [P] [US7] Create app/api/pilot/feedback/posts/[id]/route.ts (GET, PATCH) - Post detail and edit
- [ ] T109 [P] [US7] Create app/api/pilot/feedback/posts/[id]/upvote/route.ts (POST) - Upvote post
- [ ] T110 [P] [US7] Create app/api/pilot/feedback/posts/[id]/comments/route.ts (POST) - Add comment
- [ ] T111 [P] [US7] Create app/api/pilot/feedback/categories/route.ts (GET) - List categories
- [ ] T112 [P] [US7] Create app/api/admin/feedback/posts/[id]/route.ts (PATCH) - Moderate post (pin, hide)

### UI Pages (US7)

- [ ] T113 [US7] Create app/pilot/feedback/page.tsx - Feedback posts list with category filter
- [ ] T114 [US7] Create app/pilot/feedback/[id]/page.tsx - Individual post with comments
- [ ] T115 [US7] Create app/dashboard/admin/feedback-moderation/page.tsx - Admin moderation dashboard

### UI Components (US7)

- [ ] T116 [P] [US7] Create components/feedback/FeedbackPostCard.tsx - Client Component with post preview
- [ ] T117 [P] [US7] Create components/feedback/CreatePostModal.tsx - Client Component for new post
- [ ] T118 [P] [US7] Create components/feedback/CommentList.tsx - Client Component with flat comment thread
- [ ] T119 [P] [US7] Create components/feedback/CreateCommentForm.tsx - Client Component with @mentions
- [ ] T120 [P] [US7] Create components/feedback/CategoryFilter.tsx - Client Component with category buttons

### Integration (US7)

- [ ] T121 [US7] Add notification when pilot's post gets a comment (using @mentions)
- [ ] T122 [US7] Add pagination for posts and comments using cursor-based pagination

**Checkpoint**: Feedback community allows pilots to post, comment, upvote. Admins can moderate. Story 7 complete and independently testable.

---

## Phase 10: User Story 8 - Pilot Registration Approval Workflow (Priority: P3)

**Goal**: Enable admins to review and approve/deny pilot registration requests.

**Independent Test**: Submit registration via /pilot/register, admin reviews at /dashboard/admin/pilot-registrations, approves/denies, verify pilot can/cannot log in.

### Service Layer (US8)

- [ ] T123 [P] [US8] Create lib/services/pilot-registration-service.ts with createRegistration(), getPendingRegistrations(), approveRegistration(), denyRegistration()

### API Routes (US8)

- [ ] T124 [P] [US8] Update app/api/pilot/register/route.ts to create pilot_registrations record (already created in US1, just enhance)
- [ ] T125 [P] [US8] Create app/api/admin/pilot-registrations/route.ts (GET) - List pending registrations
- [ ] T126 [P] [US8] Create app/api/admin/pilot-registrations/[id]/route.ts (GET, PATCH) - View and approve/deny

### UI Pages (US8)

- [ ] T127 [US8] Create app/dashboard/admin/pilot-registrations/page.tsx - Admin registration queue

### UI Components (US8)

- [ ] T128 [P] [US8] Create components/admin/RegistrationTable.tsx - Client Component with registration list
- [ ] T129 [P] [US8] Create components/admin/RegistrationReviewModal.tsx - Client Component for approve/deny

### Integration (US8)

- [ ] T130 [US8] Implement post-approval workflow: Create pilot record, link to user account, send welcome email
- [ ] T131 [US8] Add email verification check (Supabase Auth) before showing in admin approval queue
- [ ] T132 [US8] Add notification to pilot when registration is approved/denied

**Checkpoint**: Registration approval workflow complete. All user stories (US1-US8) implemented and independently testable.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Testing (E2E)

- [ ] T133 [P] Create e2e/pilot-portal.spec.ts - Test US1 (login, dashboard, notifications)
- [ ] T134 [P] Create e2e/pilot-leave.spec.ts - Test US2 (leave submission, eligibility)
- [ ] T135 [P] Create e2e/flight-requests.spec.ts - Test US3 (pilot submit, admin review)
- [ ] T136 [P] Create e2e/audit-logs.spec.ts - Test US4 (audit viewing, filtering, export)
- [ ] T137 [P] Create e2e/tasks.spec.ts - Test US5 (Kanban, list view, task CRUD)
- [ ] T138 [P] Create e2e/disciplinary.spec.ts - Test US6 (matter creation, timeline)
- [ ] T139 [P] Create e2e/feedback.spec.ts - Test US7 (posts, comments, moderation)

### Documentation

- [ ] T140 [P] Update CLAUDE.md with new services (9 new services documented)
- [ ] T141 [P] Update README.md with pilot portal features and URLs
- [ ] T142 [P] Run quickstart.md validation checklist

### Performance & Security

- [ ] T143 [P] Add database indexes verification (all foreign keys indexed)
- [ ] T144 [P] Verify RLS policies active on all 10 new tables
- [ ] T145 [P] Test real-time subscriptions under load (notifications, presence)

### Deployment

- [ ] T146 Run validation suite: npm run validate (type-check + lint + format:check)
- [ ] T147 Run E2E tests: npm test (all 7 test files must pass)
- [ ] T148 Deploy to production: Merge PR, deploy migration, verify deployment
- [ ] T149 Post-deployment smoke tests: Verify all 8 user stories work in production
- [ ] T150 Monitor logs for errors and performance issues

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed) OR sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Integrates with US1 (notifications) but independently testable
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Integrates with US1 (notifications) but independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Independent (adds audit logging to all features)
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 (pilot task notifications) but independently testable
- **User Story 6 (P2)**: Can start after Foundational (Phase 2) - Independent
- **User Story 7 (P3)**: Can start after Foundational (Phase 2) - Integrates with US1 (comment notifications) but independently testable
- **User Story 8 (P3)**: Can start after Foundational (Phase 2) - Integrates with US1 (registration approval triggers pilot account creation) but independently testable

### Within Each User Story

- Service layer before API routes
- API routes before UI pages
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All services within a story marked [P] can run in parallel
- All API routes within a story marked [P] can run in parallel
- All components within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Execution Examples

### User Story 1 (Pilot Portal)

```bash
# Launch all services for US1 in parallel:
Task: "Create lib/services/pilot-portal-service.ts"
Task: "Create lib/services/pilot-notification-service.ts"

# Launch all API routes for US1 in parallel:
Task: "Create app/api/pilot/login/route.ts"
Task: "Create app/api/pilot/logout/route.ts"
Task: "Create app/api/pilot/register/route.ts"
Task: "Create app/api/pilot/notifications/route.ts"
Task: "Create app/api/pilot/notifications/[id]/route.ts"

# Launch all components for US1 in parallel:
Task: "Create components/pilot/PilotLoginForm.tsx"
Task: "Create components/pilot/PilotRegisterForm.tsx"
Task: "Create components/pilot/PilotDashboardContent.tsx"
Task: "Create components/pilot/NotificationList.tsx"
Task: "Create components/pilot/NotificationBell.tsx"
```

### User Story 5 (Task Management)

```bash
# Launch all components for US5 in parallel:
Task: "Create components/tasks/TaskModal.tsx"
Task: "Create components/tasks/TaskKanbanView.tsx"
Task: "Create components/tasks/TaskListView.tsx"
Task: "Create components/tasks/TaskCard.tsx"
Task: "Create components/tasks/TaskFilters.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Pilot Portal)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Complete Phase 4: User Story 2 (Leave Requests)
6. **STOP and VALIDATE**: Test User Story 2 independently
7. Complete Phase 5: User Story 3 (Flight Requests)
8. **STOP and VALIDATE**: Test User Story 3 independently
9. **MVP COMPLETE**: Deploy/demo US1-US3

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Pilot Portal live!)
3. Add User Story 2 → Test independently → Deploy/Demo (Leave requests enabled!)
4. Add User Story 3 → Test independently → Deploy/Demo (Flight requests live! **MVP complete**)
5. Add User Story 4 → Test independently → Deploy/Demo (Audit logging active)
6. Add User Story 5 → Test independently → Deploy/Demo (Task management ready)
7. Add User Story 6 → Test independently → Deploy/Demo (Disciplinary tracking available)
8. Add User Story 7 → Test independently → Deploy/Demo (Feedback community live)
9. Add User Story 8 → Test independently → Deploy/Demo (Registration approval workflow complete)
10. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Pilot Portal)
   - Developer B: User Story 2 (Leave Requests)
   - Developer C: User Story 3 (Flight Requests)
3. Stories complete and integrate independently
4. Continue with US4-US8 as capacity allows

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

**Total Tasks**: 150 tasks
**MVP Scope (US1-US3)**: 67 tasks (T001-T067)
**Full Scope (US1-US8)**: 150 tasks
**Estimated Implementation Time**: 8-10 weeks (2 developers full-time)

**Task Breakdown by Phase**:
- Phase 1 (Setup): 3 tasks
- Phase 2 (Foundational): 24 tasks (BLOCKING)
- Phase 3 (US1 - Pilot Portal): 18 tasks
- Phase 4 (US2 - Leave Requests): 10 tasks
- Phase 5 (US3 - Flight Requests): 12 tasks (MVP complete at T067)
- Phase 6 (US4 - Audit Logging): 11 tasks
- Phase 7 (US5 - Task Management): 13 tasks
- Phase 8 (US6 - Disciplinary): 13 tasks
- Phase 9 (US7 - Feedback): 18 tasks
- Phase 10 (US8 - Registration): 10 tasks
- Phase 11 (Polish): 18 tasks

**Parallel Opportunities**: 85+ tasks marked [P] can run in parallel within their phase

---

**Generated**: 2025-10-22
**Status**: Ready for implementation
**Next Step**: Begin Phase 1 (Setup)
