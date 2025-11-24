-- Migration: Extend pilot_requests to Support RDO/SDO Requests
-- Author: Maurice Rondeau (Sprint 1.4 - Nov 2025)
-- Description: Extend unified pilot_requests table to handle RDO/SDO requests
-- Part of unified table architecture (replaces separate rdo_sdo_requests table)
--
-- ARCHITECTURE DECISION:
-- ======================
-- Per Sprint 1.1 unified table architecture, ALL request types use pilot_requests table.
-- This migration adds RDO/SDO support to the unified table instead of creating a separate table.
--
-- Request Categories (request_category):
--   - LEAVE: Annual leave, sick leave, LSL, etc.
--   - FLIGHT: Flight requests
--   - RDO: Rostered Day Off requests (NEW)
--   - SDO: Scheduled Day Off requests (NEW)
--   - LEAVE_BID: Annual leave bidding (separate purpose)

-- ============================================
-- 1. Extend request_category to include RDO/SDO
-- ============================================

-- Drop old constraint
ALTER TABLE pilot_requests
DROP CONSTRAINT IF EXISTS pilot_requests_request_category_check;

-- Add new constraint with RDO/SDO
ALTER TABLE pilot_requests
ADD CONSTRAINT pilot_requests_request_category_check
CHECK (request_category IN ('LEAVE', 'FLIGHT', 'RDO', 'SDO', 'LEAVE_BID'));

-- ============================================
-- 2. Add helpful comments
-- ============================================

COMMENT ON COLUMN pilot_requests.request_category IS
'Request category: LEAVE (leave requests), FLIGHT (flight requests), RDO (rostered day off), SDO (scheduled day off), LEAVE_BID (annual leave bidding)';

-- ============================================
-- 3. Create convenience views for RDO/SDO
-- ============================================

-- Active RDO/SDO requests view (mirrors active_leave_requests pattern)
CREATE OR REPLACE VIEW active_rdo_sdo_requests AS
SELECT
  id,
  pilot_id,
  pilot_user_id,
  employee_number,
  rank,
  name,
  request_category,
  request_type,
  submission_channel,
  submission_date,
  start_date,
  end_date,
  days_count,
  roster_period,
  roster_period_start_date,
  roster_publish_date,
  roster_deadline_date,
  workflow_status,
  reviewed_by,
  reviewed_at,
  review_comments,
  is_late_request,
  is_past_deadline,
  priority_score,
  reason,
  notes,
  created_at,
  updated_at
FROM pilot_requests
WHERE request_category IN ('RDO', 'SDO')
  AND workflow_status NOT IN ('DENIED', 'WITHDRAWN');

COMMENT ON VIEW active_rdo_sdo_requests IS
'Active RDO/SDO requests from unified pilot_requests table. Filters for request_category IN (RDO, SDO) and excludes denied/withdrawn requests.';

-- ============================================
-- 4. Migration notes
-- ============================================

-- NOTE: This migration extends the unified table architecture from Sprint 1.1.
-- Services using rdo_sdo_requests table should be migrated to use pilot_requests
-- with request_category IN ('RDO', 'SDO') filter.
--
-- Migration Pattern:
-- FROM: supabase.from('rdo_sdo_requests').select('*')
-- TO:   supabase.from('pilot_requests').select('*').in('request_category', ['RDO', 'SDO'])
--
-- The separate rdo_sdo_requests migration (20250119120000) should NOT be deployed.
