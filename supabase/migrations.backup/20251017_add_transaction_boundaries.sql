-- Migration: Add Transaction Boundaries for Multi-Step Operations
-- Created: 2025-10-17
-- Purpose: Implement PostgreSQL functions for atomic operations to prevent data corruption
-- Related Todo: 004-ready-p1-add-transaction-boundaries.md

-- ===================================
-- FUNCTION 1: Delete Pilot with Cascading (Atomic)
-- ===================================
-- This function ensures that when a pilot is deleted, all related records
-- are removed atomically. If any step fails, the entire operation rolls back.

-- Drop existing function if it exists (to allow return type changes)
DROP FUNCTION IF EXISTS delete_pilot_with_cascade(uuid);

CREATE OR REPLACE FUNCTION delete_pilot_with_cascade(
  p_pilot_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_deleted_leave_count int;
  v_deleted_cert_count int;
  v_pilot_info jsonb;
  v_result jsonb;
BEGIN
  -- Capture pilot info before deletion for audit trail
  SELECT jsonb_build_object(
    'id', id,
    'employee_id', employee_id,
    'first_name', first_name,
    'last_name', last_name,
    'role', role
  ) INTO v_pilot_info
  FROM pilots
  WHERE id = p_pilot_id;

  IF v_pilot_info IS NULL THEN
    RAISE EXCEPTION 'Pilot with id % not found', p_pilot_id;
  END IF;

  -- Step 1: Delete all leave requests for this pilot
  DELETE FROM leave_requests
  WHERE pilot_id = p_pilot_id;
  GET DIAGNOSTICS v_deleted_leave_count = ROW_COUNT;

  -- Step 2: Delete all certifications for this pilot
  DELETE FROM pilot_checks
  WHERE pilot_id = p_pilot_id;
  GET DIAGNOSTICS v_deleted_cert_count = ROW_COUNT;

  -- Step 3: Delete the pilot record
  DELETE FROM pilots
  WHERE id = p_pilot_id;

  -- Return summary of deletion
  SELECT jsonb_build_object(
    'success', true,
    'pilot', v_pilot_info,
    'deleted_leave_requests', v_deleted_leave_count,
    'deleted_certifications', v_deleted_cert_count,
    'message', format('Successfully deleted pilot %s %s and %s related records',
                     v_pilot_info->>'first_name',
                     v_pilot_info->>'last_name',
                     v_deleted_leave_count + v_deleted_cert_count)
  ) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Failed to delete pilot: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- FUNCTION 2: Batch Update Certifications (Atomic)
-- ===================================
-- This function updates multiple certifications atomically.
-- All updates succeed together or all fail together.

-- Drop existing function if it exists (to allow return type changes)
DROP FUNCTION IF EXISTS batch_update_certifications(jsonb[]);

CREATE OR REPLACE FUNCTION batch_update_certifications(
  p_updates jsonb[]
) RETURNS jsonb AS $$
DECLARE
  v_update jsonb;
  v_updated_count int := 0;
  v_failed_count int := 0;
  v_cert_id uuid;
  v_result jsonb;
BEGIN
  -- Process each update
  FOREACH v_update IN ARRAY p_updates
  LOOP
    BEGIN
      v_cert_id := (v_update->>'id')::uuid;

      -- Perform update with only non-null fields
      UPDATE pilot_checks
      SET
        completion_date = COALESCE((v_update->>'completion_date')::date, completion_date),
        expiry_date = COALESCE((v_update->>'expiry_date')::date, expiry_date),
        expiry_roster_period = COALESCE(v_update->>'expiry_roster_period', expiry_roster_period),
        notes = COALESCE(v_update->>'notes', notes),
        updated_at = now()
      WHERE id = v_cert_id;

      IF FOUND THEN
        v_updated_count := v_updated_count + 1;
      ELSE
        v_failed_count := v_failed_count + 1;
        RAISE WARNING 'Certification % not found', v_cert_id;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- If any single update fails, rollback all
        RAISE EXCEPTION 'Failed to update certification %: %', v_cert_id, SQLERRM;
    END;
  END LOOP;

  -- Return summary
  SELECT jsonb_build_object(
    'success', true,
    'updated_count', v_updated_count,
    'failed_count', v_failed_count,
    'total_requested', array_length(p_updates, 1),
    'message', format('Successfully updated %s certifications', v_updated_count)
  ) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Batch update failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- FUNCTION 3: Approve Leave Request with Audit Log (Atomic)
-- ===================================
-- This function approves/denies a leave request and creates an audit log entry
-- atomically. Both operations succeed together or fail together.

-- Drop existing function if it exists (to allow return type changes)
DROP FUNCTION IF EXISTS approve_leave_request(uuid, uuid, text, text);

CREATE OR REPLACE FUNCTION approve_leave_request(
  p_request_id uuid,
  p_reviewer_id uuid,
  p_status text, -- 'APPROVED' or 'DENIED'
  p_comments text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_request_info jsonb;
  v_result jsonb;
BEGIN
  -- Validate status
  IF p_status NOT IN ('APPROVED', 'DENIED') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be APPROVED or DENIED', p_status;
  END IF;

  -- Capture request info before update
  SELECT jsonb_build_object(
    'id', lr.id,
    'pilot_id', lr.pilot_id,
    'request_type', lr.request_type,
    'start_date', lr.start_date,
    'end_date', lr.end_date,
    'days_count', lr.days_count,
    'old_status', lr.status,
    'pilot_name', p.first_name || ' ' || p.last_name,
    'employee_id', p.employee_id
  ) INTO v_request_info
  FROM leave_requests lr
  JOIN pilots p ON p.id = lr.pilot_id
  WHERE lr.id = p_request_id;

  IF v_request_info IS NULL THEN
    RAISE EXCEPTION 'Leave request with id % not found', p_request_id;
  END IF;

  -- Check if already reviewed
  IF (v_request_info->>'old_status') != 'PENDING' THEN
    RAISE EXCEPTION 'Leave request % has already been reviewed (status: %)',
                    p_request_id,
                    v_request_info->>'old_status';
  END IF;

  -- Step 1: Update leave request status
  UPDATE leave_requests
  SET
    status = p_status,
    reviewed_by = p_reviewer_id,
    reviewed_at = now(),
    review_comments = p_comments,
    updated_at = now()
  WHERE id = p_request_id;

  -- Step 2: Create audit log entry
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    user_id,
    created_at
  ) VALUES (
    'leave_requests',
    p_request_id,
    'UPDATE',
    jsonb_build_object('status', v_request_info->>'old_status'),
    jsonb_build_object(
      'status', p_status,
      'reviewed_by', p_reviewer_id,
      'reviewed_at', now(),
      'review_comments', p_comments
    ),
    p_reviewer_id,
    now()
  );

  -- Return summary
  SELECT jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'pilot_name', v_request_info->>'pilot_name',
    'employee_id', v_request_info->>'employee_id',
    'request_type', v_request_info->>'request_type',
    'old_status', v_request_info->>'old_status',
    'new_status', p_status,
    'reviewed_at', now(),
    'message', format('Leave request %s for %s (%s days)',
                     lower(p_status),
                     v_request_info->>'pilot_name',
                     v_request_info->>'days_count')
  ) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Failed to approve leave request: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- FUNCTION 4: Create Pilot with Initial Certifications (Atomic)
-- ===================================
-- This function creates a pilot and their initial certifications atomically.
-- Both pilot and all certifications are created together or none at all.
-- Drop existing function if it exists (to allow return type changes)
DROP FUNCTION IF EXISTS create_pilot_with_certifications(jsonb, jsonb[]);


CREATE OR REPLACE FUNCTION create_pilot_with_certifications(
  p_pilot_data jsonb,
  p_certifications jsonb[] DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_pilot_id uuid;
  v_seniority_number int;
  v_cert jsonb;
  v_cert_count int := 0;
  v_pilot_info jsonb;
  v_result jsonb;
BEGIN
  -- Calculate seniority number
  SELECT COUNT(*) + 1 INTO v_seniority_number
  FROM pilots
  WHERE commencement_date IS NOT NULL
    AND commencement_date < (p_pilot_data->>'commencement_date')::timestamptz;

  -- Step 1: Insert pilot
  INSERT INTO pilots (
    employee_id,
    first_name,
    middle_name,
    last_name,
    role,
    contract_type,
    nationality,
    passport_number,
    passport_expiry,
    date_of_birth,
    commencement_date,
    seniority_number,
    is_active
  ) VALUES (
    p_pilot_data->>'employee_id',
    p_pilot_data->>'first_name',
    p_pilot_data->>'middle_name',
    p_pilot_data->>'last_name',
    p_pilot_data->>'role',
    p_pilot_data->>'contract_type',
    p_pilot_data->>'nationality',
    p_pilot_data->>'passport_number',
    (p_pilot_data->>'passport_expiry')::date,
    (p_pilot_data->>'date_of_birth')::date,
    (p_pilot_data->>'commencement_date')::timestamptz,
    v_seniority_number,
    COALESCE((p_pilot_data->>'is_active')::boolean, true)
  )
  RETURNING id, employee_id, first_name, last_name, role, seniority_number
  INTO v_pilot_id, v_pilot_info;

  -- Step 2: Insert certifications if provided
  IF p_certifications IS NOT NULL THEN
    FOREACH v_cert IN ARRAY p_certifications
    LOOP
      INSERT INTO pilot_checks (
        pilot_id,
        check_type_id,
        completion_date,
        expiry_date,
        expiry_roster_period,
        notes
      ) VALUES (
        v_pilot_id,
        (v_cert->>'check_type_id')::uuid,
        (v_cert->>'completion_date')::date,
        (v_cert->>'expiry_date')::date,
        v_cert->>'expiry_roster_period',
        v_cert->>'notes'
      );
      v_cert_count := v_cert_count + 1;
    END LOOP;
  END IF;

  -- Return complete pilot info with certifications
  SELECT jsonb_build_object(
    'success', true,
    'pilot', (
      SELECT row_to_json(p.*)
      FROM pilots p
      WHERE p.id = v_pilot_id
    ),
    'certifications', (
      SELECT jsonb_agg(row_to_json(pc.*))
      FROM pilot_checks pc
      WHERE pc.pilot_id = v_pilot_id
    ),
    'certification_count', v_cert_count,
    'message', format('Successfully created pilot %s with %s certifications',
                     p_pilot_data->>'first_name' || ' ' || p_pilot_data->>'last_name',
                     v_cert_count)
  ) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Failed to create pilot with certifications: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- FUNCTION 5: Bulk Certification Delete (Atomic)
-- ===================================
-- This function deletes multiple certifications atomically.
-- Useful for removing all expired certifications or cleanup operations.
-- Drop existing function if it exists (to allow return type changes)
DROP FUNCTION IF EXISTS bulk_delete_certifications(uuid[]);


CREATE OR REPLACE FUNCTION bulk_delete_certifications(
  p_certification_ids uuid[]
) RETURNS jsonb AS $$
DECLARE
  v_deleted_count int := 0;
  v_result jsonb;
BEGIN
  -- Delete all certifications in one operation
  DELETE FROM pilot_checks
  WHERE id = ANY(p_certification_ids);

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Return summary
  SELECT jsonb_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'requested_count', array_length(p_certification_ids, 1),
    'message', format('Successfully deleted %s certifications', v_deleted_count)
  ) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Bulk delete failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- GRANT PERMISSIONS
-- ===================================
-- Grant execute permissions to authenticated users

GRANT EXECUTE ON FUNCTION delete_pilot_with_cascade(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION batch_update_certifications(jsonb[]) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_leave_request(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_pilot_with_certifications(jsonb, jsonb[]) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_delete_certifications(uuid[]) TO authenticated;

-- ===================================
-- DOCUMENTATION
-- ===================================
COMMENT ON FUNCTION delete_pilot_with_cascade(uuid) IS 'Atomically deletes a pilot and all related records (leave requests, certifications). Returns summary of deletion.';
COMMENT ON FUNCTION batch_update_certifications(jsonb[]) IS 'Atomically updates multiple certifications. All updates succeed together or all fail together.';
COMMENT ON FUNCTION approve_leave_request(uuid, uuid, text, text) IS 'Atomically approves/denies a leave request and creates an audit log entry. Both operations succeed together or fail together.';
COMMENT ON FUNCTION create_pilot_with_certifications(jsonb, jsonb[]) IS 'Atomically creates a pilot and their initial certifications. Both pilot and all certifications are created together or none at all.';
COMMENT ON FUNCTION bulk_delete_certifications(uuid[]) IS 'Atomically deletes multiple certifications. Useful for bulk cleanup operations.';
