# Security Alert: Environment Variable Leak

**Date**: November 4, 2025
**Severity**: CRITICAL
**Status**: MITIGATED (Action Required)
**Author**: Maurice Rondeau

## Issue Summary

**CRITICAL SECURITY VULNERABILITY DISCOVERED**: A Resend API key was exposed in git history through `.env.resend.tmp` file.

## Details

### Exposed Credentials

**File**: `.env.resend.tmp`
**Exposed Key**: `re_9MGCNg2C_Fn3MHmNE6sGosnxKdoGRQ37f`
**Service**: Resend (Email service)
**Date Added**: October 29, 2025
**Discovery Date**: November 4, 2025
**Exposure Duration**: ~6 days

### What Was Exposed

```env
RESEND_API_KEY=re_9MGCNg2C_Fn3MHmNE6sGosnxKdoGRQ37f
RESEND_FROM_EMAIL=Fleet Management <noreply@pxb767office.app>
```

### Risk Assessment

**Risk Level**: HIGH

**Potential Impact**:
- ✅ **Email Quota Abuse**: Attacker could send unlimited emails using your Resend account
- ✅ **Email Spoofing**: Phishing emails could be sent from noreply@pxb767office.app
- ✅ **Reputation Damage**: Domain could be blacklisted due to spam/abuse
- ✅ **Financial Impact**: Resend charges per email - could run up costs
- ❌ **Database Access**: NO (email API only - database credentials not exposed)
- ❌ **User Data**: NO (API key only grants email sending capability)

## Actions Taken

### 1. Removed File from Git Tracking ✅

```bash
git rm --cached .env.resend.tmp
# File no longer tracked in git
```

### 2. Updated .gitignore ✅

Added comprehensive patterns to prevent future leaks:
```gitignore
.env*.tmp
.env*.backup
*.env.tmp
*.env.backup
```

### 3. Git History Status

**IMPORTANT**: The exposed key is still in git history. Previous commits contain the leaked key.

**Options to fully remediate**:
a. Rotate the API key (RECOMMENDED - simple and effective)
b. Rewrite git history (complex and risky)

## Required Actions

### IMMEDIATE (Do Within 24 Hours)

#### 1. Rotate Resend API Key

**Steps**:
1. Log into Resend Dashboard: https://resend.com/api-keys
2. Revoke the exposed key: `re_9MGCNg2C_Fn3MHmNE6sGosnxKdoGRQ37f`
3. Generate a new API key
4. Update `.env.local` with new key
5. Update Vercel environment variables with new key

**Why this is sufficient**:
- Old key becomes immediately useless
- No need to rewrite git history
- Simple and low-risk solution

#### 2. Verify No Other Secrets Exposed

```bash
# Check git history for other potential leaks
git log --all --full-history -- "*env*" | grep -i "key\|password\|secret"

# Check for hardcoded secrets in code
grep -r "SUPABASE.*=" --include="*.ts" --include="*.tsx" app/ lib/
```

#### 3. Update Documentation

Add security reminder to CLAUDE.md:
- Never commit .env files
- Always use .env.local for development
- Always use Vercel dashboard for production secrets

### SHORT-TERM (Within 1 Week)

#### 1. Add Pre-Commit Hook

Create `.husky/pre-commit` to prevent future leaks:
```bash
#!/bin/sh
# Detect secrets in staged files
git diff --cached --name-only | grep -E "\.env" | grep -v "\.env\.example" && {
  echo "❌ ERROR: Attempting to commit .env file"
  echo "Remove .env files from staging: git reset HEAD .env*"
  exit 1
}

# Check for hardcoded secrets
git diff --cached | grep -E "(api_key|password|secret).*=.*[a-zA-Z0-9]{20,}" && {
  echo "⚠️  WARNING: Potential secret detected in diff"
  echo "Review carefully before committing"
}
```

#### 2. Security Audit

Run security scan:
```bash
# Install and run gitleaks
brew install gitleaks  # or download from GitHub
gitleaks detect --source . --verbose
```

#### 3. Team Communication

If working with a team:
- Notify all team members of the leak
- Review access logs in Resend dashboard
- Check for suspicious email activity
- Update team security practices

### LONG-TERM (Ongoing)

#### 1. Secrets Management

Consider using a secrets management service:
- Vercel Environment Variables (already using)
- Doppler (centralized secrets management)
- HashiCorp Vault (enterprise)

#### 2. Regular Security Reviews

- Monthly: Review git history for accidental commits
- Quarterly: Rotate API keys and credentials
- Annually: Full security audit

#### 3. CI/CD Integration

Add to GitHub Actions (if using):
```yaml
- name: Secret Scan
  uses: trufflesecurity/trufflehog@main
  with:
    path: ./
    base: ${{ github.event.repository.default_branch }}
    head: HEAD
```

## Verification Checklist

Before closing this security alert:

- [ ] `.env.resend.tmp` removed from git tracking
- [ ] `.gitignore` updated with comprehensive patterns
- [ ] Resend API key rotated
- [ ] `.env.local` updated with new key
- [ ] Vercel environment variables updated
- [ ] No other secrets found in git history
- [ ] Pre-commit hooks added (optional but recommended)
- [ ] Team notified (if applicable)
- [ ] Documentation updated

## Prevention Guidelines

### DO:
✅ Use `.env.local` for all local development secrets
✅ Add all .env variants to .gitignore (except .env.example)
✅ Use Vercel dashboard for production environment variables
✅ Review staged files before committing (`git status`)
✅ Use `git diff --cached` to review changes before commit

### DON'T:
❌ Never commit .env files (even temporarily)
❌ Never name files `.env.tmp` or `.env.backup`
❌ Never hardcode secrets in source code
❌ Never share API keys in chat/email
❌ Never commit files with "key", "password", "secret" in filenames

## Learning Points

1. **File naming matters**: `.env.tmp` was not caught by original gitignore
2. **Git tracking is permanent**: Once committed, always in history
3. **Early detection is key**: Found within 6 days (good!)
4. **Rotation is easier than history rewrite**: Key rotation is the practical solution

## References

- Resend Security Docs: https://resend.com/docs/security
- GitHub Secret Scanning: https://docs.github.com/en/code-security/secret-scanning
- Git History Rewriting (if needed): https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History

---

**Status**: Mitigated pending API key rotation
**Next Review**: After key rotation completed
**Incident Closed**: (Date after verification checklist complete)
