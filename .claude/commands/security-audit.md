# /security-audit

Perform comprehensive security audit and vulnerability assessment.

## When to Use

Use this command for:

- Pre-deployment security checks
- After implementing authentication/authorization
- When handling sensitive data
- Before production releases
- API security reviews
- Database security validation

## What It Does

Invokes the **security-sentinel** agent which:

- Scans for common security vulnerabilities
- Validates input handling and sanitization
- Reviews authentication/authorization implementations
- Checks for hardcoded secrets
- Ensures OWASP compliance
- Validates Supabase RLS policies
- Checks API endpoint security

## Usage

```bash
/security-audit
```

Optional: Target specific areas

```
"Run security audit on authentication endpoints"
"Security review of API routes"
"Check for SQL injection vulnerabilities"
```

## Example

Before deploying:

```
You: "Ready to deploy - please run security audit"
Assistant: "Running comprehensive security audit with /security-audit"
```

## Critical for This Project

- ✅ Supabase RLS policy validation
- ✅ API route authentication checks
- ✅ Environment variable security
- ✅ User input validation
- ✅ Session management security

---

**Agent**: security-sentinel
**Scope**: Comprehensive security review
**Project**: Fleet Management V2 (Supabase + Next.js)
