# Migration Guide: From v1 (air-niugini-pms) to v2 (fleet-management-v2)

**Version**: 1.0.0
**Last Updated**: October 17, 2025
**Author**: Maurice (Skycruzer)

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack Changes](#tech-stack-changes)
3. [Project Structure Differences](#project-structure-differences)
4. [Step-by-Step Migration Process](#step-by-step-migration-process)
5. [Import Path Changes](#import-path-changes)
6. [Next.js 15 Async Patterns](#nextjs-15-async-patterns)
7. [React 19 Updates](#react-19-updates)
8. [Supabase Client Changes](#supabase-client-changes)
9. [Service Layer Patterns](#service-layer-patterns)
10. [Component Migration](#component-migration)
11. [Styling Migration](#styling-migration)
12. [Common Pitfalls](#common-pitfalls)
13. [Before/After Examples](#beforeafter-examples)
14. [Testing Migration](#testing-migration)
15. [Migration Checklist](#migration-checklist)

---

## Overview

This guide provides comprehensive step-by-step instructions for porting features from **air-niugini-pms (v1)** to **fleet-management-v2 (v2)**. This is a **rebuild project**, not an upgrade, leveraging the latest technology stack while maintaining the same business logic and database schema.

**Key Principle**: v2 uses a modern architecture with Next.js 15, React 19, and Turbopack, requiring updates to patterns, imports, and async handling.

---

## Tech Stack Changes

### Framework & Runtime

| Component | v1 | v2 | Impact |
|-----------|----|----|--------|
| **Next.js** | 14.2.33 | 15.5.4 | Async cookies, new caching |
| **React** | 18.3.1 | 19.1.0 | New hooks, improved types |
| **TypeScript** | 5.9.2 | 5.7+ | Updated types |
| **Build System** | Webpack | Turbopack | Faster builds, different config |

### UI & Styling

| Component | v1 | v2 | Impact |
|-----------|----|----|--------|
| **TailwindCSS** | 3.4.17 | 4.1.0 | Updated syntax, new utilities |
| **Radix UI** | Various versions | Latest (2.x) | Updated APIs |
| **Lucide React** | Older version | 0.544.0 | More icons, updated imports |

### State Management

| Component | v1 | v2 | Impact |
|-----------|----|----|--------|
| **TanStack Query** | 5.85.5 | 5.90.2 | Minor API updates |
| **Zustand** | 5.0.0 | **REMOVED** | Use React Context instead |
| **React Hook Form** | 7.53.0 | 7.63.0 | Updated validation |
| **Zod** | 3.23.8 | 4.1.11 | Breaking changes in schemas |

### Database & Auth

| Component | v1 | v2 | Impact |
|-----------|----|----|--------|
| **Supabase JS** | Older | 2.47.10 | Updated client APIs |
| **Supabase SSR** | Older | 0.7.0 | New async patterns |

### Additional Features

| Component | v1 | v2 | Impact |
|-----------|----|----|--------|
| **PWA (next-pwa)** | 5.6.0 | **REMOVED** | Not needed in v2 |
| **Chart.js** | 4.5.0 | **REMOVED** | To be replaced with Recharts |
| **Storybook** | ❌ Not present | ✅ 8.5.11 | Added for component development |
| **Playwright** | 1.55.1 | 1.55.0 | Same version |

---

## Project Structure Differences

### Directory Layout

```
v1 (air-niugini-pms)          →    v2 (fleet-management-v2)
─────────────────────────────────────────────────────────────
src/                                (root level)
├── app/                      →    app/
├── components/               →    components/
├── lib/                      →    lib/
│   ├── supabase.ts          →    lib/supabase/
│   │                              ├── client.ts
│   │                              ├── server.ts
│   │                              └── middleware.ts
│   └── *.ts                 →    lib/services/
│                                  lib/utils/
├── types/                    →    types/
└── styles/                   →    (CSS in Tailwind v4)

(root level)                        (root level)
├── .env.local                →    .env.local (same)
├── next.config.js            →    next.config.ts
├── package.json              →    package.json
└── tsconfig.json             →    tsconfig.json
```

### Key Differences

1. **No `src/` directory**: v2 uses root-level `app/`, `components/`, `lib/` directories
2. **Supabase split**: v1 has single `supabase.ts`, v2 has separate `client.ts`, `server.ts`, `middleware.ts`
3. **Config files**: v2 uses TypeScript config (`next.config.ts` instead of `.js`)
4. **Services organization**: v2 requires `lib/services/` subdirectory for all service files
5. **Storybook**: v2 adds `.storybook/` configuration and `*.stories.tsx` files

---

## Step-by-Step Migration Process

### Phase 1: Planning (Before Coding)

1. **Identify the Feature**
   - Read the v1 source code thoroughly
   - Document all dependencies (services, utilities, components)
   - List all business logic and edge cases

2. **Create Migration Map**
   ```
   Feature: Pilot Management
   ├── Services: pilot-service.ts, cache-service.ts
   ├── Utilities: certification-utils.ts, roster-utils.ts
   ├── Components: PilotCard.tsx, PilotTable.tsx, PilotForm.tsx
   ├── API Routes: /api/pilots/route.ts
   └── Pages: /dashboard/pilots/page.tsx
   ```

3. **Check Dependencies**
   - Verify all npm packages are available in v2
   - Note any missing packages that need alternatives
   - Plan for PWA → non-PWA migration if needed

### Phase 2: Service Layer Migration

**CRITICAL**: Always migrate services FIRST before components or API routes.

1. **Create Service File**
   ```bash
   # v2 structure requires services subdirectory
   touch lib/services/pilot-service.ts
   ```

2. **Copy Service Code**
   - Copy function signatures and business logic from v1
   - Update imports (see [Import Path Changes](#import-path-changes))
   - Update Supabase client usage (see [Supabase Client Changes](#supabase-client-changes))

3. **Add Type Safety**
   - Import types from `@/types/supabase`
   - Add proper TypeScript return types
   - Use Zod schemas for validation

4. **Test Service**
   ```typescript
   // Create test file: lib/services/__tests__/pilot-service.test.ts
   import { getPilots } from '../pilot-service'

   describe('Pilot Service', () => {
     it('should fetch pilots', async () => {
       const pilots = await getPilots()
       expect(pilots).toBeDefined()
     })
   })
   ```

### Phase 3: Utility Migration

1. **Copy Utility Files**
   ```bash
   # v1
   src/lib/roster-utils.ts

   # v2
   lib/utils/roster-utils.ts
   ```

2. **Update Imports**
   - Change relative imports to `@/` aliases
   - Update date-fns imports (v4.x in v2)

3. **No Business Logic Changes**
   - Utilities should be pure functions
   - Only update imports and types
   - Preserve all business logic exactly

### Phase 4: Component Migration

1. **Create Component File**
   ```bash
   # v2 structure
   touch components/pilots/pilot-card.tsx
   ```

2. **Copy Component Code**
   - Update imports to `@/` aliases
   - Update Radix UI component imports (v2.x APIs)
   - Replace Zustand with React Context/useState

3. **Update Styling**
   - Review TailwindCSS v4 changes (see [Styling Migration](#styling-migration))
   - Update class names if needed
   - Test responsive design

4. **Add Storybook Story**
   ```bash
   touch components/pilots/pilot-card.stories.tsx
   ```

   ```typescript
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
         first_name: 'John',
         last_name: 'Doe',
         rank: 'Captain',
       },
     },
   }
   ```

### Phase 5: API Route Migration

1. **Create API Route**
   ```bash
   # v2 App Router structure
   mkdir -p app/api/pilots
   touch app/api/pilots/route.ts
   ```

2. **Update Async Patterns**
   - Use Next.js 15 async request patterns (see [Next.js 15 Async Patterns](#nextjs-15-async-patterns))
   - Update to new `NextRequest`/`NextResponse` APIs

3. **Call Service Functions**
   ```typescript
   import { getPilots } from '@/lib/services/pilot-service'

   export async function GET(request: NextRequest) {
     try {
       const pilots = await getPilots()
       return NextResponse.json({ success: true, data: pilots })
     } catch (error) {
       return NextResponse.json({ success: false, error: error.message }, { status: 500 })
     }
   }
   ```

### Phase 6: Page Migration

1. **Create Page File**
   ```bash
   # v2 App Router structure
   mkdir -p app/dashboard/pilots
   touch app/dashboard/pilots/page.tsx
   ```

2. **Use Server Components**
   - Default to Server Components in Next.js 15
   - Only add `'use client'` for interactivity
   - Fetch data at component level, not in API routes

3. **Update Metadata**
   ```typescript
   export const metadata = {
     title: 'Pilots | Fleet Management',
     description: 'Manage pilot records and certifications',
   }
   ```

### Phase 7: Testing

1. **Write E2E Tests**
   ```bash
   touch e2e/pilots.spec.ts
   ```

2. **Run Tests**
   ```bash
   npm test
   npm run test:ui  # Visual debugging
   ```

3. **Verify Functionality**
   - Test CRUD operations
   - Test business logic (leave eligibility, certification expiry)
   - Test responsive design

### Phase 8: Documentation

1. **Update README**
   - Document new feature
   - Add usage instructions

2. **Add Code Comments**
   - Document complex business logic
   - Add JSDoc comments for public functions

---

## Import Path Changes

### v1 Import Style (Relative Paths)

```typescript
// src/lib/pilot-service.ts
import { getSupabaseAdmin } from './supabase'
import { getCertificationStatus } from './certification-utils'
import type { Pilot } from '../types/database.types'
```

### v2 Import Style (`@/` Alias)

```typescript
// lib/services/pilot-service.ts
import { createClient } from '@/lib/supabase/server'
import { getCertificationStatus } from '@/lib/utils/certification-utils'
import type { Database } from '@/types/supabase'
```

### Import Mapping Table

| v1 Import | v2 Import | Notes |
|-----------|-----------|-------|
| `./supabase` | `@/lib/supabase/server` | Server components |
| `./supabase` | `@/lib/supabase/client` | Client components |
| `./[utility]` | `@/lib/utils/[utility]` | Utilities moved |
| `../types/database.types` | `@/types/supabase` | Generated types |
| `../components/[comp]` | `@/components/[comp]` | No `src/` prefix |
| `@/lib/[service]` | `@/lib/services/[service]` | Services subfolder |

### Search & Replace Strategy

Use these regex patterns to bulk-update imports:

```regex
# Find relative imports
Find: from ['"]\.\.?/(.+)['"]

# Replace with @ alias
Replace: from '@/$1'

# Fix supabase imports (requires manual review)
Find: from ['"]@/lib/supabase['"]
Replace: from '@/lib/supabase/server'  # or client/middleware
```

---

## Next.js 15 Async Patterns

### Cookies API

**v1 (Synchronous)**:
```typescript
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()  // Synchronous
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

**v2 (Asynchronous)**:
```typescript
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()  // ← ASYNC!
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

**Key Changes**:
- Add `async` keyword to function
- Add `await` before `cookies()` call
- Update `get()` to `getAll()` and `setAll()` pattern
- All callers must also be `async`

### Headers API

**v1**:
```typescript
import { headers } from 'next/headers'

const headersList = headers()
const userAgent = headersList.get('user-agent')
```

**v2**:
```typescript
import { headers } from 'next/headers'

const headersList = await headers()  // ← ASYNC!
const userAgent = headersList.get('user-agent')
```

### Server Components

**v1**:
```typescript
// app/dashboard/page.tsx
export default function DashboardPage() {
  const supabase = createClient()
  // ...
}
```

**v2**:
```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {  // ← ASYNC!
  const supabase = await createClient()  // ← AWAIT!
  const { data: { user } } = await supabase.auth.getUser()
  // ...
}
```

### API Routes

**v1**:
```typescript
export async function GET(request: NextRequest) {
  const supabase = createClient()
  // ...
}
```

**v2**:
```typescript
export async function GET(request: NextRequest) {
  const supabase = await createClient()  // ← AWAIT!
  // ...
}
```

### Middleware

**v1**:
```typescript
export async function middleware(request: NextRequest) {
  const supabase = createClient(request)
  const { data: { session } } = await supabase.auth.getSession()
  // ...
}
```

**v2**:
```typescript
export async function middleware(request: NextRequest) {
  const { supabase, response } = await createClient(request)  // ← AWAIT!
  const { data: { session } } = await supabase.auth.getSession()
  // ...
  return response
}
```

---

## React 19 Updates

### New Hook: `use()`

React 19 introduces the `use()` hook for reading promises and context.

**v1 (React 18)**:
```typescript
'use client'
import { useContext } from 'react'
import { AuthContext } from '@/contexts/auth-context'

function Component() {
  const { user } = useContext(AuthContext)
  return <div>{user?.email}</div>
}
```

**v2 (React 19 - Optional)**:
```typescript
'use client'
import { use } from 'react'
import { AuthContext } from '@/contexts/auth-context'

function Component() {
  const { user } = use(AuthContext)  // ← New hook
  return <div>{user?.email}</div>
}
```

**Note**: Both patterns work in React 19. The `use()` hook is optional but preferred.

### Ref Handling

**v1**:
```typescript
import { forwardRef } from 'react'

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => {
    return <button ref={ref} {...props}>{children}</button>
  }
)
```

**v2 (Simpler)**:
```typescript
// No forwardRef needed in React 19
function Button({ children, ...props }: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return <button {...props}>{children}</button>
}
```

### Type Updates

**v1**:
```typescript
import { FC, ReactNode } from 'react'

const Component: FC<{ children: ReactNode }> = ({ children }) => {
  return <div>{children}</div>
}
```

**v2 (Improved)**:
```typescript
import { ReactNode } from 'react'

function Component({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}
```

**Note**: React 19 has better type inference, so explicit `FC` typing is less needed.

---

## Supabase Client Changes

### Client Architecture

**v1 (Single Client)**:
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

**v2 (Three Clients)**:

1. **Browser Client** (`lib/supabase/client.ts`):
   ```typescript
   import { createBrowserClient } from '@supabase/ssr'

   export function createClient() {
     return createBrowserClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
     )
   }
   ```

2. **Server Client** (`lib/supabase/server.ts`):
   ```typescript
   import { createServerClient } from '@supabase/ssr'
   import { cookies } from 'next/headers'

   export async function createClient() {
     const cookieStore = await cookies()

     return createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           getAll() {
             return cookieStore.getAll()
           },
           setAll(cookiesToSet) {
             cookiesToSet.forEach(({ name, value, options }) =>
               cookieStore.set(name, value, options)
             )
           },
         },
       }
     )
   }
   ```

3. **Middleware Client** (`lib/supabase/middleware.ts`):
   ```typescript
   import { createServerClient } from '@supabase/ssr'
   import { NextRequest, NextResponse } from 'next/server'

   export async function createClient(request: NextRequest) {
     let response = NextResponse.next({ request })

     const supabase = createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           getAll() {
             return request.cookies.getAll()
           },
           setAll(cookiesToSet) {
             cookiesToSet.forEach(({ name, value }) =>
               request.cookies.set(name, value)
             )
             response = NextResponse.next({ request })
             cookiesToSet.forEach(({ name, value, options }) =>
               response.cookies.set(name, value, options)
             )
           },
         },
       }
     )

     return { supabase, response }
   }
   ```

### Usage Patterns

| Context | v1 | v2 |
|---------|----|----|
| **Client Component** | `import { supabase } from '@/lib/supabase'` | `import { createClient } from '@/lib/supabase/client'`<br>`const supabase = createClient()` |
| **Server Component** | `import { supabase } from '@/lib/supabase'` | `import { createClient } from '@/lib/supabase/server'`<br>`const supabase = await createClient()` |
| **API Route** | `import { supabase } from '@/lib/supabase'` | `import { createClient } from '@/lib/supabase/server'`<br>`const supabase = await createClient()` |
| **Middleware** | `import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'` | `import { createClient } from '@/lib/supabase/middleware'`<br>`const { supabase, response } = await createClient(request)` |
| **Admin Operations** | `import { getSupabaseAdmin } from '@/lib/supabase'` | Use server client with service role key (not recommended in v2) |

### Migration Pattern

**Before (v1)**:
```typescript
import { supabase } from '@/lib/supabase'

async function getPilots() {
  const { data, error } = await supabase
    .from('pilots')
    .select('*')
  return data
}
```

**After (v2) - Server-Side**:
```typescript
import { createClient } from '@/lib/supabase/server'

async function getPilots() {
  const supabase = await createClient()  // ← Create instance
  const { data, error } = await supabase
    .from('pilots')
    .select('*')
  return data
}
```

**After (v2) - Client-Side**:
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

function PilotList() {
  const supabase = createClient()  // ← No await for browser
  const [pilots, setPilots] = useState([])

  useEffect(() => {
    async function fetchPilots() {
      const { data } = await supabase.from('pilots').select('*')
      setPilots(data)
    }
    fetchPilots()
  }, [])

  return <div>{/* ... */}</div>
}
```

---

## Service Layer Patterns

### Service Architecture (CRITICAL)

Both v1 and v2 use **service layer architecture**, but v2 has stricter organization.

**v1 Structure**:
```
src/lib/
├── pilot-service.ts
├── leave-service.ts
├── dashboard-service.ts
└── ... (all services at root)
```

**v2 Structure** (REQUIRED):
```
lib/
├── services/           ← Services MUST be in subdirectory
│   ├── pilot-service.ts
│   ├── leave-service.ts
│   └── dashboard-service.ts
└── utils/              ← Pure utilities
    ├── roster-utils.ts
    └── certification-utils.ts
```

### Service Migration Pattern

**Step 1: Copy Service File**

```bash
# v1 location
src/lib/pilot-service.ts

# v2 location
lib/services/pilot-service.ts
```

**Step 2: Update Imports**

```typescript
// v1
import { getSupabaseAdmin } from './supabase'
import { getCertificationStatus } from './certification-utils'

// v2
import { createClient } from '@/lib/supabase/server'
import { getCertificationStatus } from '@/lib/utils/certification-utils'
```

**Step 3: Update Supabase Calls**

```typescript
// v1
export async function getPilots() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('pilots').select('*')
  return data
}

// v2
export async function getPilots() {
  const supabase = await createClient()  // ← AWAIT!
  const { data, error } = await supabase.from('pilots').select('*')
  return data
}
```

**Step 4: Add TypeScript Types**

```typescript
// v2 - Use generated types
import type { Database } from '@/types/supabase'

type Pilot = Database['public']['Tables']['pilots']['Row']

export async function getPilots(): Promise<Pilot[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('pilots').select('*')

  if (error) throw error
  return data
}
```

### Service Best Practices (v2)

1. **Always Return Data or Throw**
   ```typescript
   // ✅ GOOD
   export async function getPilot(id: string): Promise<Pilot> {
     const { data, error } = await supabase.from('pilots').select('*').eq('id', id).single()
     if (error) throw error
     return data
   }

   // ❌ BAD - Don't return { success, data, error } objects
   return { success: true, data, error: null }
   ```

2. **Use Async/Await, Not Callbacks**
   ```typescript
   // ✅ GOOD
   const pilots = await getPilots()

   // ❌ BAD
   getPilots().then(pilots => { /* ... */ })
   ```

3. **Keep Services Pure**
   ```typescript
   // ✅ GOOD - Pure business logic
   export async function getPilots(filters?: { rank?: string }) {
     const supabase = await createClient()
     let query = supabase.from('pilots').select('*')

     if (filters?.rank) {
       query = query.eq('rank', filters.rank)
     }

     const { data, error } = await query
     if (error) throw error
     return data
   }

   // ❌ BAD - Don't access request/response objects
   export async function getPilots(request: NextRequest) {
     const params = request.nextUrl.searchParams
     // Services should not know about HTTP
   }
   ```

---

## Component Migration

### Component Structure

**v1 Component**:
```typescript
// src/components/pilots/PilotCard.tsx
'use client'
import { FC } from 'react'
import { Card } from '@/components/ui/card'

interface PilotCardProps {
  pilot: Pilot
}

export const PilotCard: FC<PilotCardProps> = ({ pilot }) => {
  return (
    <Card>
      <h3>{pilot.first_name} {pilot.last_name}</h3>
      <p>{pilot.rank}</p>
    </Card>
  )
}
```

**v2 Component**:
```typescript
// components/pilots/pilot-card.tsx (lowercase file name)
'use client'
import { Card } from '@/components/ui/card'
import type { Database } from '@/types/supabase'

type Pilot = Database['public']['Tables']['pilots']['Row']

interface PilotCardProps {
  pilot: Pilot
}

export function PilotCard({ pilot }: PilotCardProps) {  // ← No FC
  return (
    <Card>
      <h3>{pilot.first_name} {pilot.last_name}</h3>
      <p>{pilot.rank}</p>
    </Card>
  )
}
```

### Key Changes

1. **File Naming**: v2 uses lowercase kebab-case (`pilot-card.tsx` not `PilotCard.tsx`)
2. **No FC Type**: Use plain function declaration
3. **Import Types**: Use generated database types from `@/types/supabase`
4. **Export Style**: Named exports preferred over default exports

### Zustand → React Context Migration

**v1 (Zustand Store)**:
```typescript
// src/stores/pilot-store.ts
import { create } from 'zustand'

interface PilotStore {
  pilots: Pilot[]
  setPilots: (pilots: Pilot[]) => void
}

export const usePilotStore = create<PilotStore>((set) => ({
  pilots: [],
  setPilots: (pilots) => set({ pilots }),
}))
```

```typescript
// Component usage
import { usePilotStore } from '@/stores/pilot-store'

function PilotList() {
  const pilots = usePilotStore((state) => state.pilots)
  const setPilots = usePilotStore((state) => state.setPilots)
  // ...
}
```

**v2 (React Context)**:
```typescript
// contexts/pilot-context.tsx
'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

interface PilotContextType {
  pilots: Pilot[]
  setPilots: (pilots: Pilot[]) => void
}

const PilotContext = createContext<PilotContextType | undefined>(undefined)

export function PilotProvider({ children }: { children: ReactNode }) {
  const [pilots, setPilots] = useState<Pilot[]>([])

  return (
    <PilotContext.Provider value={{ pilots, setPilots }}>
      {children}
    </PilotContext.Provider>
  )
}

export function usePilots() {
  const context = useContext(PilotContext)
  if (!context) {
    throw new Error('usePilots must be used within PilotProvider')
  }
  return context
}
```

```typescript
// Component usage
import { usePilots } from '@/contexts/pilot-context'

function PilotList() {
  const { pilots, setPilots } = usePilots()
  // ...
}
```

**Migration Steps**:
1. Create context file in `contexts/` directory
2. Replace Zustand `create()` with `createContext()` and `useState()`
3. Add Provider component
4. Update all imports from `@/stores/*` to `@/contexts/*`
5. Update hook usage (destructure all values at once)

### TanStack Query Updates

**v1**:
```typescript
import { useQuery } from '@tanstack/react-query'

function PilotList() {
  const { data: pilots, isLoading } = useQuery({
    queryKey: ['pilots'],
    queryFn: async () => {
      const res = await fetch('/api/pilots')
      return res.json()
    },
  })
}
```

**v2 (Same, but with types)**:
```typescript
import { useQuery } from '@tanstack/react-query'
import type { Database } from '@/types/supabase'

type Pilot = Database['public']['Tables']['pilots']['Row']

function PilotList() {
  const { data: pilots, isLoading } = useQuery<Pilot[]>({  // ← Add type
    queryKey: ['pilots'],
    queryFn: async () => {
      const res = await fetch('/api/pilots')
      const json = await res.json()
      return json.data as Pilot[]
    },
  })
}
```

**No major changes needed**, just add TypeScript types.

---

## Styling Migration

### TailwindCSS v3 → v4

**v1 (TailwindCSS 3.4.17)**:
```typescript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
      },
    },
  },
  plugins: [],
}
```

**v2 (TailwindCSS 4.1.0)**:
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
      },
    },
  },
  plugins: [],
}
export default config
```

### Breaking Changes in Tailwind v4

1. **Config Format**: TypeScript config file instead of JS
2. **Content Paths**: Update to match new directory structure (no `src/`)
3. **Plugin System**: Some plugins have updated APIs

### CSS Changes

**v1**:
```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**v2**:
```css
/* app/globals.css */
@import 'tailwindcss';
```

**Note**: Tailwind v4 uses `@import` instead of `@tailwind` directives.

### Component Class Updates

Most Tailwind classes remain the same, but verify:

```typescript
// These work in both v3 and v4
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">

// Check these utilities (may have changed)
<div className="backdrop-blur-sm">  // ← Verify in v4
<div className="text-ellipsis">     // ← Verify in v4
```

**Migration Strategy**:
1. Run development server after updating Tailwind
2. Check for console warnings about deprecated classes
3. Update classes as needed
4. Test responsive design thoroughly

---

## Common Pitfalls

### 1. Forgetting `await` on Server Client

**Problem**:
```typescript
// ❌ WRONG
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()  // ← Missing await!
  const { data } = await supabase.from('pilots').select('*')
  // ...
}
```

**Error Message**:
```
TypeError: supabase.from is not a function
```

**Solution**:
```typescript
// ✅ CORRECT
const supabase = await createClient()  // ← Add await!
```

### 2. Using Wrong Supabase Client

**Problem**:
```typescript
// ❌ WRONG - Using server client in client component
'use client'
import { createClient } from '@/lib/supabase/server'

function Component() {
  const supabase = createClient()  // ← Can't call async function here!
}
```

**Solution**:
```typescript
// ✅ CORRECT - Use browser client
'use client'
import { createClient } from '@/lib/supabase/client'

function Component() {
  const supabase = createClient()  // ← No await needed
}
```

### 3. Incorrect Import Paths

**Problem**:
```typescript
// ❌ WRONG - Relative path from old structure
import { getPilots } from '../lib/pilot-service'
```

**Solution**:
```typescript
// ✅ CORRECT - Use @ alias
import { getPilots } from '@/lib/services/pilot-service'
```

### 4. Zod v3 → v4 Breaking Changes

**Problem**:
```typescript
// ❌ WRONG - Zod v3 syntax
import { z } from 'zod'

const schema = z.object({
  name: z.string().nonempty(),  // ← Deprecated in v4
})
```

**Solution**:
```typescript
// ✅ CORRECT - Zod v4 syntax
const schema = z.object({
  name: z.string().min(1),  // ← Use min(1) instead
})
```

### 5. Missing Service Subdirectory

**Problem**:
```typescript
// ❌ WRONG - Service at root of lib/
lib/pilot-service.ts
```

**Error**:
Project structure doesn't match v2 conventions.

**Solution**:
```typescript
// ✅ CORRECT - Service in subdirectory
lib/services/pilot-service.ts
```

### 6. PWA Code in v2

**Problem**:
```typescript
// ❌ WRONG - PWA not available in v2
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
}
```

**Solution**:
Remove all PWA code. v2 doesn't use next-pwa.

### 7. Chart.js in v2

**Problem**:
```typescript
// ❌ WRONG - Chart.js not installed in v2
import { Line } from 'react-chartjs-2'
```

**Solution**:
Use alternative charting library (Recharts recommended) or install Chart.js:
```bash
npm install chart.js react-chartjs-2
```

### 8. Zustand in v2

**Problem**:
```typescript
// ❌ WRONG - Zustand not available in v2
import { create } from 'zustand'
```

**Solution**:
Use React Context instead (see [Zustand → React Context Migration](#zustand--react-context-migration)).

---

## Before/After Examples

### Example 1: Pilot Service

**Before (v1)**:
```typescript
// src/lib/pilot-service.ts
import { getSupabaseAdmin } from './supabase'
import type { Pilot } from '../types/database.types'

export async function getPilots(): Promise<Pilot[]> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('pilots')
    .select('*')
    .order('seniority_number', { ascending: true })

  if (error) {
    console.error('Error fetching pilots:', error)
    throw new Error('Failed to fetch pilots')
  }

  return data || []
}

export async function getPilot(id: string): Promise<Pilot | null> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('pilots')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching pilot:', error)
    return null
  }

  return data
}
```

**After (v2)**:
```typescript
// lib/services/pilot-service.ts
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type Pilot = Database['public']['Tables']['pilots']['Row']

export async function getPilots(): Promise<Pilot[]> {
  const supabase = await createClient()  // ← AWAIT!

  const { data, error } = await supabase
    .from('pilots')
    .select('*')
    .order('seniority_number', { ascending: true })

  if (error) {
    console.error('Error fetching pilots:', error)
    throw new Error('Failed to fetch pilots')
  }

  return data || []
}

export async function getPilot(id: string): Promise<Pilot | null> {
  const supabase = await createClient()  // ← AWAIT!

  const { data, error } = await supabase
    .from('pilots')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching pilot:', error)
    return null
  }

  return data
}
```

**Key Changes**:
1. Import changed: `./supabase` → `@/lib/supabase/server`
2. Type import: `../types/database.types` → `@/types/supabase`
3. Added `await` before `createClient()`
4. Extracted type: `type Pilot = Database['public']['Tables']['pilots']['Row']`

---

### Example 2: Roster Utilities

**Before (v1)**:
```typescript
// src/lib/roster-utils.ts
import { differenceInDays, addDays, startOfDay } from 'date-fns'

const ROSTER_DURATION = 28
const KNOWN_ROSTER = {
  number: 12,
  year: 2025,
  startDate: new Date('2025-10-11'),
}

export function getCurrentRosterPeriod() {
  const today = startOfDay(new Date())
  const daysSinceKnown = differenceInDays(today, KNOWN_ROSTER.startDate)
  const periodsPassed = Math.floor(daysSinceKnown / ROSTER_DURATION)

  let number = KNOWN_ROSTER.number + periodsPassed
  let year = KNOWN_ROSTER.year

  // Handle year rollover (RP13 → RP1)
  while (number > 13) {
    number -= 13
    year += 1
  }
  while (number < 1) {
    number += 13
    year -= 1
  }

  const periodStartDays = periodsPassed * ROSTER_DURATION
  const startDate = addDays(KNOWN_ROSTER.startDate, periodStartDays)
  const endDate = addDays(startDate, ROSTER_DURATION - 1)

  return {
    code: `RP${number}/${year}`,
    number,
    year,
    startDate,
    endDate,
    daysRemaining: differenceInDays(endDate, today),
  }
}
```

**After (v2)**:
```typescript
// lib/utils/roster-utils.ts
import { differenceInDays, addDays, startOfDay } from 'date-fns'

const ROSTER_DURATION = 28
const KNOWN_ROSTER = {
  number: 12,
  year: 2025,
  startDate: new Date('2025-10-11'),
}

export function getCurrentRosterPeriod() {
  const today = startOfDay(new Date())
  const daysSinceKnown = differenceInDays(today, KNOWN_ROSTER.startDate)
  const periodsPassed = Math.floor(daysSinceKnown / ROSTER_DURATION)

  let number = KNOWN_ROSTER.number + periodsPassed
  let year = KNOWN_ROSTER.year

  // Handle year rollover (RP13 → RP1)
  while (number > 13) {
    number -= 13
    year += 1
  }
  while (number < 1) {
    number += 13
    year -= 1
  }

  const periodStartDays = periodsPassed * ROSTER_DURATION
  const startDate = addDays(KNOWN_ROSTER.startDate, periodStartDays)
  const endDate = addDays(startDate, ROSTER_DURATION - 1)

  return {
    code: `RP${number}/${year}`,
    number,
    year,
    startDate,
    endDate,
    daysRemaining: differenceInDays(endDate, today),
  }
}
```

**Key Changes**:
1. File moved: `src/lib/` → `lib/utils/`
2. **No code changes** - utilities are pure functions!

---

### Example 3: Pilot Card Component

**Before (v1)**:
```typescript
// src/components/pilots/PilotCard.tsx
'use client'
import { FC } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCertificationStatus } from '@/lib/certification-utils'
import type { Pilot } from '@/types/database.types'

interface PilotCardProps {
  pilot: Pilot
  certificationCount: number
}

export const PilotCard: FC<PilotCardProps> = ({ pilot, certificationCount }) => {
  const status = getCertificationStatus(pilot.latest_cert_expiry)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {pilot.first_name} {pilot.last_name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{pilot.rank}</p>
          <p className="text-sm">Seniority: #{pilot.seniority_number}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm">Certifications:</span>
            <Badge variant={status.color === 'red' ? 'destructive' : 'default'}>
              {certificationCount}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

**After (v2)**:
```typescript
// components/pilots/pilot-card.tsx
'use client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCertificationStatus } from '@/lib/utils/certification-utils'
import type { Database } from '@/types/supabase'

type Pilot = Database['public']['Tables']['pilots']['Row']

interface PilotCardProps {
  pilot: Pilot
  certificationCount: number
}

export function PilotCard({ pilot, certificationCount }: PilotCardProps) {
  const status = getCertificationStatus(pilot.latest_cert_expiry)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {pilot.first_name} {pilot.last_name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{pilot.rank}</p>
          <p className="text-sm">Seniority: #{pilot.seniority_number}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm">Certifications:</span>
            <Badge variant={status.color === 'red' ? 'destructive' : 'default'}>
              {certificationCount}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Key Changes**:
1. File renamed: `PilotCard.tsx` → `pilot-card.tsx` (lowercase)
2. Removed `FC` type annotation
3. Import changed: `@/lib/certification-utils` → `@/lib/utils/certification-utils`
4. Type import: `@/types/database.types` → `@/types/supabase`
5. Extracted type: `type Pilot = Database['public']['Tables']['pilots']['Row']`

---

### Example 4: API Route

**Before (v1)**:
```typescript
// src/app/api/pilots/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPilots } from '@/lib/pilot-service'

export async function GET(request: NextRequest) {
  try {
    const pilots = await getPilots()

    return NextResponse.json({
      success: true,
      data: pilots,
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
```

**After (v2)**:
```typescript
// app/api/pilots/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPilots } from '@/lib/services/pilot-service'

export async function GET(request: NextRequest) {
  try {
    const pilots = await getPilots()

    return NextResponse.json({
      success: true,
      data: pilots,
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
```

**Key Changes**:
1. File moved: `src/app/` → `app/` (no `src/` prefix)
2. Import changed: `@/lib/pilot-service` → `@/lib/services/pilot-service`
3. **No other changes needed!**

---

### Example 5: Server Component Page

**Before (v1)**:
```typescript
// src/app/dashboard/pilots/page.tsx
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { PilotList } from '@/components/pilots/PilotList'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default async function PilotsPage() {
  const supabase = createClient()
  const { data: pilots } = await supabase.from('pilots').select('*')

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Pilots</h1>
      <Suspense fallback={<LoadingSpinner />}>
        <PilotList pilots={pilots || []} />
      </Suspense>
    </div>
  )
}
```

**After (v2)**:
```typescript
// app/dashboard/pilots/page.tsx
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { PilotList } from '@/components/pilots/pilot-list'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export const metadata = {
  title: 'Pilots | Fleet Management',
  description: 'Manage pilot records and certifications',
}

export default async function PilotsPage() {
  const supabase = await createClient()  // ← AWAIT!
  const { data: pilots } = await supabase.from('pilots').select('*')

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Pilots</h1>
      <Suspense fallback={<LoadingSpinner />}>
        <PilotList pilots={pilots || []} />
      </Suspense>
    </div>
  )
}
```

**Key Changes**:
1. File moved: `src/app/` → `app/`
2. Import changed: `@/lib/supabase` → `@/lib/supabase/server`
3. Added `await` before `createClient()`
4. Added `metadata` export for SEO
5. Component import: `PilotList` → `pilot-list` (lowercase)

---

## Testing Migration

### Test Structure

**v1 Testing**:
- Jest for unit tests (`__tests__/` directories)
- Playwright for E2E tests (`e2e/` directory)

**v2 Testing**:
- Playwright for E2E tests only (`e2e/` directory)
- Optional: Add Vitest for unit tests in future

### E2E Test Migration

**Before (v1)**:
```typescript
// e2e/pilots.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Pilot Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard/pilots')
  })

  test('should display pilot list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pilots' })).toBeVisible()

    const rows = page.locator('table tbody tr')
    await expect(rows).toHaveCount(27)
  })
})
```

**After (v2)**:
```typescript
// e2e/pilots.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Pilot Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/pilots')  // ← Port change
  })

  test('should display pilot list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pilots' })).toBeVisible()

    const rows = page.locator('table tbody tr')
    await expect(rows).toHaveCount(27)
  })
})
```

**Key Changes**:
1. Port: `3001` → `3000`
2. **Same test code otherwise!**

### Running Tests

**v1**:
```bash
npm test           # Jest
npx playwright test  # Playwright
```

**v2**:
```bash
npm test           # Playwright only
npm run test:ui    # Playwright UI mode
```

---

## Migration Checklist

Use this checklist when migrating each feature:

### Pre-Migration

- [ ] Read v1 source code thoroughly
- [ ] Document all dependencies (services, utilities, components)
- [ ] Create migration plan (services → utilities → components → pages)
- [ ] Verify npm packages are available in v2

### Service Layer

- [ ] Create service file in `lib/services/`
- [ ] Copy business logic from v1
- [ ] Update imports to `@/` aliases
- [ ] Change `import { getSupabaseAdmin } from './supabase'` to `import { createClient } from '@/lib/supabase/server'`
- [ ] Add `await` before `createClient()`
- [ ] Add TypeScript types from `@/types/supabase`
- [ ] Test service functions in isolation

### Utilities

- [ ] Create utility file in `lib/utils/`
- [ ] Copy pure functions from v1
- [ ] Update imports to `@/` aliases
- [ ] **Do not change business logic**
- [ ] Verify date-fns v4 compatibility

### Components

- [ ] Create component file in `components/` (lowercase filename)
- [ ] Copy component code from v1
- [ ] Remove `FC` type annotation
- [ ] Update imports to `@/` aliases
- [ ] Replace Zustand with React Context (if used)
- [ ] Update Supabase client import (browser vs server)
- [ ] Verify TailwindCSS v4 classes
- [ ] Add Storybook story
- [ ] Test responsive design

### API Routes

- [ ] Create route file in `app/api/`
- [ ] Copy route handler from v1
- [ ] Update service imports to `@/lib/services/`
- [ ] Add `await` before `createClient()`
- [ ] Test API endpoint

### Pages

- [ ] Create page file in `app/`
- [ ] Copy page component from v1
- [ ] Add `async` keyword to function
- [ ] Add `await` before `createClient()`
- [ ] Add `metadata` export
- [ ] Update component imports (lowercase filenames)
- [ ] Test page rendering

### Testing

- [ ] Copy E2E test from v1
- [ ] Update port (`3001` → `3000`)
- [ ] Run tests: `npm test`
- [ ] Fix any failures

### Documentation

- [ ] Update README if needed
- [ ] Add code comments for complex logic
- [ ] Document any deviations from v1

### Final Validation

- [ ] Run `npm run validate` (type-check + lint + format)
- [ ] Test all CRUD operations
- [ ] Test business logic (leave eligibility, certification expiry)
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test authentication flows
- [ ] Verify database queries work correctly

---

## Summary

This migration guide provides comprehensive instructions for porting features from **air-niugini-pms (v1)** to **fleet-management-v2 (v2)**. The key changes are:

1. **Next.js 15**: Async cookies, headers, and Supabase clients
2. **React 19**: Improved types, optional `use()` hook
3. **Supabase SSR**: Separate client/server/middleware clients
4. **TailwindCSS v4**: Updated syntax and config format
5. **Project Structure**: No `src/` directory, services in subdirectory
6. **Zod v4**: Breaking changes in schema definitions
7. **No Zustand**: Use React Context instead
8. **No PWA**: Removed next-pwa
9. **Storybook**: Added for component development

**Migration Phases**:
1. Services (CRITICAL - migrate first)
2. Utilities (pure functions, minimal changes)
3. Components (update imports, remove Zustand)
4. API Routes (add await on createClient)
5. Pages (add async/await)
6. Tests (update port)

**Common Pitfalls**:
- Forgetting `await` on server client
- Using wrong Supabase client (server vs browser)
- Incorrect import paths (missing `services/` subdirectory)
- Zod v4 breaking changes
- TailwindCSS v4 syntax changes

Follow this guide systematically, and the migration will be smooth and maintainable.

---

**Fleet Management v2**
*Modern rebuild with Next.js 15 + React 19 + TypeScript*
**Version 1.0.0 - October 17, 2025**
