-- Migration: Remove Travel Visa functionality
-- This removes all Travel Visa check types, related records, the pilot_visas table,
-- and the visa_type enum that are no longer used.

-- 1. Delete pilot_checks where check_type category = 'Travel Visa'
DELETE FROM pilot_checks
WHERE check_type_id IN (SELECT id FROM check_types WHERE category = 'Travel Visa');

-- 2. Delete check_types with category 'Travel Visa'
DELETE FROM check_types WHERE category = 'Travel Visa';

-- 3. Drop pilot_visas table if it exists
DROP TABLE IF EXISTS pilot_visas;

-- 4. Drop visa_type enum
DROP TYPE IF EXISTS visa_type;

-- 5. roster_period_capacity uses individual columns (not JSONB), no Travel Visa column exists — no action needed.
