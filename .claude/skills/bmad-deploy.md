# BMAD Deploy - Automated Project Deployment Workflow

**Version**: 1.0.0
**Author**: Maurice (Skycruzer)
**Purpose**: Automate quality checks, security audits, Vercel deployment, and git operations

---

## Overview

This skill automates the complete deployment workflow for both existing and new projects following the BMAD methodology. It ensures quality, security, and successful deployment to Vercel with proper git version control.

## Usage

### For Existing Projects (Review & Deploy)

```
/bmad-deploy review
```

### For New Projects (Initial Deploy)

```
/bmad-deploy new
```

### Quick Deploy (Skip Review)

```
/bmad-deploy quick
```

---

## Workflow 1: Review & Deploy (Existing Projects)

### Step 1: Project Health Check

**Agent**: QA (Quinn)

**Tasks**:

1. Review codebase architecture and structure
2. Check for code quality issues
3. Identify security vulnerabilities
4. Validate naming conventions
5. Check for deprecated dependencies
6. Review error handling patterns

**Commands**:

```bash
# Code quality validation
npm run validate
npm run validate:naming
npm run type-check

# Check for security issues
npm audit
npm outdated
```

**Deliverable**: Project health report with severity-tagged issues

---

### Step 2: Quality Resolution

**Agent**: Developer

**Tasks**:

1. Fix P0 (Critical) issues identified in health check
2. Fix P1 (High) issues that block deployment
3. Update dependencies if security vulnerabilities found
4. Resolve TypeScript errors
5. Fix ESLint errors
6. Ensure all tests pass

**Commands**:

```bash
# Fix quality issues
npm run lint:fix
npm run format
npm run type-check

# Run tests
npm test

# Update dependencies (if needed)
npm update
npm audit fix
```

**Quality Gates**:

- ✅ Zero TypeScript errors
- ✅ Zero ESLint errors
- ✅ All tests passing
- ✅ No critical security vulnerabilities
- ✅ Code formatted correctly

---

### Step 3: Security Audit

**Agent**: QA (Quinn)

**Tasks**:

1. Run security audit on dependencies
2. Check for exposed secrets in code
3. Validate environment variable usage
4. Review authentication/authorization
5. Check RLS policies (if Supabase)
6. Validate rate limiting on public endpoints
7. Review CORS configuration

**Commands**:

```bash
# Security audit
npm audit --audit-level=moderate
npm run validate

# Check for secrets
git secrets --scan || echo "Install git-secrets for better secret detection"

# Environment check
grep -r "NEXT_PUBLIC" . --include="*.ts" --include="*.tsx" | grep -v ".env"
```

**Security Checklist**:

- [ ] No hardcoded secrets or API keys
- [ ] Environment variables properly configured
- [ ] Authentication flows tested
- [ ] RLS policies enabled and tested
- [ ] Rate limiting configured
- [ ] Security headers configured
- [ ] HTTPS enforced

---

### Step 4: Pre-Deployment Build

**Agent**: Developer

**Tasks**:

1. Clean previous builds
2. Run production build
3. Verify build succeeds
4. Check bundle size
5. Test production build locally

**Commands**:

```bash
# Clean build
rm -rf .next

# Production build
npm run build

# Analyze bundle (optional)
ANALYZE=true npm run build

# Test production build locally
npm run start
# Open http://localhost:3000 and verify functionality
```

**Build Quality Gates**:

- ✅ Build completes without errors
- ✅ No console warnings in production
- ✅ Bundle size acceptable (<500KB initial load)
- ✅ All pages render correctly

---

### Step 5: Vercel Deployment

**Agent**: Developer

**Tasks**:

1. Ensure Vercel CLI installed
2. Configure environment variables in Vercel
3. Deploy to preview environment
4. Verify preview deployment
5. Deploy to production

**Commands**:

```bash
# Install Vercel CLI (if needed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production (after preview verification)
vercel --prod
```

**Environment Variables to Set in Vercel**:

```env
NEXT_PUBLIC_SUPABASE_URL=<your-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
NEXT_PUBLIC_APP_URL=<production-url>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
LOGTAIL_SOURCE_TOKEN=<server-token>
NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN=<client-token>
UPSTASH_REDIS_REST_URL=<redis-url>
UPSTASH_REDIS_REST_TOKEN=<redis-token>
RESEND_API_KEY=<resend-key>
RESEND_FROM_EMAIL=<from-email>
```

---

### Step 6: Deployment Verification

**Agent**: QA (Quinn)

**Tasks**:

1. Test production deployment URL
2. Verify all critical user flows work
3. Check authentication flows
4. Test database connectivity
5. Verify real-time features work
6. Check error logging integration
7. Test mobile responsiveness
8. Verify PWA installation works

**Manual Testing Checklist**:

- [ ] Homepage loads correctly
- [ ] Authentication (login/logout) works
- [ ] Admin dashboard accessible
- [ ] Pilot portal accessible
- [ ] Database reads/writes work
- [ ] Forms submit successfully
- [ ] Real-time updates work
- [ ] Error tracking logs to Better Stack
- [ ] Mobile view renders correctly
- [ ] PWA install prompt appears

**Automated Tests**:

```bash
# Run E2E tests against production
PLAYWRIGHT_BASE_URL=https://your-app.vercel.app npm test
```

---

### Step 7: Git Version Control

**Agent**: Developer

**Tasks**:

1. Stage all changes
2. Create conventional commit
3. Push to repository
4. Create git tag for release
5. Update CHANGELOG.md

**Commands**:

```bash
# Stage changes
git add .

# Create commit with conventional format
git commit -m "chore: deploy v$(node -p "require('./package.json').version") to production

- Complete quality audit
- Resolve all P0/P1 issues
- Pass security audit
- Successful Vercel deployment
- Verified production functionality

🚀 Deployed with BMAD-METHOD
🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to main
git push origin main

# Create release tag
git tag -a "v$(node -p "require('./package.json').version")" -m "Production release"
git push --tags
```

---

## Workflow 2: New Project Deploy

### Step 1: Project Initialization

**Agent**: Developer

**Tasks**:

1. Verify project structure
2. Install dependencies
3. Configure environment variables
4. Generate database types (if applicable)
5. Run initial build

**Commands**:

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with actual values

# Generate types (if Supabase)
npm run db:types

# Initial build test
npm run build
```

---

### Step 2: Quality Setup

**Agent**: Developer

**Tasks**:

1. Configure ESLint
2. Configure Prettier
3. Setup Husky pre-commit hooks
4. Configure TypeScript strict mode
5. Setup testing framework
6. Add validation scripts

**Commands**:

```bash
# Setup git hooks
npm run prepare

# Validate configuration
npm run validate
npm run validate:naming
```

---

### Step 3: Security Configuration

**Agent**: QA (Quinn)

**Tasks**:

1. Configure security headers
2. Setup rate limiting
3. Configure CORS
4. Setup error logging
5. Configure Supabase RLS (if applicable)
6. Setup environment variable validation

**Security Checklist**:

- [ ] Security headers in next.config.js
- [ ] Rate limiting configured
- [ ] Error logging setup (Better Stack)
- [ ] RLS policies enabled
- [ ] Environment validation added
- [ ] No secrets in code

---

### Step 4-7: Same as Workflow 1

Follow Steps 4-7 from "Review & Deploy" workflow:

- Pre-Deployment Build
- Vercel Deployment
- Deployment Verification
- Git Version Control

---

## Quick Deploy Workflow

For urgent hotfixes or when you're confident in code quality:

```bash
# 1. Quick validation
npm run validate && npm test

# 2. Build and deploy
npm run build && vercel --prod

# 3. Verify and commit
# Manual verification at production URL
git add . && git commit -m "hotfix: critical bug fix" && git push
```

**⚠️ Warning**: Use Quick Deploy sparingly. Always prefer full workflow for production releases.

---

## Rollback Procedure

If deployment fails verification:

### Step 1: Immediate Rollback

```bash
# Revert to previous deployment in Vercel dashboard
# OR
vercel rollback <deployment-url>
```

### Step 2: Investigate Issues

1. Check Vercel deployment logs
2. Check Better Stack error logs
3. Check browser console for client errors
4. Review failed E2E tests

### Step 3: Fix and Redeploy

1. Fix identified issues locally
2. Test thoroughly
3. Restart deployment workflow from Step 4

---

## Best Practices

### Before Every Deployment

✅ All tests passing locally
✅ Build succeeds without warnings
✅ Code reviewed and approved
✅ Environment variables documented
✅ Database migrations tested
✅ Rollback plan in place

### During Deployment

✅ Deploy to preview first
✅ Test preview thoroughly
✅ Monitor deployment logs
✅ Verify environment variables
✅ Check build analytics

### After Deployment

✅ Test all critical flows
✅ Monitor error logs for 15-30 minutes
✅ Check performance metrics
✅ Verify database connectivity
✅ Test on multiple devices/browsers
✅ Document any issues found

---

## Integration with BMAD Agents

### Use `/qa` for:

- Code review before deployment
- Security audit
- Deployment verification testing
- Post-deployment monitoring plan

### Use `/dev` for:

- Quality issue resolution
- Build process
- Vercel deployment
- Git operations

### Use `/bmad-master` for:

- Complete end-to-end deployment
- Complex rollback scenarios
- Multi-environment deployments

---

## Troubleshooting

### Build Fails

```bash
# Clear caches
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Deployment Fails

1. Check Vercel logs in dashboard
2. Verify environment variables are set
3. Check for missing dependencies
4. Verify build succeeds locally

### Tests Fail in Production

1. Check PLAYWRIGHT_BASE_URL is correct
2. Verify authentication works
3. Check CORS configuration
4. Review network requests in browser DevTools

### Database Connection Fails

1. Verify Supabase environment variables
2. Check RLS policies allow access
3. Test connection with `node test-connection.mjs`
4. Verify service role key has correct permissions

---

## Metrics and Monitoring

### Track These Metrics:

- **Deployment Time**: Target <5 minutes
- **Test Pass Rate**: Target 100%
- **Error Rate**: Monitor for first 30 minutes post-deploy
- **Performance**: Lighthouse score >90
- **Rollback Rate**: Track how often you need to rollback

### Success Criteria:

✅ All quality gates passed
✅ Zero critical security issues
✅ Production deployment successful
✅ All E2E tests passing
✅ No errors in monitoring logs (15 min)
✅ Git history updated with release tag

---

## Version History

| Version | Date        | Changes                                             |
| ------- | ----------- | --------------------------------------------------- |
| 1.0.0   | Nov 1, 2025 | Initial release with review & new project workflows |

---

**🚀 Built with BMAD-METHOD**
**🤖 Automated deployment excellence with Claude Code**
