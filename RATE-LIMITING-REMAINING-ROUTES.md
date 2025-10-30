# Rate Limiting - Remaining Routes Quick Reference

**Status**: 11/21 routes complete (52%)
**Remaining**: 10 routes

---

## ✅ Completed (11 routes)

1. ✅ Login - withAuthRateLimit
2. ✅ Register - withAuthRateLimit
3. ✅ Forgot Password - withAuthRateLimit
4. ✅ Reset Password - withAuthRateLimit
5. ✅ Pilots collection - withRateLimit (already done)
6. ✅ Pilots [id] - Manual rate limiting
7. ✅ Certifications [id] - Manual rate limiting
8. ✅ Certifications collection - withRateLimit
9. ✅ Leave Requests [id]/review - Manual rate limiting
10. ✅ Flight Requests [id] - Manual rate limiting

---

## ⏳ Remaining 10 Routes (Wrapper Approach)

### 1. `/app/api/leave-requests/route.ts` - POST

**Current**:
```typescript
export async function POST(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfError = await validateCsrf(request)
```

**Changes Needed**:
- Add import: `import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'`
- Change: `export async function POST(request: NextRequest) {`
- To: `export const POST = withRateLimit(async (request: NextRequest) => {`
- Add `)` at end of function

---

### 2. `/app/api/portal/flight-requests/route.ts` - POST, DELETE

**Has 2 methods to wrap**: POST and DELETE

**Changes Needed**:
- Add import: `import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'`
- Wrap POST: `export const POST = withRateLimit(async (request: NextRequest) => {`
- Wrap DELETE: `export const DELETE = withRateLimit(async (request: NextRequest) => {`
- Add `)` at end of each function

---

### 3. `/app/api/portal/leave-bids/route.ts` - POST

**Changes Needed**:
- Add import: `import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'`
- Wrap POST method
- Update header with rate limiting note

---

### 4. `/app/api/portal/leave-requests/route.ts` - POST, DELETE

**Has 2 methods to wrap**: POST and DELETE

**Changes Needed**:
- Add import: `import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'`
- Wrap both POST and DELETE methods

---

### 5. `/app/api/portal/feedback/route.ts` - POST

**Changes Needed**:
- Add import: `import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'`
- Wrap POST method

---

### 6. `/app/api/portal/logout/route.ts` - POST

**Changes Needed**:
- Add import: `import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'`
- Wrap POST method

---

### 7. `/app/api/portal/registration-approval/route.ts` - POST

**Changes Needed**:
- Add import: `import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'`
- Wrap POST method

---

### 8. `/app/api/tasks/route.ts` - POST

**Changes Needed**:
- Add import: `import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'`
- Wrap POST method

---

### 9. `/app/api/admin/leave-bids/review/route.ts` - POST

**Changes Needed**:
- Add import: `import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'`
- Wrap POST method

---

## Standard Pattern

### Header Update:
```typescript
/**
 * [Route Name]
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST method requires CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * @version 2.1.0
 * @updated 2025-10-27 - Added rate limiting
 */

import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
```

### Method Wrapping:
```typescript
// BEFORE:
export async function POST(request: NextRequest) {
  try {
    // handler
  }
}

// AFTER:
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // handler
  }
})
```

---

## Estimated Time: 45 minutes
- 10 routes × 3-5 minutes each = 30-50 minutes
- Testing: 15 minutes
- Documentation update: 10 minutes

**Total**: ~1 hour to complete all remaining routes
