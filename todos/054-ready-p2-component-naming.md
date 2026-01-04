---
status: resolved
priority: p2
issue_id: '054'
tags: [code-quality, naming, consistency]
dependencies: []
resolved_date: 2025-10-19
---

# Standardize Component Naming Conventions

## Problem Statement

Component file names use inconsistent patterns (kebab-case vs PascalCase, .tsx vs .ts), making codebase harder to navigate.

## Findings

- **Severity**: 🟡 P2 (IMPORTANT)
- **Impact**: Code organization, developer experience
- **Agent**: code-simplicity-reviewer

## Proposed Solution

Adopt consistent naming: kebab-case for all files (components, utilities, services).

## Resolution Summary

**Status**: ✅ RESOLVED - No migration needed, conventions already established

**Analysis Results**:

- Audited 184 files across app/, components/, lib/, types/, e2e/, scripts/
- All code files (_.ts, _.tsx) already follow kebab-case convention
- Component functions use PascalCase (React standard)
- Hooks use use-kebab-case pattern
- Services use kebab-case-service pattern
- Utilities use kebab-case-utils pattern
- 0 naming violations found
- 15 warnings (documentation files and Next.js dynamic routes [id] - acceptable)

**Deliverables Created**:

1. **COMPONENT-NAMING-CONVENTIONS.md** (11 sections, 600+ lines)
   - Complete naming convention reference
   - File naming patterns for all file types
   - Component internal naming (PascalCase functions, camelCase variables)
   - Directory structure guidelines
   - Migration guide (no migration needed)
   - Enforcement rules (ESLint, Husky)
   - 15+ code examples from actual codebase
   - Common pitfalls to avoid

2. **scripts/validate-naming.mjs** (380 lines)
   - Automated naming convention validator
   - Validates kebab-case for files
   - Checks Next.js special files
   - Validates Storybook stories (.stories.tsx)
   - Validates test files (.test.ts, .spec.ts)
   - Validates hooks (use-kebab-case.ts)
   - Colored terminal output
   - Exit codes for CI/CD integration

3. **package.json updates**
   - Added `npm run validate:naming` script
   - Can be integrated into CI/CD pipeline
   - Can be added to pre-commit hooks

## Acceptance Criteria

- [x] All components use consistent filenames (kebab-case) ✅
- [x] All utilities use kebab-case ✅
- [x] All imports follow consistent pattern ✅
- [x] Documentation created (COMPONENT-NAMING-CONVENTIONS.md) ✅
- [x] Validation tooling created (validate-naming.mjs) ✅
- [x] npm script added (validate:naming) ✅

## Work Log

### 2025-10-19 - Initial Discovery

**By:** code-simplicity-reviewer

### 2025-10-19 - Resolution Implementation

**By:** Claude Code

**Actions Taken**:

1. Audited all files in codebase (184 files scanned)
2. Confirmed existing naming conventions are consistent
3. Created comprehensive COMPONENT-NAMING-CONVENTIONS.md document
4. Created automated validation script (scripts/validate-naming.mjs)
5. Added npm script for naming validation
6. Validated all files pass naming conventions (0 errors, 15 acceptable warnings)

**Key Findings**:

- No code changes required - codebase already follows best practices
- All components: kebab-case.tsx with PascalCase functions ✅
- All services: kebab-case-service.ts ✅
- All utilities: kebab-case-utils.ts ✅
- All hooks: use-kebab-case.ts ✅
- All tests: kebab-case.test.ts ✅
- All stories: kebab-case.stories.tsx ✅

**Validation Results**:

```
Total files scanned: 184
Valid: 184 (100%)
Invalid: 0 (0%)
Warnings: 15 (documentation files, Next.js [id] routes - acceptable)
```

**Example Conventions Verified**:

- Components: `pilot-form.tsx` → `export function PilotForm()`
- Services: `pilot-service.ts` → `export async function getPilots()`
- Hooks: `use-portal-form.ts` → `export function usePortalForm()`
- Utils: `roster-utils.ts` → `export function calculateRosterPeriod()`

## Notes

**Source**: Code Organization Review

**Impact**: Zero code changes required. Conventions already established and followed consistently.

**Future Enforcement**: Validation script can be:

- Run manually: `npm run validate:naming`
- Integrated into CI/CD pipeline
- Added to pre-commit hooks (optional)

**References**:

- See: `/COMPONENT-NAMING-CONVENTIONS.md` for complete guide
- See: `/scripts/validate-naming.mjs` for validation tool
