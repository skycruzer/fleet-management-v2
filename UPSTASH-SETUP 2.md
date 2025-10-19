# Upstash Redis Setup Guide

This guide walks you through setting up Upstash Redis for distributed rate limiting in the Fleet Management V2 application.

## Why Upstash Redis?

- **Distributed Rate Limiting**: Works across multiple server instances (essential for production)
- **Edge-Optimized**: Low latency for serverless/edge deployments
- **Free Tier**: 10,000 requests/day, 256MB storage (perfect for development and small-scale production)
- **No Maintenance**: Fully managed service, no infrastructure to manage

## Setup Steps (5 minutes)

### 1. Create Upstash Account

1. Visit [https://console.upstash.com](https://console.upstash.com)
2. Sign up with GitHub, Google, or email
3. Verify your email if required

### 2. Create Redis Database

1. Click **"Create Database"**
2. Configure your database:
   - **Name**: `fleet-management-rate-limit` (or any name you prefer)
   - **Type**: Regional (Global is optional but costs more)
   - **Region**: Choose closest to your Vercel deployment region (e.g., `us-east-1`)
   - **TLS**: Enable (recommended for security)
3. Click **"Create"**

### 3. Get Connection Credentials

After database creation, you'll see your database dashboard:

1. Navigate to the **"REST API"** tab
2. Copy the following values:
   - **UPSTASH_REDIS_REST_URL**: `https://your-database-name-xxxxx.upstash.io`
   - **UPSTASH_REDIS_REST_TOKEN**: `AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ==`

### 4. Configure Environment Variables

#### Local Development

Add to `.env.local`:

```env
# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL=https://your-database-name-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ==
```

#### Production (Vercel)

1. Go to your Vercel project settings
2. Navigate to **Settings ’ Environment Variables**
3. Add both variables:
   - `UPSTASH_REDIS_REST_URL` ’ Your Upstash URL
   - `UPSTASH_REDIS_REST_TOKEN` ’ Your Upstash token
4. Select **Production**, **Preview**, and **Development** environments
5. Click **Save**

### 5. Verify Setup

Run the development server and test a Server Action:

```bash
npm run dev
```

Try submitting a feedback post multiple times rapidly. After 5 submissions within 1 minute, you should see:

```
Too many requests. Please wait XX seconds before trying again.
```

## Rate Limit Configuration

Current rate limits (configured in `lib/rate-limit.ts`):

| Action | Limit | Window | Purpose |
|--------|-------|--------|---------|
| Feedback Submissions | 5 | 1 minute | Prevent spam posts |
| Leave Requests | 3 | 1 minute | Prevent request abuse |
| Flight Requests | 3 | 1 minute | Prevent spam requests |
| Feedback Votes | 30 | 1 minute | Allow higher voting frequency |
| Login Attempts | 5 | 1 minute | Prevent brute force |
| Password Reset | 3 | 1 hour | Prevent email flooding |

## Testing Rate Limits

### Manual Testing

1. **Feedback Submission**:
   - Submit 5 feedback posts within 1 minute
   - 6th submission should be blocked with error message

2. **Leave Request**:
   - Submit 3 leave requests within 1 minute
   - 4th submission should be blocked

### Automated Testing

Create a test script to verify rate limiting:

```typescript
// test/rate-limit.test.ts
import { describe, it, expect } from '@jest/globals'
import { submitFeedbackAction } from '@/app/portal/feedback/actions'

describe('Rate Limiting', () => {
  it('should block after 5 feedback submissions', async () => {
    const formData = new FormData()
    formData.set('title', 'Test Feedback Title')
    formData.set('content', 'Test feedback content that is long enough')
    formData.set('is_anonymous', 'false')

    // Submit 5 times (should succeed)
    for (let i = 0; i < 5; i++) {
      const result = await submitFeedbackAction(formData)
      expect(result.success).toBe(true)
    }

    // 6th submission should fail
    const result = await submitFeedbackAction(formData)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Too many requests')
  })
})
```

## Monitoring & Analytics

### Upstash Dashboard

Monitor your rate limiting in the Upstash console:

1. Go to [https://console.upstash.com](https://console.upstash.com)
2. Select your database
3. View **Metrics** tab:
   - Request count
   - Storage usage
   - Response times
   - Error rates

### Rate Limit Analytics

Upstash Ratelimit includes built-in analytics (enabled in our config):

```typescript
export const feedbackRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  analytics: true, //  Enables analytics
  prefix: 'ratelimit:feedback',
})
```

Analytics data can be queried to understand:
- Which users hit rate limits most frequently
- Peak usage times
- Potential abuse patterns

## Troubleshooting

### Error: "UPSTASH_REDIS_REST_URL is not defined"

**Solution**: Ensure environment variables are set in `.env.local`

```bash
# Verify environment variables
cat .env.local | grep UPSTASH
```

### Error: "Authentication failed"

**Solution**: Check your `UPSTASH_REDIS_REST_TOKEN` is correct

1. Go to Upstash dashboard
2. Copy the token again (it's in the **REST API** tab)
3. Update `.env.local` with the new token
4. Restart dev server: `npm run dev`

### Rate Limit Not Working

**Solution**: Verify Redis connection

Create a test file `test-redis-connection.ts`:

```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

async function testConnection() {
  try {
    await redis.set('test-key', 'test-value')
    const value = await redis.get('test-key')
    console.log(' Redis connection successful:', value)
    await redis.del('test-key')
  } catch (error) {
    console.error('L Redis connection failed:', error)
  }
}

testConnection()
```

Run: `npx tsx test-redis-connection.ts`

### Exceeded Free Tier Limits

Upstash free tier limits:
- **Requests**: 10,000/day
- **Storage**: 256MB
- **Concurrent connections**: 100

If exceeded:
1. **Upgrade to Pro**: $0.20 per 100K requests
2. **Optimize rate limits**: Increase time windows to reduce requests
3. **Use multiple databases**: Separate rate limiting by environment

## Cost Optimization

### Free Tier Breakdown

With current rate limits:

| Action | Daily Max Users | Calculation |
|--------|----------------|-------------|
| Feedback (5/min) | 33 users @ max rate | 10,000 / (5 × 60 × 24 / 60) |
| Leave (3/min) | 55 users @ max rate | 10,000 / (3 × 60 × 24 / 60) |
| **Realistic usage** | 500+ daily active users | Most users won't hit limits |

**Conclusion**: Free tier is sufficient for 500+ daily active users in production.

### When to Upgrade

Upgrade to Pro ($10/month) when:
- Daily active users > 500
- Request volume > 10,000/day
- Need higher reliability SLA
- Require global replication

## Alternative: In-Memory Rate Limiting

If you don't want to use Upstash (e.g., for local-only development), you can use the in-memory implementation:

```typescript
// lib/rate-limit-memory.ts
class InMemoryRateLimiter {
  // ... implementation
}
```

**Pros**:
- No external dependencies
- Zero cost
- Simple setup

**Cons**:
- Only works on single server
- Resets on deployment
- Not suitable for production at scale

## Security Considerations

### Environment Variables

- **NEVER commit** `.env.local` to Git
- Store production credentials in Vercel environment variables
- Rotate tokens periodically (recommended: every 90 days)

### Rate Limit Bypass Prevention

Our implementation uses user IDs as identifiers:

```typescript
await feedbackRateLimit.limit(`user:${pilotUser.id}`)
```

This prevents:
-  Multiple IPs bypassing rate limits (user-based, not IP-based)
-  Shared network (airline offices) hitting false limits
-  VPN/proxy evasion

## Summary

 **Implemented**:
- Upstash Redis integration
- Rate limiting on 4 Server Actions
- Helpful error messages with reset times
- Environment configuration
- Production-ready setup

 **Benefits**:
- Prevents spam and DoS attacks
- Protects database from flooding
- Distributes rate limits across servers
- Free tier supports 500+ daily users

 **Next Steps**:
1. Create Upstash account
2. Set up Redis database
3. Add environment variables
4. Test rate limiting locally
5. Deploy to production

---

**Need Help?**

- [Upstash Documentation](https://upstash.com/docs/redis)
- [Rate Limiting Guide](https://upstash.com/docs/redis/features/ratelimit)
- [Upstash Support](https://upstash.com/support)
