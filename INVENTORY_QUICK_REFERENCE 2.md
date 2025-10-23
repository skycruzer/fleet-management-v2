# Fleet Management V2 - Inventory Quick Reference

**Quick lookup guide for existing features**

---

## Pages by Section

### Admin Dashboard (8 sections)
```
/dashboard                    → Dashboard home with metrics
/dashboard/pilots             → Pilots CRUD (list/new/edit)
/dashboard/certifications     → Certifications CRUD
/dashboard/leave              → Leave management CRUD
/dashboard/analytics          → Fleet analytics & reports
/dashboard/admin/settings     → System settings
/dashboard/admin/check-types  → Check type management
/dashboard/admin/users        → User management
```

### Pilot Portal (6 sections)
```
/portal/dashboard             → Personal dashboard
/portal/certifications        → My certifications
/portal/leave                 → My leave requests
/portal/flights               → My flight requests
/portal/feedback              → Submit & view feedback
```

### Auth
```
/                             → Home/landing page
/auth/login                   → Login page
```

---

## Components Count

| Category | Count | Location |
|----------|-------|----------|
| UI Components | 53 | `/components/ui/` |
| Portal Forms | 8 | `/components/portal/` |
| Feature Comp. | 10 | Various subdirs |
| Form Wrappers | 10 | `/components/forms/` |
| Navigation | 4 | `/components/navigation/` |
| Accessibility | 4 | `/components/accessibility/` |
| Pilot Management | 3 | `/components/pilots/` |
| Certification | 3 | `/components/certifications/` |
| Examples | 4 | `/components/examples/` |
| **Total** | **85+** | |

---

## API Routes (11 total)

```
GET/POST  /api/pilots                 → Pilot CRUD
GET/PUT/DELETE /api/pilots/[id]       → Single pilot ops
GET/POST  /api/certifications         → Cert CRUD
GET/PUT/DELETE /api/certifications/[id] → Single cert ops
GET/POST  /api/leave-requests         → Leave CRUD
GET/POST  /api/check-types            → Check type management
GET       /api/analytics              → Analytics data
GET/POST  /api/settings               → Settings management
GET/PUT/DELETE /api/settings/[id]     → Single setting ops
GET/POST  /api/users                  → User management
POST      /api/auth/signout           → Logout handler
```

---

## Services (13 total)

All in `/lib/services/`:

1. **pilot-service.ts** - Pilot CRUD + qualifications
2. **certification-service.ts** - Cert tracking + expiry
3. **leave-service.ts** - Leave request CRUD
4. **leave-eligibility-service.ts** - Complex eligibility logic
5. **expiring-certifications-service.ts** - Expiry calculations
6. **dashboard-service.ts** - Metrics aggregation
7. **analytics-service.ts** - Analytics data
8. **pdf-service.ts** - PDF reports
9. **cache-service.ts** - Performance caching
10. **audit-service.ts** - Audit logging
11. **admin-service.ts** - System administration
12. **user-service.ts** - User management
13. **pilot-portal-service.ts** - Pilot portal ops
14. **check-types-service.ts** - Check type management

---

## Hooks (8 custom)

| Hook | Purpose |
|------|---------|
| `use-portal-form` | Portal form state |
| `use-deduplicated-submit` | Prevent double submissions |
| `use-retry-state` | Retry failed operations |
| `use-optimistic-mutation` | Optimistic updates |
| `use-focus-management` | Focus management |
| `use-keyboard-nav` | Keyboard navigation |
| `use-touch` | Touch events |
| `use-online-status` | Network detection |

---

## Validation Schemas (Zod)

| Schema File | Coverage |
|------------|----------|
| `pilot-validation.ts` | Pilot CRUD validation |
| `certification-validation.ts` | Cert validation |
| `leave-validation.ts` | Leave request validation |
| `user-validation.ts` | User management validation |
| `dashboard-validation.ts` | Dashboard data |
| `analytics-validation.ts` | Analytics data |

---

## E2E Tests (15 test files)

```
auth.spec.ts                  → Login/logout
pilots.spec.ts                → Pilot CRUD
certifications.spec.ts        → Certification operations
leave-requests.spec.ts        → Leave workflow
dashboard.spec.ts             → Dashboard rendering
flight-requests.spec.ts       → Flight requests
portal-quick-test.spec.ts     → Portal smoke tests
portal-error-check.spec.ts    → Portal error handling
feedback.spec.ts              → Feedback system
accessibility.spec.ts         → WCAG compliance
performance.spec.ts           → Performance metrics
pwa.spec.ts                   → PWA functionality
rate-limiting.spec.ts         → Rate limiting
mobile-navigation.spec.ts     → Mobile UX
example.spec.ts               → Reference tests
```

---

## Database Tables (8 main + 6 views)

### Tables
- **pilots** (27 records) - Pilot master data
- **pilot_checks** (607 records) - Certifications
- **check_types** (34 records) - Check definitions
- **leave_requests** - Leave management
- **flight_requests** - Flight submissions
- **an_users** - System users
- **contract_types** (3 records)
- **disciplinary_actions** - Discipline records

### Read-Only Views
- expiring_checks
- detailed_expiring_checks
- compliance_dashboard
- pilot_report_summary
- captain_qualifications_summary
- dashboard_metrics

---

## Business Logic Rules

### Roster Period System
- **28-day cycles** (RP1-RP13)
- **Anchor**: RP12/2025 = 2025-10-11
- All leave must align to period boundaries

### Certification Color Coding
- 🔴 **Red**: Expired (days < 0)
- 🟡 **Yellow**: ≤30 days until expiry
- 🟢 **Green**: >30 days until expiry

### Leave Eligibility
- **Minimum 10 Captains** available per request
- **Minimum 10 First Officers** available
- **Separated by rank** - evaluated independently
- **Approval priority**: Seniority number (lower = higher)

### Captain Qualifications
- **Stored as JSONB**:
  - line_captain (bool)
  - training_captain (bool)
  - examiner (bool)
  - rhs_captain_expiry (date)

---

## Key Files to Know

### Configuration
- `next.config.js` - Next.js build config
- `tsconfig.json` - TypeScript config
- `tailwind.config.js` - Tailwind CSS config
- `.env.local` - Environment variables (local)
- `middleware.ts` - Request middleware

### Type Generation
- `types/supabase.ts` - Generated from DB schema (2000+ lines)
- `types/pilot.ts` - Pilot type definitions
- `types/index.ts` - Barrel exports

### Utilities
- `lib/utils/error-messages.ts` - 50+ error messages
- `lib/utils/certification-utils.ts` - FAA color coding
- `lib/utils/roster-utils.ts` - 28-day calculations
- `lib/utils/constraint-error-handler.ts` - DB error handling
- `lib/error-logger.ts` - Error tracking

---

## How to Add New Features

### Follow This Pattern:

1. **Add Service** (if DB ops needed)
   ```
   lib/services/new-feature-service.ts
   ```

2. **Add Validation Schema** (if forms)
   ```
   lib/validations/new-feature-validation.ts
   ```

3. **Create API Route** (if external access)
   ```
   app/api/new-feature/route.ts
   ```

4. **Build UI Components**
   ```
   components/new-feature/component.tsx
   components/new-feature/component.stories.tsx  ← Storybook
   ```

5. **Add Page**
   ```
   app/dashboard/new-feature/page.tsx
   ```

6. **Write E2E Tests**
   ```
   e2e/new-feature.spec.ts
   ```

7. **Run Quality Checks**
   ```bash
   npm run validate
   npm test
   ```

---

## Common Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm start                      # Start prod server

# Testing
npm test                       # Run E2E tests
npm run test:ui               # Open Playwright UI
npm run test:headed           # Run with visible browser

# Quality
npm run lint                   # Run ESLint
npm run type-check            # TypeScript check
npm run format:check          # Check formatting
npm run validate              # Full validation (pre-commit)

# Database
npm run db:types              # Generate types from schema
npm run db:migration          # Create new migration
npm run db:deploy             # Deploy migrations

# Storybook
npm run storybook             # Start component dev
npm run build-storybook       # Build static site
```

---

## Don't Duplicate These!

❌ **DON'T CREATE:**
- Another pilot list page (already have `/dashboard/pilots`)
- Another certification form (already have in forms/)
- Another API for pilots (already have `/api/pilots`)
- Another service for leave (already have `leave-service.ts`)
- Another error boundary (already have `error-boundary.tsx`)
- Another form validation (already have Zod schemas)

✅ **DO REUSE:**
- Existing services in `lib/services/`
- Existing components in `components/`
- Existing validation schemas
- Existing API routes
- Existing utilities in `lib/utils/`

---

## Architecture Overview

```
REQUEST
   ↓
MIDDLEWARE (auth, cookies)
   ↓
API ROUTE or PAGE
   ↓
SERVICE LAYER (business logic)
   ↓
SUPABASE DATABASE
   ↓
SERVICE returns data
   ↓
API/PAGE formats response
   ↓
COMPONENT renders UI
   ↓
USER sees result
```

**Critical Rule**: Services handle ALL database operations. Never call Supabase directly!

---

## Location Reference

| What | Where |
|------|-------|
| Pages | `/app/` |
| API Routes | `/app/api/` |
| Components | `/components/` |
| Services | `/lib/services/` |
| Hooks | `/lib/hooks/` |
| Utilities | `/lib/utils/` |
| Validations | `/lib/validations/` |
| Types | `/types/` |
| E2E Tests | `/e2e/` |
| Styles | `/styles/` or inline Tailwind |

---

**Last Updated**: October 22, 2025
**Quick Reference for**: Fleet Management V2 v0.1.0
