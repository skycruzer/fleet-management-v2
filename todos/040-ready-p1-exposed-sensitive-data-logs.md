---
status: completed
priority: p1
issue_id: '040'
tags: [security, logging, pii, sensitive-data]
dependencies: []
---

# Remove Sensitive Data from Console Logs

## Problem Statement

Service functions and Server Actions log sensitive user data (PII, reasons for leave, medical information) to console.error(), which is captured in production logs. This exposes private information in log aggregation systems.

## Findings

- **Severity**: 🔴 P1 (CRITICAL)
- **Impact**: Privacy violation, GDPR non-compliance, sensitive data exposure
- **Agent**: security-sentinel

**Exposed Data:**

```typescript
// ❌ Logs entire error with user data
console.error('Error submitting leave request:', error)
// Exposes: pilot_user_id, reason ("medical emergency"), dates

// ❌ Logs form data
console.error('Validation failed:', formData)
// Exposes: all form fields including sensitive reasons
```

## Proposed Solution

```typescript
// ✅ Log error type only, no PII
console.error('Error submitting leave request:', {
  errorType: error.name,
  errorCode: error.code,
  // Never log: user IDs, reasons, personal data
})
```

## Acceptance Criteria

- [x] Remove all console.log() with sensitive data
- [x] Use structured logging without PII
- [x] Audit all error handlers

## Work Log

### 2025-10-19 - Initial Discovery

**By:** security-sentinel
**Learnings:** Console logs expose sensitive user data

### 2025-10-19 - Resolution Complete

**By:** Claude Code
**Changes Made:**

- Sanitized all console.error() calls in `pilot-portal-service.ts` (24 locations)
- Sanitized error logging in all portal action files (3 files)
- Sanitized error logging in `admin-service.ts` (4 locations)
- Replaced full error object logging with structured logging containing only:
  - `errorType` or `errorCode`
  - `errorMessage`
- Removed exposure of:
  - User IDs (pilot_user_id, pilot_id, employee_id)
  - Leave request reasons (may contain medical information)
  - Flight request descriptions and reasons
  - Feedback post content
  - Form data
  - Personal identifiable information (PII)

**Impact:**

- All sensitive data removed from production logs
- GDPR compliance improved (Article 32 - Security of processing)
- Maintains debugging capability with error types and messages
- No functional changes to application behavior

## Notes

**Source**: Security Review Finding #6
**GDPR**: Article 32 - Security of processing
