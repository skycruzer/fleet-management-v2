# Fleet Management V2 - BMad Integration Summary

**Generated**: October 21, 2025
**Project**: Fleet Management V2 (B767 Pilot Management System)
**Author**: Maurice (Skycruzer)
**Version**: 0.1.0 (Active Development)

---

## 🎯 Project Overview

**Fleet Management V2** is a modern, production-ready B767 Pilot Management System built with cutting-edge technology and enterprise-grade architecture patterns. This system manages pilot certifications, leave requests, compliance tracking, and analytics for a fleet of 27 pilots with 607 certifications across 34 check types.

### Project Status
- **Stage**: Active Development
- **Environment**: Production Database (wgdmgvonqysflwdiiols)
- **Live Data**: 27 pilots, 607 certifications, 34 check types
- **Build Status**: ✅ Passing
- **Type Safety**: ✅ Strict TypeScript 5.7.3
- **Tests**: ✅ E2E Coverage with Playwright

---

## 🏗️ Technology Stack

### Core Framework
```json
{
  "framework": "Next.js 15.5.4",
  "runtime": "React 19.1.0",
  "language": "TypeScript 5.7.3",
  "buildTool": "Turbopack"
}
```

### UI & Styling
- **UI Framework**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS v4.1.0 with @tailwindcss/postcss
- **Icons**: Lucide React 0.546.0
- **Themes**: next-themes 0.4.6 (dark/light mode)
- **Animations**: tailwindcss-animate 1.0.7

### State & Data Management
- **Server State**: TanStack Query 5.90.2 with React Query DevTools
- **Data Tables**: TanStack Table 8.21.3
- **Forms**: React Hook Form 7.65.0
- **Validation**: Zod 4.1.12
- **Form Resolvers**: @hookform/resolvers 3.10.0

### Backend & Database
- **Database**: Supabase PostgreSQL (Project: wgdmgvonqysflwdiiols)
- **ORM**: Supabase Client 2.75.1 with SSR 0.7.0
- **Authentication**: Supabase Auth with role-based access control
- **Caching**: Next.js 15 unstable_cache with revalidation
- **Rate Limiting**: Upstash Rate Limit 2.0.6 with Redis 1.35.6

### Testing & Quality
- **E2E Testing**: Playwright 1.55.0
- **Component Dev**: Storybook 8.5.11
- **Linting**: ESLint 9.38.0 with Next.js config
- **Formatting**: Prettier 3.4.2 with Tailwind plugin
- **Git Hooks**: Husky 9.1.7 with lint-staged 16.2.4

### Utilities
- **Date Handling**: date-fns 4.1.0
- **Class Management**: clsx 2.1.1, class-variance-authority 0.7.1, tailwind-merge 3.3.1
- **Security**: isomorphic-dompurify 2.29.0
- **Calendar**: react-day-picker 9.11.1

---

## 📁 Project Structure

```
fleet-management-v2/
├── app/                          # Next.js 15 App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Landing page
│   ├── globals.css              # Tailwind v4 global styles
│   │
│   ├── api/                     # API Routes (13 endpoints)
│   │   ├── analytics/           # Analytics endpoints
│   │   ├── auth/                # Authentication endpoints
│   │   ├── certifications/      # Certification CRUD
│   │   ├── check-types/         # Check type management
│   │   ├── leave-requests/      # Leave request CRUD
│   │   ├── pilots/              # Pilot CRUD operations
│   │   ├── settings/            # System settings
│   │   └── users/               # User management
│   │
│   ├── dashboard/               # Admin Dashboard (Main App)
│   │   ├── page.tsx             # Dashboard home
│   │   ├── pilots/              # Pilot management pages
│   │   ├── certifications/      # Certification pages
│   │   ├── leave/               # Leave management
│   │   ├── analytics/           # Analytics & reports
│   │   └── admin/               # Admin settings
│   │       ├── settings/        # System configuration
│   │       ├── users/           # User management
│   │       └── check-types/     # Check type management
│   │
│   ├── portal/                  # Pilot Self-Service Portal
│   │   ├── dashboard/           # Pilot dashboard
│   │   ├── certifications/      # View certifications
│   │   ├── leave/               # Leave requests
│   │   ├── flights/             # Flight requests
│   │   └── feedback/            # Feedback submission
│   │
│   └── auth/                    # Authentication pages
│       └── login/               # Login page
│
├── components/                  # React Components (62 total)
│   ├── ui/                      # shadcn/ui components
│   ├── forms/                   # Form components
│   ├── layout/                  # Layout components
│   ├── dashboard/               # Dashboard-specific
│   ├── pilots/                  # Pilot components
│   ├── certifications/          # Certification components
│   └── theme-provider.tsx       # Theme context provider
│
├── lib/                         # Core Libraries & Utilities
│   ├── supabase/                # Supabase clients (3 types)
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client
│   │   └── middleware.ts        # Middleware client
│   │
│   ├── services/                # Service Layer (13 services)
│   │   ├── pilot-service.ts              # Pilot CRUD & business logic
│   │   ├── certification-service.ts      # Certification management
│   │   ├── leave-service.ts              # Leave requests
│   │   ├── leave-eligibility-service.ts  # Leave eligibility logic
│   │   ├── expiring-certifications-service.ts  # Expiry tracking
│   │   ├── dashboard-service.ts          # Dashboard aggregations
│   │   ├── analytics-service.ts          # Analytics processing
│   │   ├── pdf-service.ts                # PDF generation
│   │   ├── cache-service.ts              # Performance caching
│   │   ├── audit-service.ts              # Audit logging
│   │   ├── admin-service.ts              # System settings
│   │   ├── user-service.ts               # User management
│   │   └── pilot-portal-service.ts       # Pilot portal operations
│   │
│   ├── utils/                   # Utility functions
│   │   ├── type-guards.ts       # Type validation
│   │   ├── date-utils.ts        # Date calculations
│   │   └── formatting.ts        # Data formatting
│   │
│   ├── hooks/                   # Custom React hooks
│   ├── error-logger.ts          # Error logging utility
│   └── utils.ts                 # General utilities
│
├── types/                       # TypeScript Definitions
│   ├── supabase.ts              # Generated DB types (auto-updated)
│   └── index.ts                 # Custom type definitions
│
├── e2e/                         # Playwright E2E Tests
│   ├── auth.spec.ts             # Authentication tests
│   ├── pilots.spec.ts           # Pilot management tests
│   └── certifications.spec.ts   # Certification tests
│
├── .storybook/                  # Storybook Configuration
│   ├── main.ts                  # Main config
│   └── preview.ts               # Preview config
│
├── supabase/                    # Supabase Configuration
│   └── migrations/              # Database migrations
│
├── docs/                        # Documentation
├── public/                      # Static assets
└── scripts/                     # Automation scripts
```

---

## 🏛️ Architecture Patterns

### 1. Service Layer Architecture (MANDATORY)

**Critical Rule**: All database operations MUST go through service functions. Direct Supabase calls are prohibited.

```typescript
// ✅ CORRECT - Use service layer
import { getPilots } from '@/lib/services/pilot-service'

export async function GET() {
  const pilots = await getPilots()
  return NextResponse.json({ success: true, data: pilots })
}

// ❌ WRONG - Direct Supabase call
const { data } = await supabase.from('pilots').select('*')
```

### 2. Three-Tier Supabase Client Architecture

```
┌─────────────────────────────────────────────┐
│ Browser Client (lib/supabase/client.ts)    │
│ - Use in Client Components ('use client')  │
│ - Cookie-based session management          │
│ - Real-time subscriptions                  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Server Client (lib/supabase/server.ts)     │
│ - Use in Server Components, Actions, APIs  │
│ - SSR with cookie handling                 │
│ - Service layer operations                 │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Middleware Client (lib/supabase/middleware)│
│ - Use in middleware.ts only                │
│ - Request/response session handling        │
│ - Route protection                         │
└─────────────────────────────────────────────┘
```

### 3. Implemented Services (13 Total)

| Service | Responsibility | Location |
|---------|---------------|----------|
| `pilot-service` | Pilot CRUD, captain qualifications, seniority | `lib/services/pilot-service.ts` |
| `certification-service` | Certification tracking and management | `lib/services/certification-service.ts` |
| `leave-service` | Leave request CRUD operations | `lib/services/leave-service.ts` |
| `leave-eligibility-service` | Complex leave eligibility logic (rank-separated) | `lib/services/leave-eligibility-service.ts` |
| `expiring-certifications-service` | Certification expiry calculations | `lib/services/expiring-certifications-service.ts` |
| `dashboard-service` | Dashboard metrics aggregation | `lib/services/dashboard-service.ts` |
| `analytics-service` | Analytics data processing | `lib/services/analytics-service.ts` |
| `pdf-service` | PDF report generation | `lib/services/pdf-service.ts` |
| `cache-service` | Performance caching with TTL | `lib/services/cache-service.ts` |
| `audit-service` | Audit logging for all CRUD operations | `lib/services/audit-service.ts` |
| `admin-service` | System settings and admin operations | `lib/services/admin-service.ts` |
| `user-service` | User management and role assignment | `lib/services/user-service.ts` |
| `pilot-portal-service` | Pilot-facing portal operations | `lib/services/pilot-portal-service.ts` |

### 4. Database Schema

**Core Tables**:
- `pilots` - Pilot profiles and qualifications (27 records)
- `pilot_checks` - Certification records (607 records)
- `check_types` - Check type definitions (34 types)
- `leave_requests` - Leave request tracking
- `audit_logs` - Comprehensive audit trail
- `an_users` - User accounts and roles
- `system_settings` - Configurable system parameters
- `contract_types` - Employment contract types
- `digital_forms` - Form templates and submissions

**Key Features**:
- Row Level Security (RLS) on all tables
- Automated timestamp tracking (created_at, updated_at)
- UUID primary keys
- Foreign key constraints with cascading
- Indexes on frequently queried columns

---

## 🔐 Authentication & Authorization

### Role-Based Access Control (RBAC)

```typescript
// User Roles
type UserRole = 'admin' | 'user' | 'pilot'

// Permission Matrix
const permissions = {
  admin: ['read', 'write', 'delete', 'manage_users', 'system_settings'],
  user: ['read', 'write'],
  pilot: ['read_own', 'request_leave', 'view_certifications']
}
```

### Authentication Flow

```
1. User visits protected route
   ↓
2. Middleware checks session (middleware.ts)
   ↓
3. If authenticated → Allow access
   ↓
4. If not authenticated → Redirect to /auth/login
   ↓
5. After login → Session stored in cookies
   ↓
6. Protected routes check user role via RLS policies
```

---

## 📊 Data Model

### Pilot Entity

```typescript
interface Pilot {
  id: string                    // UUID
  employee_id: string           // Unique employee ID
  first_name: string
  middle_name?: string | null
  last_name: string
  role: 'Captain' | 'First Officer'
  contract_type?: string | null
  nationality?: string | null
  passport_number?: string | null
  date_of_birth?: string | null
  hire_date?: string | null
  retirement_age?: number | null
  email?: string | null
  phone?: string | null
  address?: string | null
  captain_qualifications?: Json | null  // JSONB: line_captain, training_captain, examiner
  created_at: string
  updated_at: string
}
```

### Certification Entity

```typescript
interface PilotCheck {
  id: string                    // UUID
  pilot_id: string              // FK → pilots.id
  check_code: string            // FK → check_types.check_code
  issue_date: string
  expiry_date: string
  remarks?: string | null
  is_current: boolean           // Auto-calculated
  days_until_expiry?: number    // Auto-calculated
  created_at: string
  updated_at: string
}
```

### Leave Request Entity

```typescript
interface LeaveRequest {
  id: string                    // UUID
  pilot_id: string              // FK → pilots.id
  leave_type: string
  start_date: string
  end_date: string
  days_requested: number
  status: 'pending' | 'approved' | 'denied'
  reason?: string | null
  approver_id?: string | null
  approval_date?: string | null
  remarks?: string | null
  created_at: string
  updated_at: string
}
```

---

## 🚀 Key Features

### 1. Pilot Management
- Comprehensive pilot profiles with 14+ data fields
- Captain qualification tracking (line captain, training captain, examiner)
- Seniority calculations based on hire date
- Age and retirement tracking with automated alerts
- Real-time pilot search and filtering

### 2. Certification Tracking
- 607 certifications across 34 check types
- Automated expiry calculations
- Color-coded status indicators (FAA compliant):
  - 🟢 Green: >90 days valid
  - 🟡 Yellow: 30-90 days (expiring soon)
  - 🔴 Red: <30 days or expired
- Bulk certification upload
- PDF certificate generation

### 3. Leave Management
- Rank-separated leave eligibility (Captain vs First Officer)
- Annual leave tracking with accruals
- Request approval workflow
- Leave balance calculations
- Calendar view integration

### 4. Analytics Dashboard
- Real-time fleet metrics:
  - Total pilots by rank
  - Certification compliance %
  - Expiring certifications count
  - Average seniority
  - Retirement forecasts
- Filterable data tables
- Export to PDF/Excel
- Custom date range analysis

### 5. Pilot Self-Service Portal
- View personal certifications
- Submit leave requests
- Check leave balances
- Request additional flights
- Submit feedback forms
- View flight schedules

### 6. Audit Trail
- Comprehensive logging of all CRUD operations
- User action tracking with IP addresses
- Changed field tracking (before/after)
- Compliance reporting
- Export audit logs

---

## 🎨 UI/UX Design

### Design System
- **shadcn/ui**: Component library with Radix UI primitives
- **Tailwind v4**: Utility-first CSS with dark mode
- **Color Scheme**:
  - Primary: Aviation blue (#1E40AF)
  - Success: Green (#10B981)
  - Warning: Yellow (#F59E0B)
  - Danger: Red (#EF4444)
- **Typography**: System fonts with fallbacks
- **Spacing**: 4px base unit (Tailwind scale)

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- Touch-friendly interface
- Optimized data tables for mobile

### Accessibility (a11y)
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Focus indicators
- Color contrast ratios
- ARIA labels and roles

---

## 🧪 Testing Strategy

### E2E Testing (Playwright)

```bash
# Test Coverage
├── Authentication flows
├── Pilot CRUD operations
├── Certification management
├── Leave request workflows
├── Dashboard data integrity
├── Search and filtering
└── Form validations
```

### Component Testing (Storybook)

```bash
# Storybook Stories
├── UI components (buttons, cards, dialogs)
├── Form components (inputs, selects, checkboxes)
├── Layout components (headers, sidebars)
└── Complex components (data tables, charts)
```

---

## 📦 Build & Deployment

### Development
```bash
npm run dev               # Start dev server (http://localhost:3000)
npm run validate          # Type-check + lint + format:check
npm run storybook         # Component development (http://localhost:6006)
```

### Production Build
```bash
npm run build             # Next.js production build with Turbopack
npm run start             # Start production server
```

### Database Operations
```bash
npm run db:types          # Generate TypeScript types from schema
npm run db:migration      # Create new migration
npm run db:deploy         # Deploy migrations to production
```

### Code Quality
```bash
npm run lint              # ESLint checks
npm run lint:fix          # Auto-fix ESLint issues
npm run type-check        # TypeScript validation
npm run format            # Prettier formatting
npm run format:check      # Check formatting only
```

### Testing
```bash
npm test                  # Run all Playwright E2E tests
npm run test:ui           # Playwright UI mode
npm run test:headed       # Tests with visible browser
npm run test:debug        # Debug mode
```

---

## 🔧 Configuration Files

### Key Configurations

| File | Purpose |
|------|---------|
| `next.config.js` | Next.js 15 configuration with Turbopack |
| `tsconfig.json` | TypeScript strict mode config |
| `tailwind.config.ts` | Tailwind v4 configuration |
| `postcss.config.js` | PostCSS with Tailwind plugin |
| `playwright.config.ts` | E2E test configuration |
| `.eslintrc.json` | ESLint rules |
| `.prettierrc` | Code formatting rules |
| `components.json` | shadcn/ui configuration |

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://wgdmgvonqysflwdiiols.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional (Server-only)
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

---

## 🚨 Known Issues & Limitations

### Current Limitations
1. **PDF Generation**: Uses browser-based rendering (consider server-side alternative)
2. **Real-time Updates**: Not yet implemented for pilot certifications
3. **Offline Support**: PWA features not yet implemented
4. **Mobile App**: No native mobile application

### Technical Debt
1. Some duplicate directory structures (app/api/analytics 2, 3, etc.)
2. Consider consolidating service layer types
3. Add comprehensive input validation on all API routes
4. Implement request rate limiting on all endpoints

---

## 🎯 Development Guidelines for BMad

### 1. Always Use Service Layer
```typescript
// Import services from lib/services/
import { getPilots, createPilot } from '@/lib/services/pilot-service'
```

### 2. Type Safety First
```typescript
// Use generated Supabase types
import type { Database } from '@/types/supabase'
type Pilot = Database['public']['Tables']['pilots']['Row']
```

### 3. Error Handling
```typescript
// Use error logger utility
import { logError, ErrorSeverity } from '@/lib/error-logger'

try {
  // operation
} catch (error) {
  logError('Operation failed', { error, severity: ErrorSeverity.ERROR })
}
```

### 4. Authentication Context
```typescript
// Server Components
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

// Client Components
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### 5. Caching Strategy
```typescript
// Use Next.js cache for expensive operations
import { unstable_cache } from 'next/cache'

const getCachedPilots = unstable_cache(
  async () => getPilots(),
  ['pilots'],
  { revalidate: 3600, tags: ['pilots'] }
)
```

---

## 📚 Documentation References

### Internal Documentation
- `CLAUDE.md` - Complete development guide (448 lines)
- `README.md` - Project setup and overview
- `ARCHITECTURE-ANALYSIS-REPORT.md` - System architecture deep dive
- `CODE-REVIEW-TRIAGE-2025-10-17.md` - Code quality analysis
- `DATABASE_OPTIMIZATION.md` - Database performance guide
- `MIGRATION-GUIDE.md` - Migration strategies and guides
- `PROJECT-SUMMARY.md` - High-level project summary
- `WORK-PLAN.md` - Development roadmap

### External Resources
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [TanStack Query](https://tanstack.com/query)
- [Playwright Testing](https://playwright.dev)

---

## 🎓 Learning Resources for BMad Integration

### Recommended Reading Order
1. Start with `CLAUDE.md` - Complete development standards
2. Review `README.md` - Setup and basic commands
3. Explore `lib/services/` - Understand service layer pattern
4. Check `app/api/` - See API route structure
5. Review `components/` - UI component architecture
6. Study `types/supabase.ts` - Database schema understanding

### Key Concepts to Master
1. **Service Layer Pattern** - All DB operations through services
2. **Three-Tier Client Architecture** - Browser, Server, Middleware clients
3. **Type Safety** - Generated types from Supabase schema
4. **Next.js 15 Features** - App Router, Server Actions, Turbopack
5. **shadcn/ui** - Component composition and customization

---

## 🔄 Git Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Emergency fixes

### Commit Conventions
```bash
feat: Add pilot certification upload
fix: Resolve date calculation in leave eligibility
docs: Update API documentation
style: Format code with Prettier
refactor: Simplify pilot service logic
test: Add E2E tests for certification flow
chore: Update dependencies
```

### Pre-commit Hooks (Husky + lint-staged)
- ESLint auto-fix
- Prettier formatting
- Type checking
- Test validation (if applicable)

---

## 📊 Project Metrics

### Codebase Statistics
- **Total Components**: 62
- **Service Layer**: 13 services
- **API Endpoints**: 13 routes
- **Database Tables**: 9 core tables
- **E2E Tests**: Comprehensive coverage
- **Storybook Stories**: UI component library

### Production Data
- **Pilots**: 27 active pilots
- **Certifications**: 607 certification records
- **Check Types**: 34 different check types
- **Users**: Multi-role user base

### Performance Targets
- **Time to Interactive (TTI)**: <2 seconds
- **First Contentful Paint (FCP)**: <1 second
- **Largest Contentful Paint (LCP)**: <2.5 seconds
- **API Response Time**: <500ms (90th percentile)

---

## 🎯 BMad Integration Recommendations

### 1. Agent Configuration
Configure BMad agents to understand:
- Service layer pattern (mandatory)
- Supabase client architecture (3 types)
- Type safety requirements (strict mode)
- Aviation industry standards (FAA compliance)

### 2. Workflow Automation
Suggested workflows for BMad:
- **New Feature**: Plan → Service → API → UI → Test
- **Bug Fix**: Investigate → Service → Test → Deploy
- **Refactor**: Analyze → Service Layer → Validate
- **Database**: Schema → Migration → Types → Service Update

### 3. Code Generation Templates
BMad should understand these patterns:
```typescript
// Service function template
export async function getEntity(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// API route template
export async function GET(request: Request) {
  try {
    const data = await getEntity(id)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch' },
      { status: 500 }
    )
  }
}
```

### 4. Quality Gates
BMad should enforce:
- ✅ All DB operations through services
- ✅ Type safety with generated types
- ✅ Error handling in all async operations
- ✅ Audit logging for CRUD operations
- ✅ Input validation with Zod schemas
- ✅ Test coverage for new features

---

## 📞 Support & Contact

**Project Maintainer**: Maurice (Skycruzer)
**Project Location**: `/Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2`
**Supabase Project**: wgdmgvonqysflwdiiols

### Getting Help
1. Review this summary document
2. Check `CLAUDE.md` for detailed guidance
3. Explore existing code in `lib/services/`
4. Run `npm run validate` before committing
5. Test with `npm test` before deploying

---

**Generated for BMad Method Integration**
**Last Updated**: October 21, 2025
**Document Version**: 1.0.0
