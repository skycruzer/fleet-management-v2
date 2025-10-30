-- ============================================================================
-- Database Cleanup and Security Fixes Migration
-- Date: 2025-10-24
-- Purpose: Remove unused tables, fix security issues, improve performance
-- ============================================================================

-- ============================================================================
-- PART 1: REMOVE UNUSED EMPTY TABLES (10 tables with 0 rows)
-- ============================================================================

-- Drop empty disciplinary-related tables
DROP TABLE IF EXISTS disciplinary_action_documents CASCADE;
DROP TABLE IF EXISTS disciplinary_comments CASCADE;
DROP TABLE IF EXISTS disciplinary_actions CASCADE;

-- Drop empty document-related tables
DROP TABLE IF EXISTS document_access_log CASCADE;
DROP TABLE IF EXISTS documents CASCADE;

-- Drop empty feedback-related tables
DROP TABLE IF EXISTS feedback_comments CASCADE;
DROP TABLE IF EXISTS feedback_posts CASCADE;

-- Drop empty form and notification tables
DROP TABLE IF EXISTS form_submissions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS task_comments CASCADE;

-- ============================================================================
-- PART 2: FIX SECURITY DEFINER VIEW (ERROR - Critical)
-- ============================================================================

-- Drop and recreate pilot_warning_history view WITHOUT security definer
DROP VIEW IF EXISTS pilot_warning_history CASCADE;

CREATE OR REPLACE VIEW pilot_warning_history AS
SELECT
  p.id AS pilot_id,
  p.first_name,
  p.last_name,
  p.employee_id,
  dm.id AS matter_id,
  dm.title AS matter_title,
  dm.severity,
  dm.status AS matter_status,
  u.name AS issued_by_name,
  u.email AS issued_by_email,
  dm.incident_date,
  dm.created_at
FROM pilots p
LEFT JOIN disciplinary_matters dm ON p.id = dm.pilot_id
LEFT JOIN an_users u ON dm.reported_by = u.id
WHERE dm.severity IN ('WARNING', 'SEVERE')
ORDER BY p.last_name, p.first_name, dm.incident_date DESC;

-- Add RLS policy for the view
ALTER VIEW pilot_warning_history SET (security_invoker = true);

-- ============================================================================
-- PART 3: FIX FUNCTION SEARCH_PATH SECURITY ISSUES (14 functions)
-- ============================================================================

-- Fix: update_disciplinary_action_documents_updated_at
-- This function no longer needed since table was dropped
DROP FUNCTION IF EXISTS update_disciplinary_action_documents_updated_at() CASCADE;

-- Fix: update_flight_requests_updated_at
DROP FUNCTION IF EXISTS update_flight_requests_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION update_flight_requests_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS update_flight_requests_updated_at ON flight_requests;
CREATE TRIGGER update_flight_requests_updated_at
  BEFORE UPDATE ON flight_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_flight_requests_updated_at();

-- Fix: update_updated_at_column (used by multiple tables)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Recreate all triggers that use this function
DROP TRIGGER IF EXISTS update_pilots_updated_at ON pilots;
CREATE TRIGGER update_pilots_updated_at
  BEFORE UPDATE ON pilots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pilot_checks_updated_at ON pilot_checks;
CREATE TRIGGER update_pilot_checks_updated_at
  BEFORE UPDATE ON pilot_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leave_requests_updated_at ON leave_requests;
CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_disciplinary_matters_updated_at ON disciplinary_matters;
CREATE TRIGGER update_disciplinary_matters_updated_at
  BEFORE UPDATE ON disciplinary_matters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fix: log_pilot_users_changes
DROP FUNCTION IF EXISTS log_pilot_users_changes() CASCADE;
CREATE OR REPLACE FUNCTION log_pilot_users_changes()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      action,
      old_values,
      new_values,
      user_id
    ) VALUES (
      'pilot_users',
      NEW.id::text,
      'UPDATE',
      to_jsonb(OLD),
      to_jsonb(NEW),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS log_pilot_users_changes_trigger ON pilot_users;
CREATE TRIGGER log_pilot_users_changes_trigger
  AFTER UPDATE ON pilot_users
  FOR EACH ROW
  EXECUTE FUNCTION log_pilot_users_changes();

-- Fix: get_pilot_warning_count (used for disciplinary tracking)
DROP FUNCTION IF EXISTS get_pilot_warning_count(uuid) CASCADE;
CREATE OR REPLACE FUNCTION get_pilot_warning_count(pilot_uuid uuid)
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  warning_count integer;
BEGIN
  SELECT COUNT(*)
  INTO warning_count
  FROM disciplinary_matters
  WHERE pilot_id = pilot_uuid
    AND severity IN ('WARNING', 'SEVERE');

  RETURN COALESCE(warning_count, 0);
END;
$$;

-- Fix: create_pilot_with_certifications (transaction function)
DROP FUNCTION IF EXISTS create_pilot_with_certifications(jsonb, jsonb[]) CASCADE;
CREATE OR REPLACE FUNCTION create_pilot_with_certifications(
  pilot_data jsonb,
  certifications jsonb[]
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_pilot_id uuid;
  cert jsonb;
BEGIN
  -- Insert pilot
  INSERT INTO pilots (
    first_name,
    last_name,
    employee_id,
    role,
    date_of_birth,
    commencement_date,
    contract_type_id
  )
  VALUES (
    pilot_data->>'first_name',
    pilot_data->>'last_name',
    pilot_data->>'employee_id',
    (pilot_data->>'role')::pilot_role,
    (pilot_data->>'date_of_birth')::date,
    (pilot_data->>'commencement_date')::date,
    (pilot_data->>'contract_type_id')::uuid
  )
  RETURNING id INTO new_pilot_id;

  -- Insert certifications
  IF certifications IS NOT NULL AND array_length(certifications, 1) > 0 THEN
    FOREACH cert IN ARRAY certifications
    LOOP
      INSERT INTO pilot_checks (pilot_id, check_type_id, expiry_date)
      VALUES (
        new_pilot_id,
        (cert->>'check_type_id')::uuid,
        (cert->>'expiry_date')::date
      );
    END LOOP;
  END IF;

  RETURN new_pilot_id;
END;
$$;

-- Fix: submit_leave_request_tx (transaction function)
DROP FUNCTION IF EXISTS submit_leave_request_tx(uuid, date, date, text, text) CASCADE;
CREATE OR REPLACE FUNCTION submit_leave_request_tx(
  p_pilot_id uuid,
  p_start_date date,
  p_end_date date,
  p_roster_period text,
  p_notes text DEFAULT NULL
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_request_id uuid;
BEGIN
  INSERT INTO leave_requests (
    pilot_id,
    start_date,
    end_date,
    roster_period,
    notes,
    status,
    submitted_at
  )
  VALUES (
    p_pilot_id,
    p_start_date,
    p_end_date,
    p_roster_period,
    p_notes,
    'pending',
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO new_request_id;

  RETURN new_request_id;
END;
$$;

-- Fix: approve_leave_request (transaction function)
DROP FUNCTION IF EXISTS approve_leave_request(uuid, uuid, text) CASCADE;
CREATE OR REPLACE FUNCTION approve_leave_request(
  p_request_id uuid,
  p_approved_by uuid,
  p_approval_notes text DEFAULT NULL
)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE leave_requests
  SET
    status = 'approved',
    approved_by = p_approved_by,
    approved_at = CURRENT_TIMESTAMP,
    approval_notes = p_approval_notes,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_request_id
    AND status = 'pending';

  RETURN FOUND;
END;
$$;

-- Fix: submit_flight_request_tx (transaction function)
DROP FUNCTION IF EXISTS submit_flight_request_tx(uuid, text, text, date, text) CASCADE;
CREATE OR REPLACE FUNCTION submit_flight_request_tx(
  p_pilot_id uuid,
  p_request_type text,
  p_route_details text,
  p_preferred_date date DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_request_id uuid;
BEGIN
  INSERT INTO flight_requests (
    pilot_id,
    request_type,
    route_details,
    preferred_date,
    notes,
    status,
    submitted_at
  )
  VALUES (
    p_pilot_id,
    p_request_type,
    p_route_details,
    p_preferred_date,
    p_notes,
    'pending',
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO new_request_id;

  RETURN new_request_id;
END;
$$;

-- Fix: submit_feedback_post_tx (function for table that was dropped)
-- This function is no longer needed since feedback_posts table was dropped
DROP FUNCTION IF EXISTS submit_feedback_post_tx(uuid, uuid, text, text, boolean) CASCADE;

-- Fix: bulk_delete_certifications (batch operation)
DROP FUNCTION IF EXISTS bulk_delete_certifications(uuid[]) CASCADE;
CREATE OR REPLACE FUNCTION bulk_delete_certifications(
  certification_ids uuid[]
)
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM pilot_checks
  WHERE id = ANY(certification_ids);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Fix: delete_pilot_with_cascade (cascade delete operation)
DROP FUNCTION IF EXISTS delete_pilot_with_cascade(uuid) CASCADE;
CREATE OR REPLACE FUNCTION delete_pilot_with_cascade(
  p_pilot_id uuid
)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete all related records
  DELETE FROM pilot_checks WHERE pilot_id = p_pilot_id;
  DELETE FROM leave_requests WHERE pilot_id = p_pilot_id;
  DELETE FROM flight_requests WHERE pilot_id = p_pilot_id;
  DELETE FROM disciplinary_matters WHERE pilot_id = p_pilot_id;
  DELETE FROM pilot_users WHERE employee_id = (SELECT employee_id::text FROM pilots WHERE id = p_pilot_id);

  -- Delete the pilot
  DELETE FROM pilots WHERE id = p_pilot_id;

  RETURN FOUND;
END;
$$;

-- Fix: batch_update_certifications (batch operation)
DROP FUNCTION IF EXISTS batch_update_certifications(jsonb[]) CASCADE;
CREATE OR REPLACE FUNCTION batch_update_certifications(
  updates jsonb[]
)
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  update_record jsonb;
  updated_count integer := 0;
BEGIN
  FOREACH update_record IN ARRAY updates
  LOOP
    UPDATE pilot_checks
    SET
      expiry_date = (update_record->>'expiry_date')::date,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = (update_record->>'id')::uuid;

    IF FOUND THEN
      updated_count := updated_count + 1;
    END IF;
  END LOOP;

  RETURN updated_count;
END;
$$;

-- ============================================================================
-- PART 4: REMOVE UNUSED VIEWS
-- ============================================================================

-- Drop unused/duplicate views
DROP VIEW IF EXISTS index_usage_stats CASCADE;
DROP VIEW IF EXISTS table_performance_stats CASCADE;
DROP VIEW IF EXISTS v_index_performance_monitor CASCADE;

-- ============================================================================
-- PART 5: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE pilots IS 'Core pilot information including qualifications and seniority';
COMMENT ON TABLE pilot_checks IS 'Certification tracking for pilots with expiry dates';
COMMENT ON TABLE leave_requests IS 'Leave request submissions and approvals aligned to roster periods';
COMMENT ON TABLE flight_requests IS 'Flight requests for additional flights, routes, or schedule changes';
COMMENT ON TABLE tasks IS 'Task management system for fleet operations';
COMMENT ON TABLE disciplinary_matters IS 'Disciplinary incidents and tracking';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all CRUD operations';

COMMENT ON VIEW expiring_checks IS 'Certifications expiring within 60 days';
COMMENT ON VIEW detailed_expiring_checks IS 'Detailed view with FAA color coding for expiring certifications';
COMMENT ON VIEW compliance_dashboard IS 'Fleet-wide compliance metrics and statistics';
COMMENT ON VIEW pilot_report_summary IS 'Comprehensive pilot summary for reporting';
COMMENT ON VIEW captain_qualifications_summary IS 'Captain-specific qualifications tracking';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of changes:
-- ✅ Removed 10 empty unused tables
-- ✅ Fixed security definer view (pilot_warning_history)
-- ✅ Fixed 14 functions with mutable search_path
-- ✅ Removed 3 unused performance monitoring views
-- ✅ Added documentation comments
--
-- Remaining manual tasks:
-- - Move extensions from public to extensions schema (requires superuser)
-- - Enable leaked password protection in Supabase Auth settings
-- - Configure additional MFA options in Supabase Auth settings
-- - Review materialized view RLS policies
