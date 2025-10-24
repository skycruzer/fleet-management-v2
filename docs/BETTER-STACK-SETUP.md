# Better Stack Setup Guide - Phase 0

**Purpose**: Complete setup guide for Better Stack logging integration
**Time Required**: 10 minutes
**Difficulty**: Easy

---

## 🎯 What is Better Stack?

**Better Stack** (formerly Logtail) is a cloud logging platform that gives you:

- ✅ **100% Error Visibility**: See every error in real-time
- ✅ **Detailed Context**: Every log includes timestamp, component, user info
- ✅ **Smart Alerts**: Get notified when errors spike
- ✅ **Powerful Search**: Find specific errors instantly
- ✅ **Performance Insights**: Track API response times and trends

**Why Better Stack for Phase 0?**

- Phase 0 added error logging to go from 0% → 100% error visibility
- Before: Errors happened silently (user reports only)
- After: Every error logged automatically with full context

---

## 📝 Step-by-Step Setup

### Step 1: Create Better Stack Account (2 minutes)

1. Go to: https://betterstack.com/logs
2. Click "Start Free Trial"
3. Sign up with email or GitHub
4. Verify email
5. Complete onboarding

**Free tier includes**:

- 1 GB/month log storage
- 7 day retention
- Unlimited sources
- All features enabled

### Step 2: Create Log Sources (3 minutes)

**Create Server Source**:

1. Click "Create Source"
2. **Name**: `Fleet Management V2 - Server`
3. **Platform**: Node.js
4. **Framework**: Next.js
5. Click "Create"
6. **Copy the source token** (starts with `logtail_`)
7. Save token somewhere safe (you'll need it for Vercel)

**Create Client Source**:

1. Click "Create Source" again
2. **Name**: `Fleet Management V2 - Client`
3. **Platform**: Browser (JavaScript)
4. **Framework**: Next.js
5. Click "Create"
6. **Copy the source token**
7. Save this token too (different from server token)

**Why two sources?**

- Server logs: API errors, database issues, server crashes
- Client logs: UI errors, user actions, browser issues
- Separating them makes debugging easier

### Step 3: Add Tokens to Vercel (5 minutes)

**Option A: Via Vercel Dashboard** (Recommended)

1. Go to: https://vercel.com
2. Select your project: "fleet-management-v2"
3. Go to: Settings → Environment Variables
4. Add **Server Token**:
   - **Name**: `LOGTAIL_SOURCE_TOKEN`
   - **Value**: (paste server token from Step 2)
   - **Environment**: Production ✅
   - Click "Save"
5. Add **Client Token**:
   - **Name**: `NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN`
   - **Value**: (paste client token from Step 2)
   - **Environment**: Production ✅
   - Click "Save"

**Option B: Via Vercel CLI**

```bash
# Login to Vercel
vercel login

# Add server token
vercel env add LOGTAIL_SOURCE_TOKEN
# When prompted, select:
# - Production environment
# - Paste server token

# Add client token
vercel env add NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN
# When prompted, select:
# - Production environment
# - Paste client token
```

### Step 4: Redeploy Application

**Why redeploy?**

- New environment variables need a fresh build to take effect

**Option A: Via Vercel Dashboard**

1. Go to: Deployments tab
2. Find latest deployment
3. Click "..." → "Redeploy"
4. Confirm

**Option B: Via Git Push**

```bash
# Make a trivial change to trigger redeploy
git commit --allow-empty -m "chore: redeploy for Better Stack tokens"
git push origin main
```

**Option C: Via Vercel CLI**

```bash
vercel --prod
```

**Wait 5-7 minutes for deployment to complete**

### Step 5: Verify Logs Flowing (2 minutes)

1. Go back to Better Stack dashboard
2. Click on "Fleet Management V2 - Server" source
3. Click "Live Tail" (top right)
4. **Expected**: You should see logs appearing in real-time

**Test client logs**:

1. Open your production app
2. Navigate through pages
3. Go back to Better Stack
4. Click "Fleet Management V2 - Client" source
5. Click "Live Tail"
6. **Expected**: Client-side logs appearing

**No logs showing?**

- Wait 2-3 minutes (initial delay is normal)
- Check Vercel deployment completed successfully
- Verify environment variables are set correctly
- Check browser console for errors

---

## 🔍 Understanding the Logs

### Server Logs

**Location**: "Fleet Management V2 - Server" source

**What you'll see**:

- API request logs
- Database query logs
- Server-side errors
- Authentication events
- Service layer operations

**Example log entry**:

```json
{
  "message": "Pilot updated successfully",
  "level": "info",
  "timestamp": "2025-10-24T10:30:45.123Z",
  "context": {
    "pilotId": "abc123",
    "component": "useOptimisticPilotUpdate",
    "userId": "user123"
  }
}
```

### Client Logs

**Location**: "Fleet Management V2 - Client" source

**What you'll see**:

- Client-side JavaScript errors
- React component errors
- UI interaction logs
- Network request failures
- Browser compatibility issues

**Example log entry**:

```json
{
  "message": "Leave request creation failed",
  "level": "error",
  "timestamp": "2025-10-24T10:31:20.456Z",
  "context": {
    "error": "Network timeout",
    "component": "useOptimisticLeaveRequest",
    "url": "/api/leave-requests"
  }
}
```

---

## 🎯 Creating Useful Views

### View 1: Error Dashboard

**Purpose**: See all errors at a glance

**Create view**:

1. Click "Views" → "Create View"
2. **Name**: "Error Dashboard"
3. **Query**: `level:error`
4. **Time range**: Last 24 hours
5. **Visualization**: Line chart
6. **Group by**: `context.component`
7. Save

**What it shows**:

- Error rate over time
- Most common error sources
- Error trends (improving or getting worse)

### View 2: API Performance

**Purpose**: Monitor API response times

**Create view**:

1. Create new view
2. **Name**: "API Performance"
3. **Query**: `message:*API*`
4. **Time range**: Last 7 days
5. **Visualization**: Table
6. **Columns**: timestamp, message, context.duration
7. Save

**What it shows**:

- Slow API endpoints
- Performance trends
- Potential bottlenecks

### View 3: Top Errors

**Purpose**: Find most common errors to fix

**Create view**:

1. Create new view
2. **Name**: "Top Errors"
3. **Query**: `level:error`
4. **Time range**: Last 7 days
5. **Visualization**: Bar chart
6. **Group by**: `message`
7. **Aggregation**: Count
8. **Sort by**: Count (descending)
9. Save

**What it shows**:

- Most frequent error messages
- Impact (how many users affected)
- Priority (which errors to fix first)

---

## 🚨 Setting Up Alerts

### Alert 1: High Error Rate

**Purpose**: Get notified when errors spike

**Create alert**:

1. Click "Alerts" → "Create Alert"
2. **Name**: "High Error Rate - Production"
3. **Source**: Fleet Management V2 - Server
4. **Condition**:
   - Query: `level:error`
   - Threshold: > 5 errors
   - Time window: 5 minutes
5. **Notification**:
   - Email: your@email.com
   - Severity: Critical
6. Save

**What triggers it**:

- More than 5 errors in 5 minutes
- Indicates serious production issue
- Immediate attention required

### Alert 2: Critical Component Errors

**Purpose**: Get notified when critical components fail

**Create alert**:

1. Create new alert
2. **Name**: "Critical Component Error"
3. **Source**: Fleet Management V2 - Server
4. **Condition**:
   - Query: `level:error AND (component:dashboard-service OR component:pilot-service)`
   - Threshold: > 1 error
   - Time window: 1 minute
5. **Notification**:
   - Email: your@email.com
   - Severity: High
6. Save

**What triggers it**:

- Any error in critical services
- Dashboard or pilot service failures
- User-facing impact

### Alert 3: Client-Side Crashes

**Purpose**: Catch React component crashes

**Create alert**:

1. Create new alert
2. **Name**: "Client Component Crash"
3. **Source**: Fleet Management V2 - Client
4. **Condition**:
   - Query: `level:error AND message:*boundary*`
   - Threshold: > 3 errors
   - Time window: 10 minutes
5. **Notification**:
   - Email: your@email.com
   - Severity: Medium
6. Save

**What triggers it**:

- Error boundary catches component crash
- Multiple users affected
- UI degradation

---

## 📊 Monitoring Dashboard

### Daily Monitoring Routine (5 minutes)

**Morning check** (9:00 AM):

1. Open Better Stack dashboard
2. Check "Error Dashboard" view
3. Review any alerts from overnight
4. Check "Top Errors" view for patterns
5. Verify log volume looks normal

**Afternoon check** (3:00 PM):

1. Quick glance at error rate
2. Check if any new alerts
3. Review "API Performance" view
4. Verify no performance degradation

**Evening check** (6:00 PM):

1. Final error rate check
2. Review day's error trends
3. Document any issues for next day
4. Check alert summary

### Weekly Review (30 minutes)

**Every Monday**:

1. Review last 7 days error trends
2. Identify top 3 most common errors
3. Create tickets to fix top errors
4. Review alert effectiveness
5. Update team on error status

---

## 🔧 Advanced Configuration

### Custom Log Context

**Add user information to logs**:

```typescript
// lib/services/logging-service.ts
import { getServerUser } from '@/lib/supabase/server'

export async function logWithUser(message: string, context?: LogContext) {
  const user = await getServerUser()

  await logger.info(message, {
    ...context,
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.user_metadata?.role,
  })
}
```

**Add timing information**:

```typescript
// lib/services/logging-service.ts
export async function logWithTiming(message: string, startTime: number, context?: LogContext) {
  const duration = Date.now() - startTime

  await logger.info(message, {
    ...context,
    duration: `${duration}ms`,
    slow: duration > 1000, // Flag slow operations
  })
}
```

### Structured Logging Best Practices

**Good logging**:

```typescript
logger.error('Pilot update failed', {
  error: error.message,
  pilotId: '123',
  component: 'useOptimisticPilotUpdate',
  userId: 'user456',
})
```

**Bad logging**:

```typescript
logger.error('Error updating pilot') // No context!
```

**Why context matters**:

- Helps debug issues faster
- Identifies patterns
- Tracks down root causes
- Measures performance

---

## 📈 Success Metrics

### Week 1 Goals

**Error Discovery**:

- ✅ Catch 100% of production errors
- ✅ Reduce MTTR from hours to minutes
- ✅ Identify top 5 most common errors
- ✅ Fix at least 3 top errors

**Team Adoption**:

- ✅ All developers check dashboard daily
- ✅ Alerts configured and working
- ✅ Weekly error review meeting established
- ✅ Error trends documented

### Month 1 Goals

**Quality Improvement**:

- ✅ Reduce error rate by 50%
- ✅ No critical errors in production
- ✅ Average MTTR < 30 minutes
- ✅ User-reported errors reduced 80%

**Process Improvement**:

- ✅ Automated error triage
- ✅ Error categories established
- ✅ Runbooks for common errors
- ✅ Post-mortem process for critical errors

---

## 🚨 Troubleshooting

### Issue: No Logs Appearing

**Checklist**:

- [ ] Tokens added to Vercel correctly
- [ ] Application redeployed after adding tokens
- [ ] Deployment completed successfully
- [ ] Wait 2-3 minutes for first logs

**Debug steps**:

```bash
# Check Vercel env vars
vercel env ls

# Verify tokens are set
# Should see:
# - LOGTAIL_SOURCE_TOKEN (Production)
# - NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN (Production)
```

**Still not working?**

- Check Better Stack source tokens are correct
- Verify no typos in environment variable names
- Check browser console for errors
- Contact Better Stack support

### Issue: Too Many Logs

**Problem**: Log volume exceeds free tier (1 GB/month)

**Solutions**:

1. **Filter logs**:
   ```typescript
   // Only log errors and warnings
   if (level === 'info') return // Skip info logs
   ```
2. **Upgrade plan**: Better Stack Pro ($20/month for 5 GB)
3. **Reduce verbosity**: Log only critical operations

### Issue: Logs Missing Context

**Problem**: Logs don't include enough information to debug

**Solution**: Always include context:

```typescript
// GOOD
logger.error('API call failed', {
  error: error.message,
  endpoint: '/api/pilots',
  method: 'POST',
  userId: user.id,
  requestId: req.id,
})

// BAD
logger.error('API call failed')
```

---

## ✅ Setup Complete Checklist

**Account Setup**:

- [ ] Better Stack account created
- [ ] Server source created
- [ ] Client source created
- [ ] Source tokens saved securely

**Vercel Integration**:

- [ ] Server token added to Vercel
- [ ] Client token added to Vercel
- [ ] Application redeployed
- [ ] Logs flowing to Better Stack

**Dashboard Configuration**:

- [ ] Error Dashboard view created
- [ ] API Performance view created
- [ ] Top Errors view created
- [ ] High Error Rate alert configured
- [ ] Critical Component alert configured
- [ ] Client Crash alert configured

**Team Onboarding**:

- [ ] Team members invited to Better Stack
- [ ] Daily monitoring routine established
- [ ] Weekly review meeting scheduled
- [ ] Documentation shared with team

---

## 🎊 You're Ready to Monitor!

**Better Stack Setup**: ✅ **COMPLETE**

**What you now have**:

- ✅ 100% error visibility (vs 0% before Phase 0)
- ✅ Real-time error monitoring
- ✅ Smart alerts for critical issues
- ✅ Historical error trends
- ✅ MTTR reduced from hours to minutes

**Next Steps**:

1. Monitor for first 24 hours
2. Review first error trends
3. Fix top 3 most common errors
4. Iterate on alerts and views
5. Celebrate improved observability! 🎉

---

**Questions?**

- Better Stack Docs: https://betterstack.com/docs/logs
- Better Stack Support: support@betterstack.com
- Check Phase 0 documentation for integration details

**Happy Monitoring! 📊**

_Phase 0 Better Stack Integration: Complete_
_Error Visibility: 0% → 100%_
_MTTR: Hours → Minutes_
