# Implementation Plan: Missing Core Features Migration

**Branch**: `001-missing-core-features` | **Date**: 2025-10-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-missing-core-features/spec.md`

**Note**: This plan implements the SpecKit workflow for migrating critical features from air-niugini-pms to fleet-management-v2.

## Summary

Migrate 7 core feature areas from air-niugini-pms to fleet-management-v2, excluding documents/forms pages to avoid duplication:

**Primary Requirement**: Add pilot-facing portal with authentication, leave request submission, flight requests, and notifications. Add admin capabilities for task management, disciplinary tracking, audit logging, feedback moderation, and registration approvals.

**Technical Approach**: Extend existing Next.js 15 + React 19 + TypeScript application with new app routes for `/pilot/*` pages and `/dashboard/*` admin pages. Implement 8 new database tables (pilot_registrations, flight_requests, tasks, disciplinary_actions, disciplinary_actions_log, feedback_posts, feedback_comments, audit_logs, pilot_notifications). Follow existing service-layer architecture pattern with new services in `lib/services/`. Reuse existing authentication (Supabase Auth) with role-based routing. Leverage existing roster period utilities and leave eligibility logic for pilot leave submissions.

## Technical Context

**Language/Version**: TypeScript 5.7.3 (strict mode mandatory)
**Primary Dependencies**:
- Next.js 15.5.6 (App Router with Server Components)
- React 19.1.0
- Supabase 2.47.10 (PostgreSQL + Auth + Realtime)
- TanStack Query 5.90.2 (server state management)
- React Hook Form 7.63.0 + Zod 4.1.11 (forms + validation)
- Tailwind CSS 4.1.0 + shadcn/ui (styling + components)

**Storage**: Supabase PostgreSQL (project: wgdmgvonqysflwdiiols) with Row Level Security (RLS) enabled on all tables

**Testing**:
- Playwright 1.55.0 (E2E tests)
- Jest 29.7.0 (unit tests)
- Minimum 70% test coverage on critical paths (constitution requirement)

**Target Platform**: Web application (desktop + mobile responsive), PWA-enabled with offline support

**Project Type**: Web application (Next.js App Router structure)

**Performance Goals**:
- Page load <2 seconds on 3G connections
- Support 27 concurrent pilots + 3 admins
- Real-time updates for notifications and presence indicators
- PWA with NetworkFirst caching strategy for API calls

**Constraints**:
- Service-layer architecture mandatory (no direct Supabase calls from API routes/components)
- All tables require RLS policies
- 28-day roster period boundaries must be enforced
- Rank-separated leave eligibility (min 10 Captains + 10 First Officers per rank)
- FAA color coding required (Red/Yellow/Green for certifications)
- Audit logging required for compliance

**Scale/Scope**:
- 27 active pilots
- ~22 new pages (8 pilot portal + 14 admin dashboard)
- ~50 new components
- ~30 new API routes
- ~10 new services
- 8 new database tables
- Estimated 15,000-20,000 LOC

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Service-Layer Architecture (NON-NEGOTIABLE)
**Status**: ✅ **PASS**
- All database operations will go through new services in `lib/services/`
- New services: `pilot-portal-service.ts`, `pilot-leave-service.ts`, `flight-request-service.ts`, `task-service.ts`, `disciplinary-service.ts`, `feedback-service.ts`, `audit-log-service.ts`, `pilot-registration-service.ts`, `pilot-notification-service.ts`
- API routes will act as thin HTTP adapters
- No direct Supabase calls from components or API routes

### Principle II: Type Safety First
**Status**: ✅ **PASS**
- TypeScript 5.7.3 strict mode enforced
- All 8 new database tables will have generated types via `npm run db:types`
- Zod schemas for all user input validation (FR-048)
- Service functions will have explicit return types
- Form data validated with React Hook Form + Zod resolvers

### Principle III: Test-Driven Quality Gates
**Status**: ✅ **PASS**
- E2E tests required for all 8 user stories (SC-018)
- Playwright tests for authentication flows, CRUD operations, workflows
- 70% minimum test coverage on critical paths
- Tests will cover: pilot login, leave submission, flight requests, task management, disciplinary tracking, feedback posting, registration approval, audit logging

### Principle IV: Aviation Compliance Standards
**Status**: ✅ **PASS**
- FAA color coding maintained (Red/Yellow/Green) for certification displays in pilot dashboard
- Audit logging implemented for all critical operations (FR-018 through FR-022)
- Complete audit trail with old/new values preserved
- Disciplinary matter tracking with timeline and resolution status
- Compliance export capability (CSV audit logs)

### Principle V: Security by Design
**Status**: ✅ **PASS**
- RLS policies required on all 8 new tables
- Pilot role authentication separate from admin/manager (FR-003)
- Role-based routing (`/pilot/*` vs `/dashboard/*`)
- Admin-only pages: audit logs, feedback moderation, registration approvals
- Pilot-only pages: portal dashboard, leave submission, flight requests, feedback
- Service role key never exposed to client

### Principle VI: Progressive Web App Standards
**Status**: ✅ **PASS**
- Pilot portal pages will work with existing PWA setup
- NetworkFirst caching for API calls
- Offline indicator shows connection status
- Previously loaded data accessible offline (read-only)
- Mutations (create/update/delete) require online connection

### Principle VII: Performance & Scalability
**Status**: ✅ **PASS**
- Page load <2 seconds target maintained
- TanStack Query for server state caching with stale-while-revalidate
- Lazy loading for heavy components (task Kanban view, feedback threads)
- Database indexes on foreign keys (pilot_id, user_id, post_id, etc.)
- Real-time features use Supabase subscriptions (efficient WebSocket connections)
- Pagination for large lists (feedback posts, audit logs, tasks)

### Overall Assessment
**All 7 constitution principles PASS** ✅

No violations detected. This feature implementation fully complies with the Fleet Management V2 Constitution v1.0.0.

**Complexity Justification**: Not required - no deviations from YAGNI principles.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
fleet-management-v2/
├── app/                          # Next.js 15 App Router
│   ├── pilot/                    # NEW: Pilot Portal Routes
│   │   ├── login/page.tsx        # Pilot authentication
│   │   ├── register/page.tsx     # Pilot registration
│   │   ├── dashboard/page.tsx    # Pilot home dashboard
│   │   ├── leave/page.tsx        # Leave request submission
│   │   ├── flight-requests/page.tsx  # Flight request bidding
│   │   ├── feedback/             # Feedback community
│   │   │   ├── page.tsx          # Feedback list
│   │   │   └── [id]/page.tsx     # Individual post
│   │   └── notifications/page.tsx  # Notification center
│   │
│   ├── dashboard/                # EXISTING + NEW Admin Routes
│   │   ├── pilots/               # Existing
│   │   ├── certifications/       # Existing
│   │   ├── leave/                # Existing
│   │   ├── analytics/            # Existing
│   │   ├── flight-requests/      # NEW: Flight request review
│   │   │   └── page.tsx
│   │   ├── tasks/                # NEW: Task management
│   │   │   ├── page.tsx          # Kanban + List view
│   │   │   ├── new/page.tsx      # Create task
│   │   │   └── [id]/page.tsx     # Task detail
│   │   ├── disciplinary/         # NEW: Disciplinary tracking
│   │   │   ├── page.tsx          # Matters list
│   │   │   ├── new/page.tsx      # Create matter
│   │   │   └── [id]/page.tsx     # Matter detail
│   │   ├── audit/                # NEW: Audit logging
│   │   │   ├── page.tsx          # Audit log viewer
│   │   │   └── [id]/page.tsx     # Audit record detail
│   │   └── admin/                # Existing + NEW
│   │       ├── pilot-registrations/page.tsx  # NEW
│   │       └── feedback-moderation/page.tsx  # NEW
│   │
│   └── api/                      # API Routes
│       ├── pilot/                # NEW: Pilot API endpoints
│       │   ├── leave/route.ts
│       │   ├── flight-requests/route.ts
│       │   ├── feedback/
│       │   │   ├── posts/route.ts
│       │   │   └── posts/[id]/
│       │   │       ├── route.ts
│       │   │       └── comments/route.ts
│       │   ├── notifications/route.ts
│       │   └── register/route.ts
│       │
│       ├── tasks/route.ts        # NEW
│       ├── tasks/[id]/route.ts   # NEW
│       ├── disciplinary-matters/route.ts  # NEW
│       ├── disciplinary-matters/[id]/route.ts  # NEW
│       ├── disciplinary-matters/[id]/actions/route.ts  # NEW
│       ├── audit/route.ts        # NEW
│       └── admin/                # NEW
│           ├── pilot-registrations/route.ts
│           ├── pilot-registrations/[id]/route.ts
│           └── feedback/posts/[id]/route.ts
│
├── components/                   # React Components
│   ├── pilot/                    # NEW: Pilot Portal Components
│   │   ├── PilotLoginForm.tsx
│   │   ├── PilotRegisterForm.tsx
│   │   ├── PilotDashboard.tsx
│   │   ├── LeaveBidModal.tsx
│   │   ├── FlightRequestForm.tsx
│   │   ├── FeedbackPostCard.tsx
│   │   └── NotificationList.tsx
│   │
│   ├── tasks/                    # NEW: Task Components
│   │   ├── TaskModal.tsx
│   │   ├── TaskKanbanView.tsx
│   │   ├── TaskListView.tsx
│   │   └── TaskCard.tsx
│   │
│   ├── disciplinary/             # NEW: Disciplinary Components
│   │   ├── DisciplinaryMatterModal.tsx
│   │   ├── MatterTimelineView.tsx
│   │   └── ActionLogEntry.tsx
│   │
│   ├── audit/                    # NEW: Audit Components
│   │   ├── AuditLogTable.tsx
│   │   ├── AuditLogFilters.tsx
│   │   ├── AuditLogTimeline.tsx
│   │   └── AuditLogDetail.tsx
│   │
│   └── ui/                       # Existing shadcn/ui components (reuse)
│
├── lib/                          # Core Utilities
│   ├── services/                 # Service Layer (MANDATORY)
│   │   ├── pilot-portal-service.ts  # NEW
│   │   ├── pilot-leave-service.ts   # NEW
│   │   ├── flight-request-service.ts  # NEW
│   │   ├── task-service.ts          # NEW
│   │   ├── disciplinary-service.ts  # NEW
│   │   ├── feedback-service.ts      # NEW
│   │   ├── feedback-admin-service.ts  # NEW
│   │   ├── audit-log-service.ts     # NEW
│   │   ├── pilot-registration-service.ts  # NEW
│   │   ├── pilot-notification-service.ts  # NEW
│   │   └── ... (existing services)
│   │
│   ├── validations/              # Zod Schemas
│   │   ├── pilot-portal-schema.ts   # NEW
│   │   ├── flight-request-schema.ts  # NEW
│   │   ├── task-schema.ts           # NEW
│   │   ├── disciplinary-schema.ts   # NEW
│   │   └── feedback-schema.ts       # NEW
│   │
│   ├── utils/                    # Utilities (reuse existing)
│   │   ├── roster-utils.ts       # Existing (reuse for leave)
│   │   ├── certification-utils.ts  # Existing (reuse for dashboard)
│   │   └── ... (other utils)
│   │
│   └── supabase/                 # Supabase Clients (reuse existing)
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts
│
├── e2e/                          # Playwright E2E Tests
│   ├── pilot-portal.spec.ts      # NEW
│   ├── pilot-leave.spec.ts       # NEW
│   ├── flight-requests.spec.ts   # NEW
│   ├── tasks.spec.ts             # NEW
│   ├── disciplinary.spec.ts      # NEW
│   ├── audit-logs.spec.ts        # NEW
│   └── feedback.spec.ts          # NEW
│
└── types/                        # TypeScript Definitions
    └── supabase.ts               # AUTO-GENERATED (update via npm run db:types)
```

**Structure Decision**: Next.js 15 App Router with server components. New pilot portal pages under `app/pilot/*`, new admin pages under `app/dashboard/*`. All database operations through service layer in `lib/services/`. Reuse existing authentication, utilities, and UI components where possible.

---

**Plan Status**: ✅ **COMPLETE** - All phases finished
**Phase 0 (Research)**: ✅ research.md generated - 8 research questions answered, design decisions documented
**Phase 1 (Design)**: ✅ data-model.md, contracts/, quickstart.md generated
**Constitution Compliance**: ✅ All 7 principles PASS
**Next Steps**: Execute `/speckit.tasks` to generate implementation task breakdown

---

## Deliverables Summary

### Phase 0: Research (Complete)
✅ **research.md** (450+ lines)
- 8 research questions answered with technical decisions
- Technology stack research (Next.js 15, React 19, Supabase, @dnd-kit)
- Best practices for pilot portal, real-time notifications, task Kanban, feedback community
- Security decisions (RLS policies, audit logging, email verification)
- Risk mitigation strategies

### Phase 1: Design (Complete)
✅ **data-model.md** (1000+ lines)
- Complete SQL DDL for 10 new database tables
- Foreign key relationships and constraints
- Database indexes for performance
- Row Level Security (RLS) policies for all tables
- Database triggers for audit logging and data integrity
- Migration file with dependency-ordered table creation
- Validation queries and schema summary

✅ **contracts/** (API specifications)
- **README.md** - Contract overview and usage guide
- **pilot-auth.yaml** - Full OpenAPI 3.0 spec (3 endpoints)
- **flight-requests.yaml** - Full OpenAPI 3.0 spec (4 endpoints)
- **tasks.yaml** - Full OpenAPI 3.0 spec (5 endpoints)
- **CONTRACTS_SUMMARY.md** - Detailed outline of 6 remaining contracts (18 endpoints)
- Total: 30 endpoints documented

✅ **quickstart.md** (1200+ lines)
- Step-by-step implementation workflow (10 weeks)
- Development environment setup
- Database migration guide
- Service layer implementation patterns with code examples
- Validation schema examples (Zod)
- API route patterns (thin HTTP adapters)
- UI component patterns (Server + Client Components)
- E2E testing guide with Playwright examples
- Deployment checklist
- Common patterns and troubleshooting

---

**All SpecKit Plan Artifacts Generated**: 2025-10-22
**Total Documentation**: ~3,000 lines across 6 files
**Ready for**: Task breakdown phase (`/speckit.tasks`)
