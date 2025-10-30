# 🚀 Vercel Deployment - Quick Start

## ⚠️ BEFORE YOU DEPLOY

### 1. Set Environment Variables in Vercel

**Vercel Dashboard → Settings → Environment Variables**

Copy these from your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
RESEND_API_KEY
RESEND_FROM_EMAIL
```

**Generate NEW for production:**
```
CRON_SECRET=<see-below>
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 🔐 Your New CRON_SECRET

A secure secret has been generated in the terminal output above.
Copy it and set in Vercel as: `CRON_SECRET`

## 🚀 Deploy Commands

**Option A: Vercel CLI**
```bash
vercel --prod
```

**Option B: Git Push (if connected)**
```bash
git add .
git commit -m "chore: production deployment"
git push origin main
```

## ✅ After Deployment

**1. Run Verification**
```bash
PRODUCTION_URL=https://your-app.vercel.app node verify-deployment.mjs
```

**2. Test Admin Login**
- Go to: https://your-app.vercel.app/auth/login
- Email: skycruzer@icloud.com
- Password: mron2393

**3. Test Critical Workflows**
- [ ] Dashboard loads
- [ ] View pilots list
- [ ] Create certification
- [ ] Submit leave request
- [ ] Check notifications

## 🔍 If Login Still Fails

1. Check Vercel logs: `vercel logs --prod`
2. Check Supabase Auth logs
3. Try password reset in Supabase dashboard
4. Clear browser cache/cookies
5. Try incognito window

## 📞 Support

**QA Gate Report**: `.bmad-core/qa-results/vercel-deployment-gate.yml`
**Full Documentation**: `CLAUDE.md`

---

**Gate Decision**: ⚠️ CONCERNS - Deploy with verification
**Risk Level**: MEDIUM
**Ready to Deploy**: YES (after env vars set)
