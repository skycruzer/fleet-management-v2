# Coding Conventions

**Analysis Date:** 2026-03-14

## Naming Patterns

**Files:**

- Components: `kebab-case.tsx` (e.g., `personalized-greeting.tsx`, `compact-roster-display.tsx`)
- Services: `{feature}-service.ts` (e.g., `pilot-service.ts`, `certification-service.ts`)
- Validations: `{feature}-validation.ts` or `{feature}-schema.ts` (e.g., `pilot-validation.ts`, `flight-request-schema.ts`)
- Hooks: `use-{feature}.ts` or `use-{feature}.tsx` (e.g., `use-optimistic-mutation.ts`, `use-csrf-token.ts`)
- Utilities: descriptive lowercase with hyphens (e.g., `api-response-helper.ts`, `cache-headers.ts`)
- E2E Tests: `{feature}.spec.ts` (e.g., `auth.spec.ts`, `certifications.spec.ts`)
- Unit Tests: `{name}.test.ts` or `{name}.test.tsx` (e.g., `utils.test.ts`, `cert-expiry-card.test.tsx`)

**Functions:**

- camelCase for all function names
- Services export async functions directly (not wrapped in classes unless data-heavy)
- Hooks use `use` prefix
- Helper functions are lowercase camelCase (e.g., `getInitials()`, `safeRevalidate()`)

**Variables:**

- camelCase for all variables and constants in code
- SCREAMING_SNAKE_CASE for exported constants only (rare; usually avoid in favor of enums)
- Single letter variables only in tight loops (`for (let i = 0; ...)`)

**Types:**

- PascalCase for all type names, interfaces, and classes
- Enums in PascalCase (e.g., `ErrorSeverity`, `UserRole`)
- Generic type parameters: `<T>`, `<U>`, `<TData>`, `<TError>` (single letter is fine for generics)

**Database Enums & Fields:**

- Supabase enums use SCREAMING_SNAKE_CASE (e.g., `pilot_licence_type`, `request_category`)
- Table columns use snake_case (e.g., `first_name`, `commencement_date`)

## Code Style

**Formatting:**

- Tool: Prettier 3.8.1
- Key settings:
  - `semi: false` — No semicolons
  - `singleQuote: true` — Single quotes for strings
  - `tabWidth: 2` — 2-space indentation
  - `trailingComma: 'es5'` — Trailing commas in objects/arrays
  - `printWidth: 100` — 100-character line width
  - `arrowParens: 'always'` — Parentheses around arrow function params (even single param)
  - `endOfLine: 'lf'` — Unix line endings
  - `plugins: ['prettier-plugin-tailwindcss']` — Tailwind class sorting

**Linting:**

- Tool: ESLint 9.39.3 with TypeScript support
- Config: `eslint.config.mjs` (flat config format)
- Key plugins: `@next/eslint-plugin-next`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `typescript-eslint`
- Notable disabled rules (by design for stability):
  - `@typescript-eslint/no-unused-vars: 'off'` — Permissive for exploration
  - `@typescript-eslint/no-explicit-any: 'off'` — Allows `any` for complex types
  - `@typescript-eslint/ban-ts-comment: 'off'` — Allows `@ts-ignore` comments
  - `react-hooks/exhaustive-deps: 'off'` — Manual dependency management
  - `@next/next/no-img-element: 'error'` — Enforce `<Image>` from Next.js
  - `@next/next/no-html-link-for-pages: 'error'` — Enforce `<Link>` for routes

**Pre-commit Gates:**

- Husky + lint-staged automatically run on commit
- `*.{js,jsx,ts,tsx}` → ESLint --fix + Prettier
- `*.{json,md,mdx,css,yaml,yml}` → Prettier
- File naming validation: `npm run validate:naming` enforces kebab-case for components

## Import Organization

**Order:**

1. External packages (React, Next.js, third-party libraries)
   ```typescript
   import { createClient } from '@/lib/supabase/server'
   import { useState, useEffect } from 'react'
   ```
2. Type imports (grouped, use `import type`)
   ```typescript
   import type { Database, Json } from '@/types/supabase'
   ```
3. Internal services/utilities from `@/lib`
   ```typescript
   import { getPilots } from '@/lib/services/pilot-service'
   import { logError } from '@/lib/error-logger'
   ```
4. Internal components from `@/components`
   ```typescript
   import { Button } from '@/components/ui/button'
   import { PersonalizedGreeting } from '@/components/dashboard/personalized-greeting'
   ```
5. Relative imports (same directory or sub-directories)
   ```typescript
   import { getInitials } from './helper-functions'
   ```

**Path Aliases:**

- Primary: `@/*` → project root (defined in `tsconfig.json`)
- Never use relative imports going up (`../`); use `@/` instead
- Example: `import { cn } from '@/lib/utils'` (not `import { cn } from '../../../lib/utils'`)

## Error Handling

**Patterns:**

1. **ServiceResponse Pattern (New Standard — Jan 2026):**
   Use for all new services and heavily-used legacy services:

   ```typescript
   import { ServiceResponse } from '@/lib/types/service-response'

   async function getItem(id: string): Promise<ServiceResponse<Item>> {
     try {
       const item = await fetchItem(id)
       if (!item) return ServiceResponse.notFound('Item not found')
       return ServiceResponse.success(item)
     } catch (error) {
       return ServiceResponse.error('Failed to fetch item', error)
     }
   }
   ```

   Helpers: `ServiceResponse.success()`, `.error()`, `.notFound()`, `.unauthorized()`, `.conflict()`, `.rateLimitExceeded()`

2. **Legacy Service Pattern (Throws errors):**
   Existing services that haven't migrated wrap exceptions:

   ```typescript
   async function getUser(id: string) {
     const { data } = await supabase.from('users').select('*').eq('id', id).single()
     if (!data) throw new Error('User not found')
     return data
   }
   ```

   These are wrapped by `executeAndRespond()` in API routes.

3. **API Route Error Handling:**
   Use `executeAndRespond()` helper which logs and converts to HTTP responses:

   ```typescript
   import { executeAndRespond, unauthorizedResponse } from '@/lib/utils/api-response-helper'

   export async function GET(request: Request) {
     const auth = await getAuthenticatedAdmin()
     if (!auth.authenticated) return unauthorizedResponse()
     return executeAndRespond(async () => await getPilots(), {
       operation: 'getPilots',
       endpoint: '/api/pilots',
     })
   }
   ```

4. **Client Error Handling (Components):**
   Use `try-catch` with error boundaries for Suspense fallbacks:

   ```typescript
   <ErrorBoundary fallback={<ErrorFallback section="pilots" />}>
     <Suspense fallback={<Skeleton />}>
       <PilotList />
     </Suspense>
   </ErrorBoundary>
   ```

5. **Error Logging:**
   Use `logError()`, `logInfo()`, `logWarning()` from `lib/error-logger.ts`:

   ```typescript
   import { logError, ErrorSeverity } from '@/lib/error-logger'

   try {
     await expensiveOperation()
   } catch (error) {
     logError(error as Error, {
       source: 'ComponentName',
       severity: ErrorSeverity.HIGH,
       metadata: { userId: user.id },
     })
   }
   ```

## Logging

**Framework:** Custom logger via `lib/error-logger.ts` + `lib/services/logging-service.ts`

**Console-based for development**, structured logging to Better Stack (Logtail) in production via `LOGTAIL_SOURCE_TOKEN`.

**Patterns:**

- Always provide `source` (component/service name) and `severity` for context
- Use enums: `ErrorSeverity.LOW`, `ErrorSeverity.MEDIUM`, `ErrorSeverity.HIGH`, `ErrorSeverity.CRITICAL`
- Include metadata for debugging (user ID, request ID, affected resource ID)
- Never log sensitive data (passwords, tokens, SSNs)

```typescript
logError(new Error('Auth failed'), {
  source: 'AdminAuthService',
  severity: ErrorSeverity.HIGH,
  metadata: { endpoint: '/api/admin/auth' },
})
```

## Comments

**When to Comment:**

- Complex business logic or non-obvious algorithms
- Workarounds or temporary fixes (always include issue number if tracking)
- Public API docs for services and hooks
- Explain WHY, not WHAT (code shows what; comments explain why)

**JSDoc/TSDoc:**
Used for:

- Service functions (especially async operations)
- Custom hooks (parameters, return type, example usage)
- Complex types/interfaces
- Utilities with non-obvious behavior

````typescript
/**
 * Optimistic Mutation Hook
 * Provides instant UI feedback for mutations with automatic rollback on errors
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useOptimisticMutation(
 *   initialData,
 *   async (update) => await apiCall(update)
 * )
 * ```
 */
export function useOptimisticMutation<T>(
  initialData: T[],
  mutationFn: (update: OptimisticUpdate<T>) => Promise<T>
): OptimisticMutationResult<T> {
  // implementation
}
````

**File Headers:**
Services include author, version, and summary:

```typescript
/**
 * Pilot Service for Fleet Management V2
 * Ported from air-niugini-pms v1 with Next.js 16 updates
 *
 * @version 2.0.0
 * @since 2025-10-17
 */
```

## Function Design

**Size:**

- Target: 20-50 lines per function (soft guideline)
- Larger functions should decompose to helpers
- Async functions tend to be longer (API calls, await chains)

**Parameters:**

- Prefer 3-4 parameters max; use object destructuring for more
- Named parameters for optional settings:

  ```typescript
  // Good
  async function getPilots(options: { role?: 'Captain' | 'First Officer'; status?: string })

  // Avoid
  async function getPilots(role, status, includeArchived, sortBy)
  ```

**Return Values:**

- Async functions return `Promise<ServiceResponse<T>>` (new services) or throw (legacy services)
- Sync functions return data directly or null for "not found"
- Use type-safe patterns:

  ```typescript
  // Good
  function parseDate(input: string): Date | null

  // Avoid
  function parseDate(input: string): Date (throws on invalid)
  ```

**Async/Await:**

- Always use `async/await` (never `.then()` chains)
- Wrap slow operations in try-catch
- Use `Promise.all()` for parallel operations, not serial awaits

## Module Design

**Exports:**

- Named exports for functions/utilities
- Default export only for components (rare; usually named)
- Service files export individual functions, not a class wrapper:

  ```typescript
  // Good
  export async function getPilots() { ... }
  export async function createPilot(data) { ... }

  // Avoid
  export const PilotService = { getPilots: async () => { ... } }
  ```

**Barrel Files:**

- Used in `components/ui/` for shadcn/ui exports
- Used in `lib/hooks/` for custom hook exports
- Avoid deeply nested barrel files; prefer direct imports

**Example:**

```typescript
// components/ui/index.ts
export { Button, type ButtonProps } from './button'
export { Input } from './input'
export { Dialog, DialogTrigger, DialogContent } from './dialog'
```

## Type Safety

**TypeScript Config:**

- Mode: Strict (`"strict": true`)
- Generated types: `types/supabase.ts` — never edit manually; regenerate with `npm run db:types` after schema changes
- No unused variable/parameter warnings enabled (relaxed for exploration)

**Best Practices:**

1. Use `type` for type-only imports:
   ```typescript
   import type { Database } from '@/types/supabase'
   ```
2. Avoid `any`; use `unknown` if truly dynamic, then narrow with type guards:
   ```typescript
   function handle(data: unknown) {
     if (typeof data === 'object' && data !== null && 'id' in data) {
       // Now data has 'id' property
     }
   }
   ```
3. Use enums for fixed sets:
   ```typescript
   enum UserRole {
     ADMIN = 'ADMIN',
     MANAGER = 'MANAGER',
     PILOT = 'PILOT',
   }
   ```

## Form Validation

**Pattern:** React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PilotCreateSchema } from '@/lib/validations/pilot-validation'

export function PilotForm() {
  const form = useForm({
    resolver: zodResolver(PilotCreateSchema),
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('firstName')} />
      {form.formState.errors.firstName && (
        <span>{form.formState.errors.firstName.message}</span>
      )}
    </form>
  )
}
```

All validation schemas live in `lib/validations/` and are Zod-based (`.parse()`, `.safeParse()`).

---

_Convention analysis: 2026-03-14_
