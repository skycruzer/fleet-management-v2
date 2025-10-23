# Fleet Management V2 - Deployment Guide

**Production Deployment & Infrastructure**
**Version**: 2.0.0
**Last Updated**: October 22, 2025

---

## 📖 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Deployment Platforms](#deployment-platforms)
5. [Production Checklist](#production-checklist)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

---

## 🚀 Prerequisites

### Required Accounts

- ✅ **Supabase Account** (Database & Auth)
- ✅ **Vercel Account** (Hosting - Recommended)
  - Or: AWS, Google Cloud, Azure, Railway, Render
- ✅ **GitHub Account** (Version Control)
- ✅ **Domain Name** (Optional but recommended)

### Development Environment

**Node.js**:
- Version: 18.x or higher
- Install: https://nodejs.org

**Package Manager**:
- npm (comes with Node.js)
- Or: pnpm, yarn

**Git**:
- Version: 2.x or higher
- Install: https://git-scm.com

---

## 🔧 Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/fleet-management-v2.git
cd fleet-management-v2
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optional: Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Get Supabase Credentials**:
1. Log in to https://app.supabase.com
2. Select your project
3. Go to Settings → API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

### 4. Verify Setup

```bash
# Run development server
npm run dev

# Open browser
http://localhost:3000
```

---

## 🗄️ Database Setup

### Supabase Project Setup

**1. Create Supabase Project**:
```
Project: fleet-management-v2
Region: Choose closest to users (e.g., ap-southeast-2 for PNG)
Database Password: Generate strong password
Plan: Pro recommended for production
```

**2. Database Schema**:

The schema is already created in production Supabase instance:
- Project ID: `wgdmgvonqysflwdiiols`
- 27 pilots
- 607 certifications
- 34 check types

**For New Instance**:

```bash
# Option 1: Export from existing
supabase db dump > schema.sql

# Option 2: Use migration files
supabase db push
```

### 3. Row Level Security (RLS)

**Verify RLS Enabled**:
```sql
-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

**All tables should have RLS = true**

### 4. Database Indexes

Run database optimization script:

```bash
# Generate TypeScript types
npm run db:types

# Apply performance indexes (see DATABASE-OPTIMIZATION.md)
# Total: 24 indexes for optimal performance
```

**Key Indexes**:
```sql
-- Pilots
CREATE INDEX idx_pilots_rank ON pilots(rank);
CREATE INDEX idx_pilots_status ON pilots(status);
CREATE INDEX idx_pilots_seniority ON pilots(seniority_number);

-- Certifications
CREATE INDEX idx_pilot_checks_pilot_id ON pilot_checks(pilot_id);
CREATE INDEX idx_pilot_checks_expiry ON pilot_checks(expiry_date);
CREATE INDEX idx_pilot_checks_status ON pilot_checks(status);

-- Leave Requests
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_roster ON leave_requests(roster_period);
```

### 5. Seed Data

**Initial Data Required**:
- Check types (34 standard types)
- Contract types (3 types)
- Initial admin user

```sql
-- Create admin user (run in Supabase SQL Editor)
INSERT INTO an_users (id, email, role)
VALUES (
  gen_random_uuid(),
  'admin@yourcompany.com',
  'admin'
);
```

---

## 🚀 Deployment Platforms

### Vercel (Recommended)

**Why Vercel**:
- Native Next.js support
- Automatic deployments
- Preview environments
- Edge network (global CDN)
- Zero configuration

**Deployment Steps**:

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Initial Deployment**:
```bash
vercel
# Follow prompts
# Select: Fleet Management V2
# Select existing project or create new
```

4. **Configure Environment Variables**:
```bash
# Via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_APP_URL production

# Or via Dashboard
# https://vercel.com/your-project/settings/environment-variables
```

5. **Production Deployment**:
```bash
vercel --prod
```

6. **Custom Domain** (Optional):
```bash
vercel domains add fleet.yourcompany.com
# Follow DNS instructions
```

**Automatic Deployments**:
- Push to `main` branch → Auto-deploy to production
- Push to other branches → Preview deployments
- Pull requests → Automatic preview URLs

**Vercel Configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "regions": ["syd1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

---

### Alternative: Docker Deployment

**Dockerfile**:
```dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Docker Compose**:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    restart: unless-stopped
```

**Build & Run**:
```bash
docker build -t fleet-management:latest .
docker run -p 3000:3000 --env-file .env.production fleet-management:latest
```

---

### Alternative: AWS Amplify

**Steps**:
1. Connect GitHub repository
2. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
3. Add environment variables
4. Deploy

---

## ✅ Production Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Database schema up to date
- [ ] RLS policies tested and verified
- [ ] Database indexes applied
- [ ] Admin user created
- [ ] Seed data loaded
- [ ] Build succeeds locally (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] Type check passes (`npm run type-check`)
- [ ] Lint passes (`npm run lint`)
- [ ] No console errors in browser
- [ ] Mobile responsive testing complete
- [ ] Accessibility audit passed (Lighthouse > 95)
- [ ] Performance audit passed (Lighthouse > 90)

### Security

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] API keys secured (not in client code)
- [ ] Service role key never exposed to client
- [ ] Rate limiting enabled
- [ ] SQL injection prevention (using parameterized queries)
- [ ] XSS prevention (React escapes by default)
- [ ] CSRF protection enabled
- [ ] Session management secure
- [ ] Password requirements enforced
- [ ] Data encryption at rest (Supabase default)
- [ ] Data encryption in transit (HTTPS)

### Performance

- [ ] Images optimized (next/image)
- [ ] Fonts optimized (next/font)
- [ ] Code splitting implemented
- [ ] Lazy loading configured
- [ ] Caching strategies in place
- [ ] CDN configured (Vercel Edge Network)
- [ ] Database queries optimized
- [ ] Indexes applied
- [ ] API response times < 200ms
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1

### Monitoring

- [ ] Error tracking configured (Sentry recommended)
- [ ] Analytics configured (Google Analytics optional)
- [ ] Logging enabled
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Database monitoring (Supabase dashboard)
- [ ] Performance monitoring (Vercel Analytics)

### Documentation

- [ ] README.md updated
- [ ] User guide complete
- [ ] Admin guide complete
- [ ] Deployment guide complete (this file)
- [ ] API documentation updated
- [ ] Change log maintained
- [ ] Known issues documented

### Backup & Recovery

- [ ] Automated database backups enabled
- [ ] Backup retention policy defined (7 days minimum)
- [ ] Recovery procedure documented
- [ ] Recovery tested in staging
- [ ] Data export functionality tested
- [ ] Disaster recovery plan documented

---

## 📊 Monitoring & Maintenance

### Application Monitoring

**Vercel Analytics**:
- Real User Monitoring (RUM)
- Core Web Vitals tracking
- Page performance metrics
- Geographic distribution

**Access**: Vercel Dashboard → Analytics

**Supabase Monitoring**:
- Database performance
- Query statistics
- Connection pooling
- Storage usage

**Access**: Supabase Dashboard → Reports

### Error Tracking

**Recommended: Sentry**

**Setup**:
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

**Configuration** (`sentry.client.config.js`):
```javascript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
```

### Uptime Monitoring

**Recommended Services**:
- UptimeRobot (Free tier available)
- Pingdom
- Better Uptime
- StatusPage

**Configure Checks**:
- HTTP(S) check every 5 minutes
- Alert via email/SMS on downtime
- Status page for users

### Log Management

**Access Logs**:

**Vercel**:
```bash
vercel logs [deployment-url]
vercel logs --follow  # Real-time logs
```

**Supabase**:
```sql
-- Database logs
SELECT * FROM postgres_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

**Application Logs**:
- Use logging utility (`/lib/utils/logger.ts`)
- Log to console in development
- Send to external service in production

### Performance Monitoring

**Web Vitals Tracking**:

```typescript
// app/layout.tsx
import { Suspense } from 'react'
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

**Monitor**:
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- TTFB (Time to First Byte)
- INP (Interaction to Next Paint)

### Database Maintenance

**Weekly Tasks**:
```sql
-- Check database size
SELECT
  pg_size_pretty(pg_database_size('postgres')) as db_size;

-- Check table sizes
SELECT
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Analyze query performance
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

**Monthly Tasks**:
- Review and optimize slow queries
- Check index usage
- Vacuum database (Supabase auto-vacuum enabled)
- Review and clean up old data

---

## 🔧 Troubleshooting

### Deployment Failures

**Issue**: Build fails on Vercel

**Diagnosis**:
```bash
# Check build logs
vercel logs [deployment-url]

# Test build locally
npm run build
```

**Common Causes**:
- TypeScript errors
- Missing environment variables
- Dependency issues
- Memory limits exceeded

**Solutions**:
- Fix TypeScript errors (`npm run type-check`)
- Verify all env vars set in Vercel
- Clear node_modules and reinstall
- Upgrade Vercel plan for more memory

### Runtime Errors

**Issue**: 500 Internal Server Error

**Diagnosis**:
- Check Vercel logs
- Check browser console
- Check network tab
- Review error tracking (Sentry)

**Solutions**:
- Fix server-side code errors
- Verify environment variables
- Check database connection
- Review API route implementations

### Database Connection Issues

**Issue**: "Unable to connect to database"

**Checks**:
1. Supabase project status (supabase.com)
2. Environment variables correct?
3. Network connectivity
4. Connection pooling limits

**Solutions**:
- Verify project is running
- Check API keys
- Review Supabase status page
- Upgrade plan if hitting limits

### Performance Issues

**Issue**: Slow page loads

**Diagnosis**:
- Run Lighthouse audit
- Check Web Vitals
- Review server response times
- Check database query performance

**Solutions**:
- Optimize images (use next/image)
- Implement caching
- Add database indexes
- Use code splitting
- Enable compression

---

## 🔄 Rollback Procedures

### Vercel Rollback

**Instant Rollback**:
1. Go to Vercel Dashboard
2. Navigate to Deployments
3. Find last working deployment
4. Click "..." → "Promote to Production"
5. Confirm

**Or via CLI**:
```bash
vercel rollback
# Select previous deployment from list
```

### Database Rollback

**⚠️ Requires careful planning**

**Point-in-Time Recovery** (Supabase Pro+):
1. Go to Supabase Dashboard
2. Settings → Database → Backups
3. Select restore point (within 7 days)
4. Initiate recovery
5. Test thoroughly

**Manual Rollback**:
```sql
-- Revert specific migration
BEGIN;
-- Run rollback SQL
-- Test changes
COMMIT; -- or ROLLBACK if issues
```

### Emergency Procedures

**Critical Bug in Production**:

1. **Immediate**:
   - Rollback deployment (Vercel)
   - Post status update
   - Alert stakeholders

2. **Fix**:
   - Create hotfix branch
   - Fix bug
   - Test thoroughly
   - Deploy fix

3. **Post-Incident**:
   - Document incident
   - Analyze root cause
   - Implement prevention
   - Update runbook

**Database Corruption**:

1. **Assess damage**:
   ```sql
   SELECT * FROM suspect_table LIMIT 100;
   ```

2. **Restore from backup**:
   - Use Supabase point-in-time recovery
   - Or restore from manual backup

3. **Verify data integrity**:
   - Run data validation queries
   - Test critical workflows
   - Check with users

4. **Document and prevent**:
   - Document what happened
   - Implement safeguards
   - Update procedures

---

## 🔒 Security Best Practices

### Environment Variables

**Never commit**:
- ❌ `.env.local`
- ❌ `.env.production`
- ❌ Any file with secrets

**Use**:
- ✅ `.env.example` (template without secrets)
- ✅ Vercel environment variables
- ✅ Secure secret storage

### API Keys

**Public (Client-side)**:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `NEXT_PUBLIC_APP_URL`

**Private (Server-only)**:
- 🔒 `SUPABASE_SERVICE_ROLE_KEY`
- 🔒 `DATABASE_URL`
- 🔒 Any API keys

**Never expose private keys to client!**

### HTTPS Only

**Force HTTPS**:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      301
    )
  }
}
```

**Vercel auto-redirects HTTP → HTTPS**

### Security Headers

**Configure in `next.config.js`**:

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
```

---

## 📞 Support & Resources

### Documentation

- **User Guide**: `/USER-GUIDE.md`
- **Admin Guide**: `/ADMIN-GUIDE.md`
- **API Standards**: `/API-STANDARDS.md`
- **Database Optimization**: `/DATABASE-OPTIMIZATION.md`
- **Accessibility**: `/ACCESSIBILITY.md`
- **Mobile Optimization**: `/MOBILE-OPTIMIZATION-GUIDE.md`

### External Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

### Getting Help

**Technical Support**:
- Email: support@example.com
- Emergency: +675 XXX XXXX

**Community**:
- Next.js Discord
- Supabase Discord
- Stack Overflow

---

## 📝 Deployment Checklist

### Initial Deployment

- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Database schema created
- [ ] Seed data loaded
- [ ] Build successful
- [ ] Tests passing
- [ ] Deployed to staging
- [ ] Staging tested thoroughly
- [ ] Deployed to production
- [ ] Production smoke tests passed
- [ ] Monitoring configured
- [ ] Backups verified
- [ ] Documentation updated
- [ ] Team trained
- [ ] Launch announced

### Subsequent Deployments

- [ ] Changes reviewed
- [ ] Tests updated and passing
- [ ] Database migrations prepared
- [ ] Environment variables updated (if needed)
- [ ] Deployed to staging
- [ ] Staging tested
- [ ] Rollback plan ready
- [ ] Deployed to production
- [ ] Smoke tests passed
- [ ] Monitoring checked
- [ ] Change log updated

---

**Fleet Management V2**
*Deployment Guide*
*Version 2.0.0 - Production System*
*Ready for Enterprise Deployment*
