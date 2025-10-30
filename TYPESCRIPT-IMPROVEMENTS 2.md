# TypeScript Improvements

**Fleet Management V2 - TypeScript Configuration**
**Last Updated**: October 22, 2025

---

## 🎯 Enabled Strict Settings

As part of Sprint 5 (Code Quality), we've enabled additional TypeScript strict settings to improve code quality and catch more errors at compile time.

### Current Configuration

```json
{
  "compilerOptions": {
    "strict": true,                           // Already enabled
    "forceConsistentCasingInFileNames": true,  // Already enabled
    "noFallthroughCasesInSwitch": true,        // Already enabled
    "allowUnreachableCode": false,             // Already enabled

    // ✅ NEWLY ENABLED (Sprint 5)
    "noUnusedLocals": true,                    // Detect unused local variables
    "noUnusedParameters": true,                // Detect unused function parameters
    "noImplicitReturns": true,                 // Functions must return consistently

    // ⏳ FUTURE (Requires extensive refactoring)
    "noUncheckedIndexedAccess": false,         // Safe array/object access
    "noPropertyAccessFromIndexSignature": false, // Enforce bracket notation
    "exactOptionalPropertyTypes": false        // Stricter optional properties
  }
}
```

---

## ✅ Benefits of Enabled Settings

### `noUnusedLocals: true`
**Purpose**: Catch unused variables that clutter code

**Example**:
```typescript
// ❌ Error: 'unused' is declared but never read
function example() {
  const unused = 'hello'
  const used = 'world'
  return used
}

// ✅ Fixed
function example() {
  const used = 'world'
  return used
}
```

---

### `noUnusedParameters: true`
**Purpose**: Detect unused function parameters

**Example**:
```typescript
// ❌ Error: 'unused' is declared but never read
function process(data: string, unused: number) {
  return data.toUpperCase()
}

// ✅ Fixed - prefix with underscore
function process(data: string, _unused: number) {
  return data.toUpperCase()
}

// ✅ Better - remove unused parameter
function process(data: string) {
  return data.toUpperCase()
}
```

---

### `noImplicitReturns: true`
**Purpose**: Ensure all code paths in a function return a value

**Example**:
```typescript
// ❌ Error: Not all code paths return a value
function getStatus(value: number) {
  if (value > 0) {
    return 'positive'
  }
  // Missing return for value <= 0
}

// ✅ Fixed
function getStatus(value: number) {
  if (value > 0) {
    return 'positive'
  }
  return 'non-positive'
}
```

---

## 📊 Current Type Errors

After enabling stricter settings, we have ~45 type errors to fix:

### Breakdown by Category:

1. **Unused Variables** (~25 errors)
   - Unused imports
   - Unused function parameters
   - Unused local variables

2. **Missing Return Statements** (~3 errors)
   - Functions without consistent return paths
   - Example: `components/accessibility/announcer.tsx`

3. **Type Issues** (~17 errors)
   - Dashboard page type errors (cached data types)
   - accessorKey type mismatches in data tables
   - Example components with unused state

---

## 🔧 Cleanup Plan

### Priority 1: Quick Wins (Est. 2 hours)
**Task**: Remove unused imports and variables

**Files**:
- `app/api/**/*.ts` - Remove unused `request` parameters
- `app/dashboard/**/*.tsx` - Remove unused imports
- `components/**/*.tsx` - Remove unused variables

**Strategy**:
```bash
# Run type-check to see errors
npm run type-check

# Fix files one by one
# Most fixes are simply removing unused lines
```

---

### Priority 2: Missing Returns (Est. 1 hour)
**Task**: Add missing return statements

**Files**:
- `components/accessibility/announcer.tsx:44`

**Example Fix**:
```typescript
// Before
function announce(message: string, priority: 'polite' | 'assertive') {
  if (typeof window === 'undefined') {
    return  // Early return
  }
  // Announce logic
}

// After
function announce(message: string, priority: 'polite' | 'assertive'): void {
  if (typeof window === 'undefined') {
    return
  }
  // Announce logic
  return  // Explicit return
}
```

---

### Priority 3: Type Fixes (Est. 3 hours)
**Task**: Fix type mismatches in dashboard and tables

**Files**:
- `app/dashboard/page.tsx` - Cache data typing issues
- `components/certifications/certifications-table.tsx` - accessorKey type
- `components/pilots/pilots-table.tsx` - Similar issues

**Example Fix**:
```typescript
// Before - Type error with cached data
const data = await getCachedDashboardData()
// TypeScript infers type as {} instead of DashboardMetrics

// After - Explicit typing
const data = await getCachedDashboardData() as DashboardMetrics
// Or fix the getCachedData function to return proper types
```

---

## 🚀 Future Enhancements

### Phase 2: Ultra-Strict Settings

Once current errors are fixed, we can enable even stricter settings:

#### `noUncheckedIndexedAccess: true`
**Benefit**: Safer array and object access

**Example**:
```typescript
// Without setting
const arr = [1, 2, 3]
const value = arr[10]  // undefined, but TypeScript says number

// With setting
const arr = [1, 2, 3]
const value = arr[10]  // number | undefined (safer!)
if (value !== undefined) {
  console.log(value.toFixed(2))  // Type-safe
}
```

**Impact**: ~30+ additional errors to fix
**Effort**: 8-10 hours

---

#### `noPropertyAccessFromIndexSignature: true`
**Benefit**: Enforce bracket notation for dynamic properties

**Example**:
```typescript
// Without setting
process.env.NEXT_PUBLIC_APP_URL  // Works

// With setting - Error
process.env.NEXT_PUBLIC_APP_URL  // ❌ Must use bracket notation

// Fix
process.env['NEXT_PUBLIC_APP_URL']  // ✅ Correct
```

**Impact**: ~10 errors to fix
**Effort**: 2 hours

---

#### `exactOptionalPropertyTypes: true`
**Benefit**: Stricter optional property handling

**Example**:
```typescript
interface User {
  name: string
  age?: number  // Can be number or undefined
}

// Without setting - Both work
const user1: User = { name: 'John', age: undefined }
const user2: User = { name: 'Jane' }

// With setting - Must be explicit
const user1: User = { name: 'John', age: undefined }  // ❌ Error
const user2: User = { name: 'Jane' }  // ✅ OK

// Fix - use | undefined explicitly
interface User {
  name: string
  age?: number | undefined
}
```

**Impact**: ~40+ errors to fix
**Effort**: 12-16 hours

---

## 📋 Immediate Actions

### Sprint 5 - Quick Cleanup

1. **Remove Unused Variables** (30 minutes)
   ```bash
   # Fix API routes
   app/api/auth/signout/route.ts - Remove 'redirect'
   app/api/certifications/[id]/route.ts - Remove unused 'request'
   app/api/check-types/route.ts - Remove unused 'request'
   app/api/pilots/[id]/route.ts - Remove unused 'request'
   ```

2. **Remove Unused Imports** (30 minutes)
   ```bash
   # Fix dashboard pages
   app/dashboard/page.tsx - Remove 'Suspense'
   app/dashboard/leave/page.tsx - Remove 'format'
   app/dashboard/pilots/[id]/page.tsx - Remove 'Input', 'Label', 'format'
   app/dashboard/pilots/[id]/edit/page.tsx - Remove 'normalizeToNull', 'dateToISO'
   ```

3. **Fix Missing Returns** (15 minutes)
   ```bash
   # Fix announcer
   components/accessibility/announcer.tsx - Add explicit return
   ```

4. **Fix Type Issues** (1-2 hours)
   ```bash
   # Fix dashboard types
   app/dashboard/page.tsx - Add proper typing for cached data

   # Fix table accessorKey
   components/certifications/certifications-table.tsx - Fix accessorKey type
   ```

---

## 🎯 Success Criteria

### Sprint 5 Complete When:
- ✅ Stricter TypeScript settings enabled
- ✅ Documentation created (this file)
- ⏳ Current type errors fixed (<10 errors)
- ⏳ npm run type-check passes with 0 errors

### Phase 2 Complete When:
- ⏳ Ultra-strict settings enabled
- ⏳ All type errors fixed
- ⏳ Best practices documented

---

## 📚 Resources

### TypeScript Compiler Options
- [Strict Type-Checking Options](https://www.typescriptlang.org/tsconfig#strict)
- [Type Checking JavaScript Files](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)

### Best Practices
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [TypeScript Performance](https://github.com/microsoft/TypeScript/wiki/Performance)

---

## 📝 Notes

- **Incremental Adoption**: We're enabling strict settings gradually to avoid overwhelming the team
- **Backwards Compatibility**: Current settings don't break existing code
- **Team Training**: Share this document with team for awareness of new rules
- **CI/CD**: Type checking is part of `npm run validate` which runs pre-commit

---

**Version**: 1.0.0
**Author**: Claude (Sprint 5: Code Quality)
**Status**: Stricter settings enabled, cleanup in progress
