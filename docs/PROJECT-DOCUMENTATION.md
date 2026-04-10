# Fleet Management V2 - Comprehensive Project Documentation

**Version**: 2.0.0
**Last Updated**: October 27, 2025
**Author**: Maurice (Skycruzer)
**Status**: Production-Ready

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Service Layer](#service-layer)
6. [Authentication Systems](#authentication-systems)
7. [Database Schema](#database-schema)
8. [API Structure](#api-structure)
9. [Frontend Structure](#frontend-structure)
10. [Business Logic](#business-logic)
11. [Testing Strategy](#testing-strategy)
12. [Deployment](#deployment)
13. [Development Workflow](#development-workflow)
14. [Key Features](#key-features)

---

## Executive Summary

Fleet Management V2 is a modern, production-ready B767 Pilot Management System built with Next.js 16, React 19, and TypeScript 5.7. The system manages 27 pilots, 607 certifications, and 34 check types through a comprehensive service-layer architecture with dual authentication systems.

**Key Metrics:**

- 30+ service layer functions
- 67 API routes
- 24 E2E test suites
- 14 validation schemas
- 3,837 lines of generated database types
- Dual authentication system (Admin + Pilot Portal)
- PWA-enabled with offline support

---

## Project Overview

### Purpose

Fleet Management V2 provides comprehensive pilot management capabilities including:

- Pilot certification tracking with FAA compliance
- Leave request management with intelligent eligibility checking
- Flight request submissions
- Disciplinary action tracking
- Retirement forecasting
- Analytics and reporting
- Pilot portal for self-service operations

### Key Stakeholders

- **Fleet Managers**: Admin dashboard for complete fleet oversight
- **Pilots**: Self-service portal for personal data, requests, and notifications
- **System Administrators**: User management, settings, and security controls

### Project Structure

```
fleet-management-v2/
├── app/                      # Next.js 16 App Router
│   ├── api/                  # 67 API routes (22 categories)
│   ├── dashboard/            # Admin dashboard (15 sections)
│   ├── portal/               # Pilot portal (separate auth)
│   ├── auth/                 # Admin authentication pages
│   └── sw.ts                 # Service worker (PWA)
│
├── components/               # React components (200+ components)
│   ├── ui/                   # shadcn/ui components (40+)
│   ├── portal/               # Pilot portal components
│   ├── forms/                # Form components with validation
│   ├── layout/               # Layout components
│   └── dashboard/            # Dashboard widgets
│
├── lib/                      # Core utilities
│   ├── services/             # 30+ service layer functions
│   ├── supabase/             # Supabase clients (3 types)
│   ├── utils/                # Utility functions
│   └── validations/          # 14 Zod validation schemas
│
├── types/                    # TypeScript definitions
│   └── supabase.ts           # Generated database types (3,837 lines)
│
├── e2e/                      # 24 Playwright E2E test suites
├── supabase/                 # Database migrations
└── public/                   # Static assets (PWA icons, manifest)
```

---

## Technology Stack

### Core Technologies

| Technology       | Version | Purpose                                    |
| ---------------- | ------- | ------------------------------------------ |
| **Next.js**      | 16.0.0  | Full-stack React framework with App Router |
| **React**        | 19.1.0  | UI library with Server Components          |
| **TypeScript**   | 5.7.3   | Type-safe development (strict mode)        |
| **Tailwind CSS** | 4.1.0   | Utility-first styling framework            |
| **Supabase**     | 2.75.1  | PostgreSQL database + Auth + Storage       |

### Key Libraries

#### State Management & Data Fetching

- **TanStack Query** (5.90.2) - Server state management, caching, and synchronization
- **React Hook Form** (7.65.0) - Form state management with performance optimization
- **Zod** (4.1.12) - Schema validation for forms and API

#### UI Components

- **shadcn/ui** - 40+ Radix UI components with Tailwind styling
- **Lucide React** (0.546.0) - Icon library (3,000+ icons)
- **Framer Motion** (12.23.24) - Animation library
- **Tremor React** (3.18.7) - Dashboard charts and analytics components

#### Development & Testing

- **Playwright** (1.56.1) - End-to-end testing (24 test suites)
- **Storybook** (8.5.11) - Component development and documentation
- **ESLint** (9.38.0) - Code linting with TypeScript support
- **Prettier** (3.4.2) - Code formatting with Tailwind plugin
- **Husky** (9.1.7) - Git hooks for pre-commit validation

#### Production Features

- **@serwist/next** (9.2.1) - PWA service worker with intelligent caching
- **@logtail/node** & **@logtail/browser** (0.5.6) - Better Stack error logging
- **@upstash/ratelimit** (2.0.6) - Redis-based rate limiting
- **Resend** (6.2.2) - Email notifications for certifications
- **jsPDF** (3.0.3) - PDF report generation

#### Utilities

- **date-fns** (4.1.0) - Date manipulation and roster period calculations
- **bcrypt** (6.0.0) - Password hashing for pilot portal
- **clsx** + **tailwind-merge** - Conditional CSS class management
- **isomorphic-dompurify** (2.29.0) - XSS protection for user inputs

### Build System

- **Turbopack** - Built-in Next.js 16 bundler (faster than Webpack)
- **PostCSS** (8.5.1) - CSS processing for Tailwind
- **esbuild** - Fast JavaScript bundling

---

## Architecture

### System Architecture

Fleet Management V2 follows a **service-layer architecture** pattern where all database operations flow through dedicated service functions. This ensures:

- Consistent data access patterns
- Centralized business logic
- Type safety across the stack
- Easier testing and maintenance

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────────────────┐      ┌─────────────────────────┐  │
│  │  Admin Dashboard     │      │    Pilot Portal         │  │
│  │  (Supabase Auth)     │      │  (Custom Auth)          │  │
│  └──────────────────────┘      └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Routes (67)                         │
│  /api/pilots  /api/certifications  /api/portal/*            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer (30+)                        │
│  pilot-service  certification-service  leave-service  etc.   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase PostgreSQL                         │
│  pilots  certifications  leave_requests  pilot_users  etc.   │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns

#### 1. Service Layer Pattern (MANDATORY)

All database operations MUST use service functions:

```typescript
// ✅ CORRECT - Use service layer
import { getPilots } from '@/lib/services/pilot-service'

export async function GET() {
  const pilots = await getPilots()
  return NextResponse.json({ success: true, data: pilots })
}

// ❌ WRONG - Direct Supabase call (bypasses service layer)
const { data } = await supabase.from('pilots').select('*')
```

#### 2. Async Server Components (Next.js 16)

All server components use async/await for data fetching:

```typescript
export default async function PilotsPage() {
  const supabase = await createClient()
  const { data: pilots } = await supabase.from('pilots').select('*')

  return <PilotList pilots={pilots} />
}
```

#### 3. Validation Schema Pattern

All forms and API routes use Zod schemas for validation:

```typescript
// Define schema
export const PilotCreateSchema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  rank: z.enum(['Captain', 'First Officer']),
})

// Use in form
const form = useForm({
  resolver: zodResolver(PilotCreateSchema),
})

// Use in API
const validated = PilotCreateSchema.parse(body)
```

#### 4. Repository Pattern (Service Layer)

Each service module encapsulates database operations:

```typescript
// lib/services/pilot-service.ts
export async function getPilots() {
  /* implementation */
}
export async function getPilotById(id: string) {
  /* implementation */
}
export async function createPilot(data) {
  /* implementation */
}
export async function updatePilot(id, data) {
  /* implementation */
}
export async function deletePilot(id) {
  /* implementation */
}
```

---

## Service Layer

The service layer is the **core architectural component** that encapsulates all business logic and database operations.

### Service Architecture

**Total Services**: 30 service modules
**Location**: `lib/services/`
**Pattern**: Server-only, async functions with type safety

### Core Services

#### 1. Pilot Management (4 services)

- **pilot-service.ts** - Pilot CRUD, seniority calculations, captain qualifications
- **pilot-portal-service.ts** - Pilot authentication and portal operations
- **pilot-registration-service.ts** - Pilot registration approval workflow
- **pilot-email-service.ts** - Email notifications for pilots

#### 2. Certification Management (4 services)

- **certification-service.ts** - Certification CRUD and tracking
- **certification-renewal-planning-service.ts** - Renewal planning and scheduling
- **expiring-certifications-service.ts** - FAA color coding and expiry calculations
- **check-types-service.ts** - Check type definitions and management

#### 3. Leave Management (5 services)

- **leave-service.ts** - Leave request CRUD and roster period alignment
- **leave-eligibility-service.ts** - Complex eligibility logic (43KB, most critical)
- **leave-bid-service.ts** - Annual leave bid submissions
- **leave-stats-service.ts** - Leave statistics and reporting
- **pilot-leave-service.ts** - Pilot-specific leave operations

#### 4. Flight & Task Management (3 services)

- **flight-request-service.ts** - Flight request submissions
- **pilot-flight-service.ts** - Pilot-specific flight operations
- **task-service.ts** - Task management operations

#### 5. Analytics & Reporting (5 services)

- **dashboard-service.ts** - Dashboard metrics aggregation
- **analytics-service.ts** - Analytics data processing
- **pdf-service.ts** - PDF report generation
- **renewal-planning-pdf-service.ts** - Renewal plan PDFs
- **retirement-forecast-service.ts** - Retirement planning

#### 6. System Services (9 services)

- **admin-service.ts** - System settings and admin operations
- **user-service.ts** - User management and role assignment
- **audit-service.ts** - Audit logging for all CRUD operations
- **cache-service.ts** - Performance caching with TTL
- **logging-service.ts** - Better Stack (Logtail) integration
- **notification-service.ts** - In-app notification management
- **disciplinary-service.ts** - Disciplinary action tracking
- **succession-planning-service.ts** - Succession planning for key positions
- **pilot-feedback-service.ts** - Pilot feedback submissions

### Service Implementation Pattern

All services follow a consistent implementation pattern:

```typescript
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

export async function serviceFunction() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.from('table_name').select('*')

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error in serviceFunction:', error)
    throw error
  }
}
```

**Key Characteristics**:

- Server-only execution (`'use server'` implicit via Next.js 16)
- Async Supabase client creation
- Type-safe with generated database types
- Consistent error handling
- Business logic encapsulation

### Critical Service: leave-eligibility-service.ts

The most complex service (43KB) handles rank-separated leave eligibility logic:

**Key Features**:

- Evaluates Captains and First Officers independently
- Maintains minimum crew requirements (10 per rank)
- Seniority-based approval priority
- 28-day roster period alignment
- Conflict detection and alternative recommendations

**Functions**:

- `getCrewRequirements()` - Crew minimums from settings
- `calculateCrewAvailability()` - Day-by-day availability
- `getConflictingPendingRequests()` - Seniority-based conflicts
- `checkLeaveEligibility()` - Main eligibility calculation
- `getAlternativePilotRecommendations()` - Seniority alternatives
- `checkBulkLeaveEligibility()` - Roster period bulk validation

---

## Authentication Systems

Fleet Management V2 implements **dual authentication systems** for different user types.

### System Overview

| System           | Users           | Auth Method     | Session        | Routes         |
| ---------------- | --------------- | --------------- | -------------- | -------------- |
| **Admin Portal** | Managers, Staff | Supabase Auth   | Cookie-based   | `/dashboard/*` |
| **Pilot Portal** | Pilots          | Custom (bcrypt) | Custom session | `/portal/*`    |

### 1. Admin Portal Authentication

**Technology**: Supabase Auth (default authentication)
**Client**: `lib/supabase/server.ts` and `lib/supabase/client.ts`
**Users**: Admin staff, managers, system administrators

#### Admin Auth Flow

```
1. User visits /auth/login
2. Submits email + password
3. Supabase Auth validates credentials
4. Creates secure session with JWT
5. Middleware refreshes session on each request
6. User accesses /dashboard/* routes
```

#### Implementation

```typescript
// Server-side (Server Components, API Routes)
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')
  // Render dashboard
}

// Client-side (Client Components)
import { createClient } from '@/lib/supabase/client'

function LogoutButton() {
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }
}
```

#### Supabase Client Types

**1. Server Client** (`lib/supabase/server.ts`):

- Use in Server Components, Server Actions, Route Handlers
- SSR-compatible with Next.js 16 async cookies
- Automatic session refresh
- Custom 30-second timeout for reliability

**2. Browser Client** (`lib/supabase/client.ts`):

- Use in Client Components (`'use client'`)
- Cookie-based session management
- Real-time subscriptions support

**3. Middleware Client** (`lib/supabase/middleware.ts`):

- Handles authentication state across requests
- Session refresh and cookie management
- Protected route enforcement

### 2. Pilot Portal Authentication

**Technology**: Custom authentication using `pilot_users` table
**Service**: `lib/services/pilot-portal-service.ts`
**Users**: Pilots (linked to `pilots` table via `employee_number`)

#### Pilot Auth Flow

```
1. Pilot visits /portal/login
2. Submits email + password
3. pilotLogin() service validates against pilot_users table
4. bcrypt verifies password hash
5. Creates custom session cookie
6. Pilot accesses /portal/* routes
```

#### Implementation

```typescript
// lib/services/pilot-portal-service.ts
export async function pilotLogin(credentials: PilotLoginInput) {
  const supabase = await createClient()
  const bcrypt = require('bcrypt')

  // Find pilot user by email
  const { data: pilotUser, error } = await supabase
    .from('pilot_users')
    .select('id, email, password_hash, registration_approved')
    .eq('email', credentials.email)
    .single()

  if (error || !pilotUser) {
    return { success: false, error: 'Invalid credentials' }
  }

  // Check registration approval
  if (!pilotUser.registration_approved) {
    return { success: false, error: 'Account pending approval' }
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(credentials.password, pilotUser.password_hash)

  if (!isValidPassword) {
    return { success: false, error: 'Invalid credentials' }
  }

  // Create session
  return {
    success: true,
    data: {
      user: pilotUser,
      session: {
        /* ... */
      },
    },
  }
}
```

#### Pilot Registration Flow

```
1. Pilot visits /portal/register
2. Fills registration form (validated with Zod)
3. Password hashed with bcrypt
4. Account created with status: pending_approval
5. Admin reviews registration at /dashboard/admin/pilot-registrations
6. Admin approves → Pilot can login
7. Admin denies → Pilot notified
```

#### Key Features

- **Aviation-themed UI**: Friendly crew terminology and airline-style design
- **Approval workflow**: All registrations require admin approval
- **Secure password storage**: bcrypt hashing with salt rounds
- **Isolation**: Completely separate from admin Supabase Auth
- **Linked accounts**: Pilots linked to `pilots` table via `employee_number`

### Important: Never Mix Authentication Systems

```typescript
// ❌ WRONG - Using admin auth for pilot portal
// File: app/api/portal/something/route.ts
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const {
  data: { user },
} = await supabase.auth.getUser() // Wrong!

// ✅ CORRECT - Using pilot auth for pilot portal
// File: app/api/portal/something/route.ts
import { verifyPilotSession } from '@/lib/services/pilot-portal-service'
const session = await verifyPilotSession(request) // Correct!

// ✅ CORRECT - Using admin auth for admin dashboard
// File: app/api/pilots/route.ts
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const {
  data: { user },
} = await supabase.auth.getUser() // Correct!
```

---

## Database Schema

**Platform**: Supabase PostgreSQL
**Project ID**: `wgdmgvonqysflwdiiols`
**Generated Types**: 3,837 lines (`types/supabase.ts`)

### Main Tables

#### Core Tables

**pilots** (27 records)

- Pilot profiles, qualifications, seniority
- Columns: `id`, `employee_number`, `first_name`, `last_name`, `rank`, `commencement_date`, `qualifications` (JSONB), `status`, `retirement_date`
- Relationships: Has many `pilot_checks`, `leave_requests`, `flight_requests`

**pilot_checks** (607 records)

- Certification records (historical tracking)
- Columns: `id`, `pilot_id`, `check_type_id`, `check_date`, `expiry_date`, `issue_date`, `status`
- Relationships: Belongs to `pilots`, `check_types`

**check_types** (34 records)

- Check type definitions (Line Check, Sim Check, Medical, etc.)
- Columns: `id`, `check_code`, `description`, `validity_period`, `category`

**pilot_users** (Authentication table for pilot portal)

- Custom authentication for pilots
- Columns: `id`, `email`, `password_hash`, `employee_number`, `registration_approved`, `first_name`, `last_name`, `rank`
- Relationships: Linked to `pilots` via `employee_number`

#### Request Tables

**leave_requests**

- Leave request submissions and approvals
- Columns: `id`, `pilot_id`, `leave_type`, `start_date`, `end_date`, `status`, `roster_period`, `submitted_at`, `approved_by`
- Leave types: RDO, SDO, ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE

**leave_bids**

- Annual leave preference bidding
- Columns: `id`, `pilot_id`, `year`, `status`, `submitted_at`
- Relationships: Has many `leave_bid_options`

**leave_bid_options**

- Individual leave bid preferences (up to 10 per pilot)
- Columns: `id`, `leave_bid_id`, `start_date`, `end_date`, `priority`, `roster_period`

**flight_requests**

- Flight request submissions
- Columns: `id`, `pilot_id`, `request_type`, `start_date`, `end_date`, `status`, `notes`
- Types: RDO (Rostered Day Off), SDO (Special Day Off), Training, Other

#### System Tables

**contract_types** (3 records)

- Contract type definitions
- Types: Full-time, Part-time, Casual

**disciplinary_actions**

- Disciplinary record tracking
- Columns: `id`, `pilot_id`, `action_type`, `description`, `date`, `resolved`, `resolved_date`

**tasks**

- Task management system
- Columns: `id`, `title`, `description`, `assigned_to`, `due_date`, `status`, `priority`

**notifications**

- In-app notification system
- Columns: `id`, `user_id`, `title`, `message`, `type`, `read`, `created_at`

**audit_logs**

- Comprehensive audit trail
- Columns: `id`, `user_id`, `action`, `table_name`, `record_id`, `old_values` (JSONB), `new_values` (JSONB), `timestamp`

### Database Views (Read-Only)

**expiring_checks**

- Simplified expiring certifications
- Aggregates pilots with upcoming expiries

**detailed_expiring_checks**

- Detailed certification expiry data with FAA color coding
- Used by dashboard and alerts

**compliance_dashboard**

- Fleet-wide compliance metrics
- Real-time compliance percentage calculations

**pilot_report_summary**

- Comprehensive pilot summaries
- Used for PDF report generation

**captain_qualifications_summary**

- Captain qualification tracking
- Line Captain, Training Captain, Examiner, RHS Captain

**dashboard_metrics**

- Real-time dashboard statistics
- Cached for performance

### Database Functions

**calculate_years_to_retirement(pilot_id UUID)**

- Returns: INTEGER (years until retirement)
- Calculation: 65 - current age

**calculate_years_in_service(pilot_id UUID)**

- Returns: INTEGER (years in service)
- Calculation: Current date - commencement_date

**get_fleet_compliance_summary()**

- Returns: JSON (compliance percentage, expired count, expiring count)
- Used by dashboard for real-time metrics

**get_fleet_expiry_statistics()**

- Returns: JSON (expiry distribution by month)
- Used by analytics dashboard

**get_pilot_dashboard_metrics(pilot_id UUID)**

- Returns: JSON (pilot-specific metrics)
- Used by pilot portal dashboard

### Row Level Security (RLS)

**All tables have RLS enabled** with policies enforcing:

- Authenticated users can read data
- Admins can insert/update/delete
- Managers have elevated permissions
- Pilots have read-only access to their own data

**Example RLS Policy**:

```sql
-- Pilots can only view their own leave requests
CREATE POLICY "pilots_read_own_leave_requests"
ON leave_requests FOR SELECT
TO authenticated
USING (pilot_id = auth.uid());

-- Admins can view all leave requests
CREATE POLICY "admins_read_all_leave_requests"
ON leave_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

### Type Generation

After any database schema changes, regenerate types:

```bash
npm run db:types
```

This generates `types/supabase.ts` (3,837 lines) with complete type definitions for all tables, views, functions, and enums.

---

## API Structure

**Total API Routes**: 67 routes across 22 categories
**Location**: `app/api/`
**Pattern**: Next.js 16 Route Handlers with service layer

### API Categories

#### 1. Pilot Management (3 routes)

- `POST /api/pilots` - Create pilot
- `GET /api/pilots` - List pilots
- `GET /api/pilots/[id]` - Get pilot by ID
- `PUT /api/pilots/[id]` - Update pilot
- `DELETE /api/pilots/[id]` - Delete pilot

#### 2. Certification Management (3 routes)

- `POST /api/certifications` - Create certification
- `GET /api/certifications` - List certifications
- `GET /api/certifications/[id]` - Get certification
- `PUT /api/certifications/[id]` - Update certification
- `DELETE /api/certifications/[id]` - Delete certification

#### 3. Leave Management (4 routes)

- `POST /api/leave-requests` - Create leave request
- `GET /api/leave-requests` - List leave requests
- `GET /api/leave-requests/[id]` - Get leave request
- `PUT /api/leave-requests/[id]` - Update/approve leave request
- `GET /api/leave-stats` - Leave statistics

#### 4. Portal API (10 routes - Pilot Portal)

- `POST /api/portal/login` - Pilot login
- `POST /api/portal/logout` - Pilot logout
- `POST /api/portal/register` - Pilot registration
- `GET /api/portal/profile` - Get pilot profile
- `PUT /api/portal/profile` - Update pilot profile
- `GET /api/portal/certifications` - Get pilot certifications
- `POST /api/portal/leave-requests` - Submit leave request
- `POST /api/portal/flight-requests` - Submit flight request
- `POST /api/portal/feedback` - Submit feedback
- `POST /api/portal/leave-bids` - Submit leave bid

#### 5. Analytics & Reporting (5 routes)

- `GET /api/analytics/crew-shortage-predictions` - Crew shortage forecasts
- `GET /api/analytics/multi-year-forecast` - Multi-year forecasting
- `GET /api/analytics/succession-pipeline` - Succession planning data
- `GET /api/analytics/export` - Export analytics data
- `GET /api/dashboard` - Dashboard metrics

#### 6. System Management (8+ routes)

- `GET /api/admin` - Admin operations
- `GET /api/audit` - Audit logs
- `GET /api/settings` - System settings
- `GET /api/tasks` - Task management
- `GET /api/users` - User management
- `GET /api/retirement` - Retirement forecasting
- `GET /api/disciplinary` - Disciplinary actions
- `GET /api/renewal-planning` - Certification renewal planning

### API Implementation Pattern

All API routes follow this pattern:

```typescript
// app/api/pilots/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getPilots, createPilot } from '@/lib/services/pilot-service'
import { PilotCreateSchema } from '@/lib/validations/pilot-validation'
import { revalidatePath } from 'next/cache'

// GET /api/pilots
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const pilots = await getPilots() // Use service layer

    return NextResponse.json({ success: true, data: pilots })
  } catch (error) {
    console.error('Error fetching pilots:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/pilots
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate with Zod
    const validated = PilotCreateSchema.parse(body)

    // Use service layer
    const pilot = await createPilot(validated)

    // Revalidate affected paths
    revalidatePath('/dashboard/pilots')

    return NextResponse.json({ success: true, data: pilot }, { status: 201 })
  } catch (error) {
    console.error('Error creating pilot:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
```

### API Best Practices

**1. Authentication Check First**

```typescript
const {
  data: { user },
} = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

**2. Validate Input with Zod**

```typescript
const validated = PilotCreateSchema.parse(body) // Throws if invalid
```

**3. Use Service Layer**

```typescript
const pilots = await getPilots() // Never call Supabase directly
```

**4. Cache Invalidation After Mutations**

```typescript
revalidatePath('/dashboard/pilots') // Refresh cache after POST/PUT/DELETE
```

**5. Consistent Error Handling**

```typescript
try {
  // Operation
} catch (error) {
  console.error('Error:', error)
  return NextResponse.json({ success: false, error: 'Message' }, { status: 500 })
}
```

### API Response Format

All API routes return consistent JSON responses:

```typescript
// Success response
{
  "success": true,
  "data": { /* payload */ }
}

// Error response
{
  "success": false,
  "error": "Error message"
}

// Paginated response
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Frontend Structure

**Total Components**: 200+ React components
**UI Library**: shadcn/ui (40+ Radix UI components)
**Styling**: Tailwind CSS 4.1.0 with custom theme

### Dashboard Structure (Admin Portal)

**Location**: `app/dashboard/`
**Layout**: Professional sidebar navigation with mobile-responsive design
**Sections**: 15 main sections

#### Dashboard Sections

1. **Overview** (`/dashboard`) - Fleet metrics, compliance cards, urgent alerts
2. **Pilots** (`/dashboard/pilots`) - Pilot list, CRUD operations, seniority tracking
3. **Certifications** (`/dashboard/certifications`) - Certification management, FAA tracking
4. **Leave Management** (`/dashboard/leave`) - Leave requests, calendar view, approval workflow
5. **Flight Requests** (`/dashboard/flight-requests`) - Flight request submissions and approvals
6. **Renewal Planning** (`/dashboard/renewal-planning`) - Certification renewal schedules
7. **Analytics** (`/dashboard/analytics`) - Fleet analytics, crew forecasting, charts
8. **Audit Logs** (`/dashboard/audit-logs`) - Comprehensive audit trail with filtering
9. **Disciplinary** (`/dashboard/disciplinary`) - Disciplinary action tracking
10. **Tasks** (`/dashboard/tasks`) - Task management system
11. **Feedback** (`/dashboard/feedback`) - Pilot feedback submissions
12. **FAQs** (`/dashboard/faqs`) - Frequently asked questions
13. **Support** (`/dashboard/support`) - Support ticket system
14. **Settings** (`/dashboard/settings`) - System settings and preferences
15. **Admin** (`/dashboard/admin`) - User management, pilot registrations, check types

### Pilot Portal Structure

**Location**: `app/portal/`
**Layout**: Aviation-themed design with friendly crew terminology
**Access**: Custom authentication via `pilot_users` table

#### Portal Sections (Protected)

1. **Dashboard** (`/portal/dashboard`) - Personal stats, upcoming checks, leave balance
2. **Profile** (`/portal/profile`) - Personal information, contact details
3. **Certifications** (`/portal/certifications`) - View personal certifications
4. **Leave Requests** (`/portal/leave-requests`) - Submit and track leave requests
5. **Flight Requests** (`/portal/flight-requests`) - Submit flight requests
6. **Feedback** (`/portal/feedback`) - Submit feedback to management
7. **Notifications** (`/portal/notifications`) - In-app notifications

#### Portal Pages (Public)

1. **Login** (`/portal/login`) - Pilot login with email + password
2. **Register** (`/portal/register`) - Pilot registration (requires approval)
3. **Forgot Password** (`/portal/forgot-password`) - Password reset flow
4. **Reset Password** (`/portal/reset-password`) - Set new password

### Component Organization

```
components/
├── ui/                           # shadcn/ui components (40+)
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── table.tsx
│   ├── card.tsx
│   ├── select.tsx
│   └── ... (35+ more)
│
├── portal/                       # Pilot portal components
│   ├── dashboard-stats.tsx
│   ├── feedback-form.tsx
│   ├── flight-request-form.tsx
│   ├── leave-request-form.tsx
│   ├── leave-bid-form.tsx
│   ├── notification-bell.tsx
│   └── portal-toast-handler.tsx
│
├── dashboard/                    # Admin dashboard components
│   ├── compliance-overview-client.tsx
│   ├── dashboard-content.tsx
│   ├── hero-stats-client.tsx
│   ├── roster-period-carousel.tsx
│   ├── expiring-certifications-banner.tsx
│   ├── urgent-alert-banner.tsx
│   ├── pilot-requirements-card.tsx
│   └── retirement-forecast-card.tsx
│
├── forms/                        # Reusable form components
│   ├── form-date-picker-wrapper.tsx
│   ├── leave-request-form.tsx
│   └── ... (10+ forms)
│
├── layout/                       # Layout components
│   ├── professional-header.tsx
│   ├── professional-sidebar.tsx
│   ├── professional-sidebar-client.tsx
│   ├── pilot-portal-sidebar.tsx
│   └── mobile-nav.tsx
│
├── pilot/                        # Pilot-specific components
│   ├── PilotDashboardContent.tsx
│   ├── PilotLoginForm.tsx
│   ├── PilotRegisterForm.tsx
│   ├── FlightRequestForm.tsx
│   └── LeaveRequestForm.tsx
│
├── leave/                        # Leave management components
│   ├── leave-request-group.tsx
│   ├── leave-calendar.tsx
│   └── leave-requests-client.tsx
│
├── audit/                        # Audit log components
│   ├── AuditLogTable.tsx
│   ├── AuditLogDetail.tsx
│   ├── AuditLogTimeline.tsx
│   ├── ApprovalWorkflowCard.tsx
│   └── ChangeComparisonView.tsx
│
├── renewal-planning/             # Renewal planning components
│   ├── renewal-planning-dashboard.tsx
│   └── email-renewal-plan-button.tsx
│
├── admin/                        # Admin-specific components
│   ├── admin-dashboard-client.tsx
│   ├── leave-bid-review-table.tsx
│   ├── leave-bid-annual-calendar.tsx
│   └── search-input.tsx
│
└── ... (100+ more components)
```

### Key Component Patterns

#### 1. Server vs Client Components

**Server Components** (default, fetch data server-side):

```typescript
// app/dashboard/pilots/page.tsx
export default async function PilotsPage() {
  const pilots = await getPilots() // Server-side data fetching

  return <PilotList pilots={pilots} />
}
```

**Client Components** (interactive, use hooks):

```typescript
'use client'

export function PilotForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm({ /* ... */ })

  return <form onSubmit={form.handleSubmit}>...</form>
}
```

#### 2. Form Components with React Hook Form + Zod

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PilotCreateSchema } from '@/lib/validations/pilot-validation'

export function PilotForm() {
  const form = useForm({
    resolver: zodResolver(PilotCreateSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      rank: 'Captain'
    }
  })

  const onSubmit = async (data) => {
    const response = await fetch('/api/pilots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    // Handle response
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  )
}
```

#### 3. Data Tables with TanStack Table

```typescript
'use client'

import { useReactTable, getCoreRowModel } from '@tanstack/react-table'

export function PilotTable({ pilots }) {
  const table = useReactTable({
    data: pilots,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  return (
    <Table>
      {/* Render table */}
    </Table>
  )
}
```

### Styling with Tailwind CSS

**Theme Configuration**: `tailwind.config.ts`

```typescript
export default {
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... (20+ color tokens)
      },
    },
  },
}
```

**CSS Variables**: `app/globals.css`

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    /* ... (50+ CSS variables) */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... (dark mode overrides) */
  }
}
```

---

## Business Logic

Fleet Management V2 implements complex business rules for aviation fleet management.

### 1. Roster Period System (28-Day Cycles)

**Overview**: Leave requests operate on 28-day roster periods (RP1-RP13 annual cycle).

**Key Rules**:

- Each roster period is exactly 28 days
- Annual cycle: RP1 through RP13 (13 periods per year)
- Known anchor: **RP12/2025 starts October 11, 2025**
- After RP13/YYYY → automatically rolls to RP1/(YYYY+1)
- All leave requests must align to roster period boundaries

**Implementation**: `lib/utils/roster-utils.ts`

```typescript
export function getRosterPeriod(date: Date): { year: number; period: number } {
  // Calculate roster period from date
  // Based on RP12/2025 anchor (2025-10-11)
}

export function getRosterPeriodDates(year: number, period: number): { start: Date; end: Date } {
  // Get start and end dates for a roster period
}
```

**Usage**: Leave eligibility, leave calendar, renewal planning

### 2. Certification Compliance (FAA Standards)

**Overview**: All certifications tracked with FAA color-coding system.

**Color Coding** (`lib/utils/certification-utils.ts`):

- 🔴 **Red**: Expired (days_until_expiry < 0)
- 🟡 **Yellow**: Expiring soon (days_until_expiry ≤ 30)
- 🟢 **Green**: Current (days_until_expiry > 30)

**Alert Thresholds**:

- **Critical**: Expired certifications (immediate action required)
- **Warning**: ≤ 60 days until expiry (plan renewal)
- **Notice**: ≤ 90 days until expiry (awareness)

**Implementation**:

```typescript
export function getCertificationStatus(expiryDate: string): {
  status: 'expired' | 'expiring' | 'current'
  color: 'red' | 'yellow' | 'green'
  daysUntilExpiry: number
} {
  const days = differenceInDays(new Date(expiryDate), new Date())

  if (days < 0) return { status: 'expired', color: 'red', daysUntilExpiry: days }
  if (days <= 30) return { status: 'expiring', color: 'yellow', daysUntilExpiry: days }
  return { status: 'current', color: 'green', daysUntilExpiry: days }
}
```

### 3. Leave Eligibility Logic (Rank-Separated)

**Overview**: Most complex business logic in the system. Evaluates leave requests while maintaining minimum crew requirements.

**CRITICAL**: Captains and First Officers are evaluated **independently**.

**Minimum Crew Requirements**:

- Must maintain **10 Captains available** (per rank)
- Must maintain **10 First Officers available** (per rank)

**Approval Priority** (within same rank):

1. Seniority number (lower = higher priority, e.g., #1 beats #5)
2. Request submission date (earlier beats later)

**Approval Scenarios**:

**Scenario 1: Solo Request**

- Single pilot requests dates
- Approve if remaining crew ≥ 10
- Result: Green (approved) or Red (denied)

**Scenario 2a: Multiple Requests, Sufficient Crew**

- Multiple pilots of same rank request overlapping dates
- Total remaining crew ≥ 10
- Result: Green (approve all requests)

**Scenario 2b: Multiple Requests, Crew Shortage**

- Multiple pilots request overlapping dates
- Remaining crew < 10 if all approved
- Result: Yellow (approve by seniority until minimum reached, deny rest)

**Scenario 2c: At/Below Minimum**

- Already at or below minimum crew
- Result: Red (deny, show alternative recommendations)

**Implementation**: `lib/services/leave-eligibility-service.ts` (43KB, most complex service)

```typescript
export async function checkLeaveEligibility(
  pilotId: string,
  startDate: string,
  endDate: string
): Promise<EligibilityResult> {
  // 1. Get crew requirements from settings (10 Captains, 10 First Officers)
  const requirements = await getCrewRequirements()

  // 2. Get pilot rank
  const pilot = await getPilotById(pilotId)

  // 3. Calculate day-by-day crew availability (rank-separated)
  const availability = await calculateCrewAvailability(startDate, endDate, pilot.rank)

  // 4. Check for conflicting pending requests (same rank, same dates)
  const conflicts = await getConflictingPendingRequests(pilotId, startDate, endDate, pilot.rank)

  // 5. Apply eligibility logic based on scenario
  if (conflicts.length === 0) {
    // Scenario 1: Solo request
    return checkSoloRequest(availability, requirements)
  } else {
    // Scenario 2a/2b/2c: Multiple requests
    return checkMultipleRequests(availability, requirements, conflicts, pilot.seniority_number)
  }
}
```

**Special Alerts**:

- **Eligibility Alert**: Shows when 2+ pilots of same rank request overlapping dates
- **Final Review Alert**: Appears 22 days before next roster period starts (only when pendingCount > 0)

### 4. Captain Qualifications

**Overview**: Captains have additional qualifications stored in JSONB column.

**Qualification Types**:

- **Line Captain**: Standard captain qualification
- **Training Captain**: Authorized to conduct training
- **Examiner**: Authorized to conduct check rides
- **RHS Captain Expiry**: Right-hand seat captain currency tracking

**Storage**: JSONB column `qualifications` in `pilots` table

```json
{
  "line_captain": true,
  "training_captain": true,
  "examiner": false,
  "rhs_captain_expiry": "2026-03-15"
}
```

**Utilities**: `lib/utils/qualification-utils.ts`

```typescript
export function hasQualification(
  pilot: Pilot,
  qualification: 'line_captain' | 'training_captain' | 'examiner'
): boolean {
  return pilot.qualifications?.[qualification] === true
}

export function getRHSExpiryDate(pilot: Pilot): string | null {
  return pilot.qualifications?.rhs_captain_expiry || null
}
```

### 5. Seniority System

**Overview**: Seniority determines leave approval priority and bid allocation.

**Calculation**:

- Based on `commencement_date` field
- Earlier date = lower seniority number = higher priority
- Seniority numbers: 1-27 (unique)
- Recalculated automatically when pilots are added/updated

**Implementation**: `lib/services/pilot-service.ts`

```typescript
export async function recalculateSeniority() {
  const supabase = await createClient()

  // Get all pilots ordered by commencement_date
  const { data: pilots } = await supabase
    .from('pilots')
    .select('id, commencement_date')
    .order('commencement_date', { ascending: true })

  // Assign seniority numbers (1 = most senior)
  const updates = pilots.map((pilot, index) => ({
    id: pilot.id,
    seniority_number: index + 1,
  }))

  // Batch update
  await batchUpdateSeniority(updates)
}
```

**Usage**: Leave eligibility, leave bids, priority allocations

### 6. Retirement Calculations

**Overview**: Track pilots approaching retirement age.

**Rules**:

- **Retirement age**: 65 years
- **Warning threshold**: < 5 years to retirement
- **Due soon**: ≤ 2 years to retirement
- **Overdue**: Past retirement age

**Implementation**: Database function + service layer

```sql
-- Database function
CREATE FUNCTION calculate_years_to_retirement(pilot_id UUID)
RETURNS INTEGER AS $$
  SELECT 65 - EXTRACT(YEAR FROM AGE(NOW(), date_of_birth))::INTEGER
  FROM pilots
  WHERE id = pilot_id
$$ LANGUAGE SQL;
```

```typescript
// Service layer
export async function getRetiringPilots(yearsThreshold: number = 5) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('pilots')
    .select('*, years_to_retirement:calculate_years_to_retirement(id)')
    .lte('years_to_retirement', yearsThreshold)
    .order('years_to_retirement', { ascending: true })

  return data
}
```

**Usage**: Dashboard alerts, succession planning, analytics

### 7. Leave Requests vs Leave Bids

**IMPORTANT**: These are two DIFFERENT features with different purposes.

#### Leave Requests

- **Purpose**: Individual time-off requests (sick leave, RDO, SDO, annual leave, etc.)
- **Workflow**: Submit → Manager Review → Approve/Deny
- **Timing**: Submitted as needed, ideally 21+ days in advance
- **Service**: `lib/services/pilot-leave-service.ts` and `lib/services/leave-service.ts`
- **API**: `/api/portal/leave-requests`
- **Table**: `leave_requests`
- **Types**: RDO, SDO, ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE

#### Leave Bids

- **Purpose**: Annual leave preference submissions (bidding on preferred leave dates for the year)
- **Workflow**: Submit annual preferences → Admin processes → Approve/Reject based on seniority/availability
- **Timing**: Submitted once per year, typically for planning next year's roster
- **Service**: `lib/services/leave-bid-service.ts`
- **API**: `/api/portal/leave-bids`
- **Tables**: `leave_bids` and `leave_bid_options`
- **Features**:
  - Pilots submit up to 10 preferred leave periods (priority ranked 1-10)
  - Admin reviews all bids together
  - Allocates leave based on seniority and operational requirements
  - Status: PENDING → PROCESSING → APPROVED/REJECTED

**Key Distinction**: Leave requests are for specific needed time off; leave bids are for annual planning and preference allocation.

---

## Testing Strategy

**Testing Framework**: Playwright 1.56.1
**Total Test Suites**: 24 E2E test suites
**Location**: `e2e/`
**Coverage**: ~60% (target)

### Test Suites

#### 1. Authentication Tests (`e2e/auth.spec.ts`)

- Admin login/logout flow
- Session persistence
- Protected route access
- Unauthorized redirect

#### 2. Dashboard Tests (`e2e/dashboard.spec.ts`)

- Dashboard metrics display
- Compliance cards
- Urgent alerts
- Navigation

#### 3. Pilot Management Tests (`e2e/pilots.spec.ts`)

- Pilot list display
- Create new pilot
- Edit pilot details
- Delete pilot
- Seniority calculations

#### 4. Certification Tests (`e2e/certifications.spec.ts`)

- Certification list
- FAA color coding
- Expiry warnings
- Create/edit certifications

#### 5. Leave Request Tests (`e2e/leave-requests.spec.ts`)

- Submit leave request
- Leave eligibility checking
- Approval workflow
- Calendar view

#### 6. Flight Request Tests (`e2e/flight-requests.spec.ts`)

- Submit flight request (RDO, SDO)
- Status tracking
- Approval workflow

#### 7. Pilot Portal Tests (`e2e/pilot-portal.spec.ts`)

- Pilot login
- Dashboard display
- Profile viewing
- Request submissions

#### 8. Leave Bid Tests (`e2e/leave-bids.spec.ts`)

- Submit annual leave bids
- Priority ranking
- Admin review workflow

#### 9. Accessibility Tests (`e2e/accessibility.spec.ts`)

- ARIA labels
- Keyboard navigation
- Screen reader compatibility
- Color contrast

#### 10. Comprehensive Tests (`e2e/comprehensive-functionality.spec.ts`)

- End-to-end workflows
- Integration scenarios
- Cross-feature testing

### Test Configuration

**playwright.config.ts**:

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx playwright test e2e/pilots.spec.ts

# Run tests matching pattern
npx playwright test --grep "leave request"

# Run with UI mode
npm run test:ui

# Run with visible browser
npm run test:headed

# Debug mode
npm run test:debug

# View test report
npx playwright show-report
```

### Test Pattern Example

```typescript
import { test, expect } from '@playwright/test'

test.describe('Pilot Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')

    // Navigate to pilots page
    await page.goto('/dashboard/pilots')
  })

  test('should display pilot list', async ({ page }) => {
    // Check heading
    await expect(page.getByRole('heading', { name: 'Pilots' })).toBeVisible()

    // Check table has pilots (27 pilots + header = 28 rows)
    const rows = page.getByRole('row')
    await expect(rows).toHaveCount(28)
  })

  test('should create new pilot', async ({ page }) => {
    // Click "New Pilot" button
    await page.click('button:has-text("New Pilot")')

    // Fill form
    await page.fill('input[name="first_name"]', 'John')
    await page.fill('input[name="last_name"]', 'Doe')
    await page.selectOption('select[name="rank"]', 'Captain')

    // Submit
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page.getByText('Pilot created successfully')).toBeVisible()
  })
})
```

### Quality Gates

Before deployment, all tests must pass:

```bash
# Pre-deployment checklist
npm run validate          # Type-check + lint + format
npm run validate:naming   # Naming conventions
npm test                  # E2E tests
npm run build             # Production build
```

---

## Deployment

### Production Environment

**Platform**: Vercel
**Database**: Supabase PostgreSQL
**Domain**: TBD
**Node Version**: >= 18.0.0
**Build System**: Turbopack (Next.js 16)

### Environment Variables (Production)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wgdmgvonqysflwdiiols.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-role-key>

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Logging (Better Stack/Logtail)
LOGTAIL_SOURCE_TOKEN=<server-token>
NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN=<client-token>

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=<redis-url>
UPSTASH_REDIS_REST_TOKEN=<redis-token>

# Email (Resend)
RESEND_API_KEY=<api-key>
RESEND_FROM_EMAIL=no-reply@your-domain.com
```

### Deployment Checklist

**Code Quality**:

- [ ] Run full validation: `npm run validate`
- [ ] Run naming validation: `npm run validate:naming`
- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] No linting errors: `npm run lint`

**Environment & Configuration**:

- [ ] All environment variables set in Vercel dashboard
- [ ] Database types up to date: `npm run db:types`
- [ ] No `.env.local` or secrets committed to Git

**Database & Migrations**:

- [ ] Database migrations tested (if any)
- [ ] Row Level Security (RLS) policies verified
- [ ] Database indexes optimized for queries

**Testing & Quality**:

- [ ] Manual testing completed on staging
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile responsive testing (iOS/Android)
- [ ] Accessibility checks pass

**Monitoring & Logging**:

- [ ] Better Stack (Logtail) logging configured and working
- [ ] Error tracking tested in production environment
- [ ] Security audit logs reviewed

**PWA & Performance**:

- [ ] PWA manifest and service worker verified
- [ ] Service worker caching strategies tested
- [ ] Image optimization configured
- [ ] Performance metrics acceptable (Lighthouse score)

**Security**:

- [ ] Security headers configured in `next.config.js`
- [ ] Rate limiting tested on public endpoints
- [ ] Authentication flows tested (admin + pilot portal)
- [ ] No exposed API keys or secrets

**Documentation**:

- [ ] README updated (if needed)
- [ ] CLAUDE.md updated (if architecture changed)
- [ ] API documentation updated
- [ ] Deployment notes documented

### Deployment Commands

```bash
# Vercel CLI deployment
vercel                    # Deploy to preview
vercel --prod             # Deploy to production

# Manual deployment
npm run build             # Build production bundle
npm run start             # Start production server
```

### Post-Deployment Verification

```bash
# Check production health
curl https://your-domain.com/api/health

# Verify database connection
curl https://your-domain.com/api/dashboard

# Test authentication
curl -X POST https://your-domain.com/api/portal/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## Development Workflow

### Getting Started

#### 1. Initial Setup (5 minutes)

```bash
# Clone repository
git clone <repository-url>
cd fleet-management-v2

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=your-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key

# Generate TypeScript types from database schema
npm run db:types

# Start development server
npm run dev
# Visit http://localhost:3000

# Verify setup
npm test
```

#### 2. First Feature Implementation

```bash
# Create feature branch
git checkout -b feature/my-feature

# 1. Implement service layer first (if database operations needed)
touch lib/services/my-feature-service.ts

# 2. Add validation schema
touch lib/validations/my-feature-schema.ts

# 3. Create API route (must use service layer!)
touch app/api/my-feature/route.ts

# 4. Build UI components
# Add shadcn component if needed:
npx shadcn@latest add dialog

# 5. Write E2E test
touch e2e/my-feature.spec.ts

# 6. Run quality checks before commit
npm run validate
npm run validate:naming

# 7. Commit changes
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

### Daily Development Workflow

#### Morning Routine

```bash
# Pull latest changes
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/today-feature

# Start development server
npm run dev

# Open Storybook (optional, for component development)
npm run storybook
```

#### During Development

```bash
# Run type check (catches errors early)
npm run type-check

# Run specific test during development
npx playwright test e2e/my-feature.spec.ts --headed

# Watch mode for rapid testing
npx playwright test --ui
```

#### Before Commit

```bash
# Run all quality checks
npm run validate

# Run naming validation
npm run validate:naming

# Run all tests
npm test

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

#### Git Workflow

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat: add new feature"
# feat: new feature
# fix: bug fix
# docs: documentation
# style: formatting
# refactor: code restructuring
# test: add tests
# chore: maintenance

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub
```

### Common Development Tasks

#### Adding New API Endpoint

```bash
# 1. Create service function
touch lib/services/my-feature-service.ts

# Add function:
export async function getMyFeature() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('my_table').select('*')
  if (error) throw error
  return data
}

# 2. Add validation schema
touch lib/validations/my-feature-schema.ts

# Add schema:
export const MyFeatureSchema = z.object({
  name: z.string().min(1),
  value: z.number()
})

# 3. Create API route
mkdir -p app/api/my-feature
touch app/api/my-feature/route.ts

# Add handler:
import { getMyFeature } from '@/lib/services/my-feature-service'
export async function GET() {
  const data = await getMyFeature()
  return NextResponse.json({ success: true, data })
}

# 4. Test endpoint
curl http://localhost:3000/api/my-feature
```

#### Adding New Component

```bash
# 1. Add shadcn component if needed
npx shadcn@latest add dialog

# 2. Create component
touch components/my-feature/my-component.tsx

# 3. Create Storybook story
touch components/my-feature/my-component.stories.tsx

# 4. View in Storybook
npm run storybook
# Visit http://localhost:6006
```

#### Debugging Database Issues

```bash
# Check database connection
node test-connection.mjs

# Regenerate types after schema changes (REQUIRED!)
npm run db:types

# Check Supabase logs
# Visit: https://app.supabase.com/project/wgdmgvonqysflwdiiols/logs

# Test SQL query directly
# Use Supabase SQL Editor
```

#### Testing Specific Feature

```bash
# Run specific test file
npx playwright test e2e/leave-requests.spec.ts

# Run tests matching pattern
npx playwright test --grep "leave request"

# Debug mode with browser visible
npm run test:debug

# View test report
npx playwright show-report
```

### Troubleshooting

#### TypeScript Errors

```bash
# Regenerate database types
npm run db:types

# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Middleware Errors

```bash
# Ensure using async cookies in Next.js 16
# ❌ const cookieStore = cookies()
# ✅ const cookieStore = await cookies()
```

#### Playwright Test Failures

```bash
# Install browsers
npx playwright install

# Update Playwright
npm install @playwright/test@latest

# Clear test cache
rm -rf test-results
```

#### Husky Hooks Not Running

```bash
# Reinstall Husky
npm run prepare

# Check .husky directory exists
ls -la .husky
```

---

## Key Features

### 1. Dual Authentication System

- **Admin Portal**: Supabase Auth for managers and staff
- **Pilot Portal**: Custom authentication via `pilot_users` table
- Completely isolated authentication flows
- Secure password hashing with bcrypt
- Registration approval workflow for pilots

### 2. Comprehensive Service Layer

- 30+ service modules for all database operations
- Consistent patterns across all services
- Type-safe with generated Supabase types
- Complex business logic encapsulation
- Centralized error handling

### 3. Intelligent Leave Management

- Rank-separated eligibility checking (Captains vs First Officers)
- Seniority-based approval priority
- 28-day roster period alignment
- Conflict detection and alternative recommendations
- Annual leave bid system with priority ranking

### 4. FAA-Compliant Certification Tracking

- Color-coded certification status (Red/Yellow/Green)
- Expiry alerts at 90, 60, 30 days
- Automatic compliance calculations
- Renewal planning and scheduling
- Captain qualification tracking (Line, Training, Examiner, RHS)

### 5. Real-Time Dashboard Metrics

- Fleet compliance percentages
- Expiring certification alerts
- Crew availability tracking
- Retirement forecasting
- Recent activity timeline

### 6. Progressive Web App (PWA)

- Offline support with intelligent caching
- Install on mobile devices (iOS/Android)
- Service worker with Serwist
- Manifest with custom icons
- Network-first API caching

### 7. Comprehensive Audit Trail

- All CRUD operations logged
- User actions tracked with timestamps
- Old/new value comparison
- Change history timeline
- CSV export for compliance

### 8. Analytics & Reporting

- Crew shortage predictions
- Multi-year forecasting
- Succession pipeline analysis
- PDF report generation (jsPDF)
- Excel export capabilities

### 9. Pilot Self-Service Portal

- View personal certifications
- Submit leave requests
- Submit flight requests
- Provide feedback
- Track request status
- Aviation-themed UI

### 10. Enterprise-Grade Quality

- 24 E2E test suites with Playwright
- Type-safe development (TypeScript strict mode)
- Code quality enforcement (ESLint, Prettier, Husky)
- Naming convention validation
- Better Stack error logging
- Rate limiting with Upstash Redis

---

## Conclusion

Fleet Management V2 is a production-ready B767 Pilot Management System built with modern technologies and best practices. The system implements complex aviation business logic through a comprehensive service-layer architecture with dual authentication systems.

**Key Strengths**:

- ✅ Service layer architecture for maintainability
- ✅ Dual authentication for admin and pilot users
- ✅ Complex leave eligibility logic (rank-separated)
- ✅ FAA-compliant certification tracking
- ✅ 30+ service modules with type safety
- ✅ 67 API routes with validation
- ✅ 24 E2E test suites
- ✅ PWA-enabled with offline support
- ✅ Comprehensive audit trail
- ✅ Real-time dashboard metrics

**Production Metrics**:

- 27 pilots managed
- 607 certifications tracked
- 34 check types defined
- 3,837 lines of generated types
- 200+ React components
- ~60% test coverage

**Technology Stack**: Next.js 16, React 19, TypeScript 5.7, Tailwind CSS 4.1, Supabase PostgreSQL, Playwright 1.56

---

**Document Version**: 2.0.0
**Generated**: October 27, 2025
**Generated By**: BMad Master Agent
**For**: Maurice (Skycruzer)
