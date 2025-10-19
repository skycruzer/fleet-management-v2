# Naming Conventions - Quick Reference

**Status**: Production Standard
**Last Updated**: October 19, 2025

---

## File Naming Patterns

| File Type | Convention | Example |
|-----------|------------|---------|
| React Component | `kebab-case.tsx` | `pilot-form.tsx` |
| TypeScript File | `kebab-case.ts` | `utils.ts` |
| Service | `name-service.ts` | `pilot-service.ts` |
| Utility | `name-utils.ts` | `roster-utils.ts` |
| Validation | `name-validation.ts` | `leave-validation.ts` |
| Hook | `use-name.ts` | `use-portal-form.ts` |
| Test | `name.test.ts` | `retry-utils.test.ts` |
| Storybook | `name.stories.tsx` | `button.stories.tsx` |
| Next.js Page | `page.tsx` | `page.tsx` |
| Next.js Layout | `layout.tsx` | `layout.tsx` |
| API Route | `route.ts` | `route.ts` |

---

## Code Naming Patterns

| Item | Convention | Example |
|------|------------|---------|
| Component Function | `PascalCase` | `function PilotForm()` |
| Regular Function | `camelCase` | `function getPilots()` |
| Variable | `camelCase` | `const pilotData` |
| Constant | `UPPER_SNAKE_CASE` | `const MAX_RETRIES = 3` |
| Type/Interface | `PascalCase` | `type PilotData` |
| Hook Function | `useCamelCase` | `function usePortalForm()` |

---

## Directory Structure

```
app/                    (kebab-case routes)
  dashboard/
    pilots/
    leave-requests/
  portal/

components/             (kebab-case)
  ui/
  forms/
  portal/

lib/                    (kebab-case)
  services/
  utils/
  validations/
  hooks/
  supabase/

types/                  (kebab-case)
```

---

## Common Patterns

### Component Example
```tsx
// File: components/forms/pilot-form.tsx
export function PilotForm({ pilotId }: { pilotId: string }) {
  const MAX_NAME_LENGTH = 100
  const [pilotData, setPilotData] = useState(null)

  return <form>...</form>
}
```

### Service Example
```typescript
// File: lib/services/pilot-service.ts
export async function getPilots(): Promise<PilotData[]> {
  const supabase = await createClient()
  return await fetchData(supabase)
}
```

### Hook Example
```typescript
// File: lib/hooks/use-portal-form.ts
export function usePortalForm<T>({ schema }: { schema: T }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  return { isSubmitting, submit }
}
```

---

## Validation

Run naming validation:
```bash
npm run validate:naming
```

Expected output:
```
Total files scanned: 187
Valid: 187 (100%)
Invalid: 0 (0%)
```

---

## References

- Full Guide: `COMPONENT-NAMING-CONVENTIONS.md`
- Validation Script: `scripts/validate-naming.mjs`
- Project Guide: `CLAUDE.md`

---

**Compliance**: 100% (0 errors, 15 acceptable warnings)
