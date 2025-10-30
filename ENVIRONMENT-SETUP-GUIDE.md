# Environment Setup Guide

**Platform**: Vercel
**Framework**: Next.js 16.0.0
**Database**: Supabase PostgreSQL
**Cache**: Upstash Redis
**Email**: Resend
**Date**: October 28, 2025

---

## 🎯 Quick Setup (5 Minutes)

### Prerequisites

- Vercel account
- Supabase project: `wgdmgvonqysflwdiiols`
- (Optional) Upstash Redis account
- (Optional) Resend account with verified domain

### Step-by-Step Setup

#### 1. Get Supabase Credentials (REQUIRED)

Visit: https://app.supabase.com/project/wgdmgvonqysflwdiiols/settings/api

Copy these values:
```
Project URL: https://wgdmgvonqysflwdiiols.supabase.co
Anon/Public Key: [Copy from dashboard]
```

#### 2. Configure Vercel Environment Variables

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables (select "Production" environment):

**Required Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://wgdmgvonqysflwdiiols.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key-from-step-1]
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_NAME=Fleet Management V2
NEXT_PUBLIC_APP_VERSION=0.1.0
NEXT_PUBLIC_CURRENT_ROSTER=RP12/2025
NEXT_PUBLIC_ROSTER_END_DATE=2025-11-07
```

**Generate CRON_SECRET:**
```bash
# On Mac/Linux
openssl rand -base64 32

# Or use online generator:
# https://1password.com/password-generator/
```

Add to Vercel:
```env
CRON_SECRET=[generated-secret-here]
```

#### 3. Optional Services

**Redis (Rate Limiting) - Upstash Free Tier:**
1. Visit: https://console.upstash.com/redis
2. Create database (free tier)
3. Copy REST URL and Token
4. Add to Vercel:
```env
UPSTASH_REDIS_REST_URL=https://[your-redis-url].upstash.io
UPSTASH_REDIS_REST_TOKEN=[your-token]
```

**Email (Resend) - Free Tier:**
1. Visit: https://resend.com/api-keys
2. Create API key
3. Verify domain: https://resend.com/domains
4. Add to Vercel:
```env
RESEND_API_KEY=[your-api-key]
RESEND_FROM_EMAIL=Fleet Management <noreply@pxb767office.app>
```

#### 4. Deploy

**Via Git (Recommended):**
```bash
git push origin main
```
Vercel auto-deploys on push to main.

**Via CLI:**
```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## 📋 Complete Environment Variables Reference

### Production Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase project URL | `https://[id].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anon/public key | `eyJhbG...` |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | Production domain | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_APP_NAME` | ✅ Yes | App display name | `Fleet Management V2` |
| `NEXT_PUBLIC_APP_VERSION` | ✅ Yes | App version | `0.1.0` |
| `CRON_SECRET` | ✅ Yes | Cron job security secret | `[32+ char random string]` |
| `NEXT_PUBLIC_CURRENT_ROSTER` | ✅ Yes | Current roster period | `RP12/2025` |
| `NEXT_PUBLIC_ROSTER_END_DATE` | ✅ Yes | Current roster end date | `2025-11-07` |
| `UPSTASH_REDIS_REST_URL` | ⚠️ Recommended | Redis connection URL | `https://[id].upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | ⚠️ Recommended | Redis auth token | `[token]` |
| `RESEND_API_KEY` | ⚠️ Recommended | Email service API key | `re_[key]` |
| `RESEND_FROM_EMAIL` | ⚠️ Recommended | From email address | `Fleet <noreply@domain>` |

### Development Environment Variables

Create `.env.local` in project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://wgdmgvonqysflwdiiols.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Fleet Management V2"
NEXT_PUBLIC_APP_VERSION="0.1.0"

# Cron (development)
CRON_SECRET=dev-secret-change-in-production

# Roster Period
NEXT_PUBLIC_CURRENT_ROSTER=RP12/2025
NEXT_PUBLIC_ROSTER_END_DATE=2025-11-07

# Optional: Redis (development)
# UPSTASH_REDIS_REST_URL=https://[your-redis].upstash.io
# UPSTASH_REDIS_REST_TOKEN=[your-token]

# Optional: Email (development)
# RESEND_API_KEY=[your-api-key]
# RESEND_FROM_EMAIL=Fleet Management <noreply@pxb767office.app>
```

---

## 🔧 Service Configuration

### Supabase Setup

**Already Configured:**
- ✅ Project ID: `wgdmgvonqysflwdiiols`
- ✅ Database: 22 tables with RLS
- ✅ Auth: Enabled for admin portal
- ✅ Custom auth: Configured for pilot portal

**No Additional Setup Required**

Verify connection:
```bash
node test-connection.mjs
```

### Redis Setup (Optional but Recommended)

**Why Redis?**
- Rate limiting (prevent API abuse)
- Session caching
- Performance boost (85%+ cache hit rate)

**Setup Steps:**

1. **Create Upstash Redis Database**
   - Visit: https://console.upstash.com/redis
   - Click "Create Database"
   - Name: `fleet-management-prod`
   - Region: Choose closest to Vercel region
   - Type: Pay as You Go (free tier included)

2. **Get Credentials**
   - Click on database name
   - Copy "REST API" section:
     - UPSTASH_REDIS_REST_URL
     - UPSTASH_REDIS_REST_TOKEN

3. **Add to Vercel**
   - Vercel Dashboard → Environment Variables
   - Add both variables

4. **Test Connection**
   ```bash
   # After deployment
   curl https://your-domain.vercel.app/api/cache/health
   ```

**Free Tier Limits:**
- 10,000 requests/day
- 256MB storage
- 10,000 max connections

### Email Setup (Optional but Recommended)

**Why Resend?**
- Pilot registration emails
- Certification expiry alerts (daily cron)
- Password reset emails
- Leave/flight request notifications

**Setup Steps:**

1. **Create Resend Account**
   - Visit: https://resend.com
   - Sign up (free tier: 100 emails/day)

2. **Verify Domain**
   - Go to: https://resend.com/domains
   - Add domain: `pxb767office.app`
   - Add DNS records to your domain provider:
     ```
     Type: TXT
     Name: @
     Value: [provided by Resend]
     ```
   - Wait for verification (5-30 minutes)

3. **Create API Key**
   - Go to: https://resend.com/api-keys
   - Click "Create API Key"
   - Name: `fleet-management-prod`
   - Permissions: "Sending access"
   - Copy key (starts with `re_`)

4. **Add to Vercel**
   ```env
   RESEND_API_KEY=re_[your-key]
   RESEND_FROM_EMAIL=Fleet Management <noreply@pxb767office.app>
   ```

5. **Test Email**
   ```bash
   # After deployment, test cron endpoint
   curl "https://your-domain.vercel.app/api/cron/certification-expiry-alerts?secret=YOUR_CRON_SECRET"
   ```

**Free Tier Limits:**
- 100 emails/day
- 1 verified domain
- 30-day email logs

---

## ⚙️ Vercel Configuration

### Project Settings

**Build & Development Settings:**
```yaml
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next (auto-detected)
Install Command: npm install
Development Command: npm run dev
```

**Node.js Version:**
- Automatic (uses project's package.json)
- Recommended: 18.x or 20.x

**Environment Variables:**
- See complete list above
- Set for "Production" environment
- Optionally set for "Preview" (staging)

### Cron Jobs

**Already Configured in `vercel.json`:**

```json
{
  "crons": [
    {
      "path": "/api/cron/certification-expiry-alerts",
      "schedule": "0 6 * * *"
    }
  ]
}
```

**Schedule**: Daily at 6:00 AM UTC

**After Deployment:**
1. Verify in Vercel Dashboard → Cron Jobs
2. Check logs after first run
3. Verify emails sent to pilots

**Manual Test:**
```bash
curl "https://your-domain.vercel.app/api/cron/certification-expiry-alerts?secret=YOUR_CRON_SECRET"
```

### Custom Domain (Optional)

**Add Custom Domain:**

1. **Vercel Dashboard**
   - Go to: Settings → Domains
   - Click "Add Domain"
   - Enter: `pxb767office.app`

2. **Configure DNS**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com

   Type: A
   Name: @
   Value: 76.76.21.21
   ```

3. **SSL Certificate**
   - Automatically provisioned by Vercel
   - Takes 5-30 minutes

4. **Update Environment Variable**
   ```env
   NEXT_PUBLIC_APP_URL=https://pxb767office.app
   ```

---

## 🧪 Testing Configuration

### Local Testing

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 3. Start dev server
npm run dev

# 4. Run tests
npm test
```

### Production Testing

After deployment, test these endpoints:

```bash
# Health check
curl https://your-domain.vercel.app/api/health

# Test admin login
# Visit: https://your-domain.vercel.app/auth/login

# Test pilot portal
# Visit: https://your-domain.vercel.app/portal/login

# Test cron (use your CRON_SECRET)
curl "https://your-domain.vercel.app/api/cron/certification-expiry-alerts?secret=YOUR_SECRET"

# Test Redis health (if configured)
curl https://your-domain.vercel.app/api/cache/health
```

---

## 🔒 Security Best Practices

### Environment Variables

✅ **DO:**
- Use strong random secrets (32+ characters)
- Rotate CRON_SECRET regularly
- Use different secrets for preview/production
- Keep `.env.local` in `.gitignore`

❌ **DON'T:**
- Commit `.env.local` to Git
- Share secrets in plain text
- Use production secrets in development
- Hardcode secrets in code

### API Keys

✅ **DO:**
- Create separate keys for dev/prod
- Use read-only keys where possible
- Monitor API usage
- Revoke unused keys

❌ **DON'T:**
- Share API keys publicly
- Commit keys to Git
- Use production keys locally
- Exceed rate limits

### Cron Jobs

✅ **DO:**
- Secure with CRON_SECRET
- Validate secret on every request
- Log all cron runs
- Monitor for failures

❌ **DON'T:**
- Leave cron endpoints public
- Skip secret validation
- Ignore cron failures
- Run heavy operations in cron

---

## 📊 Monitoring Setup

### Vercel Analytics

**Enable in Dashboard:**
1. Go to: Analytics
2. Enable Web Analytics
3. Enable Speed Insights

**Metrics Tracked:**
- Page views
- Core Web Vitals (FCP, LCP, CLS, TTFB)
- User location
- Device types

### Error Tracking

**Configure Notifications:**
1. Go to: Settings → Notifications
2. Enable:
   - Build failures
   - Deployment errors
   - Runtime errors

**Email Alerts:**
- Set threshold for error rates
- Get notified of critical issues
- Monitor uptime

### Performance Monitoring

**Track These Metrics:**
- Build times (target: <10s)
- Bundle sizes (target: <3MB)
- API response times (target: <200ms)
- Cache hit rates (target: >80%)
- Database query times (target: <50ms)

---

## 🔄 Update Procedures

### Roster Period Updates (Quarterly)

**When to Update**: Start of each new roster period

**Update Variables:**
```env
NEXT_PUBLIC_CURRENT_ROSTER=RP13/2025
NEXT_PUBLIC_ROSTER_END_DATE=2025-12-05
```

**Steps:**
1. Calculate new roster period end date
2. Update in Vercel environment variables
3. Redeploy application
4. Verify in dashboard

### Version Updates

**When to Update**: Each major release

**Update Variable:**
```env
NEXT_PUBLIC_APP_VERSION=0.2.0
```

**Steps:**
1. Update `package.json` version
2. Update `NEXT_PUBLIC_APP_VERSION`
3. Create Git tag: `git tag v0.2.0`
4. Push tag: `git push origin v0.2.0`

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: Build fails with "Missing environment variable"
**Solution**:
- Check all required variables are set in Vercel
- Verify variable names match exactly
- Ensure no typos in variable names

**Issue**: Database connection fails
**Solution**:
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
- Test connection: `node test-connection.mjs`

**Issue**: Cron job not running
**Solution**:
- Verify `vercel.json` is committed
- Check cron schedule is valid
- Verify `CRON_SECRET` is set
- Check Vercel logs for errors

**Issue**: Emails not sending
**Solution**:
- Verify domain is verified in Resend
- Check `RESEND_API_KEY` is valid
- Verify `RESEND_FROM_EMAIL` matches verified domain
- Check Resend dashboard for errors

**Issue**: Redis connection fails
**Solution**:
- Verify Redis URL and token
- Check Upstash dashboard for status
- Test with: `curl https://your-domain.vercel.app/api/cache/health`

---

## ✅ Final Checklist

Before going live:

### Configuration
- [ ] All environment variables added to Vercel
- [ ] CRON_SECRET generated and added
- [ ] Domain verified (if using custom domain)
- [ ] SSL certificate active

### Services
- [ ] Supabase connection tested
- [ ] Redis connected (if enabled)
- [ ] Resend domain verified (if using email)
- [ ] Cron job scheduled

### Testing
- [ ] Admin login works
- [ ] Pilot portal works
- [ ] All API endpoints respond
- [ ] Cron job tested manually
- [ ] Email delivery tested

### Monitoring
- [ ] Vercel Analytics enabled
- [ ] Error notifications configured
- [ ] Performance tracking active
- [ ] Logs monitored

---

## 📞 Support Resources

**Vercel:**
- Documentation: https://vercel.com/docs
- Support: https://vercel.com/support
- Status: https://www.vercel-status.com

**Supabase:**
- Documentation: https://supabase.com/docs
- Dashboard: https://app.supabase.com
- Support: https://supabase.com/support

**Upstash:**
- Documentation: https://docs.upstash.com
- Console: https://console.upstash.com
- Support: support@upstash.com

**Resend:**
- Documentation: https://resend.com/docs
- Dashboard: https://resend.com/emails
- Support: support@resend.com

---

**Status**: Ready for Deployment
**Version**: 1.0.0
**Last Updated**: October 28, 2025
