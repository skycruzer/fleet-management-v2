# BMAD Deploy Skill - Quick Start Guide

## 🚀 What Was Created

I've created a comprehensive **BMAD-METHOD deployment automation skill** with two files:

1. **`.claude/skills/bmad-deploy.md`** - Full skill documentation (500+ lines)
2. **`.claude/commands/bmad-deploy.md`** - Slash command integration

---

## 📋 How to Use

### Method 1: Slash Command (Recommended)

Simply type one of these commands in Claude Code:

```bash
# For existing projects (with full review)
/bmad-deploy review

# For new projects (initial setup + deploy)
/bmad-deploy new

# Quick deploy (urgent hotfixes)
/bmad-deploy quick
```

### Method 2: Direct Skill Invocation

If slash command doesn't work, read the skill directly:

```bash
cat .claude/skills/bmad-deploy.md
```

Then follow the workflows manually.

---

## 🎯 What Each Mode Does

### `/bmad-deploy review` - Full Production Deployment

**Perfect for**: Regular releases, feature deployments, production updates

**Workflow** (7 Steps):
1. ✅ **Project Health Check** - Code quality + security scan
2. 🔧 **Quality Resolution** - Fix P0/P1 issues
3. 🔒 **Security Audit** - Secrets scan, RLS check, auth validation
4. 🏗️ **Pre-Deployment Build** - Production build + local test
5. ☁️ **Vercel Deployment** - Preview → Verify → Production
6. ✅ **Deployment Verification** - E2E tests + manual checks
7. 📝 **Git Version Control** - Conventional commit + release tag

**Time**: ~15-30 minutes
**Quality Gates**: ✅ Strict (all must pass)

---

### `/bmad-deploy new` - New Project Initial Deploy

**Perfect for**: First-time deployment of new projects

**Workflow** (7 Steps):
1. 🎬 **Project Initialization** - Dependencies + environment + types
2. ⚙️ **Quality Setup** - ESLint, Prettier, Husky, tests
3. 🔒 **Security Configuration** - Headers, rate limiting, logging, RLS
4. 🏗️ **Pre-Deployment Build** - Same as review mode
5. ☁️ **Vercel Deployment** - Same as review mode
6. ✅ **Deployment Verification** - Same as review mode
7. 📝 **Git Version Control** - Same as review mode

**Time**: ~30-45 minutes
**Quality Gates**: ✅ Strict (all must pass)

---

### `/bmad-deploy quick` - Emergency Hotfix

**Perfect for**: Critical bugs, urgent patches, production fires

**Workflow** (3 Steps):
1. ⚡ **Quick Validation** - `npm run validate && npm test`
2. 🚀 **Build & Deploy** - `npm run build && vercel --prod`
3. ✅ **Verify & Commit** - Manual check + git push

**Time**: ~5-10 minutes
**Quality Gates**: ⚠️ Minimal (use sparingly!)

---

## 🎬 Example Usage Session

```bash
# 1. Start deployment workflow
/bmad-deploy review

# Claude will guide you through:
# ✅ Step 1: Running quality checks
npm run validate
npm run validate:naming
npm test

# ✅ Step 2: Fixing any issues found
npm run lint:fix
npm run format

# ✅ Step 3: Security audit
npm audit
grep -r "NEXT_PUBLIC" . --include="*.ts"

# ✅ Step 4: Build for production
npm run build

# ✅ Step 5: Deploy to Vercel
vercel          # Preview first
vercel --prod   # After verification

# ✅ Step 6: Test production
# Manual testing checklist provided

# ✅ Step 7: Commit and tag
git add .
git commit -m "chore: deploy v2.6.0 to production..."
git tag -a v2.6.0 -m "Production release"
git push origin main --tags
```

---

## 📊 Success Criteria

After completing the workflow, you should have:

✅ **Zero critical issues**: No P0/P1 bugs
✅ **Build success**: Production build completes
✅ **Security pass**: No vulnerabilities or exposed secrets
✅ **Tests pass**: All E2E and unit tests green
✅ **Deployment live**: Vercel production URL working
✅ **Monitoring active**: Logs flowing to Better Stack
✅ **Git tagged**: Release version in repository
✅ **Rollback ready**: Know how to revert if needed

---

## 🔧 Prerequisites

Before using this skill, ensure you have:

- [ ] **Vercel Account**: CLI installed and logged in (`vercel login`)
- [ ] **Environment Variables**: All secrets documented
- [ ] **Database Ready**: Migrations tested (if applicable)
- [ ] **Tests Written**: E2E and unit tests exist
- [ ] **Code Reviewed**: Changes approved by team
- [ ] **Monitoring Setup**: Better Stack configured (optional)

---

## 🚨 Rollback Plan

If something goes wrong:

### Immediate Action
```bash
# Rollback in Vercel dashboard
# OR
vercel rollback <deployment-url>
```

### Investigation
1. Check **Vercel logs** in dashboard
2. Check **Better Stack** error logs
3. Check **browser console** for client errors
4. Review **failed E2E tests**

### Fix and Redeploy
1. Fix issues locally
2. Test thoroughly
3. Restart from Step 4 (Build)

---

## 🎓 Integration with BMAD Agents

This skill works with BMAD agents:

- **`/qa`** - Use for code review and security audit steps
- **`/dev`** - Use for quality fixes and deployment steps
- **`/bmad-master`** - Use for end-to-end orchestration

**Example**:
```bash
# Step 1: Review with QA agent
/qa
"Please review the codebase for quality and security issues before deployment"

# Step 2: Fix issues with Dev agent
/dev
"Please fix the P0 issues identified: [list issues]"

# Step 3: Deploy with BMAD Deploy skill
/bmad-deploy review
```

---

## 📈 Metrics to Track

Monitor these metrics for deployment health:

| Metric | Target | How to Measure |
|--------|--------|---------------|
| **Deployment Time** | <5 min | Time from build to live |
| **Test Pass Rate** | 100% | `npm test` results |
| **Error Rate** | <0.1% | Better Stack logs (30 min) |
| **Lighthouse Score** | >90 | Chrome DevTools |
| **Rollback Rate** | <5% | Track manual rollbacks |

---

## 🐛 Troubleshooting

### "Vercel command not found"
```bash
npm i -g vercel
vercel login
```

### "Build fails with type errors"
```bash
npm run db:types
npm run type-check
```

### "Tests fail in production"
```bash
# Check PLAYWRIGHT_BASE_URL
PLAYWRIGHT_BASE_URL=https://your-app.vercel.app npm test
```

### "Environment variables missing"
```bash
# Set in Vercel dashboard:
# Settings → Environment Variables
# Add all vars from .env.local
```

---

## 📚 Full Documentation

For complete workflows, commands, and checklists:
```bash
cat .claude/skills/bmad-deploy.md
```

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| **Review & Deploy** | `/bmad-deploy review` |
| **New Project Deploy** | `/bmad-deploy new` |
| **Emergency Hotfix** | `/bmad-deploy quick` |
| **Read Full Docs** | `cat .claude/skills/bmad-deploy.md` |
| **Rollback** | `vercel rollback <url>` |

---

## ✨ What Makes This Special

This skill combines:
- ✅ **BMAD Methodology** - Structured agent workflows
- ✅ **Quality Gates** - Enforced standards before deploy
- ✅ **Security First** - Comprehensive audit built-in
- ✅ **Automated** - One command, full workflow
- ✅ **Vercel Optimized** - Native integration
- ✅ **Git Best Practices** - Conventional commits + tags
- ✅ **Rollback Ready** - Clear recovery procedures

---

## 🎉 Next Steps

1. **Try it out**:
   ```bash
   /bmad-deploy review
   ```

2. **Customize**: Edit `.claude/skills/bmad-deploy.md` to match your workflow

3. **Share**: Team members can use the same skill

4. **Iterate**: Improve based on your deployment patterns

---

**🚀 Built with BMAD-METHOD**
**🤖 Automated deployment excellence with Claude Code**
**Version**: 1.0.0 | **Author**: Maurice (Skycruzer) | **Date**: November 1, 2025
