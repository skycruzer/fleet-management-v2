---
status: ready
priority: p1
issue_id: '003'
tags: [data-integrity, security, validation, zod]
dependencies: [002]
---

# Add Input Validation Layer

## Problem Statement

Zod 4.1.11 and React Hook Form 7.63.0 are installed but **zero validation schemas exist**. All form data is submitted without validation, allowing invalid data to corrupt the database containing 27 pilots and 607 certifications.

## Findings

- **Severity**: 🔴 P1 (CRITICAL)
- **Impact**: Data corruption, SQL injection vectors, business rule violations
- **Dependencies**: Requires service layer (Issue #002)

**Current State**:

- Zod 4.1.11 installed but unused
- React Hook Form 7.63.0 installed but not integrated
- All form data submitted without validation
- Direct database insertion without type checking

**Vulnerable Pattern**:

```typescript
// ❌ WRONG - No validation
async function POST(request: Request) {
  const body = await request.json()
  const supabase = await createClient()
  await supabase.from('pilots').insert(body) // Unvalidated!
}
```

**Impact Scenarios**:

- Invalid data inserted (e.g., string where number expected)
- Missing required fields (first_name, employee_id)
- Type mismatches corrupting 607 certification records
- SQL injection vectors
- Business rule violations (invalid roster periods, invalid ranks)

## Proposed Solutions

### Option 1: Port Validation Schemas from air-niugini-pms (RECOMMENDED)

**Create Directory**: `lib/schemas/`

**Required Schemas**:

1. `pilot-schema.ts` - Pilot creation/update validation
2. `certification-schema.ts` - Certification validation with expiry dates
3. `leave-schema.ts` - Leave request validation with roster periods
4. `check-type-schema.ts` - Check type validation

**Example** (pilot-schema.ts):

```typescript
import { z } from 'zod'

export const PilotCreateSchema = z.object({
  first_name: z.string().min(1, 'First name required').max(50),
  last_name: z.string().min(1, 'Last name required').max(50),
  employee_id: z.string().regex(/^\d{6}$/, 'Must be 6-digit employee ID'),
  rank: z.enum(['Captain', 'First Officer']),
  commencement_date: z.string().datetime(),
  qualifications: z
    .object({
      line_captain: z.boolean().optional(),
      training_captain: z.boolean().optional(),
      examiner: z.boolean().optional(),
      rhs_captain_expiry: z.string().datetime().optional(),
    })
    .optional(),
})

export type PilotCreate = z.infer<typeof PilotCreateSchema>
```

**Service Layer Integration**:

```typescript
// lib/services/pilot-service.ts
import { PilotCreateSchema } from '@/lib/schemas/pilot-schema'

export async function createPilot(data: unknown) {
  // Validate first
  const validated = PilotCreateSchema.parse(data)

  const supabase = await createClient()
  const { data: pilot, error } = await supabase.from('pilots').insert(validated).select().single()

  if (error) throw new Error(`Failed to create pilot: ${error.message}`)
  return pilot
}
```

**Pros**:

- Prevents all data corruption at entry point
- Type-safe validation
- Proven schemas from production v1
- Comprehensive error messages

**Cons**:

- Requires porting from v1

**Effort**: Medium (2-3 days for all schemas)

**Risk**: Low

## Recommended Action

Port validation schemas from air-niugini-pms v1 and integrate with service layer. This is critical to prevent data corruption.

## Technical Details

- **Affected Files**: New `lib/schemas/` directory + integration in services
- **Related Components**: All forms, all API routes, service layer
- **Database Changes**: No
- **Port From**:
  - `air-niugini-pms/src/lib/validations/pilot-validation.ts`
  - `air-niugini-pms/src/lib/validations/leave-validation.ts`
  - `air-niugini-pms/src/lib/validations/certification-validation.ts`

## Resources

- Data Integrity Report, Critical Risk #2
- Security Audit, Finding #5
- air-niugini-pms validation files

## Acceptance Criteria

- [ ] `lib/schemas/` directory created
- [ ] Pilot validation schema implemented
- [ ] Certification validation schema implemented
- [ ] Leave request validation schema implemented
- [ ] All schemas integrated with service layer
- [ ] React Hook Form integration with Zod resolver
- [ ] Comprehensive error messages
- [ ] Tests for validation logic

## Work Log

### 2025-10-17 - Initial Discovery

**By:** data-integrity-guardian, security-sentinel agents
**Actions:** Identified as P1 critical issue
**Learnings:** Zod installed but completely unused

## Notes

Source: Triage session on 2025-10-17
