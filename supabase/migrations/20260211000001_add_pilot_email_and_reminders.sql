-- Migration: Add pilot email and certification reminder configuration
-- Author: Maurice Rondeau
-- Date: 2026-02-11
-- Description: Adds email field to pilots table, per-check-type reminder settings,
--   certification email notification log for dedup, and updates the
--   get_expiring_certifications_with_email function.

-- ============================================
-- 1. Add email column to pilots table
-- ============================================
ALTER TABLE "public"."pilots" ADD COLUMN "email" TEXT;
CREATE INDEX idx_pilots_email ON "public"."pilots"("email");
COMMENT ON COLUMN "public"."pilots"."email" IS 'Direct email for notifications. Falls back to pilot_users.email if null.';

-- ============================================
-- 2. Add reminder configuration to check_types
-- ============================================
ALTER TABLE "public"."check_types" ADD COLUMN "reminder_days" INTEGER[] DEFAULT '{90,60,30,14,7}';
ALTER TABLE "public"."check_types" ADD COLUMN "email_notifications_enabled" BOOLEAN DEFAULT true;
COMMENT ON COLUMN "public"."check_types"."reminder_days" IS 'Array of days-before-expiry to send email reminders, e.g. {90,60,30,14,7}';
COMMENT ON COLUMN "public"."check_types"."email_notifications_enabled" IS 'Whether email notifications are enabled for this check type';

-- ============================================
-- 3. Create certification email notification log
-- ============================================
CREATE TABLE "public"."certification_email_log" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "pilot_id" UUID NOT NULL REFERENCES "public"."pilots"("id") ON DELETE CASCADE,
  "pilot_check_id" UUID NOT NULL REFERENCES "public"."pilot_checks"("id") ON DELETE CASCADE,
  "check_type_id" UUID NOT NULL REFERENCES "public"."check_types"("id") ON DELETE CASCADE,
  "notification_level" "public"."notification_level" NOT NULL,
  "notification_status" "public"."notification_status" NOT NULL DEFAULT 'SENT',
  "email_address" TEXT NOT NULL,
  "sent_at" TIMESTAMPTZ DEFAULT NOW(),
  "error_message" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cert_email_log_pilot ON "public"."certification_email_log"("pilot_id");
CREATE INDEX idx_cert_email_log_dedup ON "public"."certification_email_log"("pilot_check_id", "notification_level");
CREATE INDEX idx_cert_email_log_sent_at ON "public"."certification_email_log"("sent_at");

COMMENT ON TABLE "public"."certification_email_log" IS 'Tracks sent certification expiry email notifications for deduplication and audit';

-- Enable RLS
ALTER TABLE "public"."certification_email_log" ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (cron job uses admin/service-role client)
CREATE POLICY "service_role_full_access" ON "public"."certification_email_log"
  FOR ALL USING (true) WITH CHECK (true);

-- Allow authenticated users to read (admin dashboard)
CREATE POLICY "authenticated_read" ON "public"."certification_email_log"
  FOR SELECT TO authenticated USING (true);

-- ============================================
-- 4. Add certification notification types to enum
-- ============================================
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'certification_expiring';
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'certification_expired';

-- ============================================
-- 5. Update get_expiring_certifications_with_email function
--    Now uses COALESCE(p.email, pu.email) and includes reminder config
-- ============================================
CREATE OR REPLACE FUNCTION "public"."get_expiring_certifications_with_email"(
  "days_threshold" integer DEFAULT 90
)
RETURNS TABLE(
  "pilot_id" "uuid",
  "check_type_id" "uuid",
  "pilot_check_id" "uuid",
  "expiry_date" "date",
  "days_until_expiry" integer,
  "first_name" "text",
  "last_name" "text",
  "rank" "text",
  "employee_id" "text",
  "email" "text",
  "check_code" "text",
  "check_description" "text",
  "check_category" "text",
  "reminder_days" integer[],
  "email_notifications_enabled" boolean
)
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.pilot_id,
    pc.check_type_id,
    pc.id as pilot_check_id,
    pc.expiry_date,
    (pc.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry,
    p.first_name::TEXT,
    p.last_name::TEXT,
    p.role::TEXT as rank,
    p.employee_id::TEXT,
    COALESCE(p.email, pu.email)::TEXT as email,
    ct.check_code::TEXT,
    ct.check_description::TEXT,
    ct.category::TEXT as check_category,
    ct.reminder_days,
    ct.email_notifications_enabled
  FROM pilot_checks pc
  JOIN pilots p ON pc.pilot_id = p.id
  LEFT JOIN pilot_users pu ON p.employee_id = pu.employee_id
  JOIN check_types ct ON pc.check_type_id = ct.id
  WHERE (pc.expiry_date - CURRENT_DATE) <= days_threshold
    AND COALESCE(p.email, pu.email) IS NOT NULL
    AND ct.email_notifications_enabled = true
    AND p.is_active = true
  ORDER BY days_until_expiry ASC;
END;
$$;
