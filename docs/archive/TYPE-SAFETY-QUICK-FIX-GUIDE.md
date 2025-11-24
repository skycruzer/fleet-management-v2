# Type Safety Quick Fix Guide
**Fleet Management V2 - TypeScript Improvements**

---

## Quick Reference: Common Fixes

### 1. Fix Error Handling in Catch Blocks

**WRONG:**
```typescript
} catch (error: any) {
  console.error('Error:', error)
  return NextResponse.json({ error: error.message }, { status: 500 })
}
```

**RIGHT:**
```typescript
} catch (error) {
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ error: 'Unknown error occurred' }, { status: 500 })
}
```

---

### 2. Fix Supabase Query Results

**WRONG:**
```typescript
const pilots = await supabase.from('pilots').select('*')
pilots.data?.map((pilot: any) => {
  // No type safety
})
```

**RIGHT:**
```typescript
import type { Database } from '@/types/supabase'

type Pilot = Database['public']['Tables']['pilots']['Row']

const { data: pilots } = await supabase.from('pilots').select('*')
pilots?.map((pilot: Pilot) => {
  // Full type safety and IntelliSense
})
```

---

### 3. Fix Array.reduce() with Proper Types

**WRONG:**
```typescript
const counts = items.reduce((acc: any, item: any) => {
  acc.total++
  return acc
}, { total: 0 })
```

**RIGHT:**
```typescript
interface Counts {
  total: number
}

const counts = items.reduce<Counts>((acc, item) => {
  acc.total++
  return acc
}, { total: 0 })
```

---

### 4. Fix JSONB/JSON Fields

**WRONG:**
```typescript
interface AuditLog {
  old_values: any
  new_values: any
}
```

**RIGHT:**
```typescript
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
type JsonObject = { [key: string]: JsonValue }

interface AuditLog {
  old_values: JsonObject | null
  new_values: JsonObject | null
}
```

---

### 5. Fix Filter/Map Type Narrowing

**WRONG:**
```typescript
const captains = pilots.filter((p: any) => p.role === 'Captain')
```

**RIGHT:**
```typescript
type Pilot = Database['public']['Tables']['pilots']['Row']

const captains = pilots.filter((p: Pilot): p is Pilot => p.role === 'Captain')
```

---

### 6. Use Type Guards for Optional Chains

**WRONG:**
```typescript
const role = (data.pilots as any)?.role
```

**RIGHT:**
```typescript
interface PilotData {
  pilots: { role: string } | null
}

function isPilotData(data: unknown): data is PilotData {
  return typeof data === 'object' && data !== null && 'pilots' in data
}

const role = isPilotData(data) && data.pilots ? data.pilots.role : null
```

---

## File-Specific Fixes

### Fix: `/e2e/leave-approval-full-test.spec.ts:135`

```typescript
// Line 135 - Replace:
} catch (error) {
  console.log(`❌ ${apiTest.endpoint} - Failed: ${error.message}`)
}

// With:
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.log(`❌ ${apiTest.endpoint} - Failed: ${errorMessage}`)
}
```

---

### Fix: `/lib/services/audit-service.ts:48-52`

```typescript
// Replace:
export interface AuditLog {
  old_values: any
  new_values: any
  ip_address: any
}

// With:
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
type JsonObject = { [key: string]: JsonValue }

export interface AuditLog {
  old_values: JsonObject | null
  new_values: JsonObject | null
  ip_address: string | null
}
```

---

### Fix: `/lib/services/logging-service.ts:8-9`

```typescript
// Replace:
let serverLogger: any = null
let clientLogger: any = null

// With:
import type { Logtail } from '@logtail/node'
import type { Logtail as BrowserLogtail } from '@logtail/browser'

let serverLogger: Logtail | null = null
let clientLogger: BrowserLogtail | null = null
```

---

### Fix: `/lib/services/pilot-service.ts:223-250`

```typescript
// Add this type at the top of the file:
type PilotWithChecksRaw = Database['public']['Tables']['pilots']['Row'] & {
  pilot_checks: Array<{
    expiry_date: string | null
    check_types: {
      check_code: string
      check_description: string
      category: string
    } | null
  }> | null
}

interface CertificationCounts {
  current: number
  expiring: number
  expired: number
}

// Then replace Line 223:
const pilotsWithCerts = pilotsWithChecks.map((pilot: any) => {

// With:
const pilotsWithCerts = pilotsWithChecks.map((pilot: PilotWithChecksRaw) => {

// And replace Line 233:
const certificationCounts = certifications.reduce(
  (acc: any, check: any) => {

// With:
const certificationCounts = certifications.reduce<CertificationCounts>(
  (acc, check) => {
```

---

## ESLint Configuration (Add This)

Create or update `.eslintrc.json`:

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-call": "warn",
    "@typescript-eslint/no-unsafe-return": "warn"
  }
}
```

---

## Pre-Commit Hook (Add This)

Create `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check for new 'any' usage
if git diff --cached --name-only | grep -E '\.(ts|tsx)$' > /dev/null; then
  if git diff --cached | grep -E ':\s*any\b' > /dev/null; then
    echo "❌ ERROR: New 'any' types detected. Please use proper types."
    echo "Run: git diff --cached | grep -E ':\s*any\b'"
    exit 1
  fi
fi

# Run type check
npm run type-check
```

---

## VS Code Settings (Recommended)

Add to `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.strictNullChecks": true,
  "typescript.preferences.noImplicitAny": true
}
```

---

## Common Type Utilities (Create `/lib/utils/type-guards.ts`)

```typescript
import type { Database } from '@/types/supabase'

// JSON types for JSONB fields
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export type JsonObject = { [key: string]: JsonValue }

// Common database types
export type Pilot = Database['public']['Tables']['pilots']['Row']
export type PilotCheck = Database['public']['Tables']['pilot_checks']['Row']
export type LeaveRequest = Database['public']['Tables']['leave_requests']['Row']

// Type guards
export function isError(error: unknown): error is Error {
  return error instanceof Error
}

export function isPilot(data: unknown): data is Pilot {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'employee_id' in data &&
    'role' in data
  )
}

export function hasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  )
}

// Supabase result with relations
export type PilotWithChecks = Pilot & {
  pilot_checks: Array<
    PilotCheck & {
      check_types: Database['public']['Tables']['check_types']['Row'] | null
    }
  > | null
}

export function isPilotWithChecks(data: unknown): data is PilotWithChecks {
  return (
    isPilot(data) &&
    'pilot_checks' in data &&
    (data.pilot_checks === null || Array.isArray(data.pilot_checks))
  )
}
```

---

## Testing Type Safety

```typescript
// Test file: /lib/utils/__tests__/type-guards.test.ts
import { describe, it, expect } from '@jest/globals'
import { isError, isPilot, hasMessage } from '../type-guards'

describe('Type Guards', () => {
  it('should identify Error objects', () => {
    const error = new Error('test')
    expect(isError(error)).toBe(true)
    expect(isError('string')).toBe(false)
    expect(isError({ message: 'test' })).toBe(false)
  })

  it('should identify Pilot objects', () => {
    const pilot = { id: '1', employee_id: 'E001', role: 'Captain' }
    expect(isPilot(pilot)).toBe(true)
    expect(isPilot({})).toBe(false)
    expect(isPilot(null)).toBe(false)
  })
})
```

---

## Summary: Priority Order

### Week 1 (Critical)
1. ✅ Fix E2E test error (5 min)
2. ✅ Create `/lib/utils/type-guards.ts` (1 hour)
3. ✅ Fix all `catch (error: any)` (2-3 hours)
4. ✅ Fix audit-service.ts types (30 min)
5. ✅ Fix logging-service.ts types (15 min)

### Week 2 (High Priority)
6. ✅ Fix pilot-service.ts `any` usage
7. ✅ Fix certification-service.ts `any` usage
8. ✅ Fix leave-eligibility-service.ts `any` usage
9. ✅ Fix dashboard-service.ts `any` usage

### Week 3 (Medium Priority)
10. ✅ Fix all API route error handling
11. ✅ Add ESLint strict rules
12. ✅ Set up pre-commit hooks

### Future (Nice to Have)
13. ✅ Add JSDoc comments
14. ✅ Extract duplicate logic
15. ✅ Create comprehensive type library

---

**Last Updated:** October 26, 2025
