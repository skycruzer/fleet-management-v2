-- Migration: Create pilot_user_mappings view
-- Purpose: Eliminate N+1 query pattern by joining pilot_users and pilots tables
-- Date: 2025-10-19

-- Create database view for efficient pilot_user to pilot lookups
CREATE OR REPLACE VIEW pilot_user_mappings AS
SELECT
  pu.id as pilot_user_id,
  pu.employee_id,
  pu.email,
  pu.first_name,
  pu.last_name,
  pu.rank,
  pu.seniority_number,
  pu.registration_approved,
  pu.last_login_at,
  pu.created_at as pilot_user_created_at,
  p.id as pilot_id,
  p.created_at as pilot_created_at
FROM pilot_users pu
LEFT JOIN pilots p ON p.employee_id = pu.employee_id;

-- Add comment explaining the view's purpose
COMMENT ON VIEW pilot_user_mappings IS 'Efficient mapping between pilot_users and pilots tables to eliminate N+1 queries. Use this view instead of sequential queries to pilot_users then pilots.';

-- Grant appropriate permissions
GRANT SELECT ON pilot_user_mappings TO authenticated;
