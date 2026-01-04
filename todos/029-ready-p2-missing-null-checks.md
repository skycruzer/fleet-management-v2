---
status: ready
priority: p2
issue_id: '029'
tags: [typescript, null-safety, defensive-programming, service-layer]
dependencies: []
---

# Add Null Checks in Service Functions

## Problem Statement

Service functions in `pilot-portal-service.ts` access `pilotUser.id` without null checks after calling `getCurrentPilotUser()`, which can return `null`. This creates potential runtime errors if a user session expires or is logged out.

## Findings

- **Severity**: 🟡 P2 (IMPORTANT)
- **Impact**: Runtime TypeError, 500 errors instead of proper auth errors
- **Agent**: typescript-code-quality-reviewer

**Problem Scenario:**

1. User session expires mid-session
2. User calls `submitFeedbackPost()`, `submitLeaveRequest()`, etc.
3. `getCurrentPilotUser()` returns `null`
4. Code attempts `pilotUser.id` → **TypeError: Cannot read property 'id' of null**
5. Server returns 500 error instead of 401 Unauthorized

**Affected Functions:**

- `submitFeedbackPost()` - lib/services/pilot-portal-service.ts:419
- `submitLeaveRequest()` - lib/services/pilot-portal-service.ts:447
- `submitFlightRequest()` - lib/services/pilot-portal-service.ts:475
- `voteFeedbackPost()` - lib/services/pilot-portal-service.ts:503

**Current Code (Unsafe):**

```typescript
export async function submitFeedbackPost(...) {
  const supabase = await createClient()
  const pilotUser = await getCurrentPilotUser()

  // ❌ No null check - crashes if pilotUser is null
  const pilotId = await getPilotIdFromPilotUserId(pilotUser.id)
  // ... rest of function
}
```

## Proposed Solution

Add defensive null checks to all 4 functions:

```typescript
export async function submitFeedbackPost(...) {
  const supabase = await createClient()
  const pilotUser = await getCurrentPilotUser()

  // ✅ Add defensive null check
  if (!pilotUser) {
    throw new Error('Unauthorized: User session expired')
  }

  const pilotId = await getPilotIdFromPilotUserId(pilotUser.id)
  // ... rest of function
}
```

**Apply to:**

1. `submitFeedbackPost()` - Add check after line 421
2. `submitLeaveRequest()` - Add check after line 449
3. `submitFlightRequest()` - Add check after line 477
4. `voteFeedbackPost()` - Add check after line 505

**Benefits:**

- Prevents runtime TypeErrors
- Returns proper error messages to client
- Improves debugging (clear error vs. cryptic null access)
- Better user experience (knows session expired)

**Effort:** Small (10 minutes)
**Risk:** Low (defensive programming, improves reliability)

## Acceptance Criteria

- [ ] `submitFeedbackPost()` has null check for `pilotUser`
- [ ] `submitLeaveRequest()` has null check for `pilotUser`
- [ ] `submitFlightRequest()` has null check for `pilotUser`
- [ ] `voteFeedbackPost()` has null check for `pilotUser`
- [ ] Error messages are clear and actionable
- [ ] No TypeScript errors
- [ ] Test with expired session to verify proper error handling

## Work Log

### 2025-10-19 - Initial Discovery

**By:** typescript-code-quality-reviewer (compounding-engineering review)
**Learnings:** Missing defensive null checks create runtime errors

## Notes

**Source**: Comprehensive Code Review, TypeScript Agent Finding #2
**Related**: Server Actions already have this check (they validate `pilotUser` exists)
**Pattern**: Service layer should have same defensive checks as action layer
