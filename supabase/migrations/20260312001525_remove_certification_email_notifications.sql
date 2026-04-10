-- Remove certification email notification database objects
-- Part of: remove certification email notification features
-- Preserves: pilots.email column, notification_type enum values

-- 1. Drop the RPC function (references columns being dropped)
DROP FUNCTION IF EXISTS public.get_expiring_certifications_with_email(integer);

-- 2. Drop the email log table (RLS policies drop automatically)
DROP TABLE IF EXISTS public.certification_email_log;

-- 3. Drop email-specific columns from check_types
ALTER TABLE public.check_types
  DROP COLUMN IF EXISTS reminder_days,
  DROP COLUMN IF EXISTS email_notifications_enabled;

-- 4. Drop orphaned enums (only used by certification_email_log)
DROP TYPE IF EXISTS public.notification_level CASCADE;
DROP TYPE IF EXISTS public.notification_status CASCADE;
