# Type System Documentation

This directory contains TypeScript type definitions for the Fleet Management application, with a focus on type safety for JSONB columns and database operations.

## Overview

The type system provides:

1. **Strict TypeScript types** for database JSONB columns
2. **Runtime type guards** for validation
3. **Utility functions** for working with typed data
4. **Comprehensive test coverage** for type safety

## Files

### Core Type Definitions

- **`supabase.ts`** - Generated types from Supabase schema (auto-generated, do not edit manually)
- **`pilot.ts`** - Pilot-specific types with strict JSONB typing
- **`index.ts`** - Central export point for all types

### Utility Functions

Located in `/lib/utils/`:

- **`type-guards.ts`** - Runtime validation and type guards
- **`qualification-utils.ts`** - Helper functions for captain qualifications

### Tests

Located in `/lib/utils/__tests__/`:

- **`type-guards.test.ts`** - Tests for runtime type validation
- **`qualification-utils.test.ts`** - Tests for qualification utilities

## Captain Qualifications Type Safety

### Problem

The `captain_qualifications` column in the `pilots` table is stored as JSONB in PostgreSQL. By default, Supabase generates this as `Json | null`, which provides no compile-time type safety.

### Solution

We've created a strict `CaptainQualifications` type:

```typescript
export type CaptainQualifications = {
  line_captain?: boolean
  training_captain?: boolean
  examiner?: boolean
  rhs_captain_expiry?: string // ISO 8601 date string
}
```

### Usage Examples

#### Basic Type Usage

```typescript
import type { PilotRow } from '@/types/pilot'

// Pilot data with typed qualifications
const pilot: PilotRow = {
  id: 'uuid',
  first_name: 'John',
  last_name: 'Doe',
  captain_qualifications: {
    line_captain: true,
    training_captain: false,
    examiner: true,
    rhs_captain_expiry: '2025-12-31T00:00:00.000Z',
  },
  // ...other fields
}

// TypeScript provides autocomplete and type checking
if (pilot.captain_qualifications?.line_captain) {
  console.log('Pilot is a line captain')
}
```

#### Runtime Validation

```typescript
import { isCaptainQualifications, parseCaptainQualifications } from '@/lib/utils/type-guards'

// Validate unknown data
const rawData = await fetchFromAPI()

if (isCaptainQualifications(rawData.qualifications)) {
  // TypeScript now knows the type
  const quals = rawData.qualifications
  console.log(quals.line_captain)
}

// Parse and validate
const qualifications = parseCaptainQualifications(rawData.qualifications)
if (qualifications) {
  // Safe to use
  console.log(qualifications.examiner)
}
```

#### Using Utility Functions

```typescript
import {
  isLineCaptain,
  isTrainingCaptain,
  isExaminer,
  isRHSCaptainValid,
  getDaysUntilRHSExpiry,
  getCaptainQualificationSummary,
  getQualificationBadges,
} from '@/lib/utils/qualification-utils'

// Check specific qualifications
if (isLineCaptain(pilot.captain_qualifications)) {
  console.log('Line captain')
}

if (isTrainingCaptain(pilot.captain_qualifications)) {
  console.log('Can conduct training')
}

// Check RHS captain validity
if (isRHSCaptainValid(pilot.captain_qualifications)) {
  const days = getDaysUntilRHSExpiry(pilot.captain_qualifications)
  console.log(`RHS captain qualification expires in ${days} days`)
}

// Get comprehensive summary
const summary = getCaptainQualificationSummary(pilot.captain_qualifications)
console.log('Is Line Captain:', summary.isLineCaptain)
console.log('Is Training Captain:', summary.isTrainingCaptain)
console.log('Is Examiner:', summary.isExaminer)
console.log('RHS Expiry:', summary.rhsCaptainExpiry)
console.log('RHS Valid:', summary.rhsCaptainIsValid)
console.log('Days until RHS expiry:', summary.rhsCaptainDaysUntilExpiry)

// Get qualification badges for display
const badges = getQualificationBadges(pilot.captain_qualifications)
// Returns: ['Line Captain', 'Examiner', 'RHS Captain']
badges.forEach((badge) => console.log(`Badge: ${badge}`))
```

#### Sanitizing User Input

```typescript
import { sanitizeCaptainQualifications } from '@/lib/utils/type-guards'

// Sanitize potentially unsafe input
const userInput = formData.captain_qualifications
const sanitized = sanitizeCaptainQualifications(userInput)

// Safe to save to database
await updatePilot({
  id: pilotId,
  captain_qualifications: sanitized,
})
```

#### Creating Default Qualifications

```typescript
import { createDefaultCaptainQualifications } from '@/lib/utils/type-guards'

// Create new pilot with default qualifications
const newPilot: PilotInsert = {
  first_name: 'Jane',
  last_name: 'Smith',
  employee_id: 'EMP123',
  role: 'Captain',
  captain_qualifications: createDefaultCaptainQualifications(),
  // ...other required fields
}
```

#### Status Color Coding

```typescript
import { getQualificationStatusColor } from '@/lib/utils/qualification-utils'

const color = getQualificationStatusColor(pilot.captain_qualifications)

// Returns: 'red', 'yellow', 'green', or 'gray'
const badgeClass = `badge-${color}` // 'badge-green', 'badge-yellow', etc.
```

## Type Guard Functions

### `isCaptainQualifications(value: unknown): value is CaptainQualifications`

Type guard that validates if a value conforms to the `CaptainQualifications` type.

**Returns:** `true` if valid, `false` otherwise

### `parseCaptainQualifications(value: unknown): CaptainQualifications | null`

Validates and parses captain qualifications, returning a typed object or `null`.

**Returns:** Typed object or `null` if invalid

### `sanitizeCaptainQualifications(value: unknown): CaptainQualifications`

Sanitizes and ensures all fields have correct types. Converts truthy/falsy values appropriately.

**Returns:** Valid `CaptainQualifications` object

### `isISODateString(value: unknown): value is string`

Checks if a value is a valid ISO 8601 date string.

**Returns:** `true` if valid ISO date string

### `parseISODateString(value: unknown): Date | null`

Parses a date string and returns a Date object.

**Returns:** `Date` object or `null` if invalid

## Qualification Utility Functions

### Boolean Checks

- `isLineCaptain(qualifications)` - Check if pilot is a line captain
- `isTrainingCaptain(qualifications)` - Check if pilot is a training captain
- `isExaminer(qualifications)` - Check if pilot is an examiner
- `isRHSCaptainValid(qualifications)` - Check if RHS captain qualification is valid

### Date Calculations

- `getDaysUntilRHSExpiry(qualifications)` - Calculate days until RHS expiry
- `getRHSExpiryDate(qualifications)` - Get RHS expiry as Date object

### Summaries and Badges

- `getCaptainQualificationSummary(qualifications)` - Get comprehensive summary
- `countSpecialQualifications(qualifications)` - Count number of qualifications
- `getQualificationBadges(qualifications)` - Get array of badge strings

### Validation and Status

- `hasRequiredQualifications(qualifications, required)` - Check required qualifications
- `hasExpiringQualifications(qualifications, warningDays)` - Check expiring qualifications
- `getQualificationStatusColor(qualifications)` - Get status color code

## Testing

All type guards and utility functions have comprehensive test coverage.

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test type-guards.test.ts
npm test qualification-utils.test.ts

# Run tests in watch mode
npm test -- --watch
```

### Test Coverage

- ✅ Type guard validation
- ✅ Runtime type checking
- ✅ Date parsing and validation
- ✅ Qualification status checks
- ✅ Edge cases (null, undefined, invalid data)
- ✅ Date calculations
- ✅ Badge generation
- ✅ Status color coding

## Best Practices

### 1. Always Use Type Guards for Unknown Data

```typescript
// ❌ BAD - No runtime validation
const quals = data.captain_qualifications
console.log(quals.line_captain) // Might crash

// ✅ GOOD - Runtime validation
const quals = parseCaptainQualifications(data.captain_qualifications)
if (quals) {
  console.log(quals.line_captain) // Safe
}
```

### 2. Use Utility Functions Instead of Direct Property Access

```typescript
// ❌ BAD - Manual checking
const isLC = pilot.captain_qualifications?.line_captain === true

// ✅ GOOD - Use utility function
const isLC = isLineCaptain(pilot.captain_qualifications)
```

### 3. Sanitize User Input

```typescript
// ❌ BAD - Direct save
await updatePilot({ captain_qualifications: formData })

// ✅ GOOD - Sanitize first
const sanitized = sanitizeCaptainQualifications(formData)
await updatePilot({ captain_qualifications: sanitized })
```

### 4. Use Type Aliases for Complex Types

```typescript
// ✅ GOOD - Import from central location
import type { PilotRow, CaptainQualifications } from '@/types'

// Instead of
import type { Database } from '@/types/supabase'
type PilotRow = Database['public']['Tables']['pilots']['Row']
```

## Extending the Type System

### Adding New JSONB Column Types

1. Define the type in the appropriate file (e.g., `types/pilot.ts`)
2. Create type guards in `lib/utils/type-guards.ts`
3. Create utility functions if needed
4. Write comprehensive tests
5. Update this README

### Example: Adding Contract Details Type

```typescript
// types/pilot.ts
export type ContractDetails = {
  start_date: string
  end_date?: string
  type: 'permanent' | 'contract' | 'casual'
  terms?: string
}

// lib/utils/type-guards.ts
export function isContractDetails(value: unknown): value is ContractDetails {
  // Implementation
}

// lib/utils/contract-utils.ts
export function isContractActive(details: ContractDetails): boolean {
  // Implementation
}
```

## Regenerating Supabase Types

When the database schema changes, regenerate types:

```bash
npm run db:types
```

This updates `types/supabase.ts` with the latest schema definitions.

## Additional Resources

- [TypeScript Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Supabase TypeScript Support](https://supabase.com/docs/guides/api/typescript-support)
- [PostgreSQL JSONB Type](https://www.postgresql.org/docs/current/datatype-json.html)

---

**Last Updated:** October 17, 2025
**Version:** 1.0.0
**Maintainer:** Fleet Management Development Team
