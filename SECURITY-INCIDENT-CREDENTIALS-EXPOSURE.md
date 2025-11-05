# Security Incident Report: Production Credentials Exposure

**Date Discovered**: November 4, 2025
**Severity**: CRITICAL
**Status**: MITIGATED - ACTION REQUIRED
**Incident ID**: SEC-2025-11-04-001
**Reporter**: Maurice Rondeau (Security Audit)

---

## Executive Summary

**CRITICAL SECURITY INCIDENT**: Production admin and pilot credentials were hardcoded in test utility files and committed to version control.

**Exposed Accounts**:
1. Admin Account: `skycruzer@icloud.com` / `mron2393`
2. Pilot Account: `mrondeau@airniugini.com.pg` / `Lemakot@1972`

**Exposure Duration**: Unknown (file existed in git history)
**Discovery Method**: Automated security audit
**Risk Level**: CRITICAL (Full administrative access compromised)

---

## Detailed Findings

### Exposed Credentials

**File**: `e2e/helpers/test-utils.ts`
**Lines**: 18-28

```typescript
// EXPOSED CREDENTIALS (now removed)
admin: {
  email: 'skycruzer@icloud.com',           // ❌ EXPOSED
  password: 'mron2393',                    // ❌ EXPOSED
},
pilot: {
  email: 'mrondeau@airniugini.com.pg',     // ❌ EXPOSED
  password: 'Lemakot@1972',                // ❌ EXPOSED
}
```

### Impact Assessment

**Admin Account (`skycruzer@icloud.com`)**:
- ✅ Full administrative access to Fleet Management System
- ✅ Can view all pilot data (27 pilots, 607 certifications)
- ✅ Can modify/delete any records
- ✅ Access to leave requests, disciplinary actions, tasks
- ✅ Can export sensitive reports
- ✅ Access to system settings and configurations

**Pilot Account (`mrondeau@airniugini.com.pg`)**:
- ✅ Access to personal pilot dashboard
- ✅ Can view personal certification records
- ✅ Can submit leave requests and flight requests
- ✅ Access to personal feedback submissions
- ⚠️ Limited access compared to admin (read-mostly)

### Risk Severity: CRITICAL

**Why CRITICAL**:
1. **Full Admin Access**: Complete control over application
2. **Data Breach Risk**: All pilot PII accessible
3. **Data Integrity**: Attacker can modify/delete records
4. **Compliance**: GDPR/SOC2 violation (unauthorized access)
5. **Reputation**: Could damage organizational trust

### Exploitation Scenarios

**Scenario 1: Data Exfiltration**
- Attacker logs in as admin
- Exports all pilot reports (personal data, certifications, leave history)
- Sells data or uses for identity theft

**Scenario 2: Data Manipulation**
- Attacker modifies certification records
- Could cause operational safety issues
- Deletes critical compliance data

**Scenario 3: System Sabotage**
- Attacker deletes all renewal plans
- Removes pilot records
- Corrupts database integrity

---

## Remediation Actions Taken

### ✅ COMPLETED (November 4, 2025)

#### 1. Removed Hardcoded Credentials
**File**: `e2e/helpers/test-utils.ts`
**Change**: Replaced hardcoded credentials with environment variable requirements
```typescript
// NEW SECURE IMPLEMENTATION
email: process.env.TEST_ADMIN_EMAIL || throwMissingEnvError('TEST_ADMIN_EMAIL'),
password: process.env.TEST_ADMIN_PASSWORD || throwMissingEnvError('TEST_ADMIN_PASSWORD'),
```

**Effect**: Tests will now FAIL if environment variables are not set (preventing accidental credential exposure)

#### 2. Created Test Environment Template
**File**: `.env.test.local.example`
**Purpose**: Guide users to create secure test credentials
**Security Notes**: Included warnings about never committing test credentials

#### 3. Enhanced .gitignore
**Added Patterns**:
```gitignore
.env.test
.env.test.local
playwright/.env
playwright/.env.local
```
**Effect**: Test credential files now explicitly ignored

#### 4. Security Documentation
**File**: This incident report
**Purpose**: Document incident for compliance and future reference

---

## REQUIRED IMMEDIATE ACTIONS

### 🚨 CRITICAL (Complete Within 24 Hours)

#### Action 1: Reset Admin Password IMMEDIATELY
```
Account: skycruzer@icloud.com
Current Password: mron2393 (COMPROMISED)
Action Required: Reset to strong password (16+ characters)

Steps:
1. Log into Supabase Dashboard: https://app.supabase.com/project/wgdmgvonqysflwdiiols
2. Go to Authentication → Users
3. Find user: skycruzer@icloud.com
4. Click "..." → "Reset Password"
5. Generate strong password (use password manager)
6. Update .env.local with new password
7. DO NOT commit new password to git

Urgency: IMMEDIATE - Account has full admin access
```

#### Action 2: Reset Pilot Password IMMEDIATELY
```
Account: mrondeau@airniugini.com.pg
Current Password: Lemakot@1972 (COMPROMISED)
Action Required: Reset to strong password

Steps:
1. Log into application as admin
2. Navigate to Pilot Portal Users
3. Find: mrondeau@airniugini.com.pg
4. Reset password
5. Notify pilot of password change

Urgency: HIGH - Account has pilot portal access
```

#### Action 3: Audit Access Logs (Within 24 Hours)
```
Platform: Supabase Dashboard
Location: Authentication → Logs

Check for:
- Unusual login times/locations
- Failed login attempts
- Unexpected API calls
- Unauthorized data exports

Time Range: Check last 30 days minimum

Document: Any suspicious activity found
```

#### Action 4: Create Dedicated Test Accounts
```
Purpose: Separate test accounts from production accounts

Admin Test Account:
- Email: test-admin@example.com (or similar)
- Password: Weak password OK (test data only)
- Permissions: Full admin (for testing)
- DO NOT use for production

Pilot Test Account:
- Email: test-pilot@example.com (or similar)
- Password: Weak password OK (test data only)
- Permissions: Pilot portal access
- DO NOT use for production

Action: Create these accounts and add to .env.test.local
```

---

## Post-Incident Actions (Within 1 Week)

### Security Improvements

#### 1. Implement Pre-Commit Hooks
Prevent future credential commits:
```bash
# .husky/pre-commit
git diff --cached | grep -E "(password|secret|key).*=.*['\"]" && {
  echo "❌ ERROR: Potential credential detected"
  echo "Remove credentials before committing"
  exit 1
}
```

#### 2. Add Git Secrets Scanning
Install and configure:
```bash
# Install gitleaks
brew install gitleaks

# Scan repository
gitleaks detect --source . --verbose

# Add to CI/CD pipeline
```

#### 3. Rotate All API Keys
Even though not directly exposed, rotate as precaution:
- Supabase service role key
- Resend API key (already exposed separately)
- Logtail tokens
- Upstash Redis credentials
- Any other API keys

#### 4. Team Training
- Security awareness training
- Secure coding practices
- Credential management best practices
- Git commit review procedures

---

## Long-Term Prevention

### 1. Secrets Management
Implement proper secrets management:
- Use Vercel Environment Variables for production
- Use .env.local (never committed) for development
- Use .env.test.local (never committed) for testing
- Consider HashiCorp Vault for enterprise

### 2. Code Review Process
Establish mandatory code reviews:
- All commits reviewed before merge
- Automated credential scanning in CI/CD
- Security-focused reviewers

### 3. Regular Security Audits
Schedule recurring audits:
- Monthly: Automated security scans
- Quarterly: Manual security reviews
- Annually: Third-party penetration testing

### 4. Incident Response Plan
Create formal incident response procedures:
- Detection → Containment → Eradication → Recovery → Lessons Learned
- Define roles and responsibilities
- Practice with tabletop exercises

---

## Compliance Impact

This incident may require disclosure under:

- **GDPR** (if EU citizens affected): Breach notification within 72 hours
- **SOC 2**: Control failure - document in audit report
- **ISO 27001**: Security incident documentation required
- **Internal Policies**: Report to security team/management

**Recommendation**: Consult with legal/compliance team regarding disclosure requirements.

---

## Verification Checklist

Before closing this incident:

- [ ] Admin password reset and verified
- [ ] Pilot password reset and verified
- [ ] Access logs reviewed for suspicious activity
- [ ] Dedicated test accounts created
- [ ] Test credentials added to .env.test.local (not committed)
- [ ] .gitignore updated and verified
- [ ] Pre-commit hooks installed
- [ ] Git secrets scanning configured
- [ ] Team notified of incident
- [ ] Compliance team notified (if required)
- [ ] All API keys rotated
- [ ] Security audit repeated to verify fixes

---

## Lessons Learned

### What Went Wrong
1. Production credentials used for testing
2. No pre-commit credential scanning
3. No separation between test and production accounts
4. Insufficient developer security training

### What Went Right
1. Early detection (security audit)
2. No evidence of exploitation (yet)
3. Rapid remediation response
4. Comprehensive documentation

### Process Improvements
1. Mandatory environment variables for all credentials
2. Dedicated test accounts (separate from production)
3. Automated credential scanning (pre-commit + CI/CD)
4. Regular security training for developers

---

## Timeline

| Date/Time | Event |
|-----------|-------|
| Unknown | Credentials committed to repository |
| Nov 4, 2025 | Credentials discovered during security audit |
| Nov 4, 2025 | Hardcoded credentials removed from code |
| Nov 4, 2025 | .gitignore updated |
| Nov 4, 2025 | Security templates created |
| Nov 4, 2025 | Incident report created |
| **PENDING** | **Admin password reset** |
| **PENDING** | **Pilot password reset** |
| **PENDING** | **Access log audit** |

---

## References

- Security Audit Report: `./security-audit-report-2025-11-04.md`
- Resend API Key Exposure: `./SECURITY-ALERT-ENV-LEAK.md`
- Git History Cleanup: (if needed) https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History

---

**Incident Status**: OPEN - Awaiting password resets
**Next Review**: After all checklist items completed
**Incident Owner**: Maurice Rondeau
**Incident Closed**: (Date TBD after verification)

---

## ACTION REQUIRED NOW

**🚨 STOP AND RESET PASSWORDS IMMEDIATELY 🚨**

1. Reset admin password: `skycruzer@icloud.com`
2. Reset pilot password: `mrondeau@airniugini.com.pg`
3. Review access logs for unauthorized access
4. Create dedicated test accounts

**DO NOT PROCEED WITH OTHER WORK UNTIL PASSWORDS ARE RESET**

This is a CRITICAL security incident requiring immediate action.
