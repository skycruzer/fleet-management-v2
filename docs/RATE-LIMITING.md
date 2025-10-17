# Rate Limiting Documentation

## Overview

Rate limiting has been implemented to protect authentication endpoints from brute force attacks, account enumeration, and denial of service attacks. This critical security feature is automatically enforced by the application middleware.

## Implementation Details

### Architecture

The rate limiting system consists of three main components:

1. **`lib/rate-limit.ts`** - Core rate limiting utility with sliding window algorithm
2. **`lib/supabase/middleware.ts`** - Middleware integration for automatic enforcement
3. **Rate Limiter Instances** - Pre-configured rate limiters for different use cases

### Rate Limits

| Endpoint Type | Limit | Window | Use Case |
|--------------|-------|--------|----------|
| Login/Signin | 5 requests | 1 minute | Prevent brute force password attacks |
| Password Reset | 3 requests | 1 hour | Prevent email flooding and abuse |
| General Auth | 10 requests | 1 minute | Account enumeration protection |

### Automatic Enforcement

Rate limiting is automatically applied to all routes matching `/api/auth/*`:

- `/api/auth/login` - Login rate limit (5/min)
- `/api/auth/signin` - Login rate limit (5/min)
- `/api/auth/signup` - General auth rate limit (10/min)
- `/api/auth/password-reset` - Password reset rate limit (3/hour)
- `/api/auth/forgot-password` - Password reset rate limit (3/hour)

## How It Works

### 1. IP Address Extraction

The system extracts the client IP address from request headers, handling various proxy scenarios:

```typescript
import { getClientIp } from '@/lib/rate-limit'

const ip = getClientIp(request)
// Returns IP from: x-forwarded-for, x-real-ip, or cf-connecting-ip
```

**Proxy Support**:
- ✅ Vercel deployments (x-forwarded-for)
- ✅ Cloudflare (cf-connecting-ip)
- ✅ Nginx reverse proxy (x-real-ip)
- ✅ Multiple proxies (first IP in x-forwarded-for)

### 2. Sliding Window Algorithm

The rate limiter uses a sliding window algorithm that:
- Tracks individual request timestamps
- Removes requests outside the time window
- Allows bursts up to the limit
- Provides smooth rate limiting without sudden resets

**Example**: Login limit (5 requests per 60 seconds)
```
Timeline:  0s    15s   30s   45s   60s   75s
Request 1: ✅
Request 2:      ✅
Request 3:           ✅
Request 4:                ✅
Request 5:                     ✅
Request 6:                          ❌ (blocked)
Request 7:                               ✅ (allowed, Request 1 expired)
```

### 3. Response Headers

All authentication responses include rate limit headers:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1704067260
```

When rate limit is exceeded:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704067260
Content-Type: application/json

{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 45 seconds.",
  "limit": 5,
  "reset": 1704067260
}
```

## Usage Examples

### Checking Rate Limit Programmatically

```typescript
import { loginRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const { success, limit, remaining, reset, retryAfter } =
    await loginRateLimit.limit(ip)

  if (!success) {
    return new Response(
      JSON.stringify({
        error: 'Too many login attempts',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
        },
      }
    )
  }

  // Process login...
}
```

### Custom Rate Limiter

Create a custom rate limiter for specific use cases:

```typescript
import { InMemoryRateLimiter } from '@/lib/rate-limit'

// Allow 100 API calls per hour
const apiRateLimit = new InMemoryRateLimiter(
  100,              // Max requests
  60 * 60 * 1000    // Per hour
)

const result = await apiRateLimit.limit('user-id-123')
```

## Current Implementation: In-Memory

The current implementation uses **in-memory storage** for rate limiting. This is suitable for:
- ✅ Development environments
- ✅ Single-instance deployments
- ✅ Small to medium traffic

**Limitations**:
- ❌ Does not work across multiple server instances
- ❌ Data is lost on server restart
- ❌ Not suitable for serverless/edge deployments with cold starts

## Production Upgrade: Upstash Redis

For production deployments with multiple instances or serverless environments, upgrade to **Upstash Redis**:

### Step 1: Install Dependencies

```bash
npm install @upstash/ratelimit @upstash/redis
```

### Step 2: Configure Environment Variables

Add to `.env.local`:

```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### Step 3: Update lib/rate-limit.ts

Replace the in-memory implementation with Redis:

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'ratelimit:login',
})

export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
})

export const passwordResetRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true,
  prefix: 'ratelimit:password-reset',
})
```

**Benefits of Redis implementation**:
- ✅ Works across multiple server instances
- ✅ Persistent storage (survives restarts)
- ✅ Distributed rate limiting
- ✅ Built-in analytics
- ✅ Serverless-friendly
- ✅ Edge runtime compatible

## Testing

### Manual Testing

Test rate limiting with curl:

```bash
# Test login endpoint (should block after 5 requests)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -i
  echo "Request $i"
  sleep 1
done
```

Expected output:
- Requests 1-5: `200 OK` or `401 Unauthorized`
- Request 6: `429 Too Many Requests` with `Retry-After` header

### Automated Testing

Unit tests are provided in `lib/__tests__/rate-limit.test.ts`:

```bash
npm test lib/__tests__/rate-limit.test.ts
```

Tests cover:
- ✅ Rate limit enforcement
- ✅ IP address extraction
- ✅ Response header generation
- ✅ Multiple IP tracking
- ✅ Sliding window behavior

### E2E Testing

E2E tests can verify rate limiting in real scenarios:

```typescript
import { test, expect } from '@playwright/test'

test('should rate limit login attempts', async ({ page }) => {
  // Attempt 6 logins
  for (let i = 0; i < 6; i++) {
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'wrong-password')
    await page.click('button[type="submit"]')

    if (i < 5) {
      // First 5 should show "Invalid credentials"
      await expect(page.locator('text=/invalid/i')).toBeVisible()
    } else {
      // 6th should show "Too many requests"
      await expect(page.locator('text=/too many/i')).toBeVisible()
    }
  }
})
```

## Security Considerations

### Attack Prevention

Rate limiting protects against:

1. **Brute Force Password Attacks**
   - Limit: 5 attempts per minute
   - Impact: 300 attempts per hour maximum
   - Mitigation: Makes password cracking impractical

2. **Account Enumeration**
   - Limit: 10 auth requests per minute
   - Impact: Slows down account discovery
   - Mitigation: Prevents mass email verification

3. **Denial of Service (DoS)**
   - Limit: Varies by endpoint
   - Impact: Prevents exhausting Supabase auth quota
   - Mitigation: Protects backend resources

4. **Email Flooding**
   - Limit: 3 password reset per hour
   - Impact: Prevents mailbox abuse
   - Mitigation: Protects email reputation

### Best Practices

1. **Monitor Rate Limits**
   - Track 429 responses in logs
   - Alert on unusual patterns
   - Review blocked IPs regularly

2. **Adjust Limits Based on Traffic**
   - Increase limits for legitimate high-traffic scenarios
   - Decrease limits during attack patterns
   - Use analytics to optimize thresholds

3. **Combine with Other Security Measures**
   - CAPTCHA for repeated failures
   - Account lockout after multiple violations
   - IP reputation scoring
   - Geographic restrictions

4. **User Communication**
   - Display clear error messages
   - Show remaining time until reset
   - Provide alternative contact methods

## Monitoring & Analytics

### Logging Rate Limit Events

Add logging to track rate limit violations:

```typescript
// In middleware
if (!rateLimitResult.success) {
  console.warn('Rate limit exceeded', {
    ip,
    endpoint: pathname,
    timestamp: new Date().toISOString(),
    retryAfter: rateLimitResult.retryAfter,
  })

  // Optional: Log to external service (Sentry, LogRocket, etc.)
  // sentry.captureMessage('Rate limit exceeded', { level: 'warning', ... })

  return createRateLimitResponse(...)
}
```

### Upstash Analytics (with Redis)

When using Upstash Redis, built-in analytics track:
- Total requests per identifier
- Success/blocked ratio
- Request patterns over time
- Geographic distribution (with additional config)

Access analytics via Upstash dashboard or API:

```typescript
import { Ratelimit } from '@upstash/ratelimit'

const stats = await loginRateLimit.analytics.get('user-ip-address')
console.log(stats)
// {
//   success: 234,
//   blocked: 12,
//   pending: 0
// }
```

## Troubleshooting

### Issue: Legitimate users getting blocked

**Solution**: Review and adjust rate limits:

```typescript
// Increase login limit from 5 to 10
export const loginRateLimit = new InMemoryRateLimiter(10, 60 * 1000)
```

### Issue: Rate limits not working across instances

**Solution**: Upgrade to Redis-based rate limiting (see Production Upgrade section).

### Issue: IP address showing as "unknown"

**Solution**: Verify proxy headers are being forwarded correctly:

```nginx
# Nginx configuration
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

### Issue: Rate limits resetting on server restart

**Solution**: This is expected with in-memory storage. Upgrade to Redis for persistence.

## Additional Resources

- [OWASP Rate Limiting Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [Upstash Rate Limiting Documentation](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [HTTP 429 Status Code Specification](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)

## Changelog

### 2025-10-17 - Initial Implementation
- ✅ Created `lib/rate-limit.ts` with in-memory implementation
- ✅ Integrated rate limiting into `lib/supabase/middleware.ts`
- ✅ Added support for login (5/min), auth (10/min), password reset (3/hour)
- ✅ Implemented IP extraction from proxy headers
- ✅ Added standardized 429 responses with Retry-After headers
- ✅ Created comprehensive documentation and test suite
- ✅ Documented production upgrade path to Upstash Redis

---

**Status**: ✅ Implemented (In-Memory)
**Recommended Next Step**: Upgrade to Upstash Redis for production deployment
**Security Level**: 🟢 Production-Ready (with upgrade recommended for multi-instance)
