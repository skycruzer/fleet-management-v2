---
description: 'Automated BMAD-METHOD deployment workflow: Quality → Security → Deploy → Verify → Git'
globs: ['**/*']
priority: high
tags: [deployment, quality, security, vercel, git, automation, bmad]
---

# BMAD Deploy - Automated Deployment Workflow

Execute the complete BMAD-METHOD deployment workflow with quality checks, security audit, Vercel deployment, and git version control.

## Usage

**For existing projects (with review)**:

```
/bmad-deploy review
```

**For new projects (initial setup)**:

```
/bmad-deploy new
```

**Quick deploy (skip review)**:

```
/bmad-deploy quick
```

---

## What This Command Does

### Review Mode (Existing Projects)

1. **Project Health Check**: Code quality, security vulnerabilities, naming conventions
2. **Quality Resolution**: Fix critical issues, update dependencies, resolve errors
3. **Security Audit**: Scan for secrets, validate auth, check RLS policies, rate limiting
4. **Pre-Deployment Build**: Clean build, verify production bundle, test locally
5. **Vercel Deployment**: Deploy to preview, verify, then production
6. **Deployment Verification**: Test critical flows, check logs, verify features
7. **Git Version Control**: Commit with conventional format, tag release, push

### New Project Mode

1. **Project Initialization**: Setup dependencies, environment, database types
2. **Quality Setup**: Configure linting, formatting, pre-commit hooks, testing
3. **Security Configuration**: Setup headers, rate limiting, error logging, RLS
4. **Deploy Steps**: Same as Review Mode steps 4-7

### Quick Deploy Mode

1. Quick validation (`npm run validate && npm test`)
2. Build and deploy (`npm run build && vercel --prod`)
3. Manual verification and commit

---

## Workflow Execution

The skill will guide you through each step with:

- ✅ **Quality Gates**: Must pass before proceeding
- 🔍 **Validation Commands**: Automated checks to run
- 📋 **Checklists**: Manual verification items
- ⚠️ **Warnings**: Critical items to review
- 🚀 **Success Criteria**: How to know you're done

---

## Prerequisites

Before running this command, ensure:

- [ ] Vercel account configured
- [ ] Environment variables documented
- [ ] Database migrations tested (if applicable)
- [ ] Tests are written and passing locally
- [ ] Code has been reviewed

---

## When to Use This Command

**✅ Use for**:

- Production deployments
- Staging environment updates
- Release candidates
- Feature branch deployments
- Hotfix deployments (quick mode)

**❌ Don't use for**:

- Development environment testing
- Local builds only
- Draft work in progress
- Experimental features (deploy to preview only)

---

## Expected Outcomes

### Success Criteria

✅ All quality gates passed
✅ Zero critical security issues
✅ Production deployment successful
✅ All E2E tests passing
✅ No errors in monitoring logs (15 min)
✅ Git history updated with release tag

### Time Estimates

- **Review Mode**: 15-30 minutes (depending on issues found)
- **New Project Mode**: 30-45 minutes (initial setup)
- **Quick Deploy**: 5-10 minutes (use sparingly)

---

## Integration with BMAD Agents

This command works seamlessly with:

- `/qa` - For code review and security audit phases
- `/dev` - For quality resolution and deployment phases
- `/bmad-master` - For end-to-end orchestration

---

## Rollback Plan

If deployment fails verification:

1. **Immediate**: Rollback in Vercel dashboard or `vercel rollback <url>`
2. **Investigate**: Check logs (Vercel + Better Stack + Browser Console)
3. **Fix**: Address issues locally, test thoroughly
4. **Redeploy**: Restart from Step 4 (Pre-Deployment Build)

---

## Read the Full Documentation

For complete details, workflows, and troubleshooting:

```
cat .claude/skills/bmad-deploy.md
```

---

**🚀 BMAD-METHOD Deployment Excellence**
**🤖 Automated with Claude Code**
