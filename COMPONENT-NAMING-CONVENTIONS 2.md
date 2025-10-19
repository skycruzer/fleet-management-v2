# Component Naming Conventions

**Version**: 1.0.0
**Last Updated**: October 19, 2025
**Status**: Production Standard

## Overview

This document defines the standardized naming conventions for all files in the fleet-management-v2 project. Following these conventions ensures consistency, improves developer experience, and aligns with React/Next.js best practices.

---

## 1. Core Naming Rules

### 1.1 Component Files (React Components)

**Rule**: Use **kebab-case** for all component files.

**Pattern**: `{descriptor}-{type}.tsx`

**Examples**:
```
✅ CORRECT
- pilot-form.tsx
- leave-request-form.tsx
- error-boundary.tsx
- network-status-indicator.tsx
- submit-button.tsx

❌ INCORRECT
- PilotForm.tsx (PascalCase - avoid)
- pilot_form.tsx (snake_case - avoid)
- pilotForm.tsx (camelCase - avoid)
```

**Reasoning**:
- Consistent with Next.js App Router conventions (page.tsx, layout.tsx)
- Easier to scan in file explorers
- Matches shadcn/ui component naming
- URL-friendly (important for public components)

---

### 1.2 Utility/Service Files

**Rule**: Use **kebab-case** with descriptive suffix.

**Pattern**: `{name}-{type}.ts`

**Examples**:
```
✅ CORRECT
- pilot-service.ts
- certification-utils.ts
- leave-validation.ts
- roster-utils.ts
- error-logger.ts
- retry-client.ts

❌ INCORRECT
- pilotService.ts (camelCase - avoid)
- pilot_service.ts (snake_case - avoid)
- PILOT_SERVICE.ts (UPPER_CASE - avoid)
```

**Common Suffixes**:
- `-service.ts` - Business logic/API services
- `-utils.ts` - Utility functions
- `-validation.ts` - Zod schemas and validators
- `-client.ts` - Specialized clients (Supabase, HTTP)
- `-logger.ts` - Logging utilities
- `-handler.ts` - Event/error handlers

---

### 1.3 React Hooks

**Rule**: Use **kebab-case** with `use-` prefix.

**Pattern**: `use-{hook-name}.ts`

**Examples**:
```
✅ CORRECT
- use-portal-form.ts
- use-retry-state.ts
- use-online-status.ts
- use-optimistic-mutation.ts
- use-deduplicated-submit.ts

❌ INCORRECT
- usePortalForm.ts (camelCase - avoid)
- use_portal_form.ts (snake_case - avoid)
- portal-form-hook.ts (missing use- prefix)
```

---

### 1.4 Storybook Stories

**Rule**: Match component name + `.stories.tsx` suffix.

**Pattern**: `{component-name}.stories.tsx`

**Examples**:
```
✅ CORRECT
- button.stories.tsx (for button.tsx)
- error-boundary.stories.tsx (for error-boundary.tsx)
- network-status-indicator.stories.tsx

❌ INCORRECT
- ButtonStories.tsx
- button.story.tsx (use .stories.tsx, not .story.tsx)
- button-component.stories.tsx (redundant -component)
```

---

### 1.5 Test Files

**Rule**: Match file name + `.test.ts` or `.spec.ts` suffix.

**Pattern**: `{file-name}.test.ts` or `{file-name}.spec.ts`

**Examples**:
```
✅ CORRECT
- retry-utils.test.ts (for retry-utils.ts)
- pilot-service.spec.ts (for pilot-service.ts)
- use-online-status.test.ts

❌ INCORRECT
- retry-utils-test.ts (use .test.ts suffix)
- test-retry-utils.ts (suffix, not prefix)
```

**Note**: Use `.test.ts` for unit tests, `.spec.ts` for integration tests (convention, not enforced).

---

### 1.6 Next.js Special Files

**Rule**: Use Next.js reserved names (always lowercase).

**Reserved Files**:
```
✅ CORRECT (Next.js App Router)
- page.tsx          (Route page component)
- layout.tsx        (Layout component)
- loading.tsx       (Loading UI)
- error.tsx         (Error UI)
- not-found.tsx     (404 page)
- route.ts          (API route handler)
- middleware.ts     (Middleware)

❌ INCORRECT
- Page.tsx, Layout.tsx (must be lowercase)
- index.tsx (use page.tsx in App Router)
```

---

### 1.7 Type Definition Files

**Rule**: Use **kebab-case** or match source file name.

**Examples**:
```
✅ CORRECT
- types/supabase.ts (generated types)
- types/database.ts
- lib/types.ts (local types)

❌ INCORRECT
- types/Supabase.ts (avoid PascalCase)
- types/db_types.ts (avoid snake_case)
```

---

### 1.8 Configuration Files

**Rule**: Use **kebab-case** or standard config names.

**Examples**:
```
✅ CORRECT
- next.config.js
- tailwind.config.ts
- tsconfig.json
- eslint.config.mjs
- playwright.config.ts

❌ INCORRECT
- NextConfig.js
- tailwind-config.ts (use standard name)
```

---

## 2. Component Internal Naming

### 2.1 Component Function Names

**Rule**: Use **PascalCase** for component function names (React standard).

**Examples**:
```tsx
✅ CORRECT
// File: pilot-form.tsx
export function PilotForm() { ... }

// File: error-boundary.tsx
export function ErrorBoundary() { ... }

// File: network-status-indicator.tsx
export function NetworkStatusIndicator() { ... }

❌ INCORRECT
// File: pilot-form.tsx
export function pilotForm() { ... }  // camelCase - avoid

export function pilot_form() { ... } // snake_case - avoid
```

**Pattern**: Convert kebab-case filename to PascalCase for component name.
- `pilot-form.tsx` → `function PilotForm()`
- `error-boundary.tsx` → `function ErrorBoundary()`
- `submit-button.tsx` → `function SubmitButton()`

---

### 2.2 Variable and Function Names

**Rule**: Use **camelCase** for variables, functions, and parameters.

**Examples**:
```typescript
✅ CORRECT
const pilotData = await getPilots()
function calculateRetirement(pilotId: string) { ... }
const isExpiringSoon = checkExpiry(date)

❌ INCORRECT
const PilotData = await getPilots()  // PascalCase - avoid
const pilot_data = await getPilots() // snake_case - avoid
```

---

### 2.3 Constants

**Rule**: Use **UPPER_SNAKE_CASE** for true constants.

**Examples**:
```typescript
✅ CORRECT
const MAX_RETRY_ATTEMPTS = 3
const ROSTER_PERIOD_DAYS = 28
const DEFAULT_TIMEOUT_MS = 5000

❌ INCORRECT
const maxRetryAttempts = 3  // camelCase for constants - avoid
const MaxRetryAttempts = 3  // PascalCase - avoid
```

---

### 2.4 Type and Interface Names

**Rule**: Use **PascalCase** for types and interfaces.

**Examples**:
```typescript
✅ CORRECT
type PilotData = { ... }
interface LeaveRequest { ... }
type CertificationStatus = 'current' | 'expiring' | 'expired'

❌ INCORRECT
type pilotData = { ... }      // camelCase - avoid
interface leave_request { ... } // snake_case - avoid
```

---

## 3. Directory Structure Naming

### 3.1 Directory Names

**Rule**: Use **kebab-case** for all directories.

**Examples**:
```
✅ CORRECT
components/
  ui/
  forms/
  portal/
  examples/

lib/
  supabase/
  utils/
  validations/
  hooks/
  services/

app/
  dashboard/
  portal/
  auth/

❌ INCORRECT
components/UI/ (uppercase - avoid)
lib/Supabase/ (PascalCase - avoid)
app/Dashboard/ (PascalCase - avoid)
```

---

### 3.2 Route Segment Names (App Router)

**Rule**: Use **kebab-case** for route segments.

**Examples**:
```
✅ CORRECT
app/
  dashboard/
    pilots/
    leave-requests/
    certifications/
  auth/
    login/
    signup/

❌ INCORRECT
app/
  Dashboard/          (PascalCase - avoid)
  auth/
    LogIn/            (PascalCase - avoid)
    sign_up/          (snake_case - avoid)
```

**Routing Impact**:
- `dashboard/pilots/` → `/dashboard/pilots` ✅
- `Dashboard/Pilots/` → `/Dashboard/Pilots` ❌ (incorrect URL casing)

---

## 4. Import/Export Patterns

### 4.1 Named Exports (Preferred)

**Rule**: Use named exports for components and utilities.

**Examples**:
```tsx
✅ CORRECT
// pilot-form.tsx
export function PilotForm() { ... }

// Import
import { PilotForm } from '@/components/forms/pilot-form'

❌ AVOID (default exports)
// pilot-form.tsx
export default function PilotForm() { ... }

// Import (inconsistent naming possible)
import PilotForm from '@/components/forms/pilot-form'
import MyPilotForm from '@/components/forms/pilot-form' // Different name!
```

**Exceptions**: Default exports are acceptable for:
- Next.js page components (optional)
- Dynamic imports
- Third-party library compatibility

---

### 4.2 Barrel Exports (index.ts)

**Rule**: Use `index.ts` for exporting multiple related items.

**Examples**:
```typescript
✅ CORRECT
// components/forms/index.ts
export { PilotForm } from './pilot-form'
export { CertificationForm } from './certification-form'
export { LeaveRequestForm } from './leave-request-form'

// Usage
import { PilotForm, CertificationForm } from '@/components/forms'

❌ INCORRECT
// Exporting everything with *
export * from './pilot-form'  // Loses explicit control
```

---

## 5. Naming Conventions Summary Table

| Item | Convention | Example |
|------|------------|---------|
| **Component Files** | kebab-case | `pilot-form.tsx` |
| **Component Functions** | PascalCase | `function PilotForm()` |
| **Utility Files** | kebab-case | `roster-utils.ts` |
| **Service Files** | kebab-case | `pilot-service.ts` |
| **Validation Files** | kebab-case | `leave-validation.ts` |
| **Hooks** | kebab-case (use-prefix) | `use-portal-form.ts` |
| **Hook Functions** | camelCase (use prefix) | `function usePortalForm()` |
| **Storybook Stories** | kebab-case.stories.tsx | `button.stories.tsx` |
| **Test Files** | kebab-case.test.ts | `retry-utils.test.ts` |
| **Types/Interfaces** | PascalCase | `type PilotData` |
| **Variables/Functions** | camelCase | `const pilotData` |
| **Constants** | UPPER_SNAKE_CASE | `const MAX_RETRIES = 3` |
| **Directories** | kebab-case | `components/forms/` |
| **Route Segments** | kebab-case | `app/leave-requests/` |

---

## 6. Migration Guide

### 6.1 Current State Analysis

**Status**: ✅ **All files already follow conventions!**

Audit results (October 19, 2025):
- All component files use kebab-case ✅
- All service/util files use kebab-case ✅
- All hooks use kebab-case with `use-` prefix ✅
- All Storybook stories use `.stories.tsx` suffix ✅
- Next.js special files use correct names ✅

**No migration needed - conventions already established.**

---

### 6.2 Future File Creation Checklist

When creating new files, verify:

- [ ] Component file uses kebab-case (e.g., `new-component.tsx`)
- [ ] Component function uses PascalCase (e.g., `function NewComponent()`)
- [ ] Service/utility file uses kebab-case with suffix (e.g., `new-service.ts`)
- [ ] Hook file uses `use-{name}.ts` pattern (e.g., `use-new-hook.ts`)
- [ ] Hook function uses `use` prefix in camelCase (e.g., `function useNewHook()`)
- [ ] Test file matches source + `.test.ts` (e.g., `new-service.test.ts`)
- [ ] Storybook story matches component + `.stories.tsx` (e.g., `new-component.stories.tsx`)
- [ ] Directory uses kebab-case (e.g., `new-feature/`)

---

## 7. Enforcement

### 7.1 ESLint Rules

Configured in `eslint.config.mjs`:

```javascript
// Enforce naming conventions
rules: {
  '@typescript-eslint/naming-convention': [
    'error',
    {
      selector: 'variable',
      format: ['camelCase', 'UPPER_CASE'], // Variables: camelCase or UPPER_CASE
    },
    {
      selector: 'function',
      format: ['camelCase', 'PascalCase'], // Functions: camelCase (or PascalCase for components)
    },
    {
      selector: 'typeLike',
      format: ['PascalCase'], // Types/Interfaces: PascalCase
    },
  ],
}
```

### 7.2 Pre-commit Hooks

Husky + lint-staged automatically checks:
- ESLint naming rules
- TypeScript compilation
- Prettier formatting

**Commit will fail if naming conventions are violated.**

---

## 8. Examples from Codebase

### 8.1 Component Examples

```tsx
// ✅ components/forms/pilot-form.tsx
export function PilotForm() {
  const [pilotData, setPilotData] = useState<PilotData | null>(null)
  const MAX_NAME_LENGTH = 100

  return <form>...</form>
}

// ✅ components/ui/error-boundary.tsx
export function ErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundaryWrapper>...</ErrorBoundaryWrapper>
}

// ✅ components/portal/submit-button.tsx
export function SubmitButton({ isLoading }: { isLoading: boolean }) {
  return <button disabled={isLoading}>Submit</button>
}
```

### 8.2 Service Examples

```typescript
// ✅ lib/services/pilot-service.ts
export async function getPilots(): Promise<PilotData[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('pilots').select('*')
  if (error) throw error
  return data
}

// ✅ lib/services/certification-service.ts
export async function createCertification(
  certData: CertificationInput
): Promise<Certification> {
  // Implementation
}
```

### 8.3 Hook Examples

```typescript
// ✅ lib/hooks/use-portal-form.ts
export function usePortalForm<T extends z.ZodSchema>({
  schema,
  onSuccess,
}: UsePortalFormOptions<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Implementation
}

// ✅ lib/hooks/use-online-status.ts
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  // Implementation
}
```

### 8.4 Utility Examples

```typescript
// ✅ lib/utils/roster-utils.ts
const ROSTER_PERIOD_DAYS = 28

export function calculateRosterPeriod(date: Date): RosterPeriod {
  // Implementation
}

// ✅ lib/utils/certification-utils.ts
export function getCertificationStatus(
  expiryDate: string
): 'current' | 'expiring' | 'expired' {
  // Implementation
}
```

---

## 9. Common Pitfalls to Avoid

### 9.1 Inconsistent Component Naming

```tsx
❌ WRONG
// File: PilotForm.tsx (PascalCase filename)
export function PilotForm() { ... }

✅ CORRECT
// File: pilot-form.tsx (kebab-case filename)
export function PilotForm() { ... }
```

### 9.2 Mixing Naming Styles

```typescript
❌ WRONG
// Mixing kebab-case and camelCase in same directory
lib/services/
  pilot-service.ts
  leaveService.ts     // Inconsistent!
  certificationSvc.ts // Inconsistent!

✅ CORRECT
lib/services/
  pilot-service.ts
  leave-service.ts
  certification-service.ts
```

### 9.3 Unclear Abbreviations

```typescript
❌ WRONG
// Unclear abbreviations
lib/utils/cert-utils.ts  // What is "cert"?
lib/services/lve-svc.ts  // Unreadable

✅ CORRECT
lib/utils/certification-utils.ts
lib/services/leave-service.ts
```

### 9.4 Over-nesting Directories

```typescript
❌ WRONG
components/
  ui/
    forms/
      input/
        text/
          text-input.tsx  // Too deep!

✅ CORRECT
components/
  forms/
    text-input.tsx
```

---

## 10. References

### 10.1 Official Style Guides

- [Next.js Documentation - File Conventions](https://nextjs.org/docs/app/building-your-application/routing)
- [React Naming Conventions](https://react.dev/learn/thinking-in-react#step-1-break-the-ui-into-a-component-hierarchy)
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

### 10.2 Project-Specific References

- **CLAUDE.md** - Full project development guide
- **WORK-PLAN.md** - Implementation roadmap
- **CONTRIBUTING.md** - Contribution guidelines

---

## 11. Changelog

### Version 1.0.0 (October 19, 2025)

**Initial Release**
- Documented existing naming conventions
- Added migration guide (no migration needed)
- Added enforcement rules
- Added examples from current codebase

**By**: code-simplicity-reviewer agent (TODO #054)

---

**Document Owner**: Fleet Management V2 Team
**Review Cycle**: Quarterly
**Next Review**: January 2026
