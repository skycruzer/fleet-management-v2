# Code Review Triage Report

**Project**: Fleet Management V2
**Review Date**: October 17, 2025
**Reviewers**: 6 Parallel Specialized Agents
**Review Type**: Comprehensive Multi-Agent Analysis

---

## Executive Summary

A comprehensive code review was conducted using 6 specialized agents analyzing TypeScript quality, design patterns, architecture, security, performance, and data integrity. **All 6 agents independently identified the missing service layer as the #1 critical issue** blocking safe feature development.

### Critical Findings Overview

| Severity | Count | Categories |
|----------|-------|------------|
| 🔴 P0 (CATASTROPHIC) | 1 | Security |
| 🔴 P1 (CRITICAL) | 6 | Architecture, Data Integrity, Security |
| 🟡 P2 (HIGH) | 8 | Performance, Code Quality |
| 🟢 P3 (MEDIUM) | 12 | Code Quality, Maintenance |

**Total Issues**: 27 actionable findings

---

## 🔴 P0: CATASTROPHIC (Fix Immediately)

### P0-1: Service Role Key Exposed in .env.local

**Severity**: 🔴 CATASTROPHIC
**Category**: Security
**Agent**: security-sentinel
**Effort**: 10 minutes

**Problem**:
```env
# .env.local (EXPOSED)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Service role keys bypass ALL Row Level Security policies and grant full database access. This key is:
- In a gitignored file (good) but could be accidentally committed
- Unnecessary for local development
- A catastrophic security vulnerability if exposed

**Impact**:
- Complete database compromise if key is leaked
- Bypasses all RLS policies (27 pilots, 607 certifications accessible)
- Enables data deletion, modification, and exfiltration

**Solution**:
1. **REMOVE IMMEDIATELY** from .env.local
2. Use anon key for local development (RLS policies will protect data)
3. Service role key should ONLY be used in:
   - Secure server-side functions
   - Admin operations with explicit justification
   - Never in client-accessible environment variables

**References**:
- Security Audit Report, Section 1.1
- Supabase docs: Service Role Key Best Practices

---

## 🔴 P1: CRITICAL (Block Feature Development)

### P1-1: Missing Service Layer Implementation

**Severity**: 🔴 P1 (CRITICAL)
**Category**: Architecture / Data Integrity
**Agents**: All 6 agents identified this
**Effort**: Large (3-5 days)

**Problem**:
CLAUDE.md mandates service layer as Rule #1:
> "Rule #1: All database operations MUST use service functions. Never call Supabase directly from API routes or components."

Yet **zero service files exist** in the main branch.

**Impact**:
- N+1 queries inevitable (no query optimization layer)
- Data validation bypassed (direct Supabase calls)
- Business logic duplicated across components
- Seniority calculations inconsistent
- Certification expiry validation missing
- Leave eligibility logic unimplemented
- Impossible to maintain or test

**Current State**:
```
lib/
├── hooks/
├── supabase/
├── utils/
└── ❌ services/ (DOES NOT EXIST)
```

**Required Services** (from CLAUDE.md):
1. **pilot-service.ts** - Pilot CRUD with seniority calculation
2. **certification-service.ts** - Certification tracking with expiry validation
3. **leave-service.ts** - Leave request management
4. **leave-eligibility-service.ts** - Complex rank-separated eligibility logic
5. **expiring-certifications-service.ts** - Certification expiry calculations
6. **dashboard-service.ts** - Dashboard metrics aggregation
7. **analytics-service.ts** - Analytics data processing
8. **pdf-service.ts** - PDF report generation
9. **cache-service.ts** - Performance caching
10. **audit-service.ts** - Audit logging

**Solution**:
Port service layer from air-niugini-pms (src/lib/*-service.ts files) with updates for Next.js 15 async patterns.

**Example** (pilot-service.ts):
```typescript
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type Pilot = Database['public']['Tables']['pilots']['Row']

export async function getPilots(): Promise<Pilot[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pilots')
    .select('*')
    .order('commencement_date', { ascending: true })

  if (error) throw new Error(`Failed to fetch pilots: ${error.message}`)
  return data
}

export async function getPilotWithSeniority(id: string) {
  const supabase = await createClient()

  // Calculate seniority based on commencement_date
  const { data: allPilots } = await supabase
    .from('pilots')
    .select('id, commencement_date')
    .order('commencement_date', { ascending: true })

  const seniorityNumber = allPilots?.findIndex(p => p.id === id) + 1

  const { data: pilot, error } = await supabase
    .from('pilots')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(`Failed to fetch pilot: ${error.message}`)

  return {
    ...pilot,
    seniority_number: seniorityNumber
  }
}
```

**References**:
- CLAUDE.md lines 55-87 (Service Layer Pattern)
- CLAUDE.md lines 343-350 (Service files to port)
- Architecture Review, Findings #1-2
- Data Integrity Report, Critical Risk #1
- air-niugini-pms/src/lib/pilot-service.ts (reference implementation)

---

### P1-2: No Input Validation Layer

**Severity**: 🔴 P1 (CRITICAL)
**Category**: Data Integrity / Security
**Agents**: data-integrity-guardian, security-sentinel
**Effort**: Medium (2-3 days)

**Problem**:
- Zod 4.1.11 installed but **zero validation schemas exist**
- React Hook Form 7.63.0 installed but not integrated
- All form data submitted without validation
- Direct database insertion without type checking

**Impact**:
- Invalid data inserted into database (corrupts 27 pilots, 607 certifications)
- Type mismatches (e.g., string where number expected)
- Missing required fields
- SQL injection vectors
- Business rule violations (e.g., invalid roster periods)

**Current State**:
```typescript
// ❌ WRONG - No validation
async function POST(request: Request) {
  const body = await request.json()
  const supabase = await createClient()
  await supabase.from('pilots').insert(body) // Unvalidated!
}
```

**Solution**:
Create validation schemas in `lib/schemas/`:

```typescript
// lib/schemas/pilot-schema.ts
import { z } from 'zod'

export const PilotCreateSchema = z.object({
  first_name: z.string().min(1, 'First name required').max(50),
  last_name: z.string().min(1, 'Last name required').max(50),
  employee_id: z.string().regex(/^\d{6}$/, 'Must be 6-digit employee ID'),
  rank: z.enum(['Captain', 'First Officer']),
  commencement_date: z.string().datetime(),
  qualifications: z.object({
    line_captain: z.boolean().optional(),
    training_captain: z.boolean().optional(),
    examiner: z.boolean().optional(),
    rhs_captain_expiry: z.string().datetime().optional(),
  }).optional(),
})

export type PilotCreate = z.infer<typeof PilotCreateSchema>
```

**Integration with Service Layer**:
```typescript
// lib/services/pilot-service.ts
import { PilotCreateSchema } from '@/lib/schemas/pilot-schema'

export async function createPilot(data: unknown) {
  // Validate first
  const validated = PilotCreateSchema.parse(data)

  const supabase = await createClient()
  const { data: pilot, error } = await supabase
    .from('pilots')
    .insert(validated)
    .select()
    .single()

  if (error) throw new Error(`Failed to create pilot: ${error.message}`)
  return pilot
}
```

**Port from air-niugini-pms**:
- `air-niugini-pms/src/lib/validations/pilot-validation.ts`
- `air-niugini-pms/src/lib/validations/leave-validation.ts`
- `air-niugini-pms/src/lib/validations/certification-validation.ts`

**References**:
- Data Integrity Report, Critical Risk #2
- Security Audit, Finding #5
- air-niugini-pms validation implementation

---

### P1-3: No Transaction Boundaries

**Severity**: 🔴 P1 (CRITICAL)
**Category**: Data Integrity
**Agent**: data-integrity-guardian
**Effort**: Medium (2-3 days)

**Problem**:
Multi-step operations have no transaction boundaries, leading to:
- Partial failures leaving database in inconsistent state
- Orphaned records (e.g., pilot created but certifications fail)
- Race conditions in concurrent operations
- No rollback capability

**Example Vulnerable Operation**:
```typescript
// ❌ WRONG - No transaction
async function createPilotWithCertifications(pilotData, certifications) {
  // Step 1: Insert pilot
  const { data: pilot } = await supabase.from('pilots').insert(pilotData)

  // Step 2: Insert certifications (what if this fails?)
  await supabase.from('pilot_checks').insert(
    certifications.map(cert => ({ pilot_id: pilot.id, ...cert }))
  )
}
```

**Impact**:
- Pilot created but certifications missing (data corruption)
- Leave approved but balance not updated
- Certification updated but audit log missing

**Solution**:
Use PostgreSQL functions for atomic operations:

```sql
-- supabase/migrations/add_create_pilot_with_certs.sql
CREATE OR REPLACE FUNCTION create_pilot_with_certifications(
  p_pilot_data jsonb,
  p_certifications jsonb[]
) RETURNS jsonb AS $$
DECLARE
  v_pilot_id uuid;
  v_result jsonb;
BEGIN
  -- Insert pilot
  INSERT INTO pilots (first_name, last_name, employee_id, rank, commencement_date)
  VALUES (
    p_pilot_data->>'first_name',
    p_pilot_data->>'last_name',
    p_pilot_data->>'employee_id',
    p_pilot_data->>'rank',
    (p_pilot_data->>'commencement_date')::timestamptz
  )
  RETURNING id INTO v_pilot_id;

  -- Insert certifications
  INSERT INTO pilot_checks (pilot_id, check_type_id, expiry_date, certificate_number)
  SELECT
    v_pilot_id,
    (cert->>'check_type_id')::uuid,
    (cert->>'expiry_date')::date,
    cert->>'certificate_number'
  FROM unnest(p_certifications) AS cert;

  -- Return pilot with certifications
  SELECT jsonb_build_object(
    'pilot', row_to_json(p.*),
    'certifications', jsonb_agg(pc.*)
  ) INTO v_result
  FROM pilots p
  LEFT JOIN pilot_checks pc ON pc.pilot_id = p.id
  WHERE p.id = v_pilot_id
  GROUP BY p.id;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create pilot with certifications: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
```

**Service Layer Integration**:
```typescript
// lib/services/pilot-service.ts
export async function createPilotWithCertifications(
  pilotData: PilotCreate,
  certifications: CertificationCreate[]
) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'create_pilot_with_certifications',
    {
      p_pilot_data: pilotData,
      p_certifications: certifications,
    }
  )

  if (error) throw new Error(`Transaction failed: ${error.message}`)
  return data
}
```

**References**:
- Data Integrity Report, Critical Risk #4
- PostgreSQL Transactions Best Practices

---

### P1-4: Missing Content Security Policy (CSP)

**Severity**: 🔴 P1 (CRITICAL)
**Category**: Security
**Agent**: security-sentinel
**Effort**: Small (2-4 hours)

**Problem**:
`next.config.js` has excellent security headers BUT is missing Content-Security-Policy:
- No XSS protection via CSP
- Allows inline scripts from any source
- Allows connections to any external domain

**Impact**:
- XSS attacks possible (inject malicious scripts)
- Data exfiltration to attacker-controlled servers
- Session hijacking
- Credential theft

**Solution**:
Add CSP header to `next.config.js`:

```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust based on needs
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://wgdmgvonqysflwdiiols.supabase.co",
              "font-src 'self' data:",
              "connect-src 'self' https://wgdmgvonqysflwdiiols.supabase.co wss://wgdmgvonqysflwdiiols.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          // ... existing headers
        ],
      },
    ]
  },
}
```

**Strict CSP** (production target):
```javascript
"script-src 'self' 'nonce-{RANDOM}'", // Remove unsafe-inline/unsafe-eval
"style-src 'self' 'nonce-{RANDOM}'",
```

**Testing**:
1. Add CSP header
2. Test all pages for CSP violations (check browser console)
3. Adjust directives as needed
4. Monitor CSP reports in production

**References**:
- Security Audit, Finding #2
- MDN: Content Security Policy
- OWASP CSP Cheat Sheet

---

### P1-5: No Rate Limiting on Authentication

**Severity**: 🔴 P1 (CRITICAL)
**Category**: Security
**Agent**: security-sentinel
**Effort**: Small (4-6 hours)

**Problem**:
Authentication endpoints have no rate limiting:
- Brute force password attacks possible
- Account enumeration via timing attacks
- DoS via repeated auth requests

**Impact**:
- Attacker can attempt thousands of passwords per minute
- Can enumerate valid employee IDs
- Can lock out legitimate users
- Can exhaust Supabase auth quota

**Solution**:
Implement rate limiting using Vercel Edge Config or Upstash:

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// 5 login attempts per minute per IP
export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
})

// 10 requests per minute per IP for general auth endpoints
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
})
```

**Middleware Integration**:
```typescript
// middleware.ts
import { loginRateLimit } from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1'

  // Apply rate limiting to auth routes
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    const { success, remaining } = await loginRateLimit.limit(ip)

    if (!success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
          'Retry-After': '60',
        },
      })
    }
  }

  return await updateSession(request)
}
```

**Alternative** (Vercel KV):
```typescript
import { kv } from '@vercel/kv'

export async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `rate-limit:login:${ip}`
  const count = await kv.incr(key)

  if (count === 1) {
    await kv.expire(key, 60) // 1 minute
  }

  return count <= 5 // 5 attempts per minute
}
```

**References**:
- Security Audit, Finding #4
- Architecture Review, Missing Feature #3
- Upstash Ratelimit docs

---

### P1-6: No CSRF Protection

**Severity**: 🔴 P1 (HIGH)
**Category**: Security
**Agent**: security-sentinel
**Effort**: Medium (1-2 days)

**Problem**:
Forms have no CSRF token protection:
- Attacker can craft malicious forms on external sites
- Can trigger state-changing operations (delete pilot, approve leave)
- Session cookies sent automatically by browser

**Impact**:
- Attacker tricks authenticated user into visiting malicious page
- Malicious page submits form to fleet-management-v2
- Action performed as legitimate user (data deletion, leave approval)

**Solution**:
Implement CSRF token generation and validation:

```typescript
// lib/csrf.ts
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

export async function generateCsrfToken(): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const cookieStore = await cookies()

  cookieStore.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
  })

  return token
}

export async function validateCsrfToken(token: string): Promise<boolean> {
  const cookieStore = await cookies()
  const storedToken = cookieStore.get('csrf-token')?.value

  return token === storedToken
}
```

**Form Integration**:
```typescript
// components/forms/pilot-form.tsx
'use client'

export function PilotForm({ csrfToken }: { csrfToken: string }) {
  return (
    <form action="/api/pilots" method="POST">
      <input type="hidden" name="csrf_token" value={csrfToken} />
      {/* form fields */}
    </form>
  )
}
```

**API Route Protection**:
```typescript
// app/api/pilots/route.ts
import { validateCsrfToken } from '@/lib/csrf'

export async function POST(request: Request) {
  const formData = await request.formData()
  const csrfToken = formData.get('csrf_token') as string

  if (!await validateCsrfToken(csrfToken)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }

  // Process request...
}
```

**References**:
- Security Audit, Finding #3
- OWASP CSRF Prevention Cheat Sheet

---

## 🟡 P2: HIGH PRIORITY (Performance & Quality)

### P2-1: All Dashboard Pages Use 'use client'

**Severity**: 🟡 P2 (HIGH)
**Category**: Performance
**Agent**: pattern-recognition-specialist
**Effort**: Large (2-3 weeks)

**Problem**:
All 37 dashboard pages use `'use client'` directive unnecessarily:
- Pilots page should be Server Component (SSR benefits)
- Certifications page should be Server Component
- Dashboard metrics page should be Server Component
- No static rendering benefits
- Large client bundle (JavaScript sent to browser)

**Impact**:
- Slower initial page load (102 KB bundle could be reduced by 40-50%)
- Poor SEO (content not server-rendered)
- No static generation benefits
- Increased server load (no caching)

**Current State** (37 files):
```typescript
// app/dashboard/pilots/page.tsx
'use client' // ❌ WRONG

export default function PilotsPage() {
  // Fetches data client-side
}
```

**Solution**:
Refactor to Server Components with client components only for interactivity:

```typescript
// app/dashboard/pilots/page.tsx (Server Component)
import { getPilots } from '@/lib/services/pilot-service'
import { PilotsList } from '@/components/pilots/pilots-list'

export default async function PilotsPage() {
  const pilots = await getPilots() // Server-side data fetching

  return (
    <div>
      <h1>Pilots</h1>
      <PilotsList pilots={pilots} /> {/* Client component for interactivity */}
    </div>
  )
}
```

```typescript
// components/pilots/pilots-list.tsx (Client Component)
'use client'

export function PilotsList({ pilots }: { pilots: Pilot[] }) {
  const [search, setSearch] = useState('')
  // Interactive features only
}
```

**Migration Priority**:
1. Dashboard metrics page (most benefit from SSR)
2. Pilots list page (27 pilots, static data)
3. Certifications page (607 certs, mostly static)
4. Leave requests page (some interactivity needed)

**Estimated Savings**:
- Bundle size: 102 KB → ~60 KB (-41%)
- Initial load: Improve by ~500ms
- SEO: Enable full server-side rendering

**References**:
- Pattern Recognition Report, Anti-Pattern #1
- Performance Review, Optimization #2
- Next.js Server Components docs

---

### P2-2: No Database Query Optimization

**Severity**: 🟡 P2 (HIGH)
**Category**: Performance
**Agent**: performance-oracle
**Effort**: Medium (1 week)

**Problem**:
Database queries lack optimization patterns:
- No eager loading (will cause N+1 queries)
- No select field limiting (fetching entire rows)
- No pagination (fetching all 607 certifications at once)
- No indexes on foreign keys

**Impact**:
- Pilots page: 27 queries (1 for pilots + 1 per pilot for certifications) = N+1
- Certifications page: Loading 607 rows without pagination
- Dashboard: Multiple sequential queries instead of joins

**Example N+1 Pattern** (will happen without service layer):
```typescript
// ❌ WRONG - N+1 queries
const pilots = await supabase.from('pilots').select('*')
for (const pilot of pilots) {
  // 27 additional queries!
  const { data: certs } = await supabase
    .from('pilot_checks')
    .eq('pilot_id', pilot.id)
}
```

**Solution 1**: Eager Loading (Service Layer)
```typescript
// lib/services/pilot-service.ts
export async function getPilotsWithCertifications() {
  const supabase = await createClient()

  // Single query with join
  const { data, error } = await supabase
    .from('pilots')
    .select(`
      *,
      pilot_checks (
        id,
        check_type_id,
        expiry_date,
        days_until_expiry,
        check_types (name, category)
      )
    `)
    .order('commencement_date', { ascending: true })

  if (error) throw new Error(`Failed to fetch pilots: ${error.message}`)
  return data
}
```

**Solution 2**: Field Selection
```typescript
// Only fetch needed fields
const { data } = await supabase
  .from('pilots')
  .select('id, first_name, last_name, rank, employee_id')
  // Don't fetch qualifications JSONB unless needed
```

**Solution 3**: Pagination
```typescript
export async function getCertificationsPaginated(page = 1, pageSize = 50) {
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await supabase
    .from('pilot_checks')
    .select('*, pilots(first_name, last_name), check_types(name)', {
      count: 'exact',
    })
    .range(from, to)
    .order('expiry_date', { ascending: true })

  if (error) throw error
  return { certifications: data, total: count, page, pageSize }
}
```

**Solution 4**: Database Indexes
```sql
-- supabase/migrations/add_performance_indexes.sql
CREATE INDEX IF NOT EXISTS idx_pilot_checks_pilot_id
ON pilot_checks(pilot_id);

CREATE INDEX IF NOT EXISTS idx_pilot_checks_expiry_date
ON pilot_checks(expiry_date);

CREATE INDEX IF NOT EXISTS idx_pilot_checks_check_type_id
ON pilot_checks(check_type_id);

CREATE INDEX IF NOT EXISTS idx_leave_requests_pilot_id
ON leave_requests(pilot_id);

CREATE INDEX IF NOT EXISTS idx_leave_requests_status
ON leave_requests(status);
```

**References**:
- Performance Review, Critical Issue #1
- Architecture Review, Missing Feature #2

---

### P2-3: TanStack Query Not Configured

**Severity**: 🟡 P2 (HIGH)
**Category**: Performance / Developer Experience
**Agent**: performance-oracle
**Effort**: Small (4-6 hours)

**Problem**:
TanStack Query 5.90.2 installed but not configured:
- No query client provider
- No caching strategy
- No stale-while-revalidate
- Manual data fetching everywhere

**Impact**:
- Every page navigation refetches all data
- No background updates
- No optimistic updates
- Poor UX (loading spinners on every navigation)

**Solution**:
Configure TanStack Query provider:

```typescript
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            cacheTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

```typescript
// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

**Custom Hook Example**:
```typescript
// lib/hooks/use-pilots.ts
import { useQuery } from '@tanstack/react-query'
import { getPilots } from '@/lib/services/pilot-service'

export function usePilots() {
  return useQuery({
    queryKey: ['pilots'],
    queryFn: getPilots,
    staleTime: 60 * 1000, // Pilots data is relatively static
  })
}
```

**Usage**:
```typescript
// components/pilots/pilots-list.tsx
'use client'

import { usePilots } from '@/lib/hooks/use-pilots'

export function PilotsList() {
  const { data: pilots, isLoading, error } = usePilots()

  if (isLoading) return <Skeleton />
  if (error) return <ErrorAlert error={error} />

  return <Table data={pilots} />
}
```

**Benefits**:
- Automatic caching (pilots fetched once, cached for 1 minute)
- Background refetching
- Optimistic updates
- DevTools for debugging queries

**References**:
- Performance Review, Optimization #3
- TanStack Query v5 docs

---

### P2-4: Missing Error Handling Strategy

**Severity**: 🟡 P2 (HIGH)
**Category**: Code Quality / User Experience
**Agents**: data-integrity-guardian, kieran-typescript-reviewer
**Effort**: Medium (2-3 days)

**Problem**:
No centralized error handling:
- 66 console.log/error calls scattered throughout codebase
- No error boundaries
- No error reporting (Sentry, LogRocket)
- No user-friendly error messages
- Errors silently swallowed

**Impact**:
- Users see technical error messages ("Supabase error: ...")
- No way to debug production errors
- No error tracking or monitoring
- Poor user experience

**Solution 1**: Error Boundary Component
```typescript
// components/error-boundary.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Error boundary caught:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-red-700">
          {process.env.NODE_ENV === 'development'
            ? error.message
            : 'An unexpected error occurred. Please try again.'}
        </p>
        <Button onClick={reset} className="mt-4">
          Try again
        </Button>
      </div>
    </div>
  )
}
```

**Solution 2**: Centralized Error Logging
```typescript
// lib/error-logger.ts
type ErrorContext = {
  userId?: string
  action?: string
  metadata?: Record<string, unknown>
}

export function logError(error: Error, context?: ErrorContext) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error.message, context)
    console.error(error.stack)
  }

  // Send to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate Sentry
    // Sentry.captureException(error, { extra: context })
  }

  // Store in database for audit trail
  // TODO: Add error_logs table
}
```

**Solution 3**: User-Friendly Error Messages
```typescript
// lib/error-messages.ts
export const ERROR_MESSAGES = {
  PILOT_NOT_FOUND: 'Pilot not found. Please check the employee ID.',
  CERT_EXPIRED: 'This certification has expired and requires renewal.',
  LEAVE_CONFLICT: 'Leave request conflicts with existing approved leave.',
  INSUFFICIENT_CREW: 'Cannot approve leave - minimum crew requirement not met.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please contact support.',
} as const

export function getUserFriendlyMessage(error: Error): string {
  if (error.message.includes('not found')) {
    return ERROR_MESSAGES.PILOT_NOT_FOUND
  }
  if (error.message.includes('expired')) {
    return ERROR_MESSAGES.CERT_EXPIRED
  }
  // ... more mappings
  return ERROR_MESSAGES.UNKNOWN_ERROR
}
```

**Service Layer Integration**:
```typescript
// lib/services/pilot-service.ts
import { logError } from '@/lib/error-logger'
import { getUserFriendlyMessage } from '@/lib/error-messages'

export async function getPilot(id: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('pilots')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) throw new Error('Pilot not found')

    return data
  } catch (error) {
    logError(error as Error, { action: 'getPilot', metadata: { id } })
    throw new Error(getUserFriendlyMessage(error as Error))
  }
}
```

**References**:
- Data Integrity Report, Critical Risk #6
- Pattern Recognition Report, Code Smell #2
- TypeScript Review, Issue #8

---

### P2-5: Form Component Duplication

**Severity**: 🟡 P2 (HIGH)
**Category**: Code Quality / Maintenance
**Agent**: pattern-recognition-specialist
**Effort**: Medium-Large (1-2 weeks)

**Problem**:
~1,900 lines of duplicated form code:
- Pilot form duplicated across create/edit
- Certification form duplicated
- Leave request form duplicated
- Each form ~200-300 lines
- Identical validation logic
- Identical error handling

**Impact**:
- Maintenance burden (fix bug in 6 places)
- Inconsistent behavior
- Increased bundle size
- Slower development velocity

**Current State**:
```
components/forms/
├── pilot-create-form.tsx (285 lines)
├── pilot-edit-form.tsx (298 lines) ← 90% duplicate
├── cert-create-form.tsx (210 lines)
├── cert-edit-form.tsx (215 lines) ← 90% duplicate
├── leave-create-form.tsx (245 lines)
└── leave-edit-form.tsx (250 lines) ← 90% duplicate
```

**Solution**: Create Reusable Form Components

```typescript
// components/forms/pilot-form.tsx (unified)
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PilotCreateSchema } from '@/lib/schemas/pilot-schema'

interface PilotFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<PilotCreate>
  onSubmit: (data: PilotCreate) => Promise<void>
}

export function PilotForm({ mode, defaultValues, onSubmit }: PilotFormProps) {
  const form = useForm<PilotCreate>({
    resolver: zodResolver(PilotCreateSchema),
    defaultValues: defaultValues ?? {
      first_name: '',
      last_name: '',
      rank: 'First Officer',
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* ... other fields */}
        <Button type="submit">
          {mode === 'create' ? 'Create Pilot' : 'Update Pilot'}
        </Button>
      </form>
    </Form>
  )
}
```

**Usage**:
```typescript
// app/dashboard/pilots/create/page.tsx
export default function CreatePilotPage() {
  async function handleSubmit(data: PilotCreate) {
    await createPilot(data)
    // redirect...
  }

  return <PilotForm mode="create" onSubmit={handleSubmit} />
}

// app/dashboard/pilots/[id]/edit/page.tsx
export default async function EditPilotPage({ params }) {
  const pilot = await getPilot(params.id)

  async function handleSubmit(data: PilotCreate) {
    await updatePilot(params.id, data)
    // redirect...
  }

  return <PilotForm mode="edit" defaultValues={pilot} onSubmit={handleSubmit} />
}
```

**Estimated Reduction**:
- 1,900 lines → ~900 lines (-52%)
- 6 forms → 3 unified forms
- Single validation logic per entity
- Consistent behavior

**References**:
- Pattern Recognition Report, Code Duplication #1
- DRY Principle Best Practices

---

### P2-6: Middleware Edge Runtime Warning

**Severity**: 🟡 P2 (HIGH)
**Category**: Performance / Compatibility
**Agent**: performance-oracle
**Effort**: Small (2 hours)

**Problem**:
Build warning:
```
⚠ Middleware is using `edge` runtime which is not compatible with
Supabase realtime features. Consider splitting your middleware.
```

**Impact**:
- Real-time subscriptions won't work in middleware
- Potential runtime errors
- Build warnings in production

**Solution**:
Split Supabase client for middleware (disable realtime):

```typescript
// lib/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
      // ✅ Disable realtime for Edge Runtime
      realtime: {
        enabled: false,
      },
    }
  )

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user && !request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return supabaseResponse
}
```

**References**:
- Performance Review, Warning #1
- Supabase Edge Runtime docs

---

### P2-7: No Audit Trail Implementation

**Severity**: 🟡 P2 (HIGH)
**Category**: Compliance / Security
**Agent**: data-integrity-guardian
**Effort**: Medium (3-4 days)

**Problem**:
No audit logging for sensitive operations:
- Pilot data modifications not logged
- Certification updates not tracked
- Leave approvals not recorded
- No "who changed what when" history

**Impact**:
- Cannot investigate data corruption
- Cannot prove compliance for FAA audits
- Cannot track unauthorized changes
- Cannot rollback changes

**Solution 1**: Audit Log Table
```sql
-- supabase/migrations/add_audit_log.sql
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text
);

CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
ON audit_log FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
ON audit_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM an_users
    WHERE an_users.id = auth.uid()
    AND an_users.role = 'admin'
  )
);
```

**Solution 2**: Service Layer Integration
```typescript
// lib/services/audit-service.ts
import { createClient } from '@/lib/supabase/server'

export async function logAudit(params: {
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  tableName: string
  recordId: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from('audit_log').insert({
    user_id: user?.id,
    action: params.action,
    table_name: params.tableName,
    record_id: params.recordId,
    old_values: params.oldValues,
    new_values: params.newValues,
  })
}
```

**Usage in Services**:
```typescript
// lib/services/pilot-service.ts
export async function updatePilot(id: string, data: PilotUpdate) {
  const supabase = await createClient()

  // Get old values for audit
  const { data: oldPilot } = await supabase
    .from('pilots')
    .select('*')
    .eq('id', id)
    .single()

  // Update
  const { data: newPilot, error } = await supabase
    .from('pilots')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Log audit trail
  await logAudit({
    action: 'UPDATE',
    tableName: 'pilots',
    recordId: id,
    oldValues: oldPilot,
    newValues: newPilot,
  })

  return newPilot
}
```

**References**:
- CLAUDE.md line 86 (audit-service.ts required)
- Data Integrity Report, Missing Feature #5
- FAA Compliance Requirements

---

### P2-8: No Database Indexes

**Severity**: 🟡 P2 (HIGH)
**Category**: Performance
**Agent**: performance-oracle
**Effort**: Small (1 day)

**Problem**:
Foreign key columns lack indexes:
- pilot_checks.pilot_id (607 rows, queried frequently)
- pilot_checks.check_type_id (607 rows, joined frequently)
- leave_requests.pilot_id (unknown count, will grow)
- No index on expiry_date (certification filtering)

**Impact**:
- Slow queries (sequential scans instead of index scans)
- Dashboard metrics slow to load
- Certification filtering inefficient
- Leave request queries slow

**Solution**:
Add performance indexes:

```sql
-- supabase/migrations/add_performance_indexes.sql

-- Pilot checks indexes
CREATE INDEX IF NOT EXISTS idx_pilot_checks_pilot_id
ON pilot_checks(pilot_id);

CREATE INDEX IF NOT EXISTS idx_pilot_checks_check_type_id
ON pilot_checks(check_type_id);

CREATE INDEX IF NOT EXISTS idx_pilot_checks_expiry_date
ON pilot_checks(expiry_date);

-- Composite index for expiring certifications query
CREATE INDEX IF NOT EXISTS idx_pilot_checks_expiry_days
ON pilot_checks(expiry_date, days_until_expiry);

-- Leave requests indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_pilot_id
ON leave_requests(pilot_id);

CREATE INDEX IF NOT EXISTS idx_leave_requests_status
ON leave_requests(status);

CREATE INDEX IF NOT EXISTS idx_leave_requests_dates
ON leave_requests(start_date, end_date);

-- Pilots indexes
CREATE INDEX IF NOT EXISTS idx_pilots_rank
ON pilots(rank);

CREATE INDEX IF NOT EXISTS idx_pilots_commencement_date
ON pilots(commencement_date); -- For seniority calculation

-- Check types index
CREATE INDEX IF NOT EXISTS idx_check_types_category
ON check_types(category);

-- User indexes
CREATE INDEX IF NOT EXISTS idx_an_users_role
ON an_users(role);
```

**Verify Performance Improvement**:
```sql
-- Before: Sequential Scan (slow)
EXPLAIN ANALYZE
SELECT * FROM pilot_checks WHERE pilot_id = 'uuid';

-- After: Index Scan (fast)
-- Should show "Index Scan using idx_pilot_checks_pilot_id"
```

**Expected Impact**:
- Pilot details query: 50ms → 5ms (10x faster)
- Expiring certifications: 200ms → 20ms (10x faster)
- Dashboard metrics: 500ms → 50ms (10x faster)

**References**:
- Performance Review, Optimization #4
- PostgreSQL Index Performance Guide

---

## 🟢 P3: MEDIUM PRIORITY (Maintenance & Quality)

### P3-1: Console.log Cleanup

**Severity**: 🟢 P3 (MEDIUM)
**Category**: Code Quality
**Agent**: pattern-recognition-specialist
**Effort**: Small (2-3 hours)

**Problem**: 66 console.log/error calls throughout codebase

**Solution**: Replace with centralized logging
**Estimated Time**: 2-3 hours

### P3-2: Type Safety for JSONB Columns

**Severity**: 🟢 P3 (MEDIUM)
**Category**: Type Safety
**Agent**: kieran-typescript-reviewer
**Effort**: Small (4-6 hours)

**Problem**: Qualifications JSONB column has weak typing

**Solution**: Create strict TypeScript types
**Estimated Time**: 4-6 hours

### P3-3: Environment Variable Validation

**Severity**: 🟢 P3 (MEDIUM)
**Category**: Developer Experience
**Agent**: kieran-typescript-reviewer
**Effort**: Small (1-2 hours)

**Problem**: Non-null assertions on env vars (process.env.X!)

**Solution**: Validate env vars at startup
**Estimated Time**: 1-2 hours

### P3-4: Verify RLS Policies

**Severity**: 🟢 P3 (MEDIUM)
**Category**: Security
**Agent**: security-sentinel
**Effort**: Small (1 day)

**Problem**: RLS policies not verified in review

**Solution**: Audit all table RLS policies
**Estimated Time**: 1 day

### P3-5: Add Loading States

**Severity**: 🟢 P3 (MEDIUM)
**Category**: User Experience
**Agent**: pattern-recognition-specialist
**Effort**: Small (2-3 days)

**Problem**: No loading skeletons or states

**Solution**: Add skeleton components for all data fetching
**Estimated Time**: 2-3 days

### P3-6: Add Toast Notifications

**Severity**: 🟢 P3 (MEDIUM)
**Category**: User Experience
**Effort**: Small (1 day)

**Problem**: No user feedback on actions

**Solution**: Integrate @radix-ui/react-toast
**Estimated Time**: 1 day

### P3-7: Document Public API

**Severity**: 🟢 P3 (MEDIUM)
**Category**: Documentation
**Effort**: Small (1-2 days)

**Problem**: No API route documentation

**Solution**: Add JSDoc comments to all API routes
**Estimated Time**: 1-2 days

### P3-8: Create Storybook Stories

**Severity**: 🟢 P3 (MEDIUM)
**Category**: Developer Experience
**Effort**: Medium (1 week)

**Problem**: Storybook installed but no stories

**Solution**: Create stories for all components
**Estimated Time**: 1 week

### P3-9: Add E2E Tests

**Severity**: 🟢 P3 (MEDIUM)
**Category**: Testing
**Effort**: Large (2-3 weeks)

**Problem**: Playwright installed but no tests

**Solution**: Port test suite from air-niugini-pms
**Estimated Time**: 2-3 weeks

### P3-10: Document Business Rules

**Severity**: 🟢 P3 (MEDIUM)
**Category**: Documentation
**Effort**: Small (2-3 days)

**Problem**: Complex business rules not documented in code

**Solution**: Add detailed comments for roster periods, leave eligibility
**Estimated Time**: 2-3 days

### P3-11: Create Migration Guide

**Severity**: 🟢 P3 (MEDIUM)
**Category**: Documentation
**Effort**: Small (1 day)

**Problem**: No guide for porting from air-niugini-pms

**Solution**: Document porting process with examples
**Estimated Time**: 1 day

### P3-12: Add Debounce to Search

**Severity**: 🟢 P3 (MEDIUM)
**Category**: Performance
**Effort**: Small (2 hours)

**Problem**: Search triggers query on every keystroke

**Solution**: Use existing debounce utility (lib/utils.ts)
**Estimated Time**: 2 hours

---

## Implementation Roadmap

### Phase 0: IMMEDIATE (Day 1)
- **P0-1**: Remove service role key from .env.local (10 minutes)

### Phase 1: Foundation (Weeks 1-2)
**Block all feature development until complete**

1. **P1-1**: Implement service layer (3-5 days)
   - Port from air-niugini-pms
   - Implement 10 core services
   - Add comprehensive tests

2. **P1-2**: Add input validation layer (2-3 days)
   - Create Zod schemas
   - Integrate with React Hook Form
   - Port validation from air-niugini-pms

3. **P1-3**: Add transaction boundaries (2-3 days)
   - Create PostgreSQL functions
   - Integrate with service layer

### Phase 2: Security (Week 3)
1. **P1-4**: Add Content Security Policy (2-4 hours)
2. **P1-5**: Implement rate limiting (4-6 hours)
3. **P1-6**: Add CSRF protection (1-2 days)
4. **P3-4**: Verify RLS policies (1 day)

### Phase 3: Performance (Weeks 4-5)
1. **P2-2**: Database query optimization (1 week)
2. **P2-8**: Add database indexes (1 day)
3. **P2-3**: Configure TanStack Query (4-6 hours)
4. **P2-6**: Fix middleware Edge Runtime warning (2 hours)
5. **P2-1**: Convert pages to Server Components (2-3 weeks, can start)

### Phase 4: Code Quality (Weeks 6-8)
1. **P2-4**: Centralized error handling (2-3 days)
2. **P2-5**: Extract reusable form components (1-2 weeks)
3. **P2-7**: Audit trail implementation (3-4 days)
4. **P3-1**: Console.log cleanup (2-3 hours)
5. **P3-2**: JSONB type safety (4-6 hours)
6. **P3-3**: Environment variable validation (1-2 hours)

### Phase 5: User Experience (Weeks 9-10)
1. **P3-5**: Add loading states (2-3 days)
2. **P3-6**: Toast notifications (1 day)
3. **P3-12**: Debounced search (2 hours)

### Phase 6: Documentation & Testing (Weeks 11-13)
1. **P3-7**: API documentation (1-2 days)
2. **P3-8**: Storybook stories (1 week)
3. **P3-9**: E2E tests (2-3 weeks)
4. **P3-10**: Document business rules (2-3 days)
5. **P3-11**: Migration guide (1 day)

---

## Summary Statistics

### By Severity
- 🔴 P0 (CATASTROPHIC): 1 issue (10 minutes)
- 🔴 P1 (CRITICAL): 6 issues (~2 weeks)
- 🟡 P2 (HIGH): 8 issues (~6 weeks)
- 🟢 P3 (MEDIUM): 12 issues (~8 weeks)

### By Category
- **Security**: 5 issues (1 P0, 3 P1, 1 P2, 1 P3)
- **Data Integrity**: 3 issues (3 P1)
- **Architecture**: 2 issues (2 P1)
- **Performance**: 6 issues (1 P1, 5 P2)
- **Code Quality**: 7 issues (2 P2, 5 P3)
- **Documentation**: 3 issues (3 P3)
- **User Experience**: 3 issues (3 P3)

### Total Effort Estimates
- **Phase 0** (Immediate): 10 minutes
- **Phase 1** (Foundation): 2 weeks
- **Phase 2** (Security): 1 week
- **Phase 3** (Performance): 5 weeks
- **Phase 4** (Code Quality): 3 weeks
- **Phase 5** (UX): 1 week
- **Phase 6** (Docs/Testing): 3 weeks

**Total Estimated Time**: ~15 weeks (3.75 months)

---

## Critical Path

**DO NOT PROCEED WITH FEATURE DEVELOPMENT UNTIL:**

1. ✅ Service role key removed from .env.local (P0-1)
2. ✅ Service layer implemented (P1-1)
3. ✅ Input validation added (P1-2)
4. ✅ Transaction boundaries implemented (P1-3)
5. ✅ Security measures in place (P1-4, P1-5, P1-6)

**These 5 issues are BLOCKING** all safe feature development.

---

## Agent Review Credits

This comprehensive review was conducted by 6 specialized agents:

1. **kieran-typescript-reviewer** - TypeScript code quality and Next.js 15 patterns
2. **pattern-recognition-specialist** - Design patterns and anti-patterns analysis
3. **architecture-strategist** - Service layer and architecture review
4. **security-sentinel** - Security vulnerabilities and RLS audit
5. **performance-oracle** - Performance analysis and optimization
6. **data-integrity-guardian** - Data integrity and validation safeguards

All agents independently identified the missing service layer as the #1 critical issue blocking safe development.

---

**Review Completed**: October 17, 2025
**Next Step**: Begin Phase 0 (remove service role key immediately)
