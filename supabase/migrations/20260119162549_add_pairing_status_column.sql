-- Migration: Add pairing_status column to certification_renewal_plans (idempotent)
-- Developer: Maurice Rondeau
-- Date: January 2026
--
-- NOTE: This migration is now a no-op as the column and constraint already exist
-- from migration 20260119000001_add_pairing_status.sql
-- Keeping this file to maintain migration history consistency

-- Column already exists (added in previous migration)
-- ALTER TABLE certification_renewal_plans
-- ADD COLUMN IF NOT EXISTS pairing_status text DEFAULT 'not_applicable';

-- Constraint already exists (added in previous migration)
-- ALTER TABLE certification_renewal_plans
-- ADD CONSTRAINT certification_renewal_plans_pairing_status_check
-- CHECK (pairing_status IN ('paired', 'unpaired_solo', 'not_applicable'));

SELECT 'Migration 20260119162549: pairing_status column already exists, skipping.' AS status;
