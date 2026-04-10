-- Add Unique Constraints and Monitoring View
-- Developer: Maurice Rondeau
-- Date: December 18, 2025
--
-- Note: Archive tables not needed - deprecated tables were already dropped
-- by migration 20251205120000_drop_deprecated_request_tables.sql

-- ================================================================
-- Unique Constraints on pilot_requests (prevents duplicates)
-- ================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_pilot_requests_leave_unique
ON pilot_requests (pilot_id, start_date, end_date)
WHERE request_category = 'LEAVE' AND workflow_status NOT IN ('WITHDRAWN', 'DENIED');

CREATE UNIQUE INDEX IF NOT EXISTS idx_pilot_requests_flight_unique
ON pilot_requests (pilot_id, flight_date, request_type)
WHERE request_category = 'FLIGHT' AND workflow_status NOT IN ('WITHDRAWN', 'DENIED');

-- ================================================================
-- Stale Data Monitoring View
-- ================================================================

CREATE OR REPLACE VIEW pilot_requests_stale_data AS
SELECT pr.id, pr.rank as stored_rank, p.role as current_rank,
       pr.employee_number as stored_employee_number, p.employee_id as current_employee_id
FROM pilot_requests pr
JOIN pilots p ON pr.pilot_id = p.id
WHERE pr.rank != p.role OR pr.employee_number != p.employee_id;

COMMENT ON VIEW pilot_requests_stale_data IS 'Shows pilot_requests records with denormalized data that differs from current pilot table values';
