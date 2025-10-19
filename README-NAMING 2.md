# Naming Conventions

This project follows strict naming conventions to ensure code consistency and developer productivity.

## Status

**Compliance**: 100% (187/187 files)
**Violations**: 0 errors
**Last Validated**: October 19, 2025

---

## Quick Start

### Run Validation

```bash
npm run validate:naming
```

### Common Patterns

| What | Convention | Example |
|------|------------|---------|
| Component file | `kebab-case.tsx` | `pilot-form.tsx` |
| Component function | `PascalCase` | `function PilotForm()` |
| Service file | `name-service.ts` | `pilot-service.ts` |
| Hook file | `use-name.ts` | `use-portal-form.ts` |
| Hook function | `useCamelCase` | `function usePortalForm()` |

---

## Documentation

### Full References

- **Complete Guide**: [COMPONENT-NAMING-CONVENTIONS.md](./COMPONENT-NAMING-CONVENTIONS.md)
  - 11 sections, 600+ lines
  - All naming patterns
  - Code examples
  - Common pitfalls

- **Quick Reference**: [NAMING-QUICK-REFERENCE.md](./NAMING-QUICK-REFERENCE.md)
  - One-page cheat sheet
  - Quick lookup tables
  - Common examples

- **Resolution Report**: [todos/RESOLUTION-REPORT-054.md](./todos/RESOLUTION-REPORT-054.md)
  - Implementation details
  - Validation results
  - Acceptance criteria

### Tooling

- **Validation Script**: [scripts/validate-naming.mjs](./scripts/validate-naming.mjs)
  - Automated validation
  - CI/CD integration
  - Colored output

---

## File Naming Rules

### Components
```
✅ pilot-form.tsx
✅ error-boundary.tsx
✅ submit-button.tsx
❌ PilotForm.tsx (avoid PascalCase)
❌ pilot_form.tsx (avoid snake_case)
```

### Services
```
✅ pilot-service.ts
✅ leave-eligibility-service.ts
❌ pilotService.ts (avoid camelCase)
```

### Hooks
```
✅ use-portal-form.ts
✅ use-online-status.ts
❌ portal-form-hook.ts (missing use- prefix)
```

### Tests
```
✅ retry-utils.test.ts
✅ pilot-service.spec.ts
❌ retry-utils-test.ts (use .test.ts suffix)
```

---

## Code Naming Rules

### Functions
```typescript
// Component functions: PascalCase
export function PilotForm() { ... }

// Regular functions: camelCase
export async function getPilots() { ... }

// Hook functions: useCamelCase
export function usePortalForm() { ... }
```

### Variables
```typescript
// Variables: camelCase
const pilotData = await getPilots()
const isLoading = true

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3
const ROSTER_PERIOD_DAYS = 28
```

### Types
```typescript
// Types/Interfaces: PascalCase
type PilotData = { ... }
interface LeaveRequest { ... }
```

---

## Enforcement

### Automated Validation

```bash
# Manual check
npm run validate:naming

# CI/CD integration
npm run validate:naming || exit 1
```

### ESLint Rules

ESLint enforces code-level naming:
- Variable naming: camelCase or UPPER_CASE
- Function naming: camelCase or PascalCase
- Type naming: PascalCase

### Pre-commit Hooks

Husky + lint-staged automatically:
- Runs ESLint with auto-fix
- Formats with Prettier
- Type-checks with TypeScript

File naming can be added to pre-commit hooks if desired.

---

## Integration Options

### GitHub Actions

```yaml
- name: Validate Naming Conventions
  run: npm run validate:naming
```

### Pre-commit Hook

```json
{
  "lint-staged": {
    "*": ["npm run validate:naming"]
  }
}
```

---

## Validation Results

Current codebase status:

```
=== Naming Convention Validation ===

Total files scanned: 187
Valid: 187 (100%)
Invalid: 0 (0%)
Warnings: 15 (documentation files, acceptable)

✓ Validation PASSED
All files follow naming conventions!
```

---

## Need Help?

- **Quick lookup**: See [NAMING-QUICK-REFERENCE.md](./NAMING-QUICK-REFERENCE.md)
- **Complete guide**: See [COMPONENT-NAMING-CONVENTIONS.md](./COMPONENT-NAMING-CONVENTIONS.md)
- **Project guidance**: See [CLAUDE.md](./CLAUDE.md)

---

**Last Updated**: October 19, 2025
**Maintained By**: Fleet Management V2 Team
