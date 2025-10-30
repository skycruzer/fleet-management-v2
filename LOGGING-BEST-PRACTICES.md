# Logging Best Practices - Security & Privacy

**Developer**: Maurice Rondeau
**Date**: October 27, 2025
**Sprint**: Sprint 1 Days 3-4 (Task 3)
**Status**: ✅ **COMPLETE** - Sanitization Utility Implemented

---

## 🎯 Overview

This guide establishes best practices for logging in our application to prevent sensitive data leakage while maintaining useful debugging information.

**Critical Rule**: **NEVER log sensitive data in production**

---

## 🚨 What NOT to Log

### Credentials & Secrets
- ❌ Passwords (plain text or hashed)
- ❌ API keys
- ❌ Tokens (JWT, session, CSRF, OAuth)
- ❌ Private keys
- ❌ Secrets

### Personal Identifiable Information (PII)
- ❌ Full email addresses (without redaction)
- ❌ Credit card numbers
- ❌ Social Security Numbers
- ❌ Driver's license numbers
- ❌ Full names (in security-sensitive contexts)
- ❌ Phone numbers
- ❌ Addresses

### Session & Authentication
- ❌ Session tokens
- ❌ Cookie values
- ❌ Authorization headers
- ❌ Refresh tokens

---

## ✅ Safe Logging Utility

We've created a comprehensive log sanitization utility at:
**`lib/utils/log-sanitizer.ts`**

### Basic Usage

```typescript
import { createSafeLogger } from '@/lib/utils/log-sanitizer'

// Create a logger for your context
const logger = createSafeLogger('AuthService')

// Use like console.log, but safe
logger.info('User logged in', { userId, email, token })
// Output: [AuthService] User logged in { userId: '550e8400...0000', email: 'ma***@example.com', token: '[REDACTED]' }
```

### Available Functions

```typescript
import {
  createSafeLogger,  // Create context-specific logger
  safeLog,           // Drop-in replacement for console
  sanitizeObject,    // Sanitize any object
  sanitizeString,    // Sanitize any string
  sanitizeRequest,   // Sanitize HTTP requests
  sanitizeResponse,  // Sanitize HTTP responses
} from '@/lib/utils/log-sanitizer'
```

---

## 📋 Migration Guide

### Step 1: Import the Safe Logger

```typescript
import { createSafeLogger } from '@/lib/utils/log-sanitizer'

const logger = createSafeLogger('MyAPIRoute')
```

### Step 2: Replace console.log Calls

**❌ BEFORE (Unsafe)**:
```typescript
console.log('User login attempt:', {
  email: user.email,           // ❌ Exposes email
  password: body.password,     // ❌ CRITICAL: Exposes password!
  token: sessionToken,         // ❌ Exposes token
  userId: user.id              // ❌ Exposes full UUID
})
```

**✅ AFTER (Safe)**:
```typescript
logger.info('User login attempt', {
  email: user.email,           // ✅ Auto-redacted to "ma***@example.com"
  password: body.password,     // ✅ Auto-redacted to "[REDACTED]"
  token: sessionToken,         // ✅ Auto-redacted to "[REDACTED]"
  userId: user.id              // ✅ Shortened to "550e8400...0000"
})
```

### Step 3: Test Your Changes

```bash
# Run the sanitization test
node -e "
const { sanitizeObject } = require('./lib/utils/log-sanitizer.ts');
const testData = {
  email: 'test@example.com',
  password: 'secret123',
  token: 'abc123xyz',
};
console.log(JSON.stringify(sanitizeObject(testData), null, 2));
"
```

---

## 🎨 Usage Examples

### Example 1: API Route Logging

```typescript
/**
 * POST /api/portal/login
 */
import { createSafeLogger } from '@/lib/utils/log-sanitizer'

const logger = createSafeLogger('PortalLoginAPI')

export const POST = withAuthRateLimit(async (request: NextRequest) => {
  try {
    const body = await request.json()

    // ❌ DON'T: console.log('Login body:', body)
    // ✅ DO: Use safe logger
    logger.info('Login attempt', { hasEmail: Boolean(body.email) })

    const result = await pilotLogin(body)

    if (result.success) {
      // ❌ DON'T: console.log('Login success for:', body.email, 'token:', token)
      // ✅ DO: Log without sensitive data
      logger.info('Login successful', { userId: result.user.id })
    }

    return NextResponse.json(result)
  } catch (error) {
    // ✅ Error objects are automatically sanitized
    logger.error('Login error', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
})
```

### Example 2: Service Layer Logging

```typescript
/**
 * lib/services/pilot-portal-service.ts
 */
import { createSafeLogger } from '@/lib/utils/log-sanitizer'

const logger = createSafeLogger('PilotPortalService')

export async function pilotLogin(credentials: { email: string; password: string }) {
  // ❌ DON'T: console.log('Credentials:', credentials)
  // ✅ DO: Log non-sensitive metadata
  logger.info('Login request received', { email: credentials.email })

  const user = await validateCredentials(credentials.email, credentials.password)

  if (!user) {
    logger.warn('Login failed - invalid credentials', { email: credentials.email })
    return { success: false, error: 'Invalid credentials' }
  }

  // ✅ Sanitized automatically
  logger.info('Login successful', { user })

  return { success: true, user }
}
```

### Example 3: Error Logging

```typescript
try {
  const result = await someOperation()
} catch (error) {
  // ✅ Safe: Error objects are automatically sanitized
  logger.error('Operation failed', error)

  // ✅ Safe: Include context without sensitive data
  logger.error('Operation failed', {
    error,
    operation: 'updateUser',
    timestamp: new Date().toISOString(),
    // userId is automatically shortened
    userId: userId
  })
}
```

### Example 4: Request/Response Logging

```typescript
import { sanitizeRequest, sanitizeResponse } from '@/lib/utils/log-sanitizer'

export async function POST(request: NextRequest) {
  // ✅ Sanitize entire request (headers, body, etc.)
  logger.info('Request received', sanitizeRequest(request))

  const result = await processRequest(request)

  // ✅ Sanitize response before logging
  logger.info('Response sent', sanitizeResponse(result))

  return NextResponse.json(result)
}
```

---

## 🔍 What Gets Redacted?

The sanitizer automatically detects and redacts:

| Data Type | Example | Sanitized Output |
|-----------|---------|------------------|
| **Email** | maurice@example.com | ma***@example.com |
| **Password** | Secret123! | [REDACTED] |
| **Token** | eyJhbGc... | [REDACTED] |
| **UUID** | 550e8400-e29b-41d4-a716-446655440000 | 550e8400...0000 |
| **JWT** | eyJhbGciOiJIUzI1NiI... | [REDACTED_JWT] |
| **API Key** | sk_live_abc123xyz789 | [REDACTED_API_KEY] |
| **Credit Card** | 4532-1234-5678-9010 | [REDACTED_CC] |
| **SSN** | 123-45-6789 | [REDACTED_SSN] |

### Sensitive Field Detection

Fields with these names are **always redacted**:
- `password`, `passwordHash`, `confirmPassword`
- `token`, `accessToken`, `refreshToken`
- `apiKey`, `api_key`
- `secret`, `secretKey`, `privateKey`
- `sessionToken`, `csrf_token`
- `authorization`, `cookie`

---

## 📁 Migration Strategy

### Phase 1: New Code (Immediate)
✅ All NEW code must use safe logging from day one

### Phase 2: Critical Routes (Week 1)
Update these high-risk routes first:
- [ ] `/app/api/portal/login/route.ts`
- [ ] `/app/api/portal/register/route.ts`
- [ ] `/app/api/portal/reset-password/route.ts`
- [ ] `/app/api/portal/forgot-password/route.ts`
- [ ] All authentication-related routes

### Phase 3: Gradual Migration (Ongoing)
Update routes as you work on them:
- When fixing bugs
- When adding features
- During code reviews
- During refactoring

### Phase 4: Cleanup (Month 1-2)
- Systematic review of remaining console.log calls
- Replace all unsafe logging
- Remove console.log from production builds

---

## 🧪 Testing Sanitization

### Manual Testing

```bash
# Create a test file
cat > test-sanitization.js << 'EOF'
const { sanitizeObject } = require('./lib/utils/log-sanitizer.ts');

const testData = {
  email: 'pilot@example.com',
  password: 'Secret123!',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test Pilot',
  creditCard: '4532-1234-5678-9010'
};

console.log('Original:');
console.log(JSON.stringify(testData, null, 2));

console.log('\nSanitized:');
console.log(JSON.stringify(sanitizeObject(testData), null, 2));
EOF

# Run test
node test-sanitization.js

# Clean up
rm test-sanitization.js
```

### Expected Output

```json
Original:
{
  "email": "pilot@example.com",
  "password": "Secret123!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Test Pilot",
  "creditCard": "4532-1234-5678-9010"
}

Sanitized:
{
  "email": "pi***@example.com",
  "password": "[REDACTED]",
  "token": "[REDACTED]",
  "userId": "550e8400...0000",
  "name": "Test Pilot",
  "creditCard": "[REDACTED_CC]"
}
```

---

## ⚠️ Common Mistakes

### Mistake 1: Logging Request Body Directly

```typescript
// ❌ WRONG: Request might contain passwords
console.log('Request body:', await request.json())

// ✅ CORRECT: Use safe logger
const body = await request.json()
logger.info('Request received', body) // Automatically sanitized
```

### Mistake 2: Logging Errors Without Sanitization

```typescript
// ❌ WRONG: Error might contain sensitive stack traces
console.error('Error:', error)

// ✅ CORRECT: Use safe logger (auto-sanitizes errors)
logger.error('Error occurred', error)
```

### Mistake 3: Logging for Debugging in Production

```typescript
// ❌ WRONG: Debug logs in production
console.log('DEBUG:', sensitiveData)

// ✅ CORRECT: Use environment-aware logging
if (process.env.NODE_ENV !== 'production') {
  console.log('DEBUG:', sensitiveData) // Only in development
}
```

### Mistake 4: String Interpolation Before Sanitization

```typescript
// ❌ WRONG: Email already in string, can't be sanitized
console.log(`User ${user.email} logged in`)

// ✅ CORRECT: Pass as object for sanitization
logger.info('User logged in', { email: user.email })
```

---

## 🎓 Learning Resources

### Quick Reference Card

```
┌─────────────────────────────────────────┐
│ SAFE LOGGING QUICK REFERENCE            │
├─────────────────────────────────────────┤
│ Import:                                 │
│ import { createSafeLogger }             │
│   from '@/lib/utils/log-sanitizer'      │
│                                         │
│ Create Logger:                          │
│ const logger = createSafeLogger('API')  │
│                                         │
│ Use Logger:                             │
│ logger.info('Message', data)            │
│ logger.error('Error', error)            │
│ logger.warn('Warning', context)         │
│                                         │
│ Always Redacted:                        │
│ • Passwords                             │
│ • Tokens                                │
│ • API keys                              │
│ • Secrets                               │
│ • Authorization headers                 │
└─────────────────────────────────────────┘
```

### Before You Log, Ask:
1. ✅ Could this contain passwords or tokens?
2. ✅ Could this expose PII (emails, names, addresses)?
3. ✅ Am I using the safe logger?
4. ✅ Is this necessary for debugging/auditing?

---

## 📊 Current Status

| Category | Status | Count |
|----------|--------|-------|
| **Sanitization Utility** | ✅ Complete | 1/1 |
| **Critical Routes** | 🔄 In Progress | 0/4 |
| **All API Routes** | ⏳ Pending | 0/67 |
| **Documentation** | ✅ Complete | 1/1 |

---

## 🎯 Next Steps

### For Developers

1. **Read this guide** thoroughly
2. **Use safe logging** in all new code starting today
3. **Update routes** you're working on
4. **Review PRs** for unsafe logging
5. **Ask questions** if unsure about logging safety

### For Code Reviewers

- ❌ Reject PRs with unsafe logging (console.log with sensitive data)
- ✅ Approve PRs that use `createSafeLogger()`
- 💬 Educate developers on this guide
- 📝 Link to this guide in review comments

---

## 📞 Questions?

If you're unsure whether something is safe to log:
1. **DON'T log it**
2. Ask in #security channel
3. Refer to this guide
4. Use the safe logger (it's smarter than you think!)

---

**Remember**: When in doubt, redact it out! 🔒

**Last Updated**: October 27, 2025
**Document Version**: 1.0
**Status**: ✅ Production Ready
