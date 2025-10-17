---
status: in-progress
priority: p3
issue_id: "016"
tags: [code-quality, cleanup]
dependencies: [011]
---

# Console.log Cleanup

## Problem Statement
66 console.log/error calls scattered throughout codebase. Should use centralized logging.

## Findings
- **Severity**: 🟢 P3 (MEDIUM)
- **Agent**: pattern-recognition-specialist

## Proposed Solutions
Replace with centralized logging service (see #011).

**Effort**: Small (2-3 hours)

## Progress Update (2025-10-17)

### Completed (29% - 27/92 statements)
✅ **leave-service.ts** (12 statements)
  - All console.error → logError() with context
  - All console.log → logInfo()
  - Severity levels: HIGH for CRUD, CRITICAL for approvals

✅ **certification-service.ts** (15 statements)
  - All console.error → logError() with context
  - All console.log → logInfo()
  - Severity levels: HIGH/CRITICAL/MEDIUM based on operation

### In Progress (Imports added, replacements pending)
🔄 **pilot-service.ts** (16 statements)
🔄 **audit-service.ts** (26 statements - largest file)
🔄 **dashboard-service.ts** (4 statements)
🔄 **analytics-service.ts** (5 statements)
🔄 **expiring-certifications-service.ts** (6 statements)
🔄 **cache-service.ts** (5 statements)
🔄 **pdf-service.ts** (3 statements)

### Excluded (Intentional console usage)
ℹ️ **error-logger.ts** - Infrastructure logging (keep as-is)
ℹ️ **test files** - Test infrastructure (keep as-is)
ℹ️ **storybook files** - Demo code (keep as-is)
ℹ️ **utils/*-utils.ts** - JSDoc examples (keep as-is)

### Replacement Pattern Used
```typescript
// Before:
console.error('Error message', error)

// After:
logError(error as Error, {
  source: 'service-name:functionName',
  severity: ErrorSeverity.HIGH,
  metadata: { contextKey: value },
})
```

## Acceptance Criteria
- [x] Structured logging implemented in 2 major service files
- [x] Error context added (source, severity, metadata)
- [x] Import statements added to 7 remaining service files
- [ ] Complete remaining 7 service files (65 statements)
- [ ] Update env.ts (1 statement)
- [ ] Test all changes (npm run validate)
- [ ] No console calls in production code (excluding test/examples)

## Next Steps
1. Complete remaining service file replacements (~1.5 hours)
2. Run validation suite (type-check + lint + build)
3. Test in development environment
4. Update status to "done"

## Files Modified
### Completed:
- /Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/lib/services/leave-service.ts
- /Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/lib/services/certification-service.ts

### In Progress (Imports added):
- /Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/lib/services/pilot-service.ts
- /Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/lib/services/audit-service.ts
- /Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/lib/services/dashboard-service.ts
- /Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/lib/services/analytics-service.ts
- /Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/lib/services/expiring-certifications-service.ts
- /Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/lib/services/cache-service.ts
- /Users/skycruzer/Desktop/Fleet Office Management/fleet-management-v2/lib/services/pdf-service.ts

## Notes
- Source: Pattern Recognition Report
- Implementation: Using error-logger.ts from issue #011
- Severity Guidelines: CRITICAL (data loss), HIGH (CRUD), MEDIUM (analytics), LOW (warnings)
- Detailed Progress Report: `/tmp/console_cleanup_summary.md`
- Backup files created: `*.ts.bak` for modified files
