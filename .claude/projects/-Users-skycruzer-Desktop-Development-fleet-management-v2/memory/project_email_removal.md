---
name: Certification email notifications removed
description: Commit 0cd3b2c7 removed sendCertificationExpiryAlert but left orphaned cron routes and API routes referencing it
type: project
---

Certification email notification features were intentionally removed in commit 0cd3b2c7 (2026-03-11). The `sendCertificationExpiryAlert` function was deleted from `pilot-email-service.ts`, and Supabase types were regenerated removing `reminder_days` and `email_notifications_enabled` columns from `check_types`.

Orphaned routes deleted in this session (2026-03-12):
- `app/api/cron/certification-expiry-alerts/route.ts`
- `app/api/cron/certification-expiry-alerts-test/route.ts`
- `app/api/check-types/[id]/reminders/route.ts`

**Why:** The email feature was removed but route cleanup was incomplete.

**How to apply:** If any other files reference `sendCertificationExpiryAlert`, `reminder_days`, or `email_notifications_enabled` on check_types, they should also be cleaned up.
