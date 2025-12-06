# Fleet Management V2 Constitution

<!--
Sync Impact Report (2025-10-22):
- Version Change: TEMPLATE → 1.0.0 (Initial Constitution)
- Created: Initial ratification of project principles
- Modified Principles: N/A (first version)
- Added Sections: All core principles established
- Removed Sections: None
- Templates Requiring Updates:
  ✅ constitution.md (this file) - created
  ⚠ plan-template.md - pending review
  ⚠ spec-template.md - pending review
  ⚠ tasks-template.md - pending review
- Follow-up TODOs: Review and align all .specify/templates/ with new principles
-->

## Core Principles

### I. Service-Layer Architecture (NON-NEGOTIABLE)

**All database operations MUST go through service functions** located in `lib/services/`. Direct Supabase calls from API routes, components, or pages are strictly prohibited.

**Rationale**: Service layer provides:

- Centralized business logic and data access patterns
- Consistent error handling and validation
- Easier testing through mocked services
- Single point of maintenance for database queries
- Clear separation of concerns between presentation and data layers

**Implementation Requirements**:

- Every database table must have a corresponding service file
- Services handle all CRUD operations, validations, and business rules
- API routes act as thin HTTP adapters calling service functions
- Components never import Supabase clients directly

### II. Type Safety First

**TypeScript strict mode is mandatory**. All code must be fully typed with no `any` types except when interfacing with untyped third-party libraries (must be documented).

**Rationale**: Type safety prevents runtime errors, enables better IDE support, and serves as living documentation. The aviation industry requires high reliability - type safety is a force multiplier for correctness.

**Implementation Requirements**:

- Generate database types after every schema change (`npm run db:types`)
- Use Zod schemas for runtime validation of external data
- All service functions must have explicit return types
- Form data validated with React Hook Form + Zod resolvers
- No TypeScript compiler errors or warnings allowed in production builds

### III. Test-Driven Quality Gates

**Critical paths require E2E tests before deployment**. Every user-facing feature must have corresponding Playwright tests covering happy paths and error scenarios.

**Rationale**: Fleet management involves safety-critical data (pilot certifications, compliance tracking). Automated testing catches regressions before they reach production and ensures consistent behavior across updates.

**Implementation Requirements**:

- Authentication flows must have E2E coverage
- CRUD operations on pilots, certifications, and leave requests require test coverage
- Tests run automatically in CI/CD pipeline
- No PR merges without passing tests
- Test coverage maintained above 70% for critical business logic

### IV. Aviation Compliance Standards

**All certification tracking must adhere to FAA regulatory standards** with proper audit trails, color-coded status indicators, and automated expiry monitoring.

**Rationale**: Regulatory compliance is non-negotiable in aviation operations. The system must provide evidence of certification currency and maintain complete historical records.

**Implementation Requirements**:

- FAA color coding: Red (expired), Yellow (≤30 days), Green (>30 days)
- Alert thresholds: Critical (expired), Warning (≤60 days), Notice (≤90 days)
- Audit logging for all certification CRUD operations
- Complete certification history retention (no deletions, only soft updates)
- Automated expiry calculations using database views

### V. Security by Design

**Row Level Security (RLS) enabled on all tables** with role-based access control enforced at the database level, not application level.

**Rationale**: Security implemented at the database layer cannot be bypassed by application bugs or API misuse. Supabase RLS provides defense-in-depth.

**Implementation Requirements**:

- All tables have RLS policies defined
- Authenticated users get read access to relevant data
- Admin role required for inserts/updates/deletes
- Managers have elevated permissions for approvals
- Pilots limited to read-only access to their own data
- Service role key never exposed to client-side code

### VI. Progressive Web App (PWA) Standards

**Offline-first architecture** with intelligent caching strategies for mobile access. The application must function in low-connectivity environments common in aviation operations.

**Rationale**: Fleet managers and pilots need access to critical data even without internet connectivity. PWA capabilities enable mobile installation and offline viewing.

**Implementation Requirements**:

- Service worker with intelligent caching (fonts: CacheFirst, API: NetworkFirst)
- Offline indicator shows connection status
- Previously loaded data accessible offline
- Mutations (create/update/delete) require online connection
- PWA manifest with proper icons for iOS/Android installation

### VII. Performance & Scalability

**Page load times under 2 seconds** on 3G connections. Database queries optimized with proper indexes and caching strategies.

**Rationale**: Users access the system from remote locations with varying network quality. Fast performance is essential for user adoption and operational efficiency.

**Implementation Requirements**:

- Turbopack for fast builds (dev and production)
- TanStack Query for server state caching with stale-while-revalidate
- Database indexes on frequently queried columns
- Lazy loading for heavy components (charts, reports)
- Image optimization with Next.js Image component
- Cache service for expensive calculations (5-minute TTL)

## Technical Constraints

### Technology Stack Requirements

**Framework & Language**:

- Next.js 15+ with App Router (Server Components by default)
- React 19+ for UI library
- TypeScript 5.7+ in strict mode
- Node.js 18+ and npm 9+

**Backend & Database**:

- Supabase for PostgreSQL, authentication, and real-time subscriptions
- Service-layer architecture (mandatory pattern)
- Row Level Security (RLS) on all tables
- Database views for complex queries and reporting

**UI & Styling**:

- Tailwind CSS v4+ with dark mode support
- shadcn/ui components with Radix UI primitives
- Responsive design (mobile-first approach)
- WCAG 2.1 Level AA accessibility compliance

**State & Forms**:

- TanStack Query for server state management
- React Hook Form with Zod validation for forms
- Context API for global app state (theme, auth)

**Testing & Quality**:

- Playwright for E2E testing (minimum 70% coverage on critical paths)
- Storybook for component development and documentation
- ESLint + Prettier for code consistency
- Husky + lint-staged for pre-commit quality gates

### Data Integrity Rules

**Roster Period System**:

- All leave requests must align to 28-day roster periods (RP1-RP13)
- Known anchor: RP12/2025 starts 2025-10-11
- Automatic rollover after RP13/YYYY → RP1/(YYYY+1)
- Utilities in `lib/utils/roster-utils.ts` enforce boundaries

**Leave Eligibility Logic**:

- Captains and First Officers evaluated independently (rank-separated)
- Minimum crew requirements: 10 Captains, 10 First Officers available
- Approval priority: (1) Seniority number (lower wins), (2) Request submission date
- Automated conflict detection and eligibility alerts

**Seniority System**:

- Based on `commencement_date` field (earlier date = lower number = higher priority)
- Seniority numbers 1-27 unique across all pilots
- Used for leave request prioritization and captain qualification tracking

## Development Workflow

### Feature Development Process

**Planning Phase**:

1. Document feature requirements in `.specify/specs/`
2. Create tasks using `.specify/templates/tasks-template.md`
3. Identify impacted services and database schema changes
4. Estimate complexity and timeline

**Implementation Phase**:

1. Create feature branch from main (`feature/descriptive-name`)
2. Update database schema if needed (create migration)
3. Generate TypeScript types (`npm run db:types`)
4. Implement service layer functions first (TDD approach)
5. Build API routes as thin HTTP adapters
6. Create UI components with Storybook stories
7. Add E2E tests for critical user flows

**Quality Gates**:

1. Run validation suite (`npm run validate` = type-check + lint + format:check)
2. Run E2E tests (`npm test`)
3. Manual testing in dev environment
4. Code review by at least one team member
5. Security review for authentication/authorization changes

**Deployment Phase**:

1. Merge PR after passing all checks
2. Deploy migrations to production database
3. Deploy application to Vercel (automatic on merge)
4. Monitor error logs and performance metrics
5. Create changelog entry documenting changes

### Code Review Standards

**PR Requirements**:

- Descriptive title and summary explaining "why" not just "what"
- Tests included for new features
- No TypeScript errors or ESLint warnings
- Prettier formatting applied
- Service layer used for all database operations
- No hardcoded credentials or sensitive data
- Documentation updated (README, CLAUDE.md, or inline comments)

**Review Checklist**:

- [ ] Service-layer architecture followed (no direct Supabase calls)
- [ ] Type safety maintained (no `any` types without justification)
- [ ] Tests cover critical paths and edge cases
- [ ] Aviation compliance rules respected (FAA color coding, audit logging)
- [ ] Security best practices followed (RLS policies, input validation)
- [ ] Performance considerations addressed (caching, lazy loading, indexes)
- [ ] Accessibility standards met (ARIA labels, keyboard navigation)
- [ ] Mobile responsiveness verified

## Governance

### Amendment Procedure

**Constitution Changes Require**:

1. Documented rationale for the amendment
2. Impact analysis on existing codebase
3. Approval from project maintainer (Maurice/Skycruzer)
4. Migration plan for breaking changes
5. Version bump following semantic versioning

**Versioning Policy**:

- **MAJOR** (X.0.0): Backward incompatible principle removals or redefinitions
- **MINOR** (0.X.0): New principles added or materially expanded guidance
- **PATCH** (0.0.X): Clarifications, wording improvements, non-semantic refinements

### Compliance Review

**All development work must verify compliance with**:

- Service-layer architecture for database operations
- TypeScript strict mode and type safety
- E2E test coverage for critical user flows
- FAA aviation compliance standards
- Security by design (RLS, role-based access)
- Performance and scalability requirements

**Constitution supersedes all other development practices**. When conflicts arise between this document and other guidance files (README, CLAUDE.md, issue templates), this constitution takes precedence.

**Complexity must be justified**. Any deviation from YAGNI (You Aren't Gonna Need It) principles requires documented business justification.

**Runtime Development Guidance**: Refer to `CLAUDE.md` for detailed technical patterns, command references, and troubleshooting guidance.

---

**Version**: 1.0.0 | **Ratified**: 2025-10-22 | **Last Amended**: 2025-10-22
