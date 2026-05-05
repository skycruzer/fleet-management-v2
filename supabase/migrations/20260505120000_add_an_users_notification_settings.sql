-- ============================================================================
-- Migration: Add notification_settings to an_users
-- Date: 2026-05-05
-- Purpose: Persist per-user notification preferences for the admin Settings
--          page. The Notification Settings dialog has shipped for months
--          referencing an `an_users.notification_settings` column that never
--          actually existed — every Save raised PostgREST 42703 and the
--          dialog displayed a "Failed to update settings" toast. Surfaced by
--          the May 2026 audit batch when the dialog was moved behind a
--          CSRF-protected API route that propagates server errors instead of
--          swallowing them.
--
-- Shape:   JSONB column, NULL-allowed, defaulted to an empty object so old
--          rows don't need a backfill. Application code reads with `??`
--          fallbacks to its hardcoded defaults, so an empty/null value is
--          safe.
-- ============================================================================

BEGIN;

ALTER TABLE public.an_users
  ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.an_users.notification_settings IS
  'Per-user notification preferences (email/push/sms/cert reminders/leave updates). Updated via PATCH /api/user/notification-settings.';

COMMIT;
