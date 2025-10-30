# 🚀 Phase 1 - Ready for Production Deployment

**Date**: October 26, 2025
**Status**: ✅ **READY FOR DEPLOYMENT**
**Domain Verification**: ✅ **VERIFIED** (pxb767office.app)

---

## 🎉 Deployment Readiness Checklist

### Prerequisites - All Complete ✅

- [x] **Database Function Created**: `get_expiring_certifications_with_email()`
- [x] **Function Permissions Granted**: authenticated, anon, service_role
- [x] **Test Cron Job Working**: Successfully sent email to Maurice
- [x] **Production Cron Job Updated**: Uses database function
- [x] **Resend Domain Verified**: pxb767office.app ✅ VERIFIED
- [x] **Email Templates Ready**: Certification expiry & password reset
- [x] **Vercel Cron Configuration**: `vercel.json` configured for 6:00 AM daily
- [x] **Documentation Complete**: Phase 1 guide and troubleshooting docs

---

## 📋 Pre-Deployment Steps

### 1. Set Vercel Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wgdmgvonqysflwdiiols.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Email Service (Resend) - VERIFIED DOMAIN ✅
RESEND_API_KEY=<your-resend-api-key>
RESEND_FROM_EMAIL=Fleet Management <noreply@pxb767office.app>

# Cron Job Security
# ⚠️ IMPORTANT: Generate a NEW strong random secret for production
# Use: openssl rand -base64 32
CRON_SECRET=<generate-new-secret-for-production>

# App Configuration
NEXT_PUBLIC_APP_URL=<your-production-vercel-url>
```

**Security Note**:
- Generate a **NEW** `CRON_SECRET` for production (different from dev)
- Never commit secrets to git
- Use Vercel's environment variable encryption

### 2. Verify Local Build

Before deploying, verify the production build works locally:

```bash
npm run build
npm run start
```

Check for:
- ✅ No TypeScript errors
- ✅ No build warnings
- ✅ All pages load correctly
- ✅ Authentication flows work

### 3. Deploy to Vercel

Choose one of these deployment methods:

#### Option A: Git Integration (Recommended)
```bash
git add .
git commit -m "feat: implement certification expiry alerts with database function"
git push origin main
```

Vercel will automatically deploy when you push to main.

#### Option B: Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy to production
vercel --prod
```

---

## 🔍 Post-Deployment Verification

### Immediate Checks (Within 5 minutes)

1. **Visit Production URL**
   - Verify homepage loads
   - Test authentication (admin and pilot portal)
   - Check dashboard displays correctly

2. **Verify Cron Job Configuration**
   - Go to: Vercel Dashboard → Deployments → Cron Jobs
   - Confirm: `certification-expiry-alerts` appears
   - Schedule: `0 6 * * *` (6:00 AM daily)
   - Status: Active

3. **Test Cron Job Manually** (Optional)
   ```bash
   # From your local machine
   curl -X GET https://your-production-url.vercel.app/api/cron/certification-expiry-alerts \
     -H "Authorization: Bearer ${CRON_SECRET}"
   ```

   Expected response:
   ```json
   {
     "success": true,
     "message": "Certification expiry alerts processed",
     "summary": {
       "totalPilots": <number>,
       "successful": <number>,
       "failed": 0
     }
   }
   ```

### Next Day Verification (After First Cron Run)

**First Cron Run**: Tomorrow at 6:00 AM

1. **Check Vercel Logs**
   - Go to: Vercel Dashboard → Deployments → Your Deployment → Functions
   - Filter by: `/api/cron/certification-expiry-alerts`
   - Verify: Status 200, no errors

2. **Verify Email Delivery**
   - Check pilot inboxes for certification expiry emails
   - Confirm emails display correctly
   - Test "View My Certifications" link works

3. **Monitor Pilot Feedback**
   - Ensure pilots received emails
   - Check spam folders if missing
   - Verify urgency level color-coding (red/yellow/blue)

---

## 📊 What to Monitor

### Daily (First Week)

- **Cron Job Execution**: Check Vercel logs daily
- **Email Delivery**: Confirm pilots are receiving emails
- **Error Rates**: Monitor for any failed email sends
- **Pilot Feedback**: Collect feedback from pilots who received emails

### Weekly (Ongoing)

- **Email Open Rates**: Check Resend dashboard analytics
- **Database Performance**: Monitor query performance
- **Storage Usage**: Track Vercel function execution time
- **Cost Monitoring**: Review Vercel and Resend usage/costs

---

## 🚨 Troubleshooting

### Issue: Cron Job Not Running

**Symptoms**: No emails sent at 6:00 AM

**Checks**:
1. Verify `vercel.json` is in project root
2. Check `CRON_SECRET` is set in Vercel environment variables
3. Review Vercel Dashboard → Cron Jobs section
4. Check Vercel function logs for errors

**Solution**: Redeploy if `vercel.json` was added after initial deployment

### Issue: Emails Not Sending

**Symptoms**: Cron job runs successfully but no emails received

**Checks**:
1. Verify `RESEND_API_KEY` is correct in Vercel
2. Confirm domain `pxb767office.app` is verified ✅
3. Check `RESEND_FROM_EMAIL` uses verified domain
4. Review Resend dashboard for blocked emails

**Solution**: Check Resend logs for delivery status and error messages

### Issue: Wrong Urgency Level

**Symptoms**: Emails show incorrect urgency color (red/yellow/blue)

**Logic**:
- 🔴 **Critical**: `days_until_expiry < 0` (expired)
- 🟡 **Warning**: `days_until_expiry <= 30`
- 🔵 **Notice**: `days_until_expiry > 30 and <= 90`

**Solution**: Verify `days_until_expiry` calculation in database function

### Issue: Database Function Errors

**Symptoms**: "Function returns empty array" or type errors

**Solution**: Run these SQL commands:
```sql
-- Grant permissions again
GRANT EXECUTE ON FUNCTION get_expiring_certifications_with_email(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_expiring_certifications_with_email(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_expiring_certifications_with_email(INTEGER) TO service_role;

-- Test function
SELECT count(*) FROM get_expiring_certifications_with_email(90);
```

---

## 📈 Success Metrics

### Week 1 Targets

- ✅ **100% Cron Job Success Rate**: All scheduled runs complete
- ✅ **95%+ Email Delivery Rate**: Most pilots receive emails
- ✅ **Zero Production Errors**: No critical errors in logs
- ✅ **Positive Pilot Feedback**: Pilots find emails helpful

### Month 1 Targets

- ✅ **Automated Alert System**: Runs reliably without intervention
- ✅ **Improved Compliance**: Pilots renew certifications before expiry
- ✅ **Reduced Manual Work**: Less manual cert tracking needed
- ✅ **High Engagement**: Pilots regularly check certification status

---

## 🔄 Rollback Plan

If critical issues arise, you can rollback quickly:

### Option 1: Revert Deployment (Vercel)
1. Go to: Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Option 2: Disable Cron Job
1. Go to: Vercel Dashboard → Settings → Cron Jobs
2. Disable `certification-expiry-alerts` temporarily
3. Fix issues in dev environment
4. Re-enable after testing

### Option 3: Revert Git Commit
```bash
git revert HEAD
git push origin main
```

Vercel will automatically deploy the reverted version.

---

## 📝 Next Steps After Deployment

### Immediate (This Week)

1. **Monitor First Cron Run** (Tomorrow 6:00 AM)
2. **Collect Pilot Feedback** on email format and usefulness
3. **Review Vercel Logs** for any errors or warnings
4. **Update Documentation** based on production learnings

### Short Term (Next 2 Weeks)

1. **Implement Password Reset Flow** (Phase 1 - Part 2)
   - Create `/portal/forgot-password` page
   - Implement token generation and storage
   - Create `/portal/reset-password` validation page
   - Integrate `sendPasswordResetEmail()` function

2. **Add Email Preferences** (Enhancement)
   - Allow pilots to set notification preferences
   - Option to receive daily digest vs individual alerts
   - Unsubscribe/resubscribe functionality

### Long Term (Phase 2+)

1. **Leave Request Notifications** - Email alerts for leave approvals/denials
2. **Flight Request Notifications** - Email alerts for flight request status
3. **Bulk Operations** - Admin tools for mass certification updates
4. **Reporting Dashboard** - Analytics on email engagement and compliance

---

## 📞 Support Contacts

### Production Issues
- **Vercel Support**: https://vercel.com/support
- **Resend Support**: https://resend.com/support
- **Supabase Support**: https://supabase.com/support

### Internal
- **Technical Lead**: Maurice Rondeau (mrondeau@airniugini.com.pg)
- **Database Admin**: [Contact info]
- **Operations Manager**: [Contact info]

---

## 🎯 Deployment Command Summary

```bash
# 1. Final code review
git status
git diff

# 2. Build and test locally
npm run build
npm run start

# 3. Commit and push
git add .
git commit -m "feat: implement certification expiry alerts with database function"
git push origin main

# 4. Monitor deployment
# Watch Vercel dashboard for deployment status

# 5. Verify production
# Visit production URL and test functionality

# 6. Monitor first cron run
# Check logs tomorrow at 6:00 AM
```

---

**Deployment Status**: ✅ READY
**Domain Status**: ✅ VERIFIED (pxb767office.app)
**Database**: ✅ CONFIGURED
**Testing**: ✅ COMPLETE
**Documentation**: ✅ COMPLETE

**🚀 You are clear for deployment!**

---

**Last Updated**: October 26, 2025
**Prepared By**: Claude Code AI Assistant
**Verified By**: Maurice Rondeau
