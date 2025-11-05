# Fleet Management V2 - OpenSpec Project Definition

**Version**: 2.0.1
**Last Updated**: October 22, 2025
**Project Type**: B767 Pilot Management System
**Status**: Production (Active Development)

## System Overview

Fleet Management V2 is a modern, production-ready pilot management system for B767 aircraft operations. The system provides comprehensive pilot certification tracking, leave management, and fleet analytics for aviation compliance (FAA standards).

**Current Scale**:
- **27 Active Pilots** (Captains and First Officers)
- **607 Active Certifications** across 34 check types
- **34 Check Types** (ICAO/FAA compliant)
- **Production Database**: Supabase PostgreSQL (`wgdmgvonqysflwdiiols`)

## Technology Stack

### Core Framework
- **Next.js**: 15.5.4 (App Router, Server Components, Server Actions)
- **React**: 19.1.0 (with React Server Components)
- **TypeScript**: 5.7.3 (strict mode enabled)
- **Build System**: Turbopack (default for dev and production)

### UI & Styling
- **Tailwind CSS**: 4.1.0 (dark mode support, custom design system)
- **shadcn/ui**: Component library (Radix UI primitives)
- **Styling System**: Utility-first with custom aviation-specific design tokens

### Backend & Database
- **Database**: Supabase PostgreSQL (with Row Level Security)
- **Authentication**: Supabase Auth (SSR support, role-based access control)
- **State Management**: TanStack Query 5.90.2 (server state)
- **API Layer**: Next.js 15 App Router API routes

### Data & Forms
- **Form Handling**: React Hook Form 7.63.0
- **Validation**: Zod 4.1.11 (schema-based validation)
- **Type Safety**: Generated Supabase types (2000+ lines)

### Testing & Quality
- **E2E Testing**: Playwright 1.55.0
- **Component Development**: Storybook 8.5.11
- **Code Quality**: ESLint, Prettier, Husky, lint-staged
- **Pre-commit Hooks**: Automated linting, formatting, type-checking

### Progressive Web App
- **Service Worker**: Serwist (next-pwa successor)
- **Offline Support**: Smart caching strategies
- **Mobile**: Installable on iOS and Android

## Architecture Patterns

### Service Layer Architecture (MANDATORY)

**Critical Rule**: All database operations MUST go through service functions in `lib/services/`. Direct Supabase calls from components or API routes are prohibited.

**Service Files** (13 total):
1. `pilot-service.ts` - Pilot CRUD, captain qualifications
2. `certification-service.ts` - Certification tracking
3. `leave-service.ts` - Leave request operations
4. `leave-eligibility-service.ts` - Leave approval logic (rank-separated)
5. `expiring-certifications-service.ts` - Expiry calculations
6. `dashboard-service.ts` - Dashboard metrics
7. `analytics-service.ts` - Analytics processing
8. `pdf-service.ts` - PDF generation
9. `cache-service.ts` - Performance caching (TTL-based)
10. `audit-service.ts` - Audit logging
11. `admin-service.ts` - System settings
12. `user-service.ts` - User management
13. `pilot-portal-service.ts` - Pilot portal operations

### Supabase Client Types

Three distinct client types for different execution contexts:

1. **Browser Client** (`lib/supabase/client.ts`)
   - Client Components (`'use client'`)
   - Cookie-based sessions
   - Real-time subscriptions

2. **Server Client** (`lib/supabase/server.ts`)
   - Server Components, Server Actions, Route Handlers
   - SSR-compatible (Next.js 15 async cookies)
   - Automatic session refresh

3. **Middleware Client** (`lib/supabase/middleware.ts`)
   - Authentication state management
   - Protected route enforcement
   - Session refresh and cookies

## Database Schema

**Supabase Project**: `wgdmgvonqysflwdiiols`

### Core Tables

1. **`pilots`** (27 records)
   - Pilot profiles, qualifications, seniority
   - JSONB `qualifications` column (Line Captain, Training Captain, Examiner)
   - `commencement_date` for seniority calculations

2. **`pilot_checks`** (607 records)
   - Certification records with expiry tracking
   - Linked to `check_types` and `pilots`
   - FAA compliance status tracking

3. **`check_types`** (34 records)
   - Check type definitions (ICAO/FAA compliant)
   - Validity periods, requirements

4. **`leave_requests`**
   - Leave request submissions
   - 28-day roster period alignment
   - Approval workflow tracking

5. **`an_users`**
   - System authentication and user management
   - Role-based access control (Admin, Manager, Pilot)

6. **`contract_types`** (3 records)
   - Employment contract definitions

7. **`flight_requests`**
   - Flight request submissions

8. **`disciplinary_actions`**
   - Disciplinary record tracking

### Database Views (Read-Only)

1. **`expiring_checks`** - Simplified expiring certifications
2. **`detailed_expiring_checks`** - Detailed expiry data with pilot info
3. **`compliance_dashboard`** - Fleet-wide compliance metrics
4. **`pilot_report_summary`** - Comprehensive pilot summaries
5. **`captain_qualifications_summary`** - Captain qualification tracking
6. **`dashboard_metrics`** - Real-time dashboard statistics

### Database Functions

1. **`calculate_years_to_retirement(pilot_id)`** - Retirement projections
2. **`calculate_years_in_service(pilot_id)`** - Service time calculations
3. **`get_fleet_compliance_summary()`** - Fleet compliance percentage
4. **`get_fleet_expiry_statistics()`** - Expiry distribution analytics
5. **`get_pilot_dashboard_metrics()`** - Pilot-specific metrics

## Critical Business Rules

### 1. Roster Period System (28-Day Cycles)

**Definition**: Leave requests operate on fixed 28-day roster periods (RP1-RP13 annually).

**Key Rules**:
- Known anchor: **RP12/2025 starts 2025-10-11**
- After RP13/YYYY → auto-rolls to RP1/(YYYY+1)
- All leave requests MUST align to roster period boundaries
- No partial-period leaves allowed

**Implementation**: `lib/utils/roster-utils.ts`

### 2. Certification Compliance (FAA Standards)

**Color Coding** (`lib/utils/certification-utils.ts`):

| Status | Condition | Color | Meaning |
|--------|-----------|-------|---------|
| Expired | `days_until_expiry < 0` | 🔴 Red | Non-compliant, immediate action |
| Expiring Soon | `days_until_expiry ≤ 30` | 🟡 Yellow | Warning, renewal required |
| Current | `days_until_expiry > 30` | 🟢 Green | Compliant |

**Alert Thresholds**:
- **Critical**: Expired certifications (immediate grounding risk)
- **Warning**: ≤60 days until expiry (renewal planning)
- **Notice**: ≤90 days until expiry (early awareness)

### 3. Leave Eligibility Logic (Rank-Separated)

**CRITICAL RULE**: Captains and First Officers are evaluated **independently**.

**Minimum Crew Requirements**:
- Must maintain **≥10 Captains available** at all times
- Must maintain **≥10 First Officers available** at all times

**Approval Priority** (within same rank):
1. **Seniority number** (lower = higher priority, e.g., #1 > #5)
2. **Request submission date** (earlier > later)

**Approval Algorithm** (`lib/services/leave-eligibility-service.ts`):
```
IF single pilot requests dates THEN
  Approve IF remaining_crew_of_rank >= 10

IF multiple pilots (same rank) request overlapping dates THEN
  IF remaining_crew_of_rank >= 10 THEN
    Approve ALL requests
  ELSE
    Sort by seniority ASC (lower number first)
    Approve sequentially until minimum_crew_of_rank = 10
    Reject remaining requests
```

**Special Alerts**:
- **Eligibility Alert**: Shows when 2+ pilots of same rank request overlapping dates
- **Final Review Alert**: Appears 22 days before next roster period (only when `pendingCount > 0`)

### 4. Captain Qualifications

**JSONB Field**: `pilots.qualifications`

**Qualification Types**:
- **Line Captain**: Standard captain qualification
- **Training Captain**: Authorized to conduct training flights
- **Examiner**: Authorized to conduct check rides
- **RHS Captain Expiry**: Right-hand seat captain currency tracking

**Implementation**: `lib/utils/qualification-utils.ts`

### 5. Seniority System

**Basis**: `pilots.commencement_date`

**Rules**:
- Earlier `commencement_date` → Lower seniority number → Higher priority
- Seniority numbers: 1-27 (unique, sequential)
- Used for leave request prioritization
- Cannot be changed without database migration

## Project Structure

```
fleet-management-v2/
├── app/                          # Next.js 15 App Router
│   ├── layout.tsx                # Root layout (theme provider)
│   ├── page.tsx                  # Homepage
│   ├── globals.css               # Tailwind v4 global styles
│   ├── api/                      # API routes (MUST use services)
│   │   ├── pilots/route.ts
│   │   ├── certifications/route.ts
│   │   ├── leave-requests/route.ts
│   │   └── analytics/route.ts
│   ├── dashboard/                # Admin dashboard
│   ├── portal/                   # Pilot self-service portal
│   └── auth/                     # Authentication pages
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── portal/                   # Pilot portal components
│   ├── forms/                    # Form components (React Hook Form)
│   ├── layout/                   # Layout components
│   └── theme-provider.tsx        # Theme context
│
├── lib/                          # Core utilities
│   ├── services/                 # ⭐ SERVICE LAYER (CRITICAL)
│   ├── supabase/                 # Supabase clients (3 types)
│   ├── utils/                    # Utility functions
│   │   ├── roster-utils.ts       # Roster period logic
│   │   ├── certification-utils.ts # FAA color coding
│   │   ├── qualification-utils.ts # Captain qualifications
│   │   ├── error-messages.ts     # Standardized errors
│   │   └── constraint-error-handler.ts
│   └── validations/              # Zod schemas
│
├── types/                        # TypeScript definitions
│   └── supabase.ts               # Generated database types (2000+ lines)
│
├── e2e/                          # Playwright E2E tests
│   ├── auth.spec.ts
│   ├── pilots.spec.ts
│   └── certifications.spec.ts
│
├── public/                       # Static assets
│   ├── icons/                    # PWA icons
│   ├── sw.js                     # Service worker (auto-generated)
│   └── manifest.json             # PWA manifest
│
├── openspec/                     # OpenSpec spec-driven development
│   ├── project.md                # This file
│   ├── specs/                    # Capability specifications
│   ├── changes/                  # Active change proposals
│   └── changes/archive/          # Completed changes
│
└── docs/                         # Documentation
```

## Development Workflow

### Feature Development Process

1. **Spec-Driven Approach** (OpenSpec)
   - Check `openspec list` for active changes
   - Create change proposal in `openspec/changes/<change-id>/`
   - Define requirements with scenarios
   - Validate before implementation

2. **Service Layer First** (if database operations)
   - Create/update service file in `lib/services/`
   - Never make direct Supabase calls

3. **Type Generation** (if schema changes)
   ```bash
   npm run db:types
   ```

4. **API Routes** (use services)
   - Create route in `app/api/`
   - Import and use service functions

5. **UI Components**
   - Add shadcn/ui components as needed
   - Create custom components with Storybook stories

6. **E2E Tests**
   - Create test file in `e2e/`
   - Run with Playwright

7. **Quality Checks**
   ```bash
   npm run validate  # Type-check + lint + format
   ```

### Pre-Commit Validation

Husky + lint-staged automatically runs:
- ESLint with auto-fix
- Prettier with auto-format
- TypeScript type checking

**Commits are blocked if checks fail.**

## Quality Standards

### Code Quality
- TypeScript strict mode (no `any` types)
- ESLint with Next.js rules
- Prettier for consistent formatting
- All service functions must have JSDoc comments

### Testing
- E2E tests for critical user flows
- Component tests in Storybook
- Test coverage for service layer functions

### Security
- Row Level Security (RLS) enabled on all tables
- Role-based access control (Admin, Manager, Pilot)
- Protected routes enforced via middleware
- Environment variables for secrets (never committed)

### Performance
- Service worker caching (PWA)
- Smart caching strategies (TTL-based)
- Image optimization (WebP, AVIF)
- Lazy loading for heavy components
- Turbopack for fast builds

## Environment Configuration

**Required Variables** (`.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://wgdmgvonqysflwdiiols.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Optional Variables**:
```env
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # Server-only
```

## Known Constraints & Limitations

### 1. Service Layer Requirement
- All database operations MUST use service functions
- Direct Supabase calls will be rejected in code review

### 2. Roster Period Boundaries
- Leave requests cannot span multiple roster periods
- Periods are fixed 28-day cycles (cannot be customized)

### 3. Minimum Crew Requirements
- Cannot approve leave if crew drops below 10 (per rank)
- Hard-coded minimum (requires spec change to modify)

### 4. Seniority System
- Based on `commencement_date` (immutable without migration)
- Cannot handle ties (requires unique dates)

### 5. Captain Qualifications
- Stored as JSONB (requires JSON parsing)
- No database-level validation (handled in service layer)

## Deployment

**Platform**: Vercel (recommended)

**Process**:
1. Connect Git repository
2. Add environment variables in Vercel dashboard
3. Deploy with `git push` (automatic)

**Build Command**: `npm run build`
**Output Directory**: `.next`
**Install Command**: `npm install`

## Common Commands Reference

### Development
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run validate     # Full quality check
```

### Database
```bash
npm run db:types     # Generate TypeScript types
npm run db:migration # Create migration
npm run db:deploy    # Deploy to production
```

### Testing
```bash
npm test             # Run E2E tests
npm run test:ui      # Playwright UI mode
npm run test:headed  # Visible browser
```

### OpenSpec
```bash
openspec list        # Active changes
openspec list --specs  # Existing specs
openspec show <id>   # View change
openspec validate <id> --strict  # Validate change
openspec archive <id> --yes  # Archive completed
```

## Additional Documentation

- **README.md** - Getting started, setup instructions
- **CLAUDE.md** - Detailed development guidelines (448 lines)
- **WORK-PLAN.md** - 9-week implementation plan
- **PROJECT-SUMMARY.md** - Tech stack overview
- **CONTRIBUTING.md** - Contribution guidelines
- **SETUP.md** - Environment setup details

## Specification Guidelines

### What to Spec (Create Change Proposal)
- New features or capabilities
- Breaking changes to existing features
- Database schema changes
- Business logic modifications
- Architecture changes

### What NOT to Spec (Fix Directly)
- Bug fixes restoring spec behavior
- Typos, formatting, comments
- Performance optimizations (non-breaking)
- Dependency updates
- Documentation improvements

### Change Proposal Structure
```
openspec/changes/<change-id>/
├── proposal.md      # Why, What Changes, Impact
├── tasks.md         # Implementation checklist
├── design.md        # Only if complex (architecture, security, performance)
└── specs/           # Delta changes to affected capabilities
    └── <capability>/
        └── spec.md  # ADDED, MODIFIED, REMOVED, RENAMED requirements
```

## Contact & Support

**Maintainer**: Maurice (Skycruzer)
**Project Type**: Production System (Active)
**Version**: 2.0.1
**Last Updated**: October 22, 2025

---

**This project follows spec-driven development with OpenSpec. All changes that modify requirements must go through the change proposal process.**
