# Project Context

## Purpose

**Fleet Management V2** is a production-ready B767 Pilot Management System for Air Niugini. The system manages:

- **Pilot Certification Tracking** - 607 certifications across 27 pilots (FAA compliance)
- **Leave Request Management** - 28-day roster period system with rank-separated eligibility
- **Captain Qualifications** - Line Captain, Training Captain, Examiner tracking
- **Compliance Monitoring** - Real-time dashboard with expiry alerts (Red/Yellow/Green status)
- **Seniority System** - Priority-based leave approval (1-27 seniority numbers)

**Key Business Value**: Ensures FAA compliance, prevents operational disruptions, and streamlines fleet operations.

## Tech Stack

### Core Framework
- **Next.js 15.5.4** - App Router with Server Components
- **React 19.1.0** - UI library
- **TypeScript 5.7.3** - Strict mode type safety
- **Turbopack** - Build system (dev + production)

### Backend & Database
- **Supabase** - PostgreSQL + Auth + Storage (Project: `wgdmgvonqysflwdiiols`)
- **Service Layer Architecture** - All DB operations through `lib/services/`
- **Row Level Security (RLS)** - Enabled on all tables

### State Management & Data Fetching
- **TanStack Query 5.90.2** - Server state management
- **React Hook Form 7.65.0** - Form handling
- **Zod 4.1.12** - Schema validation

### UI & Styling
- **Tailwind CSS 4.1.0** - Utility-first styling
- **shadcn/ui** - Radix UI primitives + custom components
- **Lucide React** - Icon library
- **next-themes** - Dark mode support

### Testing & Quality
- **Playwright 1.55.0** - E2E testing
- **Storybook 8.5.11** - Component development
- **ESLint 9** - Code linting
- **Prettier 3.4.2** - Code formatting
- **Husky + lint-staged** - Pre-commit hooks

## Project Conventions

### Code Style

**Formatting**:
- 2-space indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in objects/arrays
- Max line length: 100 characters

**TypeScript**:
- Strict mode enabled
- Explicit return types for functions
- No `any` types allowed
- Use interfaces over types for objects

**Naming Conventions**:
- **Files**: kebab-case (`pilot-service.ts`, `leave-request-form.tsx`)
- **Components**: PascalCase (`PilotCard`, `LeaveRequestForm`)
- **Functions**: camelCase (`getPilots`, `calculateExpiry`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_PILOTS`, `ROSTER_PERIOD_DAYS`)
- **Database**: snake_case (`pilot_checks`, `leave_requests`)

### Architecture Patterns

**1. Service Layer (MANDATORY)**
```typescript
// ✅ CORRECT - Use service layer
import { getPilots } from '@/lib/services/pilot-service'

// ❌ WRONG - Direct Supabase call
const { data } = await supabase.from('pilots').select('*')
```

All database operations MUST go through service functions in `lib/services/`:
- `pilot-service.ts`
- `certification-service.ts`
- `leave-service.ts`
- `leave-eligibility-service.ts`
- `dashboard-service.ts`
- `analytics-service.ts`
- `audit-service.ts`
- `admin-service.ts`

**2. Supabase Client Types**
- **Browser**: `lib/supabase/client.ts` (Client Components)
- **Server**: `lib/supabase/server.ts` (Server Components, API routes)
- **Middleware**: `lib/supabase/middleware.ts` (Auth middleware)

**3. Component Structure**
- Server Components by default (Next.js 15)
- Use `'use client'` only when needed (interactivity, hooks, context)
- Colocate related components in feature directories

**4. Error Handling**
- Standardized error messages in `lib/utils/error-messages.ts`
- Database constraint errors via `lib/utils/constraint-error-handler.ts`
- Always return structured error responses from API routes

**5. Form Validation**
- Zod schemas in `lib/validations/`
- React Hook Form + zodResolver
- Client-side + server-side validation

### Testing Strategy

**E2E Testing** (Playwright):
- Test files in `e2e/` directory
- Naming: `*.spec.ts`
- Run before commits: `npm test`
- Focus on critical user flows (auth, CRUD, leave approval)

**Component Testing** (Storybook):
- Every UI component should have a story
- Located alongside component: `component-name.stories.tsx`
- Run Storybook: `npm run storybook`

**Quality Gates**:
1. Type checking: `npm run type-check`
2. Linting: `npm run lint`
3. Formatting: `npm run format:check`
4. E2E tests: `npm test`

All gates run via `npm run validate` before commits.

### Git Workflow

**Branch Strategy**:
- `main` - Production branch
- `feature/[name]` - New features
- `fix/[name]` - Bug fixes
- `refactor/[name]` - Code refactoring

**Commit Convention**:
```
type(scope): description

feat(pilot): add captain qualification tracking
fix(leave): correct eligibility calculation for captains
refactor(services): extract common validation logic
docs(readme): update setup instructions
```

**Types**: feat, fix, refactor, docs, test, chore, perf, style

**Pre-commit Hooks**:
- ESLint auto-fix
- Prettier auto-format
- TypeScript type checking

## Domain Context

### Aviation & FAA Regulations

**Pilot Certifications**:
- Must maintain current certifications for flight operations
- Expiry tracking with color-coded alerts:
  - 🔴 Red: Expired (days_until_expiry < 0)
  - 🟡 Yellow: Expiring soon (≤30 days)
  - 🟢 Green: Current (>30 days)

**Check Types** (34 types):
- Medical Certificates
- Line Checks
- Proficiency Checks
- Recurrent Training
- Type Ratings

### Roster Period System

**28-Day Cycles** (RP1-RP13 annual cycle):
- Known anchor: **RP12/2025 starts 2025-10-11**
- After RP13/YYYY → rolls to RP1/(YYYY+1)
- All leave requests align to roster period boundaries
- Utilities: `lib/utils/roster-utils.ts`

### Leave Eligibility Rules

**CRITICAL**: Captains and First Officers evaluated **independently**.

**Minimum Crew Requirements**:
- ≥10 Captains available (per rank)
- ≥10 First Officers available (per rank)

**Approval Priority** (within same rank):
1. Seniority number (lower = higher priority)
2. Request submission date (earlier = higher priority)

**Approval Algorithm**:
- Single pilot request → Approve if remaining crew ≥10
- Multiple pilots (same rank, overlapping dates) → Approve all if remaining ≥10, else approve by seniority until minimum reached

**Special Alerts**:
- **Eligibility Alert**: 2+ pilots (same rank) request overlapping dates
- **Final Review Alert**: 22 days before next roster period (only when pendingCount > 0)

### Seniority System

Based on `commencement_date`:
- Earlier date = lower seniority number = higher priority
- Seniority numbers 1-27 (unique)
- Used for leave request prioritization

### Captain Qualifications

Stored in JSONB `qualifications` column:
- **Line Captain** - Standard captain qualification
- **Training Captain** - Authorized to conduct training
- **Examiner** - Authorized to conduct check rides
- **RHS Captain Expiry** - Right-hand seat currency

## Important Constraints

### Technical Constraints

**Database**:
- Production Supabase: `wgdmgvonqysflwdiiols`
- Row Level Security (RLS) enabled on all tables
- Real data: 27 pilots, 607 certifications, 34 check types
- No direct Supabase queries (use service layer)

**Performance**:
- Server Components preferred (reduce client JS)
- Image optimization via Next.js Image component
- Lazy loading for heavy components
- Caching via `lib/services/cache-service.ts`

**TypeScript**:
- Strict mode enabled
- Database types auto-generated: `npm run db:types`
- All API routes and services must be typed

**Authentication**:
- Supabase Auth with email/password
- Role-based access control (Admin, Manager, Pilot)
- Protected routes via middleware

### Business Constraints

**Compliance**:
- FAA certification standards must be met
- No expired certifications for active pilots
- Audit logging for all CRUD operations

**Operational**:
- Minimum crew requirements (10 Captains, 10 First Officers)
- Leave requests must align to roster periods
- Captain/First Officer separation in leave approval

**Data Integrity**:
- Seniority numbers must be unique
- No overlapping roster periods
- Certification expiry dates must be future-dated

### Regulatory Constraints

**Aviation Authority**:
- Civil Aviation Safety Authority (CASA) compliance
- FAA Part 121 operational requirements
- Crew rest requirements (not implemented yet)

**Audit & Compliance**:
- All changes logged via `audit-service.ts`
- Data retention requirements
- Privacy regulations (GDPR-compliant)

## External Dependencies

### Supabase Services

**Database** (PostgreSQL):
- Project: `wgdmgvonqysflwdiiols`
- API URL: `https://wgdmgvonqysflwdiiols.supabase.co`
- Client library: `@supabase/supabase-js`

**Authentication**:
- Email/password auth
- Session management via cookies
- RLS policies for data access

**Storage** (Future):
- Document uploads (medical certificates, training records)
- Not currently implemented

### External APIs

**None currently**. Future integrations may include:
- Email notifications (Resend, SendGrid)
- PDF generation (enhanced reports)
- SMS alerts (Twilio)

### Development Tools

**MCP Servers** (configured in workspace `.mcp.json`):
- **Supabase MCP** - Database operations
- **Exa MCP** - Web search and research
- **Playwright MCP** - Browser automation
- **Filesystem MCP** - Direct filesystem access

**Build & Deploy**:
- Vercel (production hosting)
- GitHub Actions (CI/CD)
- Supabase CLI (database migrations)

### Third-Party Libraries

**UI Components**:
- Radix UI primitives (via shadcn/ui)
- Lucide React (icons)
- TailwindCSS (styling)

**Data Management**:
- TanStack Query (server state)
- React Hook Form (form handling)
- Zod (validation)

**Utilities**:
- date-fns (date manipulation)
- clsx + tailwind-merge (class merging)
- DOMPurify (XSS prevention)

---

**Last Updated**: October 22, 2025
**Maintained By**: Maurice (Skycruzer)
**Version**: 1.0.0
