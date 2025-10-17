# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

**Fleet Management V2** is a modern rebuild of the B767 Pilot Management System using Next.js 15, React 19, and TypeScript 5.7. This project connects to an existing Supabase database (Project ID: `wgdmgvonqysflwdiiols`) containing production data: 27 pilots, 607 certifications, and 34 check types.

**Key Architecture Principle**: This is a **service-layer architecture**. All database operations MUST go through service functions in `lib/services/`. Never make direct Supabase calls from API routes or components.

## Development Commands

### Core Development
```bash
npm run dev               # Start dev server (http://localhost:3000)
npm run build             # Production build with Turbopack
npm run start             # Start production server
npm run validate          # Run type-check + lint + format:check (pre-commit check)
```

### Database Operations
```bash
npm run db:types          # Generate TypeScript types from Supabase schema
npm run db:migration      # Create new database migration
npm run db:deploy         # Deploy migrations to production
node test-connection.mjs  # Test Supabase connection and verify data access
```

### Testing
```bash
npm test                  # Run Playwright E2E tests
npm run test:ui           # Open Playwright UI mode
npm run test:headed       # Run tests with visible browser
npm run test:debug        # Run tests in debug mode
npx playwright test e2e/specific-test.spec.ts  # Run single test file
```

### Code Quality
```bash
npm run lint              # Run ESLint
npm run lint:fix          # Auto-fix ESLint issues
npm run type-check        # TypeScript validation (strict mode)
npm run format            # Format with Prettier
npm run format:check      # Check formatting only
```

### Component Development
```bash
npm run storybook         # Start Storybook dev server (http://localhost:6006)
npm run build-storybook   # Build Storybook static site
```

## Architecture Overview

### Service Layer Pattern (CRITICAL)

**Rule #1**: All database operations MUST use service functions. Never call Supabase directly from API routes or components.

```typescript
// ✅ CORRECT - Use service layer
// app/api/pilots/route.ts
import { getPilots } from '@/lib/services/pilot-service'

export async function GET() {
  const pilots = await getPilots()
  return NextResponse.json({ success: true, data: pilots })
}

// ❌ WRONG - Direct Supabase call
const { data } = await supabase.from('pilots').select('*')
```

#### Required Services (To Be Implemented)

Based on the existing air-niugini-pms system, these service files are mandatory:

1. **`lib/services/pilot-service.ts`** - Pilot CRUD operations
2. **`lib/services/certification-service.ts`** - Certification tracking
3. **`lib/services/leave-service.ts`** - Leave request management
4. **`lib/services/leave-eligibility-service.ts`** - Complex leave eligibility logic
5. **`lib/services/expiring-certifications-service.ts`** - Certification expiry calculations
6. **`lib/services/dashboard-service.ts`** - Dashboard metrics aggregation
7. **`lib/services/analytics-service.ts`** - Analytics data processing
8. **`lib/services/pdf-service.ts`** - PDF report generation
9. **`lib/services/cache-service.ts`** - Performance caching
10. **`lib/services/audit-service.ts`** - Audit logging

### Supabase Client Architecture

Three client types for different contexts:

1. **Browser Client** (`lib/supabase/client.ts`):
   - Use in Client Components (`'use client'`)
   - Cookie-based session management
   - Real-time subscriptions

2. **Server Client** (`lib/supabase/server.ts`):
   - Use in Server Components, Server Actions, Route Handlers
   - SSR-compatible with Next.js 15 async cookies
   - Automatic session refresh

3. **Middleware Client** (`lib/supabase/middleware.ts`):
   - Handles authentication state across requests
   - Session refresh and cookie management
   - Protected route enforcement

### Database Schema

**Connected Database**: Supabase Project `wgdmgvonqysflwdiiols`

#### Main Tables
- `pilots` (27 records) - Pilot profiles with qualifications
- `pilot_checks` (607 records) - Certification records
- `check_types` (34 records) - Check type definitions
- `leave_requests` - Leave request system
- `an_users` - System authentication users
- `contract_types` (3 records) - Contract type definitions
- `digital_forms` - Digital form system
- `disciplinary_actions` - Disciplinary record tracking
- `flight_requests` - Flight request submissions

#### Database Views (Read-Only)
- `expiring_checks` - Simplified expiring certifications
- `detailed_expiring_checks` - Detailed certification expiry data
- `compliance_dashboard` - Fleet-wide compliance metrics
- `pilot_report_summary` - Comprehensive pilot summaries
- `captain_qualifications_summary` - Captain qualification tracking
- `dashboard_metrics` - Real-time dashboard statistics

#### Database Functions
- `calculate_years_to_retirement(pilot_id)` - Retirement calculations
- `calculate_years_in_service(pilot_id)` - Service time calculations
- `get_fleet_compliance_summary()` - Fleet compliance percentage
- `get_fleet_expiry_statistics()` - Expiry distribution stats
- `get_pilot_dashboard_metrics()` - Pilot-specific metrics
- `get_monthly_expiry_data(months)` - Expiry trend data
- `check_training_currency(pilot_id)` - Training currency validation

### Type Safety

**Generated Types**: `types/supabase.ts` (2000+ lines)

After any database schema changes, regenerate types:
```bash
npm run db:types
```

All Supabase clients are typed with `Database` from `@/types/supabase`.

## Critical Business Rules

### 1. Roster Period System (28-Day Cycles)

Leave requests operate on 28-day roster periods (RP1-RP13):
- Known anchor: **RP12/2025 starts 2025-10-11**
- After RP13/YYYY → automatically rolls to RP1/(YYYY+1)
- All leave requests must align to roster period boundaries
- Utility functions in `lib/utils/roster-utils.ts` (to be ported)

### 2. Certification Compliance (FAA Standards)

**Color Coding**:
- 🔴 **Red**: Expired (days_until_expiry < 0)
- 🟡 **Yellow**: Expiring soon (days_until_expiry ≤ 30)
- 🟢 **Green**: Current (days_until_expiry > 30)

**Alert Thresholds**:
- Critical: Expired certifications
- Warning: ≤60 days until expiry
- Notice: ≤90 days until expiry

### 3. Leave Eligibility Logic (Rank-Separated)

**CRITICAL**: Captains and First Officers are evaluated **independently**.

**Minimum Crew Requirements**:
- Must maintain **10 Captains available** (per rank)
- Must maintain **10 First Officers available** (per rank)

**Approval Priority** (within same rank):
1. Seniority number (lower = higher priority, e.g., #1 beats #5)
2. Request submission date (earlier beats later)

**Approval Algorithm**:
- If single pilot requests dates → Approve if remaining crew ≥ 10
- If multiple pilots request same dates → Approve all if remaining ≥ 10, else approve by seniority until minimum reached

**Special Alerts**:
- **Eligibility Alert**: Shows when 2+ pilots of same rank request overlapping dates
- **Final Review Alert**: Appears 22 days before next roster period starts (only when pendingCount > 0)

### 4. Captain Qualifications

Stored in JSONB column `qualifications`:
- **Line Captain**: Standard captain qualification
- **Training Captain**: Authorized to conduct training
- **Examiner**: Authorized to conduct check rides
- **RHS Captain Expiry**: Right-hand seat captain currency tracking

### 5. Seniority System

Based on `commencement_date` field:
- Earlier date = lower seniority number = higher priority
- Seniority numbers 1-27 (unique)
- Used for leave request prioritization

## Component Patterns

### shadcn/ui Integration

Add new components:
```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add table
```

Components install to `components/ui/` and are customizable.

### Storybook Stories

Every new component should have a Storybook story:

```tsx
// components/pilots/pilot-card.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { PilotCard } from './pilot-card'

const meta = {
  title: 'Pilots/PilotCard',
  component: PilotCard,
  tags: ['autodocs'],
} satisfies Meta<typeof PilotCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    pilot: {
      id: '1',
      name: 'John Doe',
      rank: 'Captain',
      status: 'active',
    },
  },
}

export const FirstOfficer: Story = {
  args: {
    pilot: {
      id: '2',
      name: 'Jane Smith',
      rank: 'First Officer',
      status: 'active',
    },
  },
}
```

### Server vs Client Components

**Server Components** (default in Next.js 15):
```tsx
// app/dashboard/pilots/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function PilotsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Server-side data fetching
}
```

**Client Components** (for interactivity):
```tsx
'use client'
import { createClient } from '@/lib/supabase/client'

export function PilotForm() {
  const supabase = createClient()
  // Client-side mutations, real-time updates
}
```

## Environment Variables

Required in `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wgdmgvonqysflwdiiols.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Service Role (server-only, never expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Testing Strategy

### E2E Testing with Playwright

Test files in `e2e/` directory. Example:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Pilot Management', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: login, navigate to pilot page
    await page.goto('/dashboard/pilots')
  })

  test('should display pilot list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pilots' })).toBeVisible()
    const rows = page.getByRole('row')
    await expect(rows).toHaveCount(28) // 27 pilots + header
  })

  test('should filter pilots by rank', async ({ page }) => {
    await page.getByLabel('Rank').selectOption('Captain')
    // Verify filtered results
  })
})
```

**Key Testing Patterns**:
- Test authentication flows
- Test CRUD operations end-to-end
- Test business logic (leave eligibility, certification expiry)
- Test responsive design (mobile viewport)
- Test across browsers (Chromium, Firefox, WebKit)

## Migration from air-niugini-pms v1

This is a **rebuild project** porting features from the existing production system (Next.js 14) to a modern stack (Next.js 15 + React 19).

### Files to Port from air-niugini-pms

**Service Layer** (Priority: Critical):
- `src/lib/pilot-service.ts`
- `src/lib/leave-service.ts`
- `src/lib/leave-eligibility-service.ts`
- `src/lib/expiring-certifications-service.ts`
- `src/lib/dashboard-service.ts`
- `src/lib/analytics-service.ts`
- `src/lib/pdf-data-service.ts`

**Utilities** (Priority: High):
- `src/lib/roster-utils.ts` - 28-day roster period calculations
- `src/lib/certification-utils.ts` - FAA color coding logic
- `src/lib/auth-utils.ts` - Permission checking

**Components** (Priority: Medium):
- Pilot management components
- Certification tracking components
- Leave request components
- Dashboard widgets

### Porting Checklist

When porting code:
- [ ] Update imports for new file structure (`@/` alias)
- [ ] Use Next.js 15 async patterns (e.g., `await cookies()`)
- [ ] Update to React 19 patterns (if applicable)
- [ ] Add TypeScript types from generated `types/supabase.ts`
- [ ] Add Storybook stories for UI components
- [ ] Add Playwright E2E tests for critical flows
- [ ] Update to use service layer (never direct Supabase calls)

## Performance Considerations

### Build System
- **Turbopack**: Used for both dev and production builds
- Significantly faster than Webpack
- Hot Module Replacement (HMR) is near-instant

### Optimization Strategies
```javascript
// next.config.js optimizations already configured:
experimental: {
  optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  serverActions: { bodySizeLimit: '2mb' },
}
```

### Lazy Loading Heavy Components
```tsx
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('@/components/charts/heavy-chart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false, // Disable SSR if client-only
})
```

### Image Optimization
```tsx
import Image from 'next/image'

<Image
  src="/pilot-photo.jpg"
  alt="Pilot"
  width={200}
  height={200}
  loading="lazy"
/>
```

Supported formats: WebP, AVIF (configured in `next.config.js`)

## Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled. Policies enforce:
- Authenticated users can read data
- Admins can insert/update/delete
- Managers have elevated permissions
- Users have read-only access

### Protected Routes

Middleware (`middleware.ts`) handles authentication:
- Public routes: `/`, `/auth/*`
- Protected routes: `/dashboard/*` (requires authentication)
- Admin routes: `/dashboard/admin/*` (requires admin role)

### Environment Variables

- Never commit `.env.local` to git
- Client-side vars: `NEXT_PUBLIC_*` prefix
- Server-side vars: No prefix (keep sensitive)

## Development Workflow

### Feature Development Process

1. **Create Feature Branch**:
   ```bash
   git checkout -b feature/pilot-dashboard
   ```

2. **Implement Service Layer First**:
   ```bash
   # Create service file
   touch lib/services/pilot-service.ts
   # Implement CRUD operations
   ```

3. **Add Types** (if new tables/columns):
   ```bash
   npm run db:types
   ```

4. **Build UI Components**:
   ```bash
   # Add shadcn component if needed
   npx shadcn@latest add dialog
   # Create custom component
   # Add Storybook story
   ```

5. **Write Tests**:
   ```bash
   # Create E2E test
   touch e2e/pilot-dashboard.spec.ts
   # Run tests
   npm test
   ```

6. **Run Quality Checks**:
   ```bash
   npm run validate
   ```

7. **Commit and Push**:
   ```bash
   git add .
   git commit -m "feat: add pilot dashboard"
   git push origin feature/pilot-dashboard
   ```

### Pre-Commit Hooks

Husky + lint-staged automatically runs:
- ESLint with auto-fix
- Prettier with auto-format
- TypeScript type checking

If checks fail, commit is blocked.

## Deployment

### Vercel Deployment (Recommended)

1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with `git push` to main branch
4. Automatic preview deployments for PRs

### Manual Deployment

```bash
npm run build
npm run start
```

## Troubleshooting

### Common Issues

**Issue**: TypeScript errors about Supabase types
**Solution**: Regenerate types with `npm run db:types`

**Issue**: Middleware errors with cookies
**Solution**: Ensure using `await cookies()` in Next.js 15

**Issue**: Playwright tests failing
**Solution**: Install browsers with `npx playwright install`

**Issue**: Husky hooks not running
**Solution**: Reinstall hooks with `npm run prepare`

**Issue**: Supabase connection fails
**Solution**: Run `node test-connection.mjs` to diagnose

## Additional Resources

- [WORK-PLAN.md](./WORK-PLAN.md) - Comprehensive 9-week implementation plan
- [PROJECT-SUMMARY.md](./PROJECT-SUMMARY.md) - Project overview and tech stack
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [SETUP.md](./SETUP.md) - Detailed setup instructions
- [air-niugini-pms/CLAUDE.md](../air-niugini-pms/CLAUDE.md) - Reference implementation details

## Key Differences from air-niugini-pms v1

| Aspect | v1 (air-niugini-pms) | v2 (fleet-management-v2) |
|--------|----------------------|--------------------------|
| Next.js | 14.2.33 | 15.5.4 |
| React | 18.3.1 | 19.1.0 |
| Build System | Webpack | Turbopack |
| Tailwind CSS | 3.4.17 | 4.1.0 |
| Cookie Handling | Sync | Async (`await cookies()`) |
| Component Library | Same (shadcn/ui) | Same (shadcn/ui) |
| Database | Same (Supabase) | Same (Supabase) |

---

**Version**: 1.0.0
**Last Updated**: October 17, 2025
**Maintainer**: Maurice (Skycruzer)
