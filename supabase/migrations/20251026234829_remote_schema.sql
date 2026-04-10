
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'Public schema - Contains all application tables and functions.

REMAINING SECURITY WARNINGS (Cannot be fixed via migration):
1. Extensions in public schema (btree_gin, btree_gist, pg_trgm)
   - Requires superuser privileges to move extensions
   - Not fixable by application-level migrations
   - Supabase default configuration

2. Auth leaked password protection (Manual fix required)
   - Enable in Supabase Dashboard → Authentication → Policies
   - Navigate to Password Strength settings
   - Enable "Check against HaveIBeenPwned database"

3. Auth insufficient MFA options (Manual fix required)
   - Enable in Supabase Dashboard → Authentication → Providers
   - Add additional MFA methods (TOTP, SMS, etc.)
   - Recommended: Enable TOTP at minimum
';



CREATE EXTENSION IF NOT EXISTS "btree_gin" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "btree_gist" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."assignment_type" AS ENUM (
    'FLIGHT',
    'STANDBY',
    'TRAINING',
    'OFFICE',
    'LEAVE',
    'SICK',
    'REST'
);


ALTER TYPE "public"."assignment_type" OWNER TO "postgres";


CREATE TYPE "public"."audit_action" AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'VIEW',
    'APPROVE',
    'REJECT',
    'LOGIN',
    'LOGOUT',
    'EXPORT'
);


ALTER TYPE "public"."audit_action" OWNER TO "postgres";


CREATE TYPE "public"."certification_category" AS ENUM (
    'LICENCE',
    'MEDICAL',
    'IDENTITY',
    'PASSPORT',
    'AIRCRAFT_TYPE',
    'TRAINING',
    'OPERATIONAL',
    'SIMULATOR'
);


ALTER TYPE "public"."certification_category" OWNER TO "postgres";


CREATE TYPE "public"."certification_status" AS ENUM (
    'VALID',
    'EXPIRING',
    'EXPIRED',
    'PENDING_RENEWAL',
    'NOT_APPLICABLE'
);


ALTER TYPE "public"."certification_status" OWNER TO "postgres";


CREATE TYPE "public"."check_category" AS ENUM (
    'MEDICAL',
    'LICENSE',
    'TRAINING',
    'QUALIFICATION',
    'SECURITY',
    'RECENCY',
    'LANGUAGE'
);


ALTER TYPE "public"."check_category" OWNER TO "postgres";


CREATE TYPE "public"."check_status" AS ENUM (
    'EXPIRED',
    'EXPIRING_7_DAYS',
    'EXPIRING_30_DAYS',
    'EXPIRING_60_DAYS',
    'EXPIRING_90_DAYS',
    'CURRENT'
);


ALTER TYPE "public"."check_status" OWNER TO "postgres";


CREATE TYPE "public"."crew_role" AS ENUM (
    'CAPTAIN',
    'FIRST_OFFICER',
    'SECOND_OFFICER',
    'TRAINING_CAPTAIN',
    'CHECK_CAPTAIN'
);


ALTER TYPE "public"."crew_role" OWNER TO "postgres";


CREATE TYPE "public"."leave_type" AS ENUM (
    'RDO',
    'SDO',
    'ANN',
    'SCK',
    'LSL',
    'COMP',
    'MAT',
    'PAT',
    'UNPAID'
);


ALTER TYPE "public"."leave_type" OWNER TO "postgres";


CREATE TYPE "public"."notification_level" AS ENUM (
    '90_DAYS',
    '60_DAYS',
    '30_DAYS',
    '14_DAYS',
    '7_DAYS',
    'EXPIRED',
    'CRITICAL'
);


ALTER TYPE "public"."notification_level" OWNER TO "postgres";


CREATE TYPE "public"."notification_status" AS ENUM (
    'PENDING',
    'SENT',
    'ACKNOWLEDGED',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE "public"."notification_status" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'leave_request_submitted',
    'leave_request_approved',
    'leave_request_rejected',
    'leave_request_pending_review',
    'leave_bid_submitted',
    'leave_bid_approved',
    'leave_bid_rejected',
    'flight_request_submitted',
    'flight_request_approved',
    'flight_request_rejected'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."pilot_position" AS ENUM (
    'captain',
    'first_officer',
    'second_officer',
    'cadet'
);


ALTER TYPE "public"."pilot_position" OWNER TO "postgres";


CREATE TYPE "public"."pilot_role" AS ENUM (
    'Captain',
    'First Officer'
);


ALTER TYPE "public"."pilot_role" OWNER TO "postgres";


CREATE TYPE "public"."request_status" AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED',
    'EXPIRED'
);


ALTER TYPE "public"."request_status" OWNER TO "postgres";


CREATE TYPE "public"."visa_type" AS ENUM (
    'Australia',
    'China',
    'New Zealand',
    'Japan',
    'Canada'
);


ALTER TYPE "public"."visa_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."acknowledge_alert"("alert_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE alerts 
    SET is_acknowledged = true, 
        acknowledged_at = NOW(),
        acknowledged_by = 'skycruzer@icloud.com'
    WHERE id = alert_id;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."acknowledge_alert"("alert_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."acknowledge_alert"("alert_id" "uuid", "acknowledger_email" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    UPDATE public.alerts 
    SET 
        is_acknowledged = true,
        acknowledged_at = NOW(),
        acknowledged_by = acknowledger_email
    WHERE id = alert_id
      AND is_acknowledged = false;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RETURN rows_updated > 0;
END;
$$;


ALTER FUNCTION "public"."acknowledge_alert"("alert_id" "uuid", "acknowledger_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_crew_check"("p_crew_member_id" "uuid", "p_check_type_code" "text", "p_completion_date" "date" DEFAULT NULL::"date", "p_expiry_date" "date" DEFAULT NULL::"date", "p_result" "text" DEFAULT NULL::"text", "p_certificate_number" "text" DEFAULT NULL::"text", "p_examiner_name" "text" DEFAULT NULL::"text", "p_notes" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_check_type_id UUID;
    v_new_check_id UUID;
BEGIN
    -- Get check type ID
    SELECT id INTO v_check_type_id
    FROM check_types
    WHERE code = p_check_type_code;
    
    IF v_check_type_id IS NULL THEN
        RAISE EXCEPTION 'Check type with code % not found', p_check_type_code;
    END IF;
    
    -- Insert new check
    INSERT INTO crew_checks (
        crew_member_id,
        check_type_id,
        completion_date,
        expiry_date,
        result,
        certificate_number,
        examiner_name,
        notes
    ) VALUES (
        p_crew_member_id,
        v_check_type_id,
        p_completion_date,
        p_expiry_date,
        p_result,
        p_certificate_number,
        p_examiner_name,
        p_notes
    ) RETURNING id INTO v_new_check_id;
    
    RETURN v_new_check_id;
END;
$$;


ALTER FUNCTION "public"."add_crew_check"("p_crew_member_id" "uuid", "p_check_type_code" "text", "p_completion_date" "date", "p_expiry_date" "date", "p_result" "text", "p_certificate_number" "text", "p_examiner_name" "text", "p_notes" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."add_crew_check"("p_crew_member_id" "uuid", "p_check_type_code" "text", "p_completion_date" "date", "p_expiry_date" "date", "p_result" "text", "p_certificate_number" "text", "p_examiner_name" "text", "p_notes" "text") IS 'Helper function to add a new check/certification/document to the crew_checks table';



CREATE OR REPLACE FUNCTION "public"."alert_level"("expiry_date" "date") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
    SELECT CASE 
        WHEN expiry_date < CURRENT_DATE THEN 'overdue'
        WHEN expiry_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'critical'
        WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'warning'
        WHEN expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'info'
        ELSE 'valid'
    END;
$$;


ALTER FUNCTION "public"."alert_level"("expiry_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."alert_level"("days_until_expiry" integer) RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF days_until_expiry IS NULL THEN
        RETURN 'none';
    ELSIF days_until_expiry < 0 THEN
        RETURN 'expired';
    ELSIF days_until_expiry <= 7 THEN
        RETURN 'critical';
    ELSIF days_until_expiry <= 30 THEN
        RETURN 'warning';
    ELSIF days_until_expiry <= 90 THEN
        RETURN 'info';
    ELSE
        RETURN 'none';
    END IF;
END;
$$;


ALTER FUNCTION "public"."alert_level"("days_until_expiry" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_leave_request"("p_request_id" "uuid", "p_approved_by" "uuid", "p_approval_notes" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."approve_leave_request"("p_request_id" "uuid", "p_approved_by" "uuid", "p_approval_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_leave_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_status" "text", "p_comments" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."approve_leave_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_status" "text", "p_comments" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."approve_leave_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_status" "text", "p_comments" "text") IS 'Atomically approves/denies a leave request and creates an audit log entry. Both operations succeed together or fail together.';



CREATE OR REPLACE FUNCTION "public"."audit_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  -- Insert audit record for all changes
  INSERT INTO audit_log (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."audit_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_expiry_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    record_id_value UUID;
BEGIN
    -- Get the record ID from the appropriate column
    IF TG_TABLE_NAME = 'pilots' THEN
        record_id_value := COALESCE(NEW.id, OLD.id);
    ELSE
        record_id_value := COALESCE(NEW.id, OLD.id);
    END IF;

    -- Log significant changes to expiry dates
    IF TG_OP = 'UPDATE' THEN
        -- Check different expiry date fields based on table
        IF TG_TABLE_NAME = 'pilots' AND (
            OLD.passport_expiry_date IS DISTINCT FROM NEW.passport_expiry_date OR
            OLD.tri_expiry_date IS DISTINCT FROM NEW.tri_expiry_date OR
            OLD.tre_expiry_date IS DISTINCT FROM NEW.tre_expiry_date
        ) THEN
            INSERT INTO audit_logs (
                table_name,
                record_id,
                action,
                old_values,
                new_values,
                user_email,
                timestamp
            ) VALUES (
                TG_TABLE_NAME,
                record_id_value,
                'expiry_date_changed',
                jsonb_build_object(
                    'passport_expiry_date', OLD.passport_expiry_date,
                    'tri_expiry_date', OLD.tri_expiry_date,
                    'tre_expiry_date', OLD.tre_expiry_date
                ),
                jsonb_build_object(
                    'passport_expiry_date', NEW.passport_expiry_date,
                    'tri_expiry_date', NEW.tri_expiry_date,
                    'tre_expiry_date', NEW.tre_expiry_date
                ),
                (auth.jwt() ->> 'email')::text,
                CURRENT_TIMESTAMP
            );
        ELSIF TG_TABLE_NAME != 'pilots' AND OLD.expiry_date IS DISTINCT FROM NEW.expiry_date THEN
            INSERT INTO audit_logs (
                table_name,
                record_id,
                action,
                old_values,
                new_values,
                user_email,
                timestamp
            ) VALUES (
                TG_TABLE_NAME,
                record_id_value,
                'expiry_date_changed',
                jsonb_build_object('expiry_date', OLD.expiry_date),
                jsonb_build_object('expiry_date', NEW.expiry_date),
                (auth.jwt() ->> 'email')::text,
                CURRENT_TIMESTAMP
            );
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."audit_expiry_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_pilot_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
    INSERT INTO public.audit_log (
        user_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data
    )
    VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."audit_pilot_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_sensitive_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
    -- Log sensitive changes to audit_log
    IF TG_OP = 'UPDATE' AND (
        OLD.position IS DISTINCT FROM NEW.position OR
        OLD.is_training_captain IS DISTINCT FROM NEW.is_training_captain OR
        OLD.is_examiner IS DISTINCT FROM NEW.is_examiner
    ) THEN
        INSERT INTO audit_log (
            user_id,
            action,
            entity_type,
            entity_id,
            old_values,
            new_values
        ) VALUES (
            auth.uid(),
            'SENSITIVE_UPDATE',
            'pilots',
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."audit_sensitive_changes"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."audit_sensitive_changes"() IS 'Audit function that logs sensitive pilot data changes for compliance';



CREATE OR REPLACE FUNCTION "public"."audit_table_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    old_data jsonb;
    new_data jsonb;
    changed_fields text[];
    user_email text;
    session_id text;
    is_regulatory boolean := false;
    compliance_category text;
BEGIN
    -- Get user information from current session
    user_email := COALESCE(
        current_setting('request.jwt.claims', true)::jsonb->>'email',
        current_setting('request.jwt.claims', true)::jsonb->>'user_email',
        'system'
    );
    
    session_id := COALESCE(
        current_setting('request.jwt.claims', true)::jsonb->>'session_id',
        'unknown'
    );

    -- Determine if this is a regulatory-impactful change
    IF TG_TABLE_NAME IN ('crew_checks', 'crew_members', 'check_types') THEN
        is_regulatory := true;
        compliance_category := CASE 
            WHEN TG_TABLE_NAME = 'crew_checks' THEN 'TRAINING_COMPLIANCE'
            WHEN TG_TABLE_NAME = 'crew_members' THEN 'PERSONNEL_MANAGEMENT'
            WHEN TG_TABLE_NAME = 'check_types' THEN 'REGULATORY_STANDARDS'
            ELSE 'GENERAL'
        END;
    END IF;

    -- Handle different operation types
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        new_data := NULL;
        changed_fields := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        old_data := NULL;
        new_data := to_jsonb(NEW);
        changed_fields := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        
        -- Calculate changed fields
        SELECT array_agg(key) INTO changed_fields
        FROM (
            SELECT key 
            FROM jsonb_each(old_data) 
            WHERE key != 'updated_at' 
            AND old_data->key IS DISTINCT FROM new_data->key
        ) changes;
    END IF;

    -- Insert audit record
    INSERT INTO audit_logs (
        table_name,
        record_id,
        operation_type,
        old_values,
        new_values,
        changed_fields,
        user_email,
        session_id,
        ip_address,
        user_agent,
        application_name,
        transaction_id,
        regulatory_impact,
        compliance_category,
        retention_until
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        old_data,
        new_data,
        changed_fields,
        user_email,
        session_id,
        inet_client_addr(),
        current_setting('application_name', true),
        current_setting('application_name', true),
        txid_current(),
        is_regulatory,
        compliance_category,
        CASE 
            WHEN is_regulatory THEN CURRENT_DATE + INTERVAL '7 years'
            ELSE CURRENT_DATE + INTERVAL '3 years'
        END
    );

    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION "public"."audit_table_changes"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."audit_table_changes"() IS 'Enhanced audit trigger function with regulatory compliance tracking';



CREATE OR REPLACE FUNCTION "public"."aus_to_date"("date_text" "text") RETURNS "date"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF date_text IS NULL OR date_text = '' THEN
        RETURN NULL;
    END IF;
    -- Convert DD/MM/YYYY to YYYY-MM-DD
    RETURN TO_DATE(date_text, 'DD/MM/YYYY');
END;
$$;


ALTER FUNCTION "public"."aus_to_date"("date_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_get_user_role"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role
    FROM an_users
    WHERE id = auth.uid();

    RETURN COALESCE(user_role, 'user');
END;
$$;


ALTER FUNCTION "public"."auth_get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."batch_update_certifications"("p_updates" "jsonb"[]) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."batch_update_certifications"("p_updates" "jsonb"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."batch_update_certifications"("p_updates" "jsonb"[]) IS 'Atomically updates multiple certifications. All updates succeed together or all fail together.';



CREATE OR REPLACE FUNCTION "public"."bulk_delete_certifications"("p_certification_ids" "uuid"[]) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."bulk_delete_certifications"("p_certification_ids" "uuid"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."bulk_delete_certifications"("p_certification_ids" "uuid"[]) IS 'Atomically deletes multiple certifications. Useful for bulk cleanup operations.';



CREATE OR REPLACE FUNCTION "public"."calculate_check_status"("expiry_date" "date") RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF expiry_date IS NULL THEN
        RETURN 'No Date';
    ELSIF expiry_date < CURRENT_DATE THEN
        RETURN 'Expired';
    ELSIF expiry_date < CURRENT_DATE + INTERVAL '7 days' THEN
        RETURN 'Expiring 7 Days';
    ELSIF expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN
        RETURN 'Expiring 30 Days';
    ELSIF expiry_date < CURRENT_DATE + INTERVAL '90 days' THEN
        RETURN 'Expiring 90 Days';
    ELSE
        RETURN 'Valid';
    END IF;
END;
$$;


ALTER FUNCTION "public"."calculate_check_status"("expiry_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_check_status"("validity_date" "date", "renewal_date" "date", "advance_days" integer DEFAULT 90) RETURNS character varying
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
    expiry_date DATE;
    days_to_expiry INTEGER;
BEGIN
    -- Determine the expiry date (prefer renewal_date, then validity_date)
    expiry_date := COALESCE(renewal_date, validity_date);
    
    -- If no expiry date, return pending
    IF expiry_date IS NULL THEN
        RETURN 'pending';
    END IF;
    
    -- Calculate days to expiry
    days_to_expiry := expiry_date - current_date;
    
    -- Determine status based on days to expiry
    CASE 
        WHEN days_to_expiry < 0 THEN
            RETURN 'expired';
        WHEN days_to_expiry <= 7 THEN
            RETURN 'expiring_soon';
        WHEN days_to_expiry <= advance_days THEN
            RETURN 'expiring_soon';
        ELSE
            RETURN 'valid';
    END CASE;
END;
$$;


ALTER FUNCTION "public"."calculate_check_status"("validity_date" "date", "renewal_date" "date", "advance_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_check_status"("expiry_date" "date", "warning_days" integer DEFAULT 60, "critical_days" integer DEFAULT 14) RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
DECLARE
    days_remaining INTEGER;
BEGIN
    IF expiry_date IS NULL THEN
        RETURN 'unknown';
    END IF;
    
    days_remaining := days_until_expiry(expiry_date);
    
    IF days_remaining < 0 THEN
        RETURN 'expired';
    ELSIF days_remaining <= critical_days THEN
        RETURN 'critical';
    ELSIF days_remaining <= warning_days THEN
        RETURN 'warning';
    ELSE
        RETURN 'valid';
    END IF;
END;
$$;


ALTER FUNCTION "public"."calculate_check_status"("expiry_date" "date", "warning_days" integer, "critical_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_check_status"("completion_date" "date", "validity_date" "date", "expiry_date" "date", "advance_renewal_days" integer DEFAULT 90) RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    days_until_expiry INTEGER;
BEGIN
    IF expiry_date IS NULL THEN
        RETURN 'pending';
    END IF;
    
    days_until_expiry := expiry_date - CURRENT_DATE;
    
    IF days_until_expiry < 0 THEN
        RETURN 'expired';
    ELSIF days_until_expiry <= advance_renewal_days THEN
        RETURN 'expiring_soon';
    ELSE
        RETURN 'valid';
    END IF;
END;
$$;


ALTER FUNCTION "public"."calculate_check_status"("completion_date" "date", "validity_date" "date", "expiry_date" "date", "advance_renewal_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_days_remaining"("expiry_date" "date") RETURNS integer
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
  SELECT CASE 
    WHEN expiry_date IS NULL THEN NULL
    ELSE (expiry_date - CURRENT_DATE)
  END;
$$;


ALTER FUNCTION "public"."calculate_days_remaining"("expiry_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_days_until_expiry"("expiry_date" "date") RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN expiry_date - CURRENT_DATE;
END;
$$;


ALTER FUNCTION "public"."calculate_days_until_expiry"("expiry_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_leave_days"("start_date" "date", "end_date" "date") RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN (end_date - start_date) + 1;
END;
$$;


ALTER FUNCTION "public"."calculate_leave_days"("start_date" "date", "end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_optimal_renewal_date"("current_expiry_date" "date", "validity_period_months" integer, "advance_renewal_days" integer DEFAULT 90) RETURNS "date"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- If renewal can extend current validity, calculate optimal date
    IF current_expiry_date > CURRENT_DATE THEN
        RETURN current_expiry_date - INTERVAL '1 day' * advance_renewal_days;
    ELSE
        -- If already expired, renewal should be immediate
        RETURN CURRENT_DATE;
    END IF;
END;
$$;


ALTER FUNCTION "public"."calculate_optimal_renewal_date"("current_expiry_date" "date", "validity_period_months" integer, "advance_renewal_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_pilot_to_hull_ratio"() RETURNS TABLE("active_aircraft" integer, "active_pilots" integer, "required_ratio" numeric, "pilots_needed" integer, "surplus_shortage" integer, "status" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    WITH active_data AS (
        SELECT 
            (SELECT COUNT(*) FROM public.fleet WHERE status = 'active')::INTEGER as active_aircraft,
            (SELECT COUNT(*) FROM public.pilots WHERE status = 'active')::INTEGER as active_pilots,
            (SELECT value FROM public.system_requirements WHERE requirement_type = 'pilots_per_hull') as required_ratio
    )
    SELECT 
        active_aircraft,
        active_pilots,
        required_ratio,
        (active_aircraft * required_ratio)::INTEGER as pilots_needed,
        (active_pilots - (active_aircraft * required_ratio))::INTEGER as surplus_shortage,
        CASE 
            WHEN active_pilots >= (active_aircraft * required_ratio) THEN 'COMPLIANT'
            ELSE 'SHORTAGE'
        END as status
    FROM active_data;
END;
$$;


ALTER FUNCTION "public"."calculate_pilot_to_hull_ratio"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_rdo_days"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NEW.end_date IS NOT NULL THEN
        NEW.total_days := (NEW.end_date - NEW.shift_date)::integer + 1;
    ELSE
        NEW.total_days := 1;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_rdo_days"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_required_examiners"() RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  total_pilots INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_pilots FROM pilots WHERE is_active = true;
  RETURN GREATEST(1, CEIL(total_pilots::DECIMAL / 11));
END;
$$;


ALTER FUNCTION "public"."calculate_required_examiners"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_required_training_captains"() RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  total_pilots INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_pilots FROM pilots WHERE is_active = true;
  RETURN GREATEST(1, CEIL(total_pilots::DECIMAL / 11));
END;
$$;


ALTER FUNCTION "public"."calculate_required_training_captains"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_years_in_service"("commencement_date" "date") RETURNS numeric
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  RETURN ROUND(EXTRACT(EPOCH FROM AGE(CURRENT_DATE, commencement_date)) / (365.25 * 24 * 3600), 2);
END;
$$;


ALTER FUNCTION "public"."calculate_years_in_service"("commencement_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_years_in_service"("pilot_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  hire_date DATE;
  years_in_service INTEGER;
BEGIN
  SET search_path = '';
  -- Keep the existing function logic here
  -- This is a placeholder for the actual function body
  
  SELECT p.hire_date
  INTO hire_date
  FROM public.pilots p
  WHERE p.id = pilot_id;
  
  IF hire_date IS NULL THEN
    RETURN 0;
  END IF;
  
  years_in_service := extract(YEAR FROM age(current_date, hire_date));
  
  RETURN years_in_service;
END;
$$;


ALTER FUNCTION "public"."calculate_years_in_service"("pilot_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_years_to_retirement"("birth_date" "date") RETURNS integer
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  retirement_age INTEGER;
  pilot_age NUMERIC;
  years_remaining INTEGER;
BEGIN
  -- Get retirement age from settings
  SELECT (value->>'pilot_retirement_age')::integer
  INTO retirement_age
  FROM settings
  WHERE key = 'pilot_requirements';
  
  -- Default to 65 if setting not found
  IF retirement_age IS NULL THEN
    retirement_age := 65;
  END IF;
  
  -- Return NULL if birth_date is NULL
  IF birth_date IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate current age in years
  pilot_age := EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date));
  
  -- Calculate years to retirement (minimum 0)
  years_remaining := GREATEST(0, retirement_age - pilot_age::integer);
  
  RETURN years_remaining;
END;
$$;


ALTER FUNCTION "public"."calculate_years_to_retirement"("birth_date" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_years_to_retirement"("birth_date" "date") IS 'Calculates years until retirement based on birth date and pilot_retirement_age from settings table';



CREATE OR REPLACE FUNCTION "public"."calculate_years_to_retirement"("pilot_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  pilot_dob DATE;
BEGIN
  -- Get pilot's date of birth
  SELECT date_of_birth
  INTO pilot_dob
  FROM pilots
  WHERE id = pilot_id;
  
  -- Use the birth_date version of the function
  RETURN calculate_years_to_retirement(pilot_dob);
END;
$$;


ALTER FUNCTION "public"."calculate_years_to_retirement"("pilot_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_years_to_retirement"("pilot_id" "uuid") IS 'Calculates years until retirement for a specific pilot by ID';



CREATE OR REPLACE FUNCTION "public"."can_access_pilot_data"("pilot_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN is_admin_user() OR is_pilot_owner(pilot_uuid);
END;
$$;


ALTER FUNCTION "public"."can_access_pilot_data"("pilot_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_training_currency"() RETURNS TABLE("crew_member_id" "uuid", "employee_id" character varying, "check_type_code" character varying, "expiry_date" "date", "days_until_expiry" integer, "compliance_status" character varying, "risk_level" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.id,
        cm.employee_id,
        ct.code,
        cc.expiry_date,
        CASE 
            WHEN cc.expiry_date IS NULL THEN NULL
            ELSE (cc.expiry_date - CURRENT_DATE)::INTEGER
        END,
        CASE 
            WHEN cc.expiry_date IS NULL THEN 'no_record'
            WHEN cc.expiry_date < CURRENT_DATE THEN 'expired'
            WHEN cc.expiry_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'critical'
            WHEN cc.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'warning'
            ELSE 'current'
        END::VARCHAR,
        CASE 
            WHEN cc.expiry_date IS NULL OR cc.expiry_date < CURRENT_DATE THEN 'high'
            WHEN cc.expiry_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'high'
            WHEN cc.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'medium'
            WHEN cc.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'low'
            ELSE 'none'
        END::VARCHAR
    FROM crew_members cm
    CROSS JOIN check_types ct
    LEFT JOIN LATERAL (
        SELECT cc_inner.expiry_date
        FROM crew_checks cc_inner
        WHERE cc_inner.crew_member_id = cm.id 
        AND cc_inner.check_type_id = ct.id
        AND cc_inner.status IN ('completed', 'passed')
        ORDER BY cc_inner.expiry_date DESC NULLS LAST
        LIMIT 1
    ) cc ON true
    WHERE cm.employee_status = 'active'
    AND ct.is_active = true
    AND ct.mandatory = true
    ORDER BY cm.employee_id, ct.code;
END;
$$;


ALTER FUNCTION "public"."check_training_currency"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_tri_tre_compliance"() RETURNS TABLE("total_pilots" integer, "total_tri" integer, "total_tre" integer, "tri_required" integer, "tre_required" integer, "tri_surplus_shortage" integer, "tre_surplus_shortage" integer, "tri_status" "text", "tre_status" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    WITH ratio_check AS (
        SELECT 
            (SELECT COUNT(*) FROM public.pilots WHERE status = 'active')::INTEGER as total_pilots,
            (SELECT COUNT(*) FROM public.pilots WHERE status = 'active' AND is_tri = true)::INTEGER as total_tri,
            (SELECT COUNT(*) FROM public.pilots WHERE status = 'active' AND is_tre = true)::INTEGER as total_tre,
            (SELECT value FROM public.system_requirements WHERE requirement_type = 'tri_ratio') as tri_ratio,
            (SELECT value FROM public.system_requirements WHERE requirement_type = 'tre_ratio') as tre_ratio
    )
    SELECT 
        total_pilots,
        total_tri,
        total_tre,
        CEIL(total_pilots::decimal / tri_ratio)::INTEGER as tri_required,
        CEIL(total_pilots::decimal / tre_ratio)::INTEGER as tre_required,
        (total_tri - CEIL(total_pilots::decimal / tri_ratio))::INTEGER as tri_surplus_shortage,
        (total_tre - CEIL(total_pilots::decimal / tre_ratio))::INTEGER as tre_surplus_shortage,
        CASE 
            WHEN total_tri >= CEIL(total_pilots::decimal / tri_ratio) THEN 'COMPLIANT'
            ELSE 'SHORTAGE'
        END as tri_status,
        CASE 
            WHEN total_tre >= CEIL(total_pilots::decimal / tre_ratio) THEN 'COMPLIANT'
            ELSE 'SHORTAGE'
        END as tre_status
    FROM ratio_check;
END;
$$;


ALTER FUNCTION "public"."check_tri_tre_compliance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_audit_logs"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    logs_cleaned INTEGER := 0;
BEGIN
    -- Delete non-regulatory audit logs older than 3 years
    DELETE FROM audit_logs
    WHERE regulatory_impact = false
    AND operation_timestamp < CURRENT_TIMESTAMP - INTERVAL '3 years';
    
    GET DIAGNOSTICS logs_cleaned = ROW_COUNT;
    
    -- Archive (don't delete) regulatory audit logs older than 7 years
    -- This would typically move to an archive table in production
    
    RETURN logs_cleaned;
END;
$$;


ALTER FUNCTION "public"."cleanup_audit_logs"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_audit_logs"() IS 'Cleans up non-regulatory audit logs older than retention period';



CREATE OR REPLACE FUNCTION "public"."cleanup_expired_password_reset_tokens"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW() OR used_at IS NOT NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_password_reset_tokens"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_expiry_alerts"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    alerts_cleaned INTEGER := 0;
BEGIN
    -- Mark alerts as resolved if the expiry date has passed by more than 30 days
    UPDATE expiry_alerts
    SET is_resolved = true, resolved_at = CURRENT_TIMESTAMP
    WHERE is_resolved = false
    AND expiry_date < CURRENT_DATE - INTERVAL '30 days';
    
    GET DIAGNOSTICS alerts_cleaned = ROW_COUNT;
    
    -- Delete very old resolved alerts (older than 1 year)
    DELETE FROM expiry_alerts
    WHERE is_resolved = true
    AND resolved_at < CURRENT_TIMESTAMP - INTERVAL '1 year';
    
    RETURN alerts_cleaned;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_expiry_alerts"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_old_expiry_alerts"() IS 'Cleans up old and irrelevant expiry alerts';



CREATE OR REPLACE FUNCTION "public"."create_audit_log"("p_action" character varying, "p_entity_type" character varying, "p_entity_id" "uuid", "p_old_values" "jsonb" DEFAULT NULL::"jsonb", "p_new_values" "jsonb" DEFAULT NULL::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  INSERT INTO audit_log (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    created_at
  ) VALUES (
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    NOW()
  );
END;
$$;


ALTER FUNCTION "public"."create_audit_log"("p_action" character varying, "p_entity_type" character varying, "p_entity_id" "uuid", "p_old_values" "jsonb", "p_new_values" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text" DEFAULT 'INFO'::"text", "p_link" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE v_notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, title, message, type, link, metadata)
    VALUES (p_user_id, p_title, p_message, p_type, p_link, p_metadata)
    RETURNING id INTO v_notification_id;
    RETURN v_notification_id;
END;
$$;


ALTER FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_link" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("p_recipient_id" "uuid", "p_recipient_type" "text", "p_sender_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (recipient_id, recipient_type, sender_id, type, title, message, link, metadata)
  VALUES (p_recipient_id, p_recipient_type, p_sender_id, p_type, p_title, p_message, p_link, p_metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;


ALTER FUNCTION "public"."create_notification"("p_recipient_id" "uuid", "p_recipient_type" "text", "p_sender_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_metadata" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_notification"("p_recipient_id" "uuid", "p_recipient_type" "text", "p_sender_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_metadata" "jsonb") IS 'Creates a notification with recipient type support. Protected against search path attacks with SET search_path = ''''';



CREATE OR REPLACE FUNCTION "public"."create_pilot_with_certifications"("p_pilot_data" "jsonb", "p_certifications" "jsonb"[] DEFAULT NULL::"jsonb"[]) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."create_pilot_with_certifications"("p_pilot_data" "jsonb", "p_certifications" "jsonb"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_pilot_with_certifications"("p_pilot_data" "jsonb", "p_certifications" "jsonb"[]) IS 'Atomically creates a pilot and their initial certifications. Both pilot and all certifications are created together or none at all.';



CREATE OR REPLACE FUNCTION "public"."current_user_email"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
DECLARE
    user_email TEXT;
BEGIN
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = auth.uid();
    
    RETURN user_email;
END;
$$;


ALTER FUNCTION "public"."current_user_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_is_an_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role = 'admin'
  FROM public.an_users
  WHERE id = auth.uid()
  LIMIT 1;
$$;


ALTER FUNCTION "public"."current_user_is_an_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."daily_database_maintenance"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    maintenance_results JSON;
    alerts_generated INTEGER;
    alerts_cleaned INTEGER;
    audit_logs_cleaned INTEGER;
    reminders_processed INTEGER;
    views_refreshed BOOLEAN := false;
BEGIN
    -- Generate new expiry alerts
    SELECT generate_comprehensive_expiry_alerts() INTO alerts_generated;
    
    -- Process pending reminders
    SELECT process_pending_reminders() INTO reminders_processed;
    
    -- Clean up old alerts
    SELECT cleanup_old_expiry_alerts() INTO alerts_cleaned;
    
    -- Clean up old audit logs
    SELECT cleanup_audit_logs() INTO audit_logs_cleaned;
    
    -- Refresh materialized views (only on weekdays to reduce load)
    IF EXTRACT(DOW FROM CURRENT_DATE) BETWEEN 1 AND 5 THEN
        PERFORM refresh_all_expiry_views();
        views_refreshed := true;
    END IF;
    
    -- Update statistics for better query planning
    ANALYZE crew_members, crew_checks, check_types, expiry_alerts;
    
    -- Build result JSON
    maintenance_results := json_build_object(
        'timestamp', CURRENT_TIMESTAMP,
        'alerts_generated', alerts_generated,
        'reminders_processed', reminders_processed,
        'alerts_cleaned', alerts_cleaned,
        'audit_logs_cleaned', audit_logs_cleaned,
        'views_refreshed', views_refreshed,
        'statistics_updated', true
    );
    
    -- Log maintenance activity
    INSERT INTO audit_logs (
        table_name,
        record_id,
        operation_type,
        new_values,
        user_email,
        regulatory_impact,
        compliance_category
    ) VALUES (
        'system_maintenance',
        gen_random_uuid(),
        'MAINTENANCE',
        maintenance_results::jsonb,
        'system',
        false,
        'SYSTEM_OPS'
    );
    
    RETURN maintenance_results;
END;
$$;


ALTER FUNCTION "public"."daily_database_maintenance"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."daily_database_maintenance"() IS 'Comprehensive daily maintenance routine for B767 fleet database optimization';



CREATE OR REPLACE FUNCTION "public"."daily_expiry_maintenance"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    result JSON;
    alerts_generated INTEGER;
    statuses_updated INTEGER;
    views_refreshed BOOLEAN := false;
BEGIN
    -- Update all expiry statuses
    statuses_updated := update_all_expiry_statuses();
    
    -- Generate new alerts
    alerts_generated := generate_comprehensive_expiry_alerts();
    
    -- Refresh materialized views
    BEGIN
        PERFORM refresh_expiry_materialized_views();
        views_refreshed := true;
    EXCEPTION WHEN OTHERS THEN
        views_refreshed := false;
    END;
    
    -- Return summary
    result := json_build_object(
        'timestamp', CURRENT_TIMESTAMP,
        'statuses_updated', statuses_updated,
        'alerts_generated', alerts_generated,
        'views_refreshed', views_refreshed,
        'success', true
    );
    
    -- Log the maintenance run if audit_logs table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        INSERT INTO audit_logs (
            table_name,
            record_id,
            action,
            new_values,
            user_email,
            timestamp
        ) VALUES (
            'system_maintenance',
            gen_random_uuid(),
            'daily_expiry_maintenance',
            result::jsonb,
            'system',
            CURRENT_TIMESTAMP
        );
    END IF;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."daily_expiry_maintenance"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."daily_expiry_maintenance"() IS 'Performs complete daily maintenance of expiry tracking system';



CREATE OR REPLACE FUNCTION "public"."daily_maintenance"() RETURNS TABLE("status_updates" integer, "alerts_generated" integer, "maintenance_timestamp" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    status_count INTEGER;
    alert_count INTEGER;
BEGIN
    -- Update check statuses
    SELECT update_check_statuses() INTO status_count;
    
    -- Generate new alerts
    SELECT generate_certification_alerts() INTO alert_count;
    
    -- Log the maintenance run
    INSERT INTO audit_log (table_name, action, new_values, changed_by, change_reason)
    VALUES (
        'system_maintenance', 
        'UPDATE', 
        jsonb_build_object(
            'status_updates', status_count,
            'alerts_generated', alert_count,
            'run_time', NOW()
        ),
        'system_maintenance',
        'Daily automated maintenance run'
    );
    
    RETURN QUERY SELECT status_count, alert_count, NOW();
END;
$$;


ALTER FUNCTION "public"."daily_maintenance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."daily_status_update"() RETURNS TABLE("updated_checks" integer, "generated_notifications" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    updated_count INTEGER;
    notification_count INTEGER := 0;
    check_record RECORD;
BEGIN
    -- Update all check statuses
    updated_count := update_pilot_checks_status();
    
    -- Generate notifications for critical/expired checks
    FOR check_record IN (
        SELECT pc.id, pc.pilot_id, pc.expiry_date, ct.code, ct.critical_days
        FROM pilot_checks pc
        JOIN check_types ct ON pc.check_type_id = ct.id
        JOIN pilots p ON pc.pilot_id = p.id
        WHERE p.status = 'active'
          AND ct.is_active = true
          AND days_until_expiry(pc.expiry_date) <= ct.critical_days
          AND NOT EXISTS (
              SELECT 1 FROM expiry_notifications en
              WHERE en.pilot_check_id = pc.id
                AND en.notification_type = 'critical'
                AND en.sent_at::date = CURRENT_DATE
          )
    ) LOOP
        INSERT INTO expiry_notifications (pilot_check_id, notification_type)
        VALUES (check_record.id, 'critical');
        notification_count := notification_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT updated_count, notification_count;
END;
$$;


ALTER FUNCTION "public"."daily_status_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."days_until_expiry"("expiry_date" "date") RETURNS integer
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
    IF expiry_date IS NULL THEN
        RETURN NULL;
    ELSE
        RETURN expiry_date - CURRENT_DATE;
    END IF;
END;
$$;


ALTER FUNCTION "public"."days_until_expiry"("expiry_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_pilot_with_cascade"("p_pilot_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."delete_pilot_with_cascade"("p_pilot_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."delete_pilot_with_cascade"("p_pilot_id" "uuid") IS 'Atomically deletes a pilot and all related records (leave requests, certifications). Returns summary of deletion.';



CREATE OR REPLACE FUNCTION "public"."excel_date_to_pg_date"("excel_serial" integer) RETURNS "date"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Excel serial dates start from 1900-01-01 (serial 1)
    -- But Excel incorrectly treats 1900 as a leap year, so we subtract 1
    IF excel_serial IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN DATE '1899-12-30' + excel_serial;
END;
$$;


ALTER FUNCTION "public"."excel_date_to_pg_date"("excel_serial" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_check_type_by_code"("code" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    check_type_id UUID;
BEGIN
    SELECT id INTO check_type_id
    FROM check_types 
    WHERE check_code = TRIM(code);
    
    RETURN check_type_id;
END;
$$;


ALTER FUNCTION "public"."find_check_type_by_code"("code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_crew_member_by_name"("search_name" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    crew_id UUID;
    normalized_search TEXT;
BEGIN
    -- Normalize the search name
    normalized_search := UPPER(TRIM(search_name));
    
    -- Try exact match first on full_name (uppercase)
    SELECT id INTO crew_id
    FROM crew_members 
    WHERE UPPER(full_name) = normalized_search;
    
    IF crew_id IS NOT NULL THEN
        RETURN crew_id;
    END IF;
    
    -- Try matching last name + first name
    SELECT id INTO crew_id
    FROM crew_members 
    WHERE UPPER(CONCAT(COALESCE(first_name, ''), ' ', last_name)) = normalized_search;
    
    IF crew_id IS NOT NULL THEN
        RETURN crew_id;
    END IF;
    
    -- Try matching first name + last name (reversed order)
    SELECT id INTO crew_id
    FROM crew_members 
    WHERE UPPER(CONCAT(last_name, ' ', COALESCE(first_name, ''))) = normalized_search;
    
    IF crew_id IS NOT NULL THEN
        RETURN crew_id;
    END IF;
    
    -- Try partial matching on last name
    SELECT id INTO crew_id
    FROM crew_members 
    WHERE UPPER(last_name) = ANY(STRING_TO_ARRAY(normalized_search, ' '));
    
    IF crew_id IS NOT NULL THEN
        RETURN crew_id;
    END IF;
    
    -- Try fuzzy matching using similarity
    SELECT id INTO crew_id
    FROM crew_members 
    WHERE SIMILARITY(UPPER(full_name), normalized_search) > 0.6
    ORDER BY SIMILARITY(UPPER(full_name), normalized_search) DESC
    LIMIT 1;
    
    RETURN crew_id;
END;
$$;


ALTER FUNCTION "public"."find_crew_member_by_name"("search_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_certification_alerts"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    alert_count INTEGER := 0;
    rec RECORD;
    days_remaining INTEGER;
    alert_level VARCHAR;
BEGIN
    -- Clear old alerts that are no longer relevant
    DELETE FROM expiry_alerts 
    WHERE expiry_date < CURRENT_DATE - INTERVAL '30 days'
    AND is_resolved = true;

    -- Generate alerts for crew checks
    FOR rec IN 
        SELECT 
            cc.id,
            cc.crew_member_id,
            cc.expiry_date,
            ct.name as check_name,
            ct.code as check_code,
            cm.first_name || ' ' || cm.last_name as pilot_name
        FROM crew_checks cc
        JOIN check_types ct ON cc.check_type_id = ct.id
        JOIN crew_members cm ON cc.crew_member_id = cm.id
        WHERE cc.expiry_date IS NOT NULL
        AND cc.status = 'passed'
        AND cm.employee_status IN ('active', 'on_leave')
    LOOP
        days_remaining := rec.expiry_date - CURRENT_DATE;
        
        -- Determine alert level
        IF days_remaining < 0 THEN
            alert_level := 'overdue';
        ELSIF days_remaining <= 14 THEN
            alert_level := 'critical';
        ELSIF days_remaining <= 60 THEN
            alert_level := 'warning';
        ELSE
            alert_level := 'info';
        END IF;

        -- Only create alerts for critical items or overdue
        IF alert_level IN ('critical', 'overdue') THEN
            -- Check if alert already exists
            IF NOT EXISTS (
                SELECT 1 FROM expiry_alerts 
                WHERE reference_id = rec.id 
                AND reference_table = 'crew_checks'
                AND is_resolved = false
            ) THEN
                INSERT INTO expiry_alerts (
                    pilot_id,
                    alert_type,
                    reference_id,
                    reference_table,
                    alert_level,
                    title,
                    description,
                    expiry_date,
                    days_until_expiry
                ) VALUES (
                    rec.crew_member_id,
                    'check_expiry',
                    rec.id,
                    'crew_checks',
                    alert_level,
                    rec.check_name || ' Expiry Alert',
                    'Certification "' || rec.check_name || '" for ' || rec.pilot_name || 
                    CASE 
                        WHEN days_remaining < 0 THEN ' expired ' || ABS(days_remaining) || ' days ago'
                        ELSE ' expires in ' || days_remaining || ' days'
                    END,
                    rec.expiry_date,
                    days_remaining
                );
                
                alert_count := alert_count + 1;
            END IF;
        END IF;
    END LOOP;

    -- Generate alerts for passport expiries
    FOR rec IN 
        SELECT 
            cm.id as crew_member_id,
            cm.passport_expiry_date as expiry_date,
            cm.first_name || ' ' || cm.last_name as pilot_name
        FROM crew_members cm
        WHERE cm.passport_expiry_date IS NOT NULL
        AND cm.employee_status IN ('active', 'on_leave')
    LOOP
        days_remaining := rec.expiry_date - CURRENT_DATE;
        
        -- Determine alert level
        IF days_remaining < 0 THEN
            alert_level := 'overdue';
        ELSIF days_remaining <= 90 THEN -- Passports need longer lead time
            alert_level := 'critical';
        ELSIF days_remaining <= 180 THEN
            alert_level := 'warning';
        ELSE
            alert_level := 'info';
        END IF;

        -- Only create alerts for critical items or overdue
        IF alert_level IN ('critical', 'overdue') THEN
            -- Check if alert already exists
            IF NOT EXISTS (
                SELECT 1 FROM expiry_alerts 
                WHERE pilot_id = rec.crew_member_id
                AND reference_table = 'passport'
                AND is_resolved = false
            ) THEN
                INSERT INTO expiry_alerts (
                    pilot_id,
                    alert_type,
                    reference_id,
                    reference_table,
                    alert_level,
                    title,
                    description,
                    expiry_date,
                    days_until_expiry
                ) VALUES (
                    rec.crew_member_id,
                    'document_expiry',
                    rec.crew_member_id,
                    'passport',
                    alert_level,
                    'Passport Expiry Alert',
                    'Passport for ' || rec.pilot_name || 
                    CASE 
                        WHEN days_remaining < 0 THEN ' expired ' || ABS(days_remaining) || ' days ago'
                        ELSE ' expires in ' || days_remaining || ' days'
                    END,
                    rec.expiry_date,
                    days_remaining
                );
                
                alert_count := alert_count + 1;
            END IF;
        END IF;
    END LOOP;

    RETURN alert_count;
END;
$$;


ALTER FUNCTION "public"."generate_certification_alerts"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_certification_alerts"() IS 'Generates alerts for expiring certifications and documents, returns count of new alerts created';



CREATE OR REPLACE FUNCTION "public"."generate_check_alerts"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    WITH due_checks AS (
        SELECT
            cc.id AS crew_check_id,
            cc.crew_member_id,
            cc.expiry_date,
            GREATEST(-365, (cc.expiry_date - CURRENT_DATE))::INT AS days_remaining
        FROM crew_checks cc
        WHERE cc.expiry_date IS NOT NULL
    ),
    candidates AS (
        SELECT
            dc.*, 
            CASE
                WHEN dc.days_remaining < 0 THEN 'expired'
                WHEN dc.days_remaining <= 7 THEN '7_day'
                WHEN dc.days_remaining <= 30 THEN '30_day'
                ELSE 'warning'
            END AS alert_type,
            CASE
                WHEN dc.days_remaining < 0 THEN 'critical'
                WHEN dc.days_remaining <= 7 THEN 'high'
                WHEN dc.days_remaining <= 30 THEN 'medium'
                ELSE 'low'
            END AS severity
        FROM due_checks dc
        WHERE dc.days_remaining <= 30
    )
    INSERT INTO check_alerts (
        crew_member_id,
        crew_check_id,
        alert_type,
        severity,
        message,
        alert_date,
        expiry_date,
        days_until_expiry
    )
    SELECT
        c.crew_member_id,
        c.crew_check_id,
        c.alert_type,
        c.severity,
        CASE
            WHEN c.days_remaining < 0 THEN 'Check has expired'
            ELSE 'Check expiring soon'
        END,
        CURRENT_DATE,
        c.expiry_date,
        c.days_remaining
    FROM candidates c
    WHERE NOT EXISTS (
        SELECT 1
        FROM check_alerts ca
        WHERE ca.crew_check_id = c.crew_check_id
          AND ca.alert_type = c.alert_type
          AND NOT COALESCE(ca.is_acknowledged, FALSE)  -- Changed from is_resolved to is_acknowledged
    );

    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN COALESCE(inserted_count, 0);
END;
$$;


ALTER FUNCTION "public"."generate_check_alerts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_compliance_report"("start_date" "date" DEFAULT (CURRENT_DATE - '30 days'::interval), "end_date" "date" DEFAULT CURRENT_DATE) RETURNS TABLE("compliance_category" "text", "total_events" bigint, "critical_events" bigint, "affected_crew" bigint, "event_types" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.compliance_category,
        COUNT(*) as total_events,
        COUNT(CASE WHEN al.operation_type IN ('COMPLIANCE_FAILURE', 'STATUS_CHANGE') THEN 1 END) as critical_events,
        COUNT(DISTINCT al.record_id) as affected_crew,
        jsonb_agg(DISTINCT al.operation_type) as event_types
    FROM audit_logs al
    WHERE al.operation_timestamp::date BETWEEN start_date AND end_date
    AND al.regulatory_impact = true
    AND al.compliance_category IS NOT NULL
    GROUP BY al.compliance_category
    ORDER BY total_events DESC;
END;
$$;


ALTER FUNCTION "public"."generate_compliance_report"("start_date" "date", "end_date" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_compliance_report"("start_date" "date", "end_date" "date") IS 'Generates compliance activity report for specified date range';



CREATE OR REPLACE FUNCTION "public"."generate_comprehensive_expiry_alerts"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    alerts_created INTEGER := 0;
    crew_rec RECORD;
    check_rec RECORD;
    alert_level TEXT;
    days_remaining INTEGER;
BEGIN
    -- Clear resolved alerts for items that are no longer relevant
    UPDATE expiry_alerts 
    SET is_resolved = true, resolved_at = CURRENT_TIMESTAMP
    WHERE is_resolved = false 
    AND expiry_date < CURRENT_DATE - INTERVAL '30 days';

    -- Generate alerts for crew check expiries
    FOR check_rec IN 
        SELECT 
            cc.id as check_id,
            cc.crew_member_id,
            cc.check_type_id,
            cc.expiry_date,
            ct.description as check_description,
            ct.category,
            ct.warning_threshold_days,
            ct.critical_threshold_days,
            cm.first_name || ' ' || cm.last_name as pilot_name,
            cm.employee_id
        FROM crew_checks cc
        JOIN check_types ct ON cc.check_type_id = ct.id
        JOIN crew_members cm ON cc.crew_member_id = cm.id
        WHERE cc.expiry_date IS NOT NULL
        AND cc.status IN ('completed', 'passed')
        AND cm.employee_status = 'active'
        AND ct.is_active = true
        AND cc.expiry_date <= CURRENT_DATE + INTERVAL '90 days'
        AND NOT EXISTS (
            SELECT 1 FROM expiry_alerts ea
            WHERE ea.reference_id = cc.id
            AND ea.reference_table = 'crew_checks'
            AND ea.is_resolved = false
            AND ea.expiry_date = cc.expiry_date
        )
    LOOP
        days_remaining := check_rec.expiry_date - CURRENT_DATE;
        
        -- Determine alert level
        IF days_remaining < 0 THEN
            alert_level := 'overdue';
        ELSIF days_remaining <= COALESCE(check_rec.critical_threshold_days, 14) THEN
            alert_level := 'critical';
        ELSIF days_remaining <= COALESCE(check_rec.warning_threshold_days, 60) THEN
            alert_level := 'warning';
        ELSE
            alert_level := 'info';
        END IF;

        -- Insert alert
        INSERT INTO expiry_alerts (
            pilot_id,
            alert_type,
            reference_id,
            reference_table,
            alert_level,
            title,
            description,
            expiry_date,
            days_until_expiry,
            next_reminder_date
        ) VALUES (
            check_rec.crew_member_id,
            'check_expiry',
            check_rec.check_id,
            'crew_checks',
            alert_level,
            check_rec.check_description || ' - ' || alert_level,
            'Check expiry for ' || check_rec.pilot_name || ' (' || check_rec.employee_id || ') - ' || check_rec.check_description,
            check_rec.expiry_date,
            days_remaining,
            CASE 
                WHEN alert_level = 'overdue' THEN CURRENT_DATE + INTERVAL '1 day'
                WHEN alert_level = 'critical' THEN CURRENT_DATE + INTERVAL '3 days'
                WHEN alert_level = 'warning' THEN CURRENT_DATE + INTERVAL '7 days'
                ELSE CURRENT_DATE + INTERVAL '14 days'
            END
        );
        
        alerts_created := alerts_created + 1;
    END LOOP;

    -- Generate alerts for pilot license expiries
    FOR crew_rec IN
        SELECT 
            cm.id as crew_member_id,
            cm.pilot_license_expiry as expiry_date,
            cm.first_name || ' ' || cm.last_name as pilot_name,
            cm.employee_id,
            cm.pilot_license_type
        FROM crew_members cm
        WHERE cm.employee_status = 'active'
        AND cm.pilot_license_expiry IS NOT NULL
        AND cm.pilot_license_expiry <= CURRENT_DATE + INTERVAL '90 days'
        AND NOT EXISTS (
            SELECT 1 FROM expiry_alerts ea
            WHERE ea.pilot_id = cm.id
            AND ea.alert_type = 'license_expiry'
            AND ea.is_resolved = false
            AND ea.expiry_date = cm.pilot_license_expiry
        )
    LOOP
        days_remaining := crew_rec.expiry_date - CURRENT_DATE;
        
        IF days_remaining < 0 THEN
            alert_level := 'overdue';
        ELSIF days_remaining <= 14 THEN
            alert_level := 'critical';
        ELSIF days_remaining <= 60 THEN
            alert_level := 'warning';
        ELSE
            alert_level := 'info';
        END IF;

        INSERT INTO expiry_alerts (
            pilot_id,
            alert_type,
            reference_id,
            reference_table,
            alert_level,
            title,
            description,
            expiry_date,
            days_until_expiry,
            next_reminder_date
        ) VALUES (
            crew_rec.crew_member_id,
            'license_expiry',
            crew_rec.crew_member_id,
            'crew_members',
            alert_level,
            COALESCE(crew_rec.pilot_license_type, 'Pilot License') || ' - ' || alert_level,
            'License expiry for ' || crew_rec.pilot_name || ' (' || crew_rec.employee_id || ')',
            crew_rec.expiry_date,
            days_remaining,
            CASE 
                WHEN alert_level = 'overdue' THEN CURRENT_DATE + INTERVAL '1 day'
                WHEN alert_level = 'critical' THEN CURRENT_DATE + INTERVAL '3 days'
                WHEN alert_level = 'warning' THEN CURRENT_DATE + INTERVAL '7 days'
                ELSE CURRENT_DATE + INTERVAL '14 days'
            END
        );
        
        alerts_created := alerts_created + 1;
    END LOOP;

    -- Generate alerts for medical certificate expiries
    FOR crew_rec IN
        SELECT 
            cm.id as crew_member_id,
            cm.medical_certificate_expiry as expiry_date,
            cm.first_name || ' ' || cm.last_name as pilot_name,
            cm.employee_id,
            cm.medical_certificate_class
        FROM crew_members cm
        WHERE cm.employee_status = 'active'
        AND cm.medical_certificate_expiry IS NOT NULL
        AND cm.medical_certificate_expiry <= CURRENT_DATE + INTERVAL '90 days'
        AND NOT EXISTS (
            SELECT 1 FROM expiry_alerts ea
            WHERE ea.pilot_id = cm.id
            AND ea.alert_type = 'medical_expiry'
            AND ea.is_resolved = false
            AND ea.expiry_date = cm.medical_certificate_expiry
        )
    LOOP
        days_remaining := crew_rec.expiry_date - CURRENT_DATE;
        
        IF days_remaining < 0 THEN
            alert_level := 'overdue';
        ELSIF days_remaining <= 14 THEN
            alert_level := 'critical';
        ELSIF days_remaining <= 30 THEN
            alert_level := 'warning';
        ELSE
            alert_level := 'info';
        END IF;

        INSERT INTO expiry_alerts (
            pilot_id,
            alert_type,
            reference_id,
            reference_table,
            alert_level,
            title,
            description,
            expiry_date,
            days_until_expiry,
            next_reminder_date
        ) VALUES (
            crew_rec.crew_member_id,
            'medical_expiry',
            crew_rec.crew_member_id,
            'crew_members',
            alert_level,
            'Medical Class ' || COALESCE(crew_rec.medical_certificate_class::TEXT, '?') || ' - ' || alert_level,
            'Medical certificate expiry for ' || crew_rec.pilot_name || ' (' || crew_rec.employee_id || ')',
            crew_rec.expiry_date,
            days_remaining,
            CASE 
                WHEN alert_level = 'overdue' THEN CURRENT_DATE + INTERVAL '1 day'
                WHEN alert_level = 'critical' THEN CURRENT_DATE + INTERVAL '3 days'
                WHEN alert_level = 'warning' THEN CURRENT_DATE + INTERVAL '7 days'
                ELSE CURRENT_DATE + INTERVAL '14 days'
            END
        );
        
        alerts_created := alerts_created + 1;
    END LOOP;

    -- Generate alerts for passport expiries
    FOR crew_rec IN
        SELECT 
            cm.id as crew_member_id,
            cm.passport_expiry_date as expiry_date,
            cm.first_name || ' ' || cm.last_name as pilot_name,
            cm.employee_id,
            cm.passport_country
        FROM crew_members cm
        WHERE cm.employee_status = 'active'
        AND cm.passport_expiry_date IS NOT NULL
        AND cm.passport_expiry_date <= CURRENT_DATE + INTERVAL '180 days'
        AND NOT EXISTS (
            SELECT 1 FROM expiry_alerts ea
            WHERE ea.pilot_id = cm.id
            AND ea.alert_type = 'document_expiry'
            AND ea.is_resolved = false
            AND ea.expiry_date = cm.passport_expiry_date
        )
    LOOP
        days_remaining := crew_rec.expiry_date - CURRENT_DATE;
        
        IF days_remaining < 0 THEN
            alert_level := 'overdue';
        ELSIF days_remaining <= 90 THEN
            alert_level := 'critical';
        ELSIF days_remaining <= 180 THEN
            alert_level := 'warning';
        ELSE
            alert_level := 'info';
        END IF;

        INSERT INTO expiry_alerts (
            pilot_id,
            alert_type,
            reference_id,
            reference_table,
            alert_level,
            title,
            description,
            expiry_date,
            days_until_expiry,
            next_reminder_date
        ) VALUES (
            crew_rec.crew_member_id,
            'document_expiry',
            crew_rec.crew_member_id,
            'crew_members',
            alert_level,
            'Passport (' || COALESCE(crew_rec.passport_country, 'Unknown') || ') - ' || alert_level,
            'Passport expiry for ' || crew_rec.pilot_name || ' (' || crew_rec.employee_id || ')',
            crew_rec.expiry_date,
            days_remaining,
            CASE 
                WHEN alert_level = 'overdue' THEN CURRENT_DATE + INTERVAL '1 day'
                WHEN alert_level = 'critical' THEN CURRENT_DATE + INTERVAL '7 days'
                WHEN alert_level = 'warning' THEN CURRENT_DATE + INTERVAL '14 days'
                ELSE CURRENT_DATE + INTERVAL '30 days'
            END
        );
        
        alerts_created := alerts_created + 1;
    END LOOP;

    RETURN alerts_created;
END;
$$;


ALTER FUNCTION "public"."generate_comprehensive_expiry_alerts"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_comprehensive_expiry_alerts"() IS 'Generates alerts for all types of expiring certifications and documents';



CREATE OR REPLACE FUNCTION "public"."generate_expiry_alerts"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Clear old unresolved alerts
  DELETE FROM expiry_alerts 
  WHERE is_resolved = false 
  AND created_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
  
  -- Generate new alerts
  INSERT INTO expiry_alerts (
    pilot_id, alert_type, reference_id, reference_table, alert_level,
    title, description, expiry_date, days_until_expiry
  )
  SELECT DISTINCT
    cc.crew_member_id,
    'check_expiry',
    cc.id,
    'crew_checks',
    CASE 
      WHEN cc.expiry_date < CURRENT_DATE THEN 'overdue'
      WHEN cc.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'critical'
      WHEN cc.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'warning'
      ELSE 'info'
    END,
    ct.description || ' Expiring',
    ct.description || ' expires on ' || cc.expiry_date::text,
    cc.expiry_date,
    (cc.expiry_date - CURRENT_DATE)::integer
  FROM crew_checks cc
  JOIN check_types ct ON cc.check_type_id = ct.id
  JOIN crew_members cm ON cc.crew_member_id = cm.id
  WHERE cc.expiry_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE + INTERVAL '90 days'
  AND cc.status = 'completed'
  AND cm.employee_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM expiry_alerts ea 
    WHERE ea.pilot_id = cc.crew_member_id 
    AND ea.reference_id = cc.id 
    AND ea.is_resolved = false
  );
END;
$$;


ALTER FUNCTION "public"."generate_expiry_alerts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_simplified_expiry_alerts"() RETURNS TABLE("crew_member_id" "uuid", "alert_type" "text", "title" "text", "description" "text", "expiry_date" "date", "days_until_expiry" integer, "alert_level" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  WITH expiring_items AS (
    -- Medical certificates
    SELECT 
      cm.id as crew_member_id,
      'medical_expiry' as alert_type,
      'Medical Certificate Expiring' as title,
      'Medical certificate expires on ' || cm.medical_certificate_expiry::text as description,
      cm.medical_certificate_expiry as expiry_date,
      (cm.medical_certificate_expiry - CURRENT_DATE)::integer as days_until_expiry
    FROM crew_members cm
    WHERE cm.medical_certificate_expiry IS NOT NULL
    AND cm.medical_certificate_expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
    AND cm.employee_status = 'active'
    
    UNION ALL
    
    -- License expiries
    SELECT 
      cm.id,
      'license_expiry',
      'Pilot License Expiring',
      'Pilot license expires on ' || cm.pilot_license_expiry::text,
      cm.pilot_license_expiry,
      (cm.pilot_license_expiry - CURRENT_DATE)::integer
    FROM crew_members cm
    WHERE cm.pilot_license_expiry IS NOT NULL
    AND cm.pilot_license_expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
    AND cm.employee_status = 'active'
    
    UNION ALL
    
    -- Check expiries
    SELECT 
      cc.crew_member_id,
      'check_expiry',
      ct.description || ' Expiring',
      ct.description || ' expires on ' || cc.expiry_date::text,
      cc.expiry_date,
      (cc.expiry_date - CURRENT_DATE)::integer
    FROM crew_checks cc
    JOIN check_types ct ON cc.check_type_id = ct.id
    JOIN crew_members cm ON cc.crew_member_id = cm.id
    WHERE cc.expiry_date IS NOT NULL
    AND cc.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
    AND cc.status = 'completed'
    AND cm.employee_status = 'active'
  )
  SELECT 
    ei.crew_member_id,
    ei.alert_type,
    ei.title,
    ei.description,
    ei.expiry_date,
    ei.days_until_expiry,
    CASE 
      WHEN ei.days_until_expiry < 0 THEN 'overdue'
      WHEN ei.days_until_expiry <= 7 THEN 'critical'
      WHEN ei.days_until_expiry <= 30 THEN 'warning'
      ELSE 'info'
    END as alert_level
  FROM expiring_items ei
  ORDER BY ei.days_until_expiry ASC, ei.crew_member_id;
END;
$$;


ALTER FUNCTION "public"."generate_simplified_expiry_alerts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_staff_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    new_id VARCHAR(10);
    counter INT := 1;
BEGIN
    IF NEW.staff_id IS NULL OR NEW.staff_id = '' THEN
        -- Generate staff ID based on first 3 letters of last name + 3 digit number
        IF NEW.last_name IS NOT NULL THEN
            LOOP
                new_id := UPPER(LEFT(NEW.last_name, 3)) || LPAD(counter::TEXT, 3, '0');
                -- Check if this ID already exists
                IF NOT EXISTS (SELECT 1 FROM pilots WHERE staff_id = new_id) THEN
                    NEW.staff_id := new_id;
                    EXIT;
                END IF;
                counter := counter + 1;
            END LOOP;
        ELSE
            -- Fallback: use 'PIL' prefix
            LOOP
                new_id := 'PIL' || LPAD(counter::TEXT, 3, '0');
                IF NOT EXISTS (SELECT 1 FROM pilots WHERE staff_id = new_id) THEN
                    NEW.staff_id := new_id;
                    EXIT;
                END IF;
                counter := counter + 1;
            END LOOP;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_staff_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_certification_compliance_data"() RETURNS TABLE("total_certifications" integer, "valid_certifications" integer, "expiring_soon" integer, "expired_certifications" integer, "compliance_rate" integer, "critical_alerts" integer)
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    WITH certs AS (
        SELECT
            id,
            status,
            expiry_date,
            CASE
                WHEN expiry_date IS NULL THEN NULL
                ELSE (expiry_date - CURRENT_DATE)
            END AS days_remaining
        FROM pilot_certifications
    ), alerts AS (
        SELECT COUNT(*) AS critical_alerts
        FROM certification_alerts
        WHERE NOT COALESCE(is_resolved, FALSE)
          AND severity IN ('high', 'critical')
    )
    SELECT
        COUNT(*)::INT AS total_certifications,
        COUNT(*) FILTER (WHERE status IN ('valid', 'current'))::INT AS valid_certifications,
        COUNT(*) FILTER (WHERE days_remaining BETWEEN 0 AND 30)::INT AS expiring_soon,
        COUNT(*) FILTER (WHERE days_remaining < 0)::INT AS expired_certifications,
        CASE
            WHEN COUNT(*) = 0 THEN 100
            ELSE ROUND((COUNT(*) FILTER (WHERE status IN ('valid', 'current'))::NUMERIC / COUNT(*)::NUMERIC) * 100)::INT
        END AS compliance_rate,
        (SELECT critical_alerts FROM alerts)
    FROM certs;
END;
$$;


ALTER FUNCTION "public"."get_certification_compliance_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_certification_stats"() RETURNS TABLE("total_certifications" integer, "valid_certifications" integer, "expiring_soon" integer, "expired_certifications" integer, "critical_alerts" integer)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  RETURN QUERY
  WITH cert_stats AS (
    SELECT 
      COUNT(*)::INTEGER as total_certifications,
      COUNT(CASE WHEN status = 'valid' THEN 1 END)::INTEGER as valid_certifications,
      COUNT(CASE WHEN expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND expiry_date > CURRENT_DATE THEN 1 END)::INTEGER as expiring_soon,
      COUNT(CASE WHEN expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE THEN 1 END)::INTEGER as expired_certifications
    FROM pilot_certifications
  ),
  alert_stats AS (
    SELECT 
      COUNT(CASE WHEN severity = 'critical' AND is_resolved = false THEN 1 END)::INTEGER as critical_alerts
    FROM certification_alerts
  )
  SELECT 
    cs.total_certifications,
    cs.valid_certifications,
    cs.expiring_soon,
    cs.expired_certifications,
    als.critical_alerts
  FROM cert_stats cs
  CROSS JOIN alert_stats als;
END;
$$;


ALTER FUNCTION "public"."get_certification_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_check_category_distribution"() RETURNS TABLE("category" "text", "count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ct.category, 'Other') as category,
    COUNT(*) as count
  FROM public.pilot_checks pc
  LEFT JOIN public.check_types ct ON pc.check_type_id = ct.id
  WHERE pc.expiry_date >= CURRENT_DATE
  GROUP BY ct.category
  ORDER BY count DESC;
END;
$$;


ALTER FUNCTION "public"."get_check_category_distribution"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_check_status"("expiry_date" "date") RETURNS "public"."check_status"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF expiry_date IS NULL THEN
        RETURN NULL;
    ELSIF expiry_date < CURRENT_DATE THEN
        RETURN 'EXPIRED'::check_status;
    ELSIF expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN
        RETURN 'EXPIRING_7_DAYS'::check_status;
    ELSIF expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
        RETURN 'EXPIRING_30_DAYS'::check_status;
    ELSIF expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN
        RETURN 'EXPIRING_60_DAYS'::check_status;
    ELSIF expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN
        RETURN 'EXPIRING_90_DAYS'::check_status;
    ELSE
        RETURN 'CURRENT'::check_status;
    END IF;
END;
$$;


ALTER FUNCTION "public"."get_check_status"("expiry_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_crew_audit_trail"("crew_member_uuid" "uuid", "days_back" integer DEFAULT 90) RETURNS TABLE("operation_timestamp" timestamp with time zone, "table_name" character varying, "operation_type" character varying, "changed_fields" "text"[], "user_email" character varying, "regulatory_impact" boolean, "compliance_category" character varying, "details" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.operation_timestamp,
        al.table_name,
        al.operation_type,
        al.changed_fields,
        al.user_email,
        al.regulatory_impact,
        al.compliance_category,
        CASE 
            WHEN al.old_values IS NOT NULL AND al.new_values IS NOT NULL THEN
                jsonb_build_object(
                    'old_values', al.old_values,
                    'new_values', al.new_values
                )
            WHEN al.new_values IS NOT NULL THEN
                jsonb_build_object('created', al.new_values)
            ELSE
                jsonb_build_object('deleted', al.old_values)
        END as details
    FROM audit_logs al
    WHERE al.record_id = crew_member_uuid
    AND al.operation_timestamp >= CURRENT_TIMESTAMP - (days_back || ' days')::INTERVAL
    ORDER BY al.operation_timestamp DESC;
END;
$$;


ALTER FUNCTION "public"."get_crew_audit_trail"("crew_member_uuid" "uuid", "days_back" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_crew_audit_trail"("crew_member_uuid" "uuid", "days_back" integer) IS 'Returns complete audit trail for a specific crew member';



CREATE OR REPLACE FUNCTION "public"."get_crew_expiry_summary"("crew_member_uuid" "uuid") RETURNS TABLE("crew_member_id" "uuid", "pilot_name" "text", "employee_id" "text", "total_expiries" integer, "expired_count" integer, "critical_count" integer, "warning_count" integer, "valid_count" integer, "next_expiry_date" "date", "next_expiry_type" "text", "days_to_next_expiry" integer, "compliance_status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        css.crew_member_id,
        css.full_name as pilot_name,
        css.employee_id,
        (css.expired_count + css.critical_count + css.warning_count + css.valid_count)::INTEGER as total_expiries,
        css.expired_count::INTEGER,
        css.critical_count::INTEGER, 
        css.warning_count::INTEGER,
        css.valid_count::INTEGER,
        css.next_expiry_date,
        CASE 
            WHEN css.next_expiry_date = cm.pilot_license_expiry THEN 'License'
            WHEN css.next_expiry_date = cm.medical_certificate_expiry THEN 'Medical'
            WHEN css.next_expiry_date = cm.passport_expiry_date THEN 'Passport'
            ELSE 'Check'
        END as next_expiry_type,
        css.days_to_next_expiry::INTEGER,
        css.compliance_status
    FROM mv_crew_compliance_summary css
    JOIN crew_members cm ON css.crew_member_id = cm.id
    WHERE css.crew_member_id = crew_member_uuid;
END;
$$;


ALTER FUNCTION "public"."get_crew_expiry_summary"("crew_member_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_crew_expiry_summary"("crew_member_uuid" "uuid") IS 'Returns comprehensive expiry summary for a specific crew member';



CREATE OR REPLACE FUNCTION "public"."get_crew_member_expiring_items"("p_crew_member_id" "uuid", "p_days_ahead" integer DEFAULT 60) RETURNS TABLE("expiry_type" "text", "description" "text", "expiry_date" "date", "days_until_expiry" integer, "status" "text", "reference_table" "text", "reference_id" "uuid")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mes.expiry_type,
        mes.expiry_description,
        mes.expiry_date,
        mes.days_until_expiry,
        mes.status,
        mes.reference_table,
        mes.reference_id
    FROM mv_pilot_expiry_status mes
    WHERE mes.pilot_id = p_crew_member_id
        AND mes.days_until_expiry <= p_days_ahead
    ORDER BY mes.priority_order, mes.days_until_expiry;
END;
$$;


ALTER FUNCTION "public"."get_crew_member_expiring_items"("p_crew_member_id" "uuid", "p_days_ahead" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_crew_member_expiring_items"("p_crew_member_id" "uuid", "p_days_ahead" integer) IS 'Returns all expiring items for a specific crew member within specified days';



CREATE OR REPLACE FUNCTION "public"."get_current_alert_severity_and_type"("days_remaining" integer) RETURNS TABLE("alert_type" character varying, "severity" character varying, "should_show" boolean)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  IF days_remaining < 0 THEN
    -- Expired - critical priority
    RETURN QUERY SELECT 'expired'::VARCHAR, 'critical'::VARCHAR, TRUE;
  ELSIF days_remaining <= 7 THEN
    -- 7 days or less - critical
    RETURN QUERY SELECT '7_day'::VARCHAR, 'critical'::VARCHAR, TRUE;
  ELSIF days_remaining <= 14 THEN
    -- 8-14 days - high priority  
    RETURN QUERY SELECT '14_day'::VARCHAR, 'high'::VARCHAR, TRUE;
  ELSIF days_remaining <= 28 THEN
    -- 15-28 days - high priority
    RETURN QUERY SELECT '28_day'::VARCHAR, 'high'::VARCHAR, TRUE;
  ELSIF days_remaining <= 60 THEN
    -- 29-60 days - medium priority
    RETURN QUERY SELECT '60_day'::VARCHAR, 'medium'::VARCHAR, TRUE;
  ELSIF days_remaining <= 90 THEN
    -- 61-90 days - low priority 
    RETURN QUERY SELECT '90_day'::VARCHAR, 'low'::VARCHAR, TRUE;
  ELSE
    -- More than 90 days - don't show alert yet
    RETURN QUERY SELECT 'future'::VARCHAR, 'info'::VARCHAR, FALSE;
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_current_alert_severity_and_type"("days_remaining" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_pilot_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
    pilot_uuid UUID;
BEGIN
    -- Optimized query to get pilot_id for current user
    SELECT p.id INTO pilot_uuid
    FROM pilots p
    JOIN user_profiles up ON p.staff_id = up.staff_id
    WHERE up.user_id = auth.uid();
    
    RETURN pilot_uuid;
END;
$$;


ALTER FUNCTION "public"."get_current_pilot_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_current_pilot_id"() IS 'Returns the pilot UUID for the currently authenticated user, optimized for RLS policies';



CREATE OR REPLACE FUNCTION "public"."get_current_user_role"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.auth_users
    WHERE id = auth.uid() AND is_active = true;
    
    RETURN COALESCE(user_role, 'readonly');
END;
$$;


ALTER FUNCTION "public"."get_current_user_role"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_current_user_role"() IS 'Returns the role of the currently authenticated user, defaults to pilot if not found';



CREATE OR REPLACE FUNCTION "public"."get_dashboard_metrics"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_crew_members', COUNT(DISTINCT cm.id),
    'active_crew_members', COUNT(DISTINCT CASE WHEN cm.employee_status = 'active' THEN cm.id END),
    'total_checks', COUNT(cc.id),
    'current_checks', COUNT(CASE WHEN cc.status = 'completed' AND cc.expiry_date > CURRENT_DATE THEN 1 END),
    'expired_checks', COUNT(CASE WHEN cc.expiry_date < CURRENT_DATE THEN 1 END),
    'expiring_30_days', COUNT(CASE WHEN cc.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END),
    'critical_alerts', COUNT(CASE WHEN ea.alert_level = 'critical' AND ea.is_resolved = false THEN 1 END),
    'last_updated', CURRENT_TIMESTAMP
  ) INTO result
  FROM crew_members cm
  LEFT JOIN crew_checks cc ON cm.id = cc.crew_member_id
  LEFT JOIN expiry_alerts ea ON cm.id = ea.pilot_id
  WHERE cm.employee_status = 'active';
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_dashboard_metrics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_database_performance_metrics"() RETURNS TABLE("metric_name" "text", "metric_value" numeric, "metric_unit" "text", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Total Active Crew' as metric_name,
        (SELECT COUNT(*)::NUMERIC FROM crew_members WHERE employee_status = 'active') as metric_value,
        'count' as metric_unit,
        'INFO' as status
    
    UNION ALL
    
    SELECT 
        'Compliance Percentage',
        ROUND(
            (SELECT COUNT(*)::NUMERIC FROM mv_crew_compliance_summary WHERE compliance_status = 'COMPLIANT') * 100.0 /
            NULLIF((SELECT COUNT(*)::NUMERIC FROM mv_crew_compliance_summary), 0),
            2
        ),
        'percentage',
        CASE 
            WHEN ROUND(
                (SELECT COUNT(*)::NUMERIC FROM mv_crew_compliance_summary WHERE compliance_status = 'COMPLIANT') * 100.0 /
                NULLIF((SELECT COUNT(*)::NUMERIC FROM mv_crew_compliance_summary), 0),
                2
            ) >= 95 THEN 'GOOD'
            WHEN ROUND(
                (SELECT COUNT(*)::NUMERIC FROM mv_crew_compliance_summary WHERE compliance_status = 'COMPLIANT') * 100.0 /
                NULLIF((SELECT COUNT(*)::NUMERIC FROM mv_crew_compliance_summary), 0),
                2
            ) >= 85 THEN 'WARNING'
            ELSE 'CRITICAL'
        END
    
    UNION ALL
    
    SELECT 
        'Active Unresolved Alerts',
        (SELECT COUNT(*)::NUMERIC FROM expiry_alerts WHERE is_resolved = false),
        'count',
        CASE 
            WHEN (SELECT COUNT(*) FROM expiry_alerts WHERE is_resolved = false AND alert_level = 'overdue') > 0 THEN 'CRITICAL'
            WHEN (SELECT COUNT(*) FROM expiry_alerts WHERE is_resolved = false AND alert_level = 'critical') > 5 THEN 'WARNING'
            ELSE 'GOOD'
        END;
END;
$$;


ALTER FUNCTION "public"."get_database_performance_metrics"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_database_performance_metrics"() IS 'Returns key performance indicators for database health monitoring';



CREATE OR REPLACE FUNCTION "public"."get_expiring_certifications_with_email"("days_threshold" integer DEFAULT 90) RETURNS TABLE("pilot_id" "uuid", "check_type_id" "uuid", "expiry_date" "date", "days_until_expiry" integer, "first_name" "text", "last_name" "text", "rank" "text", "employee_id" "text", "email" "text", "check_code" "text", "check_description" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.pilot_id,
    pc.check_type_id,
    pc.expiry_date,
    (pc.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry,
    p.first_name::TEXT,
    p.last_name::TEXT,
    p.role::TEXT as rank,
    p.employee_id::TEXT,
    pu.email::TEXT,
    ct.check_code::TEXT,
    ct.check_description::TEXT
  FROM pilot_checks pc
  JOIN pilots p ON pc.pilot_id = p.id
  LEFT JOIN pilot_users pu ON p.employee_id = pu.employee_id
  JOIN check_types ct ON pc.check_type_id = ct.id
  WHERE (pc.expiry_date - CURRENT_DATE) <= days_threshold
    AND pu.email IS NOT NULL
  ORDER BY days_until_expiry ASC;
END;
$$;


ALTER FUNCTION "public"."get_expiring_certifications_with_email"("days_threshold" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_expiring_checks"("days_ahead" integer DEFAULT 60) RETURNS TABLE("check_id" "uuid", "pilot_id" "uuid", "pilot_name" "text", "employee_id" "text", "check_code" "text", "check_description" "text", "expiry_date" "date", "days_remaining" integer, "status" "text", "priority" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.id as check_id,
        p.id as pilot_id,
        (p.first_name || ' ' || p.last_name) as pilot_name,
        p.employee_id,
        ct.code as check_code,
        ct.description as check_description,
        pc.expiry_date,
        days_until_expiry(pc.expiry_date) as days_remaining,
        calculate_check_status(pc.expiry_date, ct.warning_days, ct.critical_days) as status,
        CASE 
            WHEN days_until_expiry(pc.expiry_date) < 0 THEN 'HIGH'
            WHEN days_until_expiry(pc.expiry_date) <= ct.critical_days THEN 'HIGH'
            WHEN days_until_expiry(pc.expiry_date) <= ct.warning_days THEN 'MEDIUM'
            ELSE 'LOW'
        END as priority
    FROM pilot_checks pc
    JOIN pilots p ON pc.pilot_id = p.id
    JOIN check_types ct ON pc.check_type_id = ct.id
    WHERE pc.expiry_date IS NOT NULL
      AND days_until_expiry(pc.expiry_date) <= days_ahead
      AND p.status = 'active'
      AND ct.is_active = true
    ORDER BY pc.expiry_date ASC, p.last_name ASC;
END;
$$;


ALTER FUNCTION "public"."get_expiring_checks"("days_ahead" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_expiry_statistics"() RETURNS TABLE("expired_count" bigint, "expiring_in_60_days" bigint, "upcoming_renewals" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE expiry_date < CURRENT_DATE) as expired_count,
    COUNT(*) FILTER (WHERE expiry_date >= CURRENT_DATE AND expiry_date <= CURRENT_DATE + INTERVAL '60 days') as expiring_in_60_days,
    COUNT(*) FILTER (WHERE expiry_date >= CURRENT_DATE AND expiry_date <= CURRENT_DATE + INTERVAL '30 days') as upcoming_renewals
  FROM public.pilot_checks;
END;
$$;


ALTER FUNCTION "public"."get_expiry_statistics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_fleet_compliance_stats"() RETURNS TABLE("total_pilots" integer, "fully_compliant_pilots" integer, "pilots_with_warnings" integer, "pilots_with_critical" integer, "pilots_with_expired" integer, "overall_compliance_percentage" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    WITH pilot_stats AS (
        SELECT 
            p.id,
            COUNT(pc.*) as total_checks,
            COUNT(*) FILTER (WHERE calculate_check_status(pc.expiry_date, ct.warning_days, ct.critical_days) = 'valid') as valid_checks,
            COUNT(*) FILTER (WHERE calculate_check_status(pc.expiry_date, ct.warning_days, ct.critical_days) = 'warning') as warning_checks,
            COUNT(*) FILTER (WHERE calculate_check_status(pc.expiry_date, ct.warning_days, ct.critical_days) = 'critical') as critical_checks,
            COUNT(*) FILTER (WHERE calculate_check_status(pc.expiry_date, ct.warning_days, ct.critical_days) = 'expired') as expired_checks
        FROM pilots p
        LEFT JOIN pilot_checks pc ON p.id = pc.pilot_id
        LEFT JOIN check_types ct ON pc.check_type_id = ct.id
        WHERE p.status = 'active'
          AND (ct.is_active IS NULL OR ct.is_active = true)
        GROUP BY p.id
    )
    SELECT 
        COUNT(*)::INTEGER as total_pilots,
        COUNT(*) FILTER (WHERE expired_checks = 0 AND critical_checks = 0 AND warning_checks = 0)::INTEGER as fully_compliant_pilots,
        COUNT(*) FILTER (WHERE warning_checks > 0 AND critical_checks = 0 AND expired_checks = 0)::INTEGER as pilots_with_warnings,
        COUNT(*) FILTER (WHERE critical_checks > 0 AND expired_checks = 0)::INTEGER as pilots_with_critical,
        COUNT(*) FILTER (WHERE expired_checks > 0)::INTEGER as pilots_with_expired,
        CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND(
                (COUNT(*) FILTER (WHERE expired_checks = 0 AND critical_checks = 0)::NUMERIC / COUNT(*)::NUMERIC) * 100, 
                2
            )
        END as overall_compliance_percentage
    FROM pilot_stats;
END;
$$;


ALTER FUNCTION "public"."get_fleet_compliance_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_fleet_expiry_statistics"() RETURNS TABLE("total_pilots" integer, "pilots_with_expired" integer, "pilots_with_critical" integer, "pilots_with_warnings" integer, "total_expiries" integer, "expired_expiries" integer, "critical_expiries" integer, "warning_expiries" integer, "expiries_next_30_days" integer, "expiries_next_60_days" integer, "expiries_next_90_days" integer, "avg_days_to_next_expiry" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    WITH all_pilot_expiries AS (
        -- Get all expiries across all tables
        SELECT 
            p.id as pilot_id,
            UNNEST(ARRAY[
                CASE WHEN pc.expiry_date IS NOT NULL THEN pc.expiry_date END,
                CASE WHEN pd.expiry_date IS NOT NULL THEN pd.expiry_date END,
                CASE WHEN prc.expiry_date IS NOT NULL THEN prc.expiry_date END,
                CASE WHEN pfsc.expiry_date IS NOT NULL THEN pfsc.expiry_date END,
                p.passport_expiry_date,
                p.tri_expiry_date,
                p.tre_expiry_date
            ]) as expiry_date
        FROM pilots p
        LEFT JOIN pilot_checks pc ON p.id = pc.pilot_id
        LEFT JOIN pilot_documents pd ON p.id = pd.pilot_id
        LEFT JOIN pilot_refresher_courses prc ON p.id = prc.pilot_id
        LEFT JOIN pilot_flight_sim_checks pfsc ON p.id = pfsc.pilot_id
        WHERE p.status = 'active'
    ),
    expiry_status AS (
        SELECT 
            pilot_id,
            expiry_date,
            CASE 
                WHEN expiry_date < CURRENT_DATE THEN 'expired'
                WHEN expiry_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'critical'
                WHEN expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'warning'
                ELSE 'valid'
            END as status,
            (expiry_date - CURRENT_DATE) as days_until
        FROM all_pilot_expiries
        WHERE expiry_date IS NOT NULL
    ),
    pilot_status AS (
        SELECT 
            pilot_id,
            CASE 
                WHEN COUNT(CASE WHEN status = 'expired' THEN 1 END) > 0 THEN 'expired'
                WHEN COUNT(CASE WHEN status = 'critical' THEN 1 END) > 0 THEN 'critical'
                WHEN COUNT(CASE WHEN status = 'warning' THEN 1 END) > 0 THEN 'warning'
                ELSE 'valid'
            END as pilot_status
        FROM expiry_status
        GROUP BY pilot_id
    )
    SELECT 
        (SELECT COUNT(DISTINCT id)::INTEGER FROM pilots WHERE status = 'active') as total_pilots,
        COUNT(CASE WHEN ps.pilot_status = 'expired' THEN 1 END)::INTEGER as pilots_with_expired,
        COUNT(CASE WHEN ps.pilot_status = 'critical' THEN 1 END)::INTEGER as pilots_with_critical,
        COUNT(CASE WHEN ps.pilot_status = 'warning' THEN 1 END)::INTEGER as pilots_with_warnings,
        COUNT(es.expiry_date)::INTEGER as total_expiries,
        COUNT(CASE WHEN es.status = 'expired' THEN 1 END)::INTEGER as expired_expiries,
        COUNT(CASE WHEN es.status = 'critical' THEN 1 END)::INTEGER as critical_expiries,
        COUNT(CASE WHEN es.status = 'warning' THEN 1 END)::INTEGER as warning_expiries,
        COUNT(CASE WHEN es.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END)::INTEGER as expiries_next_30_days,
        COUNT(CASE WHEN es.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days' THEN 1 END)::INTEGER as expiries_next_60_days,
        COUNT(CASE WHEN es.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days' THEN 1 END)::INTEGER as expiries_next_90_days,
        ROUND(AVG(CASE WHEN es.days_until >= 0 THEN es.days_until END), 2) as avg_days_to_next_expiry
    FROM expiry_status es
    LEFT JOIN pilot_status ps ON es.pilot_id = ps.pilot_id;
END;
$$;


ALTER FUNCTION "public"."get_fleet_expiry_statistics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_monthly_expiry_data"() RETURNS TABLE("month" "text", "count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(expiry_date, 'YYYY Mon') as month,
    COUNT(*) as count
  FROM public.pilot_checks
  WHERE expiry_date >= CURRENT_DATE
    AND expiry_date <= CURRENT_DATE + INTERVAL '12 months'
  GROUP BY TO_CHAR(expiry_date, 'YYYY Mon'), DATE_TRUNC('month', expiry_date)
  ORDER BY DATE_TRUNC('month', expiry_date)
  LIMIT 12;
END;
$$;


ALTER FUNCTION "public"."get_monthly_expiry_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pending_pilot_registrations"() RETURNS TABLE("id" "uuid", "employee_id" "text", "email" "text", "first_name" "text", "last_name" "text", "rank" "text", "seniority_number" integer, "registration_approved" boolean, "registration_date" timestamp with time zone, "approved_by" "uuid", "approved_at" timestamp with time zone, "last_login_at" timestamp with time zone, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT 
    id, employee_id, email, first_name, last_name, rank,
    seniority_number, registration_approved, registration_date,
    approved_by, approved_at, last_login_at, created_at, updated_at
  FROM pilot_users
  WHERE registration_approved = false
  ORDER BY registration_date DESC;
$$;


ALTER FUNCTION "public"."get_pending_pilot_registrations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pilot_check_types"("pilot_uuid" "uuid") RETURNS TABLE("check_type_id" "uuid", "check_type_name" character varying, "check_type_code" character varying, "completion_date" "date", "expiry_date" "date", "renewal_date" "date", "validity_date" "date", "status" character varying, "notes" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.id as check_type_id,
    ct.name as check_type_name,
    ct.code as check_type_code,
    cc.completion_date,
    cc.expiry_date,
    cc.renewal_date,
    cc.validity_date,
    COALESCE(cc.status, 'pending')::varchar(50) as status,
    cc.notes,
    cc.created_at,
    cc.updated_at
  FROM check_types ct
  LEFT JOIN crew_checks cc ON ct.id = cc.check_type_id AND cc.crew_member_id = pilot_uuid
  ORDER BY ct.name;
END;
$$;


ALTER FUNCTION "public"."get_pilot_check_types"("pilot_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pilot_compliance_stats"("pilot_uuid" "uuid") RETURNS TABLE("total_checks" integer, "valid_checks" integer, "warning_checks" integer, "critical_checks" integer, "expired_checks" integer, "compliance_percentage" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_checks,
        COUNT(*) FILTER (WHERE calculate_check_status(pc.expiry_date, ct.warning_days, ct.critical_days) = 'valid')::INTEGER as valid_checks,
        COUNT(*) FILTER (WHERE calculate_check_status(pc.expiry_date, ct.warning_days, ct.critical_days) = 'warning')::INTEGER as warning_checks,
        COUNT(*) FILTER (WHERE calculate_check_status(pc.expiry_date, ct.warning_days, ct.critical_days) = 'critical')::INTEGER as critical_checks,
        COUNT(*) FILTER (WHERE calculate_check_status(pc.expiry_date, ct.warning_days, ct.critical_days) = 'expired')::INTEGER as expired_checks,
        CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND(
                (COUNT(*) FILTER (WHERE calculate_check_status(pc.expiry_date, ct.warning_days, ct.critical_days) = 'valid')::NUMERIC / COUNT(*)::NUMERIC) * 100, 
                2
            )
        END as compliance_percentage
    FROM pilot_checks pc
    JOIN check_types ct ON pc.check_type_id = ct.id
    WHERE pc.pilot_id = pilot_uuid
      AND ct.is_active = true;
END;
$$;


ALTER FUNCTION "public"."get_pilot_compliance_stats"("pilot_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pilot_dashboard_data"() RETURNS TABLE("total_pilots" integer, "active_pilots" integer, "line_captains" integer, "first_officers" integer, "training_captains" integer, "examiners" integer, "critical_alerts" bigint, "expiring_soon" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::integer FROM pilots),
        (SELECT COUNT(*)::integer FROM pilots WHERE status = 'active'),
        (SELECT COUNT(*)::integer FROM pilots WHERE position = 'Line Captain' AND status = 'active'),
        (SELECT COUNT(*)::integer FROM pilots WHERE position = 'Line First Officer' AND status = 'active'),
        (SELECT COUNT(*)::integer FROM pilots WHERE is_training_captain = true AND status = 'active'),
        (SELECT COUNT(*)::integer FROM pilots WHERE is_examiner = true AND status = 'active'),
        (SELECT COUNT(*) FROM certification_alerts WHERE severity = 'critical' AND is_resolved = false),
        (SELECT COUNT(*) FROM pilot_certifications 
         WHERE status = 'valid' 
         AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days');
END;
$$;


ALTER FUNCTION "public"."get_pilot_dashboard_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pilot_data_with_checks"() RETURNS TABLE("pilot_id" "uuid", "full_name" "text", "display_name" "text", "employee_id" character varying, "email" character varying, "role_code" character varying, "employee_status" character varying, "passport_expiry_date" "date", "nationality" character varying, "is_tre" boolean, "is_tri" boolean, "completed_checks" integer, "total_required_checks" integer, "compliance_percentage" integer, "hire_date" "date", "pilot_license_type" character varying, "pilot_license_expiry" "date", "medical_certificate_expiry" "date")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    WITH pilot_checks AS (
        SELECT 
            cm.id as pilot_id,
            COUNT(CASE WHEN cc.expiry_date > CURRENT_DATE AND cc.status = 'passed' THEN 1 END) as completed_checks_count
        FROM crew_members cm
        LEFT JOIN crew_checks cc ON cm.id = cc.crew_member_id
        WHERE cm.employee_status IN ('active', 'on_leave')
        GROUP BY cm.id
    )
    SELECT 
        cm.id as pilot_id,
        (cm.first_name || ' ' || cm.last_name)::TEXT as full_name,
        COALESCE(cm.preferred_name, cm.first_name || ' ' || SUBSTRING(cm.last_name, 1, 1) || '.')::TEXT as display_name,
        cm.employee_id,
        cm.email,
        CASE 
            WHEN cm.role_code LIKE '%captain%' OR cm.employee_id LIKE 'CPT%' THEN 'CPT'
            ELSE 'FO'
        END::VARCHAR as role_code,
        cm.employee_status,
        cm.passport_expiry_date,
        COALESCE(cm.nationality, 'Australia')::VARCHAR as nationality,
        COALESCE(cm.is_examiner, false) as is_tre,
        COALESCE(cm.is_instructor, false) as is_tri,
        COALESCE(pc.completed_checks_count, 0)::INTEGER as completed_checks,
        6::INTEGER as total_required_checks, -- Assume 6 required checks for B767 pilots
        CASE 
            WHEN pc.completed_checks_count IS NULL THEN 0
            ELSE ROUND((pc.completed_checks_count::NUMERIC / 6.0) * 100)::INTEGER
        END as compliance_percentage,
        cm.hire_date,
        cm.pilot_license_type,
        cm.pilot_license_expiry,
        cm.medical_certificate_expiry
    FROM crew_members cm
    LEFT JOIN pilot_checks pc ON cm.id = pc.pilot_id
    WHERE cm.employee_status IN ('active', 'on_leave')
    ORDER BY cm.last_name, cm.first_name;
END;
$$;


ALTER FUNCTION "public"."get_pilot_data_with_checks"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_pilot_data_with_checks"() IS 'Returns comprehensive pilot data with compliance calculations for dashboard display';



CREATE OR REPLACE FUNCTION "public"."get_pilot_details"("pilot_uuid" "uuid") RETURNS TABLE("pilot_id" "uuid", "full_name" character varying, "display_name" character varying, "first_name" character varying, "middle_name" character varying, "last_name" character varying, "role_code" character varying, "nationality" character varying, "passport_number" character varying, "passport_issue_date" "date", "passport_expiry_date" "date", "email" character varying, "phone" character varying, "is_tre" boolean, "is_tri" boolean, "status" character varying, "notes" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id as pilot_id,
    cm.full_name,
    cm.display_name,
    cm.first_name,
    cm.middle_name,
    cm.last_name,
    cm.role_code,
    cm.nationality,
    cm.passport_number,
    cm.passport_issue_date,
    cm.passport_expiry_date,
    cm.email,
    cm.phone,
    cm.is_tre,
    cm.is_tri,
    cm.status,
    cm.notes,
    cm.created_at,
    cm.updated_at
  FROM crew_members cm
  WHERE cm.id = pilot_uuid;
END;
$$;


ALTER FUNCTION "public"."get_pilot_details"("pilot_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pilot_expiries"() RETURNS TABLE("pilot_id" "uuid", "pilot_name" "text", "expiry_type" "text", "expiry_date" "date")
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
  SELECT 
    p.id as pilot_id,
    p.fullname as pilot_name,
    e.expiry_type,
    e.expiry_date
  FROM pilots p
  LEFT JOIN expiries e ON p.id = e.pilot_id
  WHERE e.expiry_date IS NOT NULL
  ORDER BY e.expiry_date ASC, p.fullname;
$$;


ALTER FUNCTION "public"."get_pilot_expiries"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pilot_expiry_summary"("pilot_uuid" "uuid") RETURNS TABLE("pilot_id" "uuid", "pilot_name" "text", "employee_id" "text", "total_expiries" integer, "expired_count" integer, "critical_count" integer, "warning_count" integer, "valid_count" integer, "next_expiry_date" "date", "next_expiry_type" "text", "days_to_next_expiry" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    WITH pilot_info AS (
        SELECT p.id, p.first_name || ' ' || p.last_name as name, p.employee_id as emp_id
        FROM pilots p WHERE p.id = pilot_uuid
    ),
    all_expiries AS (
        -- Pilot checks
        SELECT pc.pilot_id, pc.expiry_date, 'check' as expiry_type, ct.description as description,
               CASE 
                   WHEN pc.expiry_date < CURRENT_DATE THEN 'expired'
                   WHEN pc.expiry_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'critical'
                   WHEN pc.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'warning'
                   ELSE 'valid'
               END as status
        FROM pilot_checks pc
        JOIN check_types ct ON pc.check_type_id = ct.id
        WHERE pc.pilot_id = pilot_uuid AND pc.expiry_date IS NOT NULL
        
        UNION ALL
        
        -- Pilot documents
        SELECT pd.pilot_id, pd.expiry_date, 'document' as expiry_type, pd.document_name as description,
               CASE 
                   WHEN pd.expiry_date < CURRENT_DATE THEN 'expired'
                   WHEN pd.expiry_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'critical'
                   WHEN pd.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'warning'
                   ELSE 'valid'
               END as status
        FROM pilot_documents pd
        WHERE pd.pilot_id = pilot_uuid AND pd.expiry_date IS NOT NULL
        
        UNION ALL
        
        -- Refresher courses
        SELECT prc.pilot_id, prc.expiry_date, 'course' as expiry_type, prc.course_name as description,
               CASE 
                   WHEN prc.expiry_date < CURRENT_DATE THEN 'expired'
                   WHEN prc.expiry_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'critical'
                   WHEN prc.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'warning'
                   ELSE 'valid'
               END as status
        FROM pilot_refresher_courses prc
        WHERE prc.pilot_id = pilot_uuid AND prc.expiry_date IS NOT NULL
        
        UNION ALL
        
        -- Flight sim checks
        SELECT pfsc.pilot_id, pfsc.expiry_date, 'sim_check' as expiry_type, pfsc.check_type as description,
               CASE 
                   WHEN pfsc.expiry_date < CURRENT_DATE THEN 'expired'
                   WHEN pfsc.expiry_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'critical'
                   WHEN pfsc.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'warning'
                   ELSE 'valid'
               END as status
        FROM pilot_flight_sim_checks pfsc
        WHERE pfsc.pilot_id = pilot_uuid AND pfsc.expiry_date IS NOT NULL
        
        UNION ALL
        
        -- Passport expiry
        SELECT p.id as pilot_id, p.passport_expiry_date as expiry_date, 'passport' as expiry_type, 'Passport' as description,
               CASE 
                   WHEN p.passport_expiry_date < CURRENT_DATE THEN 'expired'
                   WHEN p.passport_expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'critical'
                   WHEN p.passport_expiry_date <= CURRENT_DATE + INTERVAL '180 days' THEN 'warning'
                   ELSE 'valid'
               END as status
        FROM pilots p
        WHERE p.id = pilot_uuid AND p.passport_expiry_date IS NOT NULL
        
        UNION ALL
        
        -- TRI expiry
        SELECT p.id as pilot_id, p.tri_expiry_date as expiry_date, 'tri' as expiry_type, 'TRI Qualification' as description,
               CASE 
                   WHEN p.tri_expiry_date < CURRENT_DATE THEN 'expired'
                   WHEN p.tri_expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'critical'
                   WHEN p.tri_expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'warning'
                   ELSE 'valid'
               END as status
        FROM pilots p
        WHERE p.id = pilot_uuid AND p.tri_expiry_date IS NOT NULL
        
        UNION ALL
        
        -- TRE expiry
        SELECT p.id as pilot_id, p.tre_expiry_date as expiry_date, 'tre' as expiry_type, 'TRE Qualification' as description,
               CASE 
                   WHEN p.tre_expiry_date < CURRENT_DATE THEN 'expired'
                   WHEN p.tre_expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'critical'
                   WHEN p.tre_expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'warning'
                   ELSE 'valid'
               END as status
        FROM pilots p
        WHERE p.id = pilot_uuid AND p.tre_expiry_date IS NOT NULL
    ),
    next_expiry AS (
        SELECT expiry_type, expiry_date, (expiry_date - CURRENT_DATE) as days_until
        FROM all_expiries
        WHERE expiry_date >= CURRENT_DATE
        ORDER BY expiry_date
        LIMIT 1
    )
    SELECT 
        pi.id,
        pi.name,
        pi.emp_id,
        COUNT(ae.expiry_date)::INTEGER as total_expiries,
        COUNT(CASE WHEN ae.status = 'expired' THEN 1 END)::INTEGER as expired_count,
        COUNT(CASE WHEN ae.status = 'critical' THEN 1 END)::INTEGER as critical_count,
        COUNT(CASE WHEN ae.status = 'warning' THEN 1 END)::INTEGER as warning_count,
        COUNT(CASE WHEN ae.status = 'valid' THEN 1 END)::INTEGER as valid_count,
        ne.expiry_date,
        ne.expiry_type,
        ne.days_until::INTEGER
    FROM pilot_info pi
    LEFT JOIN all_expiries ae ON pi.id = ae.pilot_id
    LEFT JOIN next_expiry ne ON true
    GROUP BY pi.id, pi.name, pi.emp_id, ne.expiry_date, ne.expiry_type, ne.days_until;
END;
$$;


ALTER FUNCTION "public"."get_pilot_expiry_summary"("pilot_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pilot_statistics"() RETURNS TABLE("active_pilots" bigint, "captain_count" bigint, "first_officer_count" bigint, "tri_count" bigint, "tre_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as active_pilots,
    COUNT(*) FILTER (WHERE role = 'CPT') as captain_count,
    COUNT(*) FILTER (WHERE role = 'FO') as first_officer_count,
    COUNT(*) FILTER (WHERE is_tri = true) as tri_count,
    COUNT(*) FILTER (WHERE is_tre = true) as tre_count
  FROM public.pilots
  WHERE status = 'active';
END;
$$;


ALTER FUNCTION "public"."get_pilot_statistics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pilot_warning_count"("pilot_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_pilot_warning_count"("pilot_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_renewal_recommendations"("days_ahead" integer DEFAULT 90) RETURNS TABLE("pilot_id" "uuid", "pilot_name" "text", "employee_id" "text", "expiry_type" "text", "expiry_description" "text", "expiry_date" "date", "days_until_expiry" integer, "recommended_renewal_date" "date", "renewal_cost_estimate" numeric, "priority_score" integer, "reference_table" "text", "reference_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    WITH renewal_priorities AS (
        SELECT 
            mes.pilot_id,
            mes.pilot_name,
            mes.employee_id,
            mes.expiry_type,
            mes.expiry_description,
            mes.expiry_date,
            mes.days_until_expiry,
            mes.expiry_date - INTERVAL '30 days' as recommended_renewal_date,
            CASE 
                WHEN mes.expiry_type = 'pilot_check' THEN 500.00
                WHEN mes.expiry_type = 'document' THEN 200.00
                WHEN mes.expiry_type = 'passport' THEN 300.00
                WHEN mes.expiry_type IN ('tri_qualification', 'tre_qualification') THEN 1500.00
                ELSE 250.00
            END::DECIMAL as cost_estimate,
            CASE 
                WHEN mes.days_until_expiry < 0 THEN 1000 -- Overdue
                WHEN mes.days_until_expiry <= 14 THEN 900 -- Critical
                WHEN mes.days_until_expiry <= 30 THEN 800 -- Urgent
                WHEN mes.days_until_expiry <= 60 THEN 700 -- Important
                ELSE 500 -- Normal planning
            END as priority_score,
            mes.reference_table,
            mes.reference_id
        FROM mv_pilot_expiry_status mes
        WHERE mes.days_until_expiry <= days_ahead
        AND mes.status IN ('expired', 'critical', 'warning')
    )
    SELECT 
        rp.pilot_id,
        rp.pilot_name,
        rp.employee_id,
        rp.expiry_type,
        rp.expiry_description,
        rp.expiry_date,
        rp.days_until_expiry,
        rp.recommended_renewal_date,
        rp.cost_estimate,
        rp.priority_score,
        rp.reference_table,
        rp.reference_id
    FROM renewal_priorities rp
    ORDER BY rp.priority_score DESC, rp.days_until_expiry ASC;
END;
$$;


ALTER FUNCTION "public"."get_renewal_recommendations"("days_ahead" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_renewal_recommendations"("days_ahead" integer) IS 'Provides prioritized renewal recommendations for upcoming expiries';



CREATE OR REPLACE FUNCTION "public"."get_system_settings"("p_user_email" "text", "p_setting_type" "text" DEFAULT 'system_config'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result_record system_settings;
BEGIN
  -- Fetch system settings record
  SELECT * INTO result_record
  FROM system_settings
  WHERE user_email = p_user_email 
    AND setting_type = p_setting_type;

  -- Return the result as JSON, or null if not found
  IF result_record.id IS NOT NULL THEN
    RETURN row_to_json(result_record);
  ELSE
    RETURN NULL;
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_system_settings"("p_user_email" "text", "p_setting_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.notifications
    WHERE user_id = p_user_id AND is_read = FALSE;
    RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_years_in_service"("commencement_date" "date") RETURNS integer
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
    SELECT EXTRACT(YEAR FROM age(CURRENT_DATE, commencement_date))::integer;
$$;


ALTER FUNCTION "public"."get_years_in_service"("commencement_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_years_to_retirement"("birth_date" "date") RETURNS integer
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
  SELECT calculate_years_to_retirement(birth_date);
$$;


ALTER FUNCTION "public"."get_years_to_retirement"("birth_date" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_years_to_retirement"("birth_date" "date") IS 'Alias for calculate_years_to_retirement(date) for backward compatibility';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  user_count integer;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- If this is the first user, make them admin
  -- Otherwise, make them a regular user
  IF user_count <= 1 THEN
    NEW.raw_user_meta_data = COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb;
  ELSE
    NEW.raw_user_meta_data = COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || '{"role": "user"}'::jsonb;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."import_crew_check"("p_crew_name" character varying, "p_check_code" character varying, "p_validity_serial" numeric, "p_renewal_serial" numeric) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_crew_id UUID;
    v_check_type_id UUID;
    v_validity_date DATE;
    v_renewal_date DATE;
    v_status VARCHAR;
BEGIN
    -- Get crew member ID
    v_crew_id := map_crew_name_to_id(p_crew_name);
    IF v_crew_id IS NULL THEN
        RAISE WARNING 'Crew member not found: %', p_crew_name;
        RETURN FALSE;
    END IF;
    
    -- Get check type ID
    SELECT id INTO v_check_type_id FROM check_types WHERE code = p_check_code;
    IF v_check_type_id IS NULL THEN
        RAISE WARNING 'Check type not found: %', p_check_code;
        RETURN FALSE;
    END IF;
    
    -- Convert Excel dates to PostgreSQL dates (handle decimal numbers)
    v_validity_date := CASE 
        WHEN p_validity_serial IS NOT NULL THEN excel_date_to_pg_date(ROUND(p_validity_serial)::INTEGER)
        ELSE NULL 
    END;
    v_renewal_date := CASE 
        WHEN p_renewal_serial IS NOT NULL THEN excel_date_to_pg_date(ROUND(p_renewal_serial)::INTEGER)
        ELSE NULL 
    END;
    
    -- Calculate status
    v_status := calculate_check_status(v_validity_date, v_renewal_date);
    
    -- Insert or update the crew check
    INSERT INTO crew_checks (
        crew_member_id, check_type_id, validity_date, renewal_date, 
        expiry_date, status, completion_date
    ) VALUES (
        v_crew_id, v_check_type_id, v_validity_date, v_renewal_date,
        COALESCE(v_renewal_date, v_validity_date), v_status,
        COALESCE(v_validity_date, CURRENT_DATE)
    )
    ON CONFLICT (crew_member_id, check_type_id) 
    DO UPDATE SET
        validity_date = EXCLUDED.validity_date,
        renewal_date = EXCLUDED.renewal_date,
        expiry_date = EXCLUDED.expiry_date,
        status = EXCLUDED.status,
        completion_date = EXCLUDED.completion_date,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."import_crew_check"("p_crew_name" character varying, "p_check_code" character varying, "p_validity_serial" numeric, "p_renewal_serial" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_post_view_count"("post_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    UPDATE public.feedback_posts
    SET view_count = view_count + 1, updated_at = NOW()
    WHERE id = post_uuid;
END;
$$;


ALTER FUNCTION "public"."increment_post_view_count"("post_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_crew_checks_batch"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  crew_id UUID;
  check_type_id UUID;
BEGIN
  -- Clear existing crew_checks for these crew members to avoid duplicates
  DELETE FROM crew_checks WHERE crew_member_id IN (
    SELECT id FROM crew_members WHERE full_name IN (
      'Guy NORRIS', 'Christopher MILENG', 'Stewart KADIKO', 'Samiu TAUFA',
      'Nama MARIOLE', 'Toea HEHUNI', 'Daniel WANMA', 'Naime AIHI',
      'CRAIG LILLEY', 'GUY BESTER', 'Lawrence Koyama', 'Neil SEXTON',
      'Paul DAWANINCURA', 'Maurice RONDEAU', 'Esmond YASI', 'David INNES',
      'Nathan JOHNSON', 'Pesi SOAKAI', 'Fotu To''ofohe', 'Rick NENDEPA',
      'John RONDEAU', 'CRAIG DUFFIELD', 'BRETT DOVEY', 'PETER KELLY',
      'PHILIP JAMES', 'Alexander PORTER', 'Ian PEARSON'
    )
  );

  -- Guy NORRIS - B767_WB
  SELECT id INTO crew_id FROM crew_members WHERE full_name = 'Guy NORRIS';
  SELECT id INTO check_type_id FROM check_types WHERE check_code = 'B767_WB';
  IF crew_id IS NOT NULL AND check_type_id IS NOT NULL THEN
    INSERT INTO crew_checks (crew_member_id, check_type_id, validity_date, renewal_date, status, validity_status)
    VALUES (crew_id, check_type_id, NULL, NULL, 'active', 'no_expiry');
  END IF;

  -- Christopher MILENG - CRM
  SELECT id INTO crew_id FROM crew_members WHERE full_name = 'Christopher MILENG';
  SELECT id INTO check_type_id FROM check_types WHERE check_code = 'CRM';
  IF crew_id IS NOT NULL AND check_type_id IS NOT NULL THEN
    INSERT INTO crew_checks (crew_member_id, check_type_id, validity_date, renewal_date, status, validity_status)
    VALUES (crew_id, check_type_id, '2023-12-31', '2023-09-30', 'active', 'expired');
  END IF;

  -- Stewart KADIKO - VISA_AUST
  SELECT id INTO crew_id FROM crew_members WHERE full_name = 'Stewart KADIKO';
  SELECT id INTO check_type_id FROM check_types WHERE check_code = 'VISA_AUST';
  IF crew_id IS NOT NULL AND check_type_id IS NOT NULL THEN
    INSERT INTO crew_checks (crew_member_id, check_type_id, validity_date, renewal_date, status, validity_status)
    VALUES (crew_id, check_type_id, '2024-12-30', NULL, 'active', 'expired');
  END IF;

  -- Samiu TAUFA - B767_REF
  SELECT id INTO crew_id FROM crew_members WHERE full_name = 'Samiu TAUFA';
  SELECT id INTO check_type_id FROM check_types WHERE check_code = 'B767_REF';
  IF crew_id IS NOT NULL AND check_type_id IS NOT NULL THEN
    INSERT INTO crew_checks (crew_member_id, check_type_id, validity_date, renewal_date, status, validity_status)
    VALUES (crew_id, check_type_id, '2025-02-21', '2024-10-30', 'active', 'expired');
  END IF;

  -- Samiu TAUFA - INSTR_AUTH
  SELECT id INTO crew_id FROM crew_members WHERE full_name = 'Samiu TAUFA';
  SELECT id INTO check_type_id FROM check_types WHERE check_code = 'INSTR_AUTH';
  IF crew_id IS NOT NULL AND check_type_id IS NOT NULL THEN
    INSERT INTO crew_checks (crew_member_id, check_type_id, validity_date, renewal_date, status, validity_status)
    VALUES (crew_id, check_type_id, '2025-05-05', '2025-01-12', 'active', 'expired');
  END IF;

END;
$$;


ALTER FUNCTION "public"."insert_crew_checks_batch"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM crew_members 
    WHERE email = auth.email() 
    AND role_code = 'admin'
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN public.get_user_role(user_id) = 'admin';
END;
$$;


ALTER FUNCTION "public"."is_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_user"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
           OR auth.jwt() ->> 'role' = 'service_role';
END;
$$;


ALTER FUNCTION "public"."is_admin_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_current_user"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
BEGIN
    RETURN auth.uid() = user_id;
END;
$$;


ALTER FUNCTION "public"."is_current_user"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_manager_or_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM crew_members 
    WHERE email = auth.email() 
    AND role_code IN ('admin', 'manager')
  );
END;
$$;


ALTER FUNCTION "public"."is_manager_or_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_pilot_owner"("pilot_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN (auth.jwt() ->> 'email')::text IN (
        SELECT email FROM pilots WHERE id = pilot_uuid
    );
END;
$$;


ALTER FUNCTION "public"."is_pilot_owner"("pilot_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_pilot_users_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  BEGIN
    INSERT INTO audit_logs (table_name, record_id, action, old_values,
  new_values, user_id)
    VALUES ('pilot_users', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW),
  auth.uid());
    RETURN NEW;
  END;
  $$;


ALTER FUNCTION "public"."log_pilot_users_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_renewal_plan_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only log if this is an UPDATE (not INSERT or DELETE)
  IF TG_OP = 'UPDATE' THEN
    -- Log date changes
    IF OLD.planned_renewal_date IS DISTINCT FROM NEW.planned_renewal_date THEN
      INSERT INTO renewal_plan_history (
        renewal_plan_id,
        change_type,
        previous_date,
        new_date,
        previous_roster_period,
        new_roster_period,
        reason,
        changed_by
      ) VALUES (
        NEW.id,
        'rescheduled',
        OLD.planned_renewal_date,
        NEW.planned_renewal_date,
        OLD.planned_roster_period,
        NEW.planned_roster_period,
        'Automatic log from trigger',
        NEW.created_by
      );
    END IF;

    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO renewal_plan_history (
        renewal_plan_id,
        change_type,
        previous_status,
        new_status,
        reason,
        changed_by
      ) VALUES (
        NEW.id,
        CASE NEW.status
          WHEN 'confirmed' THEN 'confirmed'
          WHEN 'in_progress' THEN 'started'
          WHEN 'completed' THEN 'completed'
          WHEN 'cancelled' THEN 'cancelled'
          ELSE 'notes_updated'
        END,
        OLD.status,
        NEW.status,
        'Automatic log from trigger',
        NEW.created_by
      );
    END IF;

    -- Log pairing changes
    IF OLD.paired_pilot_id IS DISTINCT FROM NEW.paired_pilot_id THEN
      INSERT INTO renewal_plan_history (
        renewal_plan_id,
        change_type,
        reason,
        changed_by
      ) VALUES (
        NEW.id,
        CASE WHEN NEW.paired_pilot_id IS NULL THEN 'unpaired' ELSE 'paired' END,
        'Automatic log from trigger',
        NEW.created_by
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_renewal_plan_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."map_crew_name_to_id"("check_name" character varying) RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    crew_id UUID;
BEGIN
    -- Direct mapping for crew names as they appear in checks
    SELECT id INTO crew_id FROM crew_members 
    WHERE full_name = CASE check_name
        WHEN 'John RONDEAU' THEN 'John RONDEAU'
        WHEN 'Maurice RONDEAU' THEN 'Maurice RONDEAU'
        WHEN 'Alexander PORTER' THEN 'Alexander Eric PORTER'
        WHEN 'CRAIG DUFFIELD' THEN 'CRAIG Owen DUFFIELD'
        WHEN 'CRAIG LILLEY' THEN 'CRAIG Aaron LILLEY'
        WHEN 'Guy NORRIS' THEN 'Guy Roderick NORRIS'
        WHEN 'Nathan JOHNSON' THEN 'Nathan Douglas George JOHNSON'
        WHEN 'Stewart KADIKO' THEN 'Stewart Augustine KADIKO'
        WHEN 'Toea HEHUNI' THEN 'Toea Kila HEHUNI'
        WHEN 'Fotu To''ofohe' THEN 'Fotu Amanakianga To''ofohe'
        WHEN 'BRETT DOVEY' THEN 'BRETT William DOVEY'
        WHEN 'Neil SEXTON' THEN 'Neil Christopher SEXTON'
        WHEN 'Pesi SOAKAI' THEN 'Pesi Sione SOAKAI'
        WHEN 'Rick NENDEPA' THEN 'Rick Kibo NENDEPA'
        WHEN 'PETER KELLY' THEN 'PETER Angus KELLY'
        WHEN 'PHILIP JAMES' THEN 'PHILIP William John Robinson JAMES'
        WHEN 'Paul DAWANINCURA' THEN 'Paul Frank DAWANINCURA'
        WHEN 'Ian PEARSON' THEN 'Ian Bruce PEARSON'
        WHEN 'Esmond YASI' THEN 'Esmond William YASI'
        ELSE check_name
    END;
    
    RETURN crew_id;
END;
$$;


ALTER FUNCTION "public"."map_crew_name_to_id"("check_name" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_check_complete"("check_id" "uuid", "completion_date" "date", "expiry_date" "date", "document_ref" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    UPDATE public.crew_checks 
    SET 
        completion_date = mark_check_complete.completion_date,
        expiry_date = mark_check_complete.expiry_date,
        document_reference = document_ref,
        status = calculate_check_status(
            mark_check_complete.completion_date,
            NULL,
            mark_check_complete.expiry_date
        ),
        updated_at = NOW(),
        updated_by = current_user_email()
    WHERE id = check_id;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RETURN rows_updated > 0;
END;
$$;


ALTER FUNCTION "public"."mark_check_complete"("check_id" "uuid", "completion_date" "date", "expiry_date" "date", "document_ref" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_check_complete"("p_crew_member_id" "uuid", "p_check_type_code" character varying, "p_completion_date" "date" DEFAULT CURRENT_DATE, "p_validity_months" integer DEFAULT NULL::integer) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_check_type_id UUID;
    v_expiry_date DATE;
BEGIN
    -- Get check type ID
    SELECT id INTO v_check_type_id FROM check_types WHERE code = p_check_type_code;
    IF v_check_type_id IS NULL THEN
        RAISE WARNING 'Check type not found: %', p_check_type_code;
        RETURN FALSE;
    END IF;
    
    -- Calculate expiry date
    IF p_validity_months IS NOT NULL THEN
        v_expiry_date := p_completion_date + (p_validity_months || ' months')::INTERVAL;
    ELSE
        SELECT 
            CASE 
                WHEN validity_period_months IS NOT NULL THEN 
                    p_completion_date + (validity_period_months || ' months')::INTERVAL
                ELSE 
                    p_completion_date + INTERVAL '12 months'
            END
        INTO v_expiry_date
        FROM check_types WHERE id = v_check_type_id;
    END IF;
    
    -- Update or insert the check
    INSERT INTO crew_checks (
        crew_member_id, check_type_id, completion_date, 
        validity_date, expiry_date, status
    ) VALUES (
        p_crew_member_id, v_check_type_id, p_completion_date,
        p_completion_date, v_expiry_date, 'valid'
    )
    ON CONFLICT (crew_member_id, check_type_id) 
    DO UPDATE SET
        completion_date = EXCLUDED.completion_date,
        validity_date = EXCLUDED.validity_date,
        expiry_date = EXCLUDED.expiry_date,
        status = EXCLUDED.status,
        updated_at = NOW(),
        updated_by = 'skycruzer@icloud.com';
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."mark_check_complete"("p_crew_member_id" "uuid", "p_check_type_code" character varying, "p_completion_date" "date", "p_validity_months" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."monitor_compliance_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Monitor critical expiry date changes in crew_checks
    IF TG_TABLE_NAME = 'crew_checks' AND TG_OP = 'UPDATE' THEN
        -- If expiry date is extended, log as compliance event
        IF OLD.expiry_date IS DISTINCT FROM NEW.expiry_date AND NEW.expiry_date > OLD.expiry_date THEN
            INSERT INTO audit_logs (
                table_name,
                record_id,
                operation_type,
                old_values,
                new_values,
                changed_fields,
                user_email,
                regulatory_impact,
                compliance_category,
                retention_until
            ) VALUES (
                'crew_checks',
                NEW.id,
                'COMPLIANCE_UPDATE',
                jsonb_build_object('old_expiry_date', OLD.expiry_date),
                jsonb_build_object('new_expiry_date', NEW.expiry_date),
                ARRAY['expiry_date'],
                COALESCE(current_setting('request.jwt.claims', true)::jsonb->>'email', 'system'),
                true,
                'EXPIRY_EXTENSION',
                CURRENT_DATE + INTERVAL '7 years'
            );
        END IF;

        -- Monitor status changes to failed
        IF OLD.status != NEW.status AND NEW.status = 'failed' THEN
            INSERT INTO audit_logs (
                table_name,
                record_id,
                operation_type,
                old_values,
                new_values,
                changed_fields,
                user_email,
                regulatory_impact,
                compliance_category,
                retention_until
            ) VALUES (
                'crew_checks',
                NEW.id,
                'COMPLIANCE_FAILURE',
                jsonb_build_object('old_status', OLD.status),
                jsonb_build_object('new_status', NEW.status, 'result', NEW.result),
                ARRAY['status', 'result'],
                COALESCE(current_setting('request.jwt.claims', true)::jsonb->>'email', 'system'),
                true,
                'CHECK_FAILURE',
                CURRENT_DATE + INTERVAL '7 years'
            );
        END IF;
    END IF;

    -- Monitor crew member status changes
    IF TG_TABLE_NAME = 'crew_members' AND TG_OP = 'UPDATE' THEN
        -- Monitor employee status changes
        IF OLD.employee_status != NEW.employee_status THEN
            INSERT INTO audit_logs (
                table_name,
                record_id,
                operation_type,
                old_values,
                new_values,
                changed_fields,
                user_email,
                regulatory_impact,
                compliance_category,
                retention_until
            ) VALUES (
                'crew_members',
                NEW.id,
                'STATUS_CHANGE',
                jsonb_build_object('old_status', OLD.employee_status),
                jsonb_build_object('new_status', NEW.employee_status),
                ARRAY['employee_status'],
                COALESCE(current_setting('request.jwt.claims', true)::jsonb->>'email', 'system'),
                true,
                'PERSONNEL_STATUS',
                CURRENT_DATE + INTERVAL '7 years'
            );
        END IF;

        -- Monitor qualification changes
        IF OLD.is_captain_qualified != NEW.is_captain_qualified 
           OR OLD.is_instructor != NEW.is_instructor 
           OR OLD.is_examiner != NEW.is_examiner THEN
            INSERT INTO audit_logs (
                table_name,
                record_id,
                operation_type,
                old_values,
                new_values,
                changed_fields,
                user_email,
                regulatory_impact,
                compliance_category,
                retention_until
            ) VALUES (
                'crew_members',
                NEW.id,
                'QUALIFICATION_CHANGE',
                jsonb_build_object(
                    'old_captain_qualified', OLD.is_captain_qualified,
                    'old_instructor', OLD.is_instructor,
                    'old_examiner', OLD.is_examiner
                ),
                jsonb_build_object(
                    'new_captain_qualified', NEW.is_captain_qualified,
                    'new_instructor', NEW.is_instructor,
                    'new_examiner', NEW.is_examiner
                ),
                ARRAY['is_captain_qualified', 'is_instructor', 'is_examiner'],
                COALESCE(current_setting('request.jwt.claims', true)::jsonb->>'email', 'system'),
                true,
                'QUALIFICATION_MANAGEMENT',
                CURRENT_DATE + INTERVAL '7 years'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."monitor_compliance_changes"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."monitor_compliance_changes"() IS 'Monitors critical compliance-related changes for regulatory reporting';



CREATE OR REPLACE FUNCTION "public"."parse_cert_date"("date_str" "text") RETURNS "date"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $_$
BEGIN
    -- Handle empty or null dates
    IF date_str IS NULL OR TRIM(date_str) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Handle far future dates (no expiry)
    IF SUBSTRING(date_str FROM '\d{4}$')::INTEGER > 2050 THEN
        RETURN NULL;
    END IF;
    
    -- Parse DD/MM/YYYY format
    RETURN TO_DATE(date_str, 'DD/MM/YYYY');
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$_$;


ALTER FUNCTION "public"."parse_cert_date"("date_str" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."parse_excel_date"("excel_serial" double precision) RETURNS "date"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF excel_serial IS NULL OR excel_serial <= 0 THEN
        RETURN NULL;
    END IF;
    
    -- Excel dates start from 1900-01-01, but Excel incorrectly treats 1900 as a leap year
    -- So we need to subtract 1 day for dates after 1900-02-28
    RETURN DATE '1900-01-01' + (excel_serial - 1)::INTEGER;
END;
$$;


ALTER FUNCTION "public"."parse_excel_date"("excel_serial" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."parse_excel_date"("excel_value" "text") RETURNS "date"
    LANGUAGE "plpgsql" IMMUTABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
    parsed_date DATE;
BEGIN
    -- Try different date formats
    BEGIN
        -- Try ISO format first
        parsed_date := excel_value::DATE;
        RETURN parsed_date;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Try Excel serial number format
    BEGIN
        IF excel_value ~ '^\d+$' AND excel_value::INTEGER > 40000 THEN
            -- Excel serial date (days since 1900-01-01, accounting for leap year bug)
            parsed_date := DATE '1900-01-01' + (excel_value::INTEGER - 2)::INTEGER;
            RETURN parsed_date;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    RETURN NULL;
END;
$_$;


ALTER FUNCTION "public"."parse_excel_date"("excel_value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_pending_reminders"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    reminders_processed INTEGER := 0;
BEGIN
    -- Update next reminder dates for alerts that are due
    UPDATE expiry_alerts
    SET next_reminder_date = CASE 
        WHEN alert_level = 'overdue' THEN CURRENT_DATE + INTERVAL '1 day'
        WHEN alert_level = 'critical' THEN CURRENT_DATE + INTERVAL '3 days'
        WHEN alert_level = 'warning' THEN CURRENT_DATE + INTERVAL '7 days'
        ELSE CURRENT_DATE + INTERVAL '14 days'
    END
    WHERE next_reminder_date <= CURRENT_DATE
    AND is_resolved = false;
    
    GET DIAGNOSTICS reminders_processed = ROW_COUNT;
    
    RETURN reminders_processed;
END;
$$;


ALTER FUNCTION "public"."process_pending_reminders"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."process_pending_reminders"() IS 'Updates reminder dates for alerts that are due for reminders';



CREATE OR REPLACE FUNCTION "public"."refresh_all_expiry_views"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW mv_crew_compliance_summary;
    REFRESH MATERIALIZED VIEW mv_monthly_expiry_trends;
    REFRESH MATERIALIZED VIEW mv_training_workload;
    REFRESH MATERIALIZED VIEW mv_expiry_monitoring;
    
    RETURN 'All materialized views refreshed successfully at ' || CURRENT_TIMESTAMP;
END;
$$;


ALTER FUNCTION "public"."refresh_all_expiry_views"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_dashboard_metrics"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics;
END;
$$;


ALTER FUNCTION "public"."refresh_dashboard_metrics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_dashboard_views"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW dashboard_metrics;
    REFRESH MATERIALIZED VIEW certification_status_summary;
END;
$$;


ALTER FUNCTION "public"."refresh_dashboard_views"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_expiry_materialized_views"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW mv_pilot_expiry_status;
    REFRESH MATERIALIZED VIEW mv_fleet_expiry_summary;
    REFRESH MATERIALIZED VIEW mv_monthly_expiry_projection;
    
    RETURN 'All expiry materialized views refreshed at ' || CURRENT_TIMESTAMP;
END;
$$;


ALTER FUNCTION "public"."refresh_expiry_materialized_views"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_expiry_views"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW mv_pilot_expiry_status;
    REFRESH MATERIALIZED VIEW mv_fleet_expiry_summary;
    REFRESH MATERIALIZED VIEW mv_monthly_expiry_projection;
END;
$$;


ALTER FUNCTION "public"."refresh_expiry_views"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."refresh_expiry_views"() IS 'Refreshes all materialized views related to expiry tracking';



CREATE OR REPLACE FUNCTION "public"."refresh_pilot_status"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW pilot_certification_status;
END;
$$;


ALTER FUNCTION "public"."refresh_pilot_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."safe_to_date"("date_str" "text") RETURNS "date"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
  BEGIN
      -- Handle empty strings or NULL
      IF date_str IS NULL OR date_str = '' THEN
          RETURN NULL;
      END IF;

      -- Handle dates with year 2999 (set as far future - 2099)
      IF date_str LIKE '%2999%' THEN
          RETURN '2099-12-31'::DATE;
      END IF;

      -- Handle dates with year > 2100 (set as 2099)
      IF SUBSTRING(date_str FROM '\d{4}')::INT > 2100 THEN
          RETURN '2099-12-31'::DATE;
      END IF;

      -- Try to parse DD/MM/YYYY format
      RETURN TO_DATE(date_str, 'DD/MM/YYYY');
  EXCEPTION
      WHEN OTHERS THEN
          -- If parsing fails, return NULL
          RETURN NULL;
  END;
  $$;


ALTER FUNCTION "public"."safe_to_date"("date_str" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_pilots_by_name"("search_term" "text") RETURNS TABLE("id" "uuid", "first_name" "text", "last_name" "text", "employee_id" "text", "role" "text")
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.employee_id,
        p.role
    FROM pilots p
    WHERE
        p.first_name ILIKE '%' || search_term || '%'
        OR p.last_name ILIKE '%' || search_term || '%'
        OR p.employee_id ILIKE '%' || search_term || '%';
END;
$$;


ALTER FUNCTION "public"."search_pilots_by_name"("search_term" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_feedback_post_tx"("p_pilot_user_id" "uuid", "p_title" "text", "p_content" "text", "p_category_id" "uuid" DEFAULT NULL::"uuid", "p_is_anonymous" boolean DEFAULT false, "p_author_display_name" "text" DEFAULT ''::"text", "p_author_rank" "text" DEFAULT ''::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_feedback_id uuid;
  v_result jsonb;
  v_final_display_name text;
  v_final_rank text;
BEGIN
  -- Validate input
  IF p_pilot_user_id IS NULL THEN
    RAISE EXCEPTION 'pilot_user_id cannot be null';
  END IF;

  IF p_title IS NULL OR trim(p_title) = '' THEN
    RAISE EXCEPTION 'title cannot be empty';
  END IF;

  IF p_content IS NULL OR trim(p_content) = '' THEN
    RAISE EXCEPTION 'content cannot be empty';
  END IF;

  -- Set anonymous author info if needed
  IF p_is_anonymous THEN
    v_final_display_name := 'Anonymous Pilot';
    v_final_rank := NULL;
  ELSE
    v_final_display_name := p_author_display_name;
    v_final_rank := p_author_rank;
  END IF;

  -- Step 1: Insert feedback post
  INSERT INTO feedback_posts (
    pilot_user_id,
    title,
    content,
    category_id,
    is_anonymous,
    author_display_name,
    author_rank,
    status
  ) VALUES (
    p_pilot_user_id,
    p_title,
    p_content,
    p_category_id,
    p_is_anonymous,
    v_final_display_name,
    v_final_rank,
    'published'
  )
  RETURNING id INTO v_feedback_id;

  -- Step 2: Verify pilot_user_mappings entry exists (creates if needed)
  -- This ensures referential integrity between pilot_users and pilots
  IF NOT EXISTS (
    SELECT 1 FROM pilot_user_mappings WHERE pilot_user_id = p_pilot_user_id
  ) THEN
    -- Log warning but don't fail - RLS will handle authorization
    RAISE WARNING 'No pilot_user_mapping found for pilot_user_id %, but feedback post created', p_pilot_user_id;
  END IF;

  -- Return success result
  SELECT jsonb_build_object(
    'success', true,
    'feedback_id', v_feedback_id,
    'pilot_user_id', p_pilot_user_id,
    'title', p_title,
    'is_anonymous', p_is_anonymous,
    'message', 'Feedback post created successfully'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Failed to submit feedback post: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."submit_feedback_post_tx"("p_pilot_user_id" "uuid", "p_title" "text", "p_content" "text", "p_category_id" "uuid", "p_is_anonymous" boolean, "p_author_display_name" "text", "p_author_rank" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."submit_feedback_post_tx"("p_pilot_user_id" "uuid", "p_title" "text", "p_content" "text", "p_category_id" "uuid", "p_is_anonymous" boolean, "p_author_display_name" "text", "p_author_rank" "text") IS 'Atomically creates a feedback post with validation. Returns success result or rolls back on error.';



CREATE OR REPLACE FUNCTION "public"."submit_flight_request_tx"("p_pilot_user_id" "uuid", "p_request_type" "text", "p_flight_date" "date", "p_description" "text", "p_reason" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_pilot_id uuid;
  v_flight_request_id uuid;
  v_result jsonb;
BEGIN
  -- Validate input
  IF p_pilot_user_id IS NULL THEN
    RAISE EXCEPTION 'pilot_user_id cannot be null';
  END IF;

  IF p_request_type IS NULL OR trim(p_request_type) = '' THEN
    RAISE EXCEPTION 'request_type cannot be empty';
  END IF;

  IF p_flight_date IS NULL THEN
    RAISE EXCEPTION 'flight_date cannot be null';
  END IF;

  IF p_description IS NULL OR trim(p_description) = '' THEN
    RAISE EXCEPTION 'description cannot be empty';
  END IF;

  -- Step 1: Get pilot_id from pilot_user_mappings
  SELECT pilot_id INTO v_pilot_id
  FROM pilot_user_mappings
  WHERE pilot_user_id = p_pilot_user_id;

  IF v_pilot_id IS NULL THEN
    RAISE EXCEPTION 'Pilot not found for pilot_user_id %', p_pilot_user_id;
  END IF;

  -- Step 2: Insert flight request
  INSERT INTO flight_requests (
    pilot_id,
    pilot_user_id,
    request_type,
    flight_date,
    description,
    reason,
    status
  ) VALUES (
    v_pilot_id,
    p_pilot_user_id,
    p_request_type,
    p_flight_date,
    p_description,
    p_reason,
    'PENDING'
  )
  RETURNING id INTO v_flight_request_id;

  -- Return success result
  SELECT jsonb_build_object(
    'success', true,
    'flight_request_id', v_flight_request_id,
    'pilot_id', v_pilot_id,
    'pilot_user_id', p_pilot_user_id,
    'request_type', p_request_type,
    'flight_date', p_flight_date,
    'description', p_description,
    'status', 'PENDING',
    'message', 'Flight request submitted successfully'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Failed to submit flight request: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."submit_flight_request_tx"("p_pilot_user_id" "uuid", "p_request_type" "text", "p_flight_date" "date", "p_description" "text", "p_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."submit_flight_request_tx"("p_pilot_user_id" "uuid", "p_request_type" "text", "p_flight_date" "date", "p_description" "text", "p_reason" "text") IS 'Atomically creates a flight request with pilot_id lookup and validation. Returns success result or rolls back on error.';



CREATE OR REPLACE FUNCTION "public"."submit_flight_request_tx"("p_pilot_id" "uuid", "p_request_type" "text", "p_route_details" "text", "p_preferred_date" "date" DEFAULT NULL::"date", "p_notes" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."submit_flight_request_tx"("p_pilot_id" "uuid", "p_request_type" "text", "p_route_details" "text", "p_preferred_date" "date", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_leave_request_tx"("p_pilot_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_roster_period" "text", "p_notes" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."submit_leave_request_tx"("p_pilot_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_roster_period" "text", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_leave_request_tx"("p_pilot_user_id" "uuid", "p_request_type" "text", "p_start_date" "date", "p_end_date" "date", "p_days_count" integer, "p_roster_period" "text", "p_reason" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_pilot_id uuid;
  v_leave_request_id uuid;
  v_result jsonb;
  v_request_date date;
BEGIN
  -- Validate input
  IF p_pilot_user_id IS NULL THEN
    RAISE EXCEPTION 'pilot_user_id cannot be null';
  END IF;

  IF p_request_type IS NULL OR trim(p_request_type) = '' THEN
    RAISE EXCEPTION 'request_type cannot be empty';
  END IF;

  IF p_start_date IS NULL THEN
    RAISE EXCEPTION 'start_date cannot be null';
  END IF;

  IF p_end_date IS NULL THEN
    RAISE EXCEPTION 'end_date cannot be null';
  END IF;

  IF p_end_date < p_start_date THEN
    RAISE EXCEPTION 'end_date cannot be before start_date';
  END IF;

  IF p_days_count IS NULL OR p_days_count <= 0 THEN
    RAISE EXCEPTION 'days_count must be greater than 0';
  END IF;

  IF p_roster_period IS NULL OR trim(p_roster_period) = '' THEN
    RAISE EXCEPTION 'roster_period cannot be empty';
  END IF;

  -- Step 1: Get pilot_id from pilot_user_mappings
  SELECT pilot_id INTO v_pilot_id
  FROM pilot_user_mappings
  WHERE pilot_user_id = p_pilot_user_id;

  IF v_pilot_id IS NULL THEN
    RAISE EXCEPTION 'Pilot not found for pilot_user_id %', p_pilot_user_id;
  END IF;

  -- Step 2: Set request date to today
  v_request_date := CURRENT_DATE;

  -- Step 3: Insert leave request
  INSERT INTO leave_requests (
    pilot_id,
    pilot_user_id,
    request_type,
    start_date,
    end_date,
    days_count,
    roster_period,
    reason,
    status,
    submission_type,
    request_date,
    request_method
  ) VALUES (
    v_pilot_id,
    p_pilot_user_id,
    p_request_type,
    p_start_date,
    p_end_date,
    p_days_count,
    p_roster_period,
    p_reason,
    'PENDING',
    'pilot',
    v_request_date,
    'SYSTEM'
  )
  RETURNING id INTO v_leave_request_id;

  -- Return success result
  SELECT jsonb_build_object(
    'success', true,
    'leave_request_id', v_leave_request_id,
    'pilot_id', v_pilot_id,
    'pilot_user_id', p_pilot_user_id,
    'request_type', p_request_type,
    'start_date', p_start_date,
    'end_date', p_end_date,
    'days_count', p_days_count,
    'roster_period', p_roster_period,
    'status', 'PENDING',
    'message', 'Leave request submitted successfully'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Failed to submit leave request: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."submit_leave_request_tx"("p_pilot_user_id" "uuid", "p_request_type" "text", "p_start_date" "date", "p_end_date" "date", "p_days_count" integer, "p_roster_period" "text", "p_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."submit_leave_request_tx"("p_pilot_user_id" "uuid", "p_request_type" "text", "p_start_date" "date", "p_end_date" "date", "p_days_count" integer, "p_roster_period" "text", "p_reason" "text") IS 'Atomically creates a leave request with pilot_id lookup and validation. Returns success result or rolls back on error.';



CREATE OR REPLACE FUNCTION "public"."system_health_check"() RETURNS TABLE("check_name" "text", "status" "text", "details" "text", "recommendation" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    
    -- Check for overdue items
    SELECT 
        'Overdue Certifications' as check_name,
        CASE 
            WHEN COUNT(*) = 0 THEN 'PASS'
            WHEN COUNT(*) <= 5 THEN 'WARNING'
            ELSE 'FAIL'
        END as status,
        'Found ' || COUNT(*) || ' overdue certification items' as details,
        CASE 
            WHEN COUNT(*) > 0 THEN 'Review and update overdue certifications immediately'
            ELSE 'No action required'
        END as recommendation
    FROM mv_expiry_monitoring 
    WHERE expiry_status = 'expired'
    
    UNION ALL
    
    -- Check for missing foreign key relationships
    SELECT 
        'Data Integrity',
        CASE 
            WHEN COUNT(*) = 0 THEN 'PASS'
            ELSE 'FAIL'
        END,
        'Found ' || COUNT(*) || ' orphaned records',
        CASE 
            WHEN COUNT(*) > 0 THEN 'Clean up orphaned records to maintain data integrity'
            ELSE 'Data integrity is good'
        END
    FROM (
        SELECT 1 FROM crew_checks cc 
        WHERE NOT EXISTS (SELECT 1 FROM crew_members cm WHERE cm.id = cc.crew_member_id)
        UNION ALL
        SELECT 1 FROM crew_checks cc 
        WHERE NOT EXISTS (SELECT 1 FROM check_types ct WHERE ct.id = cc.check_type_id)
    ) orphaned_records;
END;
$$;


ALTER FUNCTION "public"."system_health_check"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."system_health_check"() IS 'Performs automated health checks and provides recommendations';



CREATE OR REPLACE FUNCTION "public"."trigger_audit_log"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    changed_fields TEXT[];
BEGIN
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        INSERT INTO audit_logs (
            table_name, record_id, operation_type, 
            old_values, user_id, operation_timestamp
        ) VALUES (
            TG_TABLE_NAME, OLD.id, 'DELETE',
            old_data, auth.uid(), NOW()
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        
        -- Find changed fields using proper JSONB comparison
        SELECT ARRAY_AGG(key) INTO changed_fields
        FROM jsonb_each_text(old_data) o
        WHERE NOT (new_data ? o.key AND (new_data->>o.key) = o.value);
        
        INSERT INTO audit_logs (
            table_name, record_id, operation_type,
            old_values, new_values, changed_fields, 
            user_id, operation_timestamp
        ) VALUES (
            TG_TABLE_NAME, NEW.id, 'UPDATE',
            old_data, new_data, changed_fields,
            auth.uid(), NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        new_data := to_jsonb(NEW);
        INSERT INTO audit_logs (
            table_name, record_id, operation_type,
            new_values, user_id, operation_timestamp
        ) VALUES (
            TG_TABLE_NAME, NEW.id, 'INSERT',
            new_data, auth.uid(), NOW()
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."trigger_audit_log"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_check_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    warning_days_val INTEGER;
    critical_days_val INTEGER;
BEGIN
    -- Get warning and critical days from check_types
    SELECT warning_days, critical_days 
    INTO warning_days_val, critical_days_val
    FROM check_types 
    WHERE id = NEW.check_type_id;
    
    -- Update status based on expiry date
    NEW.status := calculate_check_status(NEW.expiry_date, warning_days_val, critical_days_val);
    NEW.updated_at := now();
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_update_check_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_all_expiry_statuses"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    update_count INTEGER := 0;
    rows_affected INTEGER;
BEGIN
    -- Update pilot_checks statuses
    UPDATE pilot_checks SET 
        status = CASE 
            WHEN expiry_date < CURRENT_DATE THEN 'expired'
            WHEN expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'expiring_soon'
            ELSE 'valid'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE status != CASE 
        WHEN expiry_date < CURRENT_DATE THEN 'expired'
        WHEN expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'expiring_soon'
        ELSE 'valid'
    END;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    update_count := update_count + rows_affected;

    -- Update pilot_documents statuses
    UPDATE pilot_documents SET 
        status = CASE 
            WHEN expiry_date < CURRENT_DATE THEN 'expired'
            WHEN expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'expiring_soon'
            ELSE 'valid'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE expiry_date IS NOT NULL
    AND status != CASE 
        WHEN expiry_date < CURRENT_DATE THEN 'expired'
        WHEN expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'expiring_soon'
        ELSE 'valid'
    END;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    update_count := update_count + rows_affected;

    -- Update pilot_visas statuses if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pilot_visas') THEN
        UPDATE pilot_visas SET 
            status = CASE 
                WHEN expiry_date < CURRENT_DATE THEN 'expired'
                WHEN expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'expiring_soon'
                ELSE 'valid'
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE status NOT IN ('cancelled', 'pending_renewal')
        AND status != CASE 
            WHEN expiry_date < CURRENT_DATE THEN 'expired'
            WHEN expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'expiring_soon'
            ELSE 'valid'
        END;
        
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        update_count := update_count + rows_affected;
    END IF;

    -- Update refresher courses statuses
    UPDATE pilot_refresher_courses SET 
        status = CASE 
            WHEN expiry_date < CURRENT_DATE THEN 'expired'
            ELSE status
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE expiry_date IS NOT NULL
    AND expiry_date < CURRENT_DATE
    AND status != 'expired';
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    update_count := update_count + rows_affected;

    RETURN update_count;
END;
$$;


ALTER FUNCTION "public"."update_all_expiry_statuses"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_all_expiry_statuses"() IS 'Updates status fields across all tables based on current expiry dates';



CREATE OR REPLACE FUNCTION "public"."update_auth_users_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_auth_users_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_category_post_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.feedback_categories SET post_count = post_count + 1 WHERE id = NEW.category_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.feedback_categories SET post_count = post_count - 1 WHERE id = OLD.category_id AND post_count > 0;
    ELSIF TG_OP = 'UPDATE' AND OLD.category_id != NEW.category_id THEN
        UPDATE public.feedback_categories SET post_count = post_count - 1 WHERE id = OLD.category_id AND post_count > 0;
        UPDATE public.feedback_categories SET post_count = post_count + 1 WHERE id = NEW.category_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_category_post_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_certification_status"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  -- Mark expired certifications
  UPDATE pilot_certifications 
  SET status = 'expired', updated_at = NOW()
  WHERE expiry_date < CURRENT_DATE AND status = 'valid';

  -- Create expired alerts for newly expired certifications
  INSERT INTO certification_alerts (
    pilot_id,
    certification_id,
    alert_type,
    alert_date,
    expiry_date,
    message,
    severity
  )
  SELECT 
    pc.pilot_id,
    pc.id,
    'expired',
    CURRENT_DATE,
    pc.expiry_date,
    'EXPIRED: ' || ct.name || ' expired on ' || pc.expiry_date::TEXT,
    'critical'
  FROM pilot_certifications pc
  JOIN certification_types ct ON pc.certification_type_id = ct.id
  WHERE pc.status = 'expired' 
  AND pc.expiry_date < CURRENT_DATE
  AND NOT EXISTS (
    SELECT 1 FROM certification_alerts ca 
    WHERE ca.certification_id = pc.id 
    AND ca.alert_type = 'expired'
  );
END;
$$;


ALTER FUNCTION "public"."update_certification_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_check_expiry_dates"() RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    updated_rows INTEGER;
BEGIN
    UPDATE crew_checks
    SET
        validity_status = CASE
            WHEN expiry_date IS NULL THEN 'unknown'
            WHEN expiry_date < CURRENT_DATE THEN 'expired'
            WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring'
            ELSE 'current'
        END,
        status = CASE
            WHEN expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE THEN 'expired'
            WHEN status IS NULL THEN 'valid'
            ELSE status
        END,
        updated_at = NOW()
    WHERE expiry_date IS NOT NULL;

    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    RETURN COALESCE(updated_rows, 0);
END;
$$;


ALTER FUNCTION "public"."update_check_expiry_dates"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_check_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    days_left INTEGER;
    warning_days INTEGER;
    critical_days INTEGER;
BEGIN
    -- Get warning and critical days from check_types
    SELECT ct.warning_days, ct.critical_days
    INTO warning_days, critical_days
    FROM public.check_types ct
    WHERE ct.id = NEW.check_type_id;
    
    days_left := NEW.expiry_date - CURRENT_DATE;
    
    IF days_left < 0 THEN
        NEW.status = 'expired';
    ELSIF days_left <= critical_days THEN
        NEW.status = 'expiring_soon';
    ELSIF days_left <= warning_days THEN
        NEW.status = 'expiring_soon';
    ELSE
        NEW.status = 'valid';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_check_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_check_statuses"() RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    updated_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Update expired checks
    UPDATE crew_checks 
    SET status = 'expired', updated_at = NOW()
    WHERE expiry_date < CURRENT_DATE 
        AND status != 'expired';
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    updated_count := updated_count + temp_count;
    
    -- Update expiring soon checks (within 90 days)
    UPDATE crew_checks 
    SET status = 'expiring_soon', updated_at = NOW()
    WHERE expiry_date >= CURRENT_DATE 
        AND expiry_date <= CURRENT_DATE + INTERVAL '90 days'
        AND status != 'expiring_soon'
        AND status != 'expired';
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    updated_count := updated_count + temp_count;
    
    -- Update valid checks
    UPDATE crew_checks 
    SET status = 'valid', updated_at = NOW()
    WHERE expiry_date > CURRENT_DATE + INTERVAL '90 days'
        AND status != 'valid';
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    updated_count := updated_count + temp_count;
    
    RETURN updated_count;
END;
$$;


ALTER FUNCTION "public"."update_check_statuses"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_crew_certification_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.status := CASE
        WHEN NEW.expiry_date < CURRENT_DATE THEN 'EXPIRED'::certification_status
        WHEN NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING'::certification_status
        ELSE 'VALID'::certification_status
    END;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_crew_certification_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_crew_instructor_status"("p_crew_member_id" "uuid", "p_is_tre" boolean DEFAULT NULL::boolean, "p_is_tri" boolean DEFAULT NULL::boolean) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE crew_members 
    SET 
        is_tre = COALESCE(p_is_tre, is_tre),
        is_tri = COALESCE(p_is_tri, is_tri),
        updated_at = NOW(),
        updated_by = 'skycruzer@icloud.com'
    WHERE id = p_crew_member_id;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."update_crew_instructor_status"("p_crew_member_id" "uuid", "p_is_tre" boolean, "p_is_tri" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_flight_requests_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_flight_requests_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_full_name"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.full_name = TRIM(
        COALESCE(NEW.first_name, '') || ' ' ||
        COALESCE(NEW.middle_name, '') || ' ' ||
        COALESCE(NEW.last_name, '')
    );
    -- Remove extra spaces
    NEW.full_name = REGEXP_REPLACE(NEW.full_name, '\s+', ' ', 'g');
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_full_name"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_pilot_checks_status"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    UPDATE pilot_checks
    SET 
        status = calculate_check_status(
            expiry_date, 
            (SELECT warning_days FROM check_types WHERE id = pilot_checks.check_type_id),
            (SELECT critical_days FROM check_types WHERE id = pilot_checks.check_type_id)
        ),
        updated_at = now()
    WHERE status != calculate_check_status(
        expiry_date, 
        (SELECT warning_days FROM check_types WHERE id = pilot_checks.check_type_id),
        (SELECT critical_days FROM check_types WHERE id = pilot_checks.check_type_id)
    );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;


ALTER FUNCTION "public"."update_pilot_checks_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_pilot_feedback_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_pilot_feedback_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_pilot_leave_summary"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF TG_OP IN ('INSERT','UPDATE') THEN
        INSERT INTO pilot_leave_summary (pilot_id, year, annual_leave_taken, sick_leave_taken, total_leave_taken, last_updated)
        VALUES (
            NEW.pilot_id,
            NEW.year,
            COALESCE((SELECT SUM(total_days) FROM pilot_leave_records WHERE pilot_id = NEW.pilot_id AND year = NEW.year AND leave_type = 'Annual'), 0),
            COALESCE((SELECT SUM(total_days) FROM pilot_leave_records WHERE pilot_id = NEW.pilot_id AND year = NEW.year AND leave_type = 'Sick'), 0),
            COALESCE((SELECT SUM(total_days) FROM pilot_leave_records WHERE pilot_id = NEW.pilot_id AND year = NEW.year), 0),
            NOW()
        )
        ON CONFLICT (pilot_id, year) DO UPDATE SET
            annual_leave_taken = EXCLUDED.annual_leave_taken,
            sick_leave_taken = EXCLUDED.sick_leave_taken,
            total_leave_taken = EXCLUDED.total_leave_taken,
            last_updated = NOW();
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO pilot_leave_summary (pilot_id, year, annual_leave_taken, sick_leave_taken, total_leave_taken, last_updated)
        VALUES (
            OLD.pilot_id,
            OLD.year,
            COALESCE((SELECT SUM(total_days) FROM pilot_leave_records WHERE pilot_id = OLD.pilot_id AND year = OLD.year AND leave_type = 'Annual'), 0),
            COALESCE((SELECT SUM(total_days) FROM pilot_leave_records WHERE pilot_id = OLD.pilot_id AND year = OLD.year AND leave_type = 'Sick'), 0),
            COALESCE((SELECT SUM(total_days) FROM pilot_leave_records WHERE pilot_id = OLD.pilot_id AND year = OLD.year), 0),
            NOW()
        )
        ON CONFLICT (pilot_id, year) DO UPDATE SET
            annual_leave_taken = EXCLUDED.annual_leave_taken,
            sick_leave_taken = EXCLUDED.sick_leave_taken,
            total_leave_taken = EXCLUDED.total_leave_taken,
            last_updated = NOW();
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_pilot_leave_summary"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_pilot_users_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_pilot_users_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_position_from_role_code"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NEW.role_code IS NOT NULL THEN
        CASE NEW.role_code
            WHEN 'CPT', 'CAPT', 'CAPTAIN' THEN
                NEW.position := 'Line Captain';
            WHEN 'FO', 'FIRST_OFFICER' THEN
                NEW.position := 'Line First Officer';
            ELSE
                -- Default fallback
                NEW.position := COALESCE(NEW.position, 'Line First Officer');
        END CASE;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_position_from_role_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_post_comment_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.feedback_posts SET comment_count = comment_count + 1, updated_at = NOW() WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.feedback_posts SET comment_count = GREATEST(comment_count - 1, 0), updated_at = NOW() WHERE id = OLD.post_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_post_comment_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_renewal_plan_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_renewal_plan_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_system_settings"("p_user_email" "text", "p_setting_type" "text" DEFAULT 'system_config'::"text", "p_fleet_size" integer DEFAULT 1, "p_required_captains_per_aircraft" integer DEFAULT 19, "p_required_first_officers_per_aircraft" integer DEFAULT 5, "p_training_captain_ratio" numeric DEFAULT 11, "p_examiner_ratio" numeric DEFAULT 11, "p_alert_days_critical" integer DEFAULT 7, "p_alert_days_warning" integer DEFAULT 30, "p_alert_days_info" integer DEFAULT 90, "p_email_notifications" boolean DEFAULT true, "p_sms_notifications" boolean DEFAULT false, "p_system_timezone" "text" DEFAULT 'UTC'::"text", "p_backup_frequency" "text" DEFAULT 'daily'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result_record system_settings;
BEGIN
  -- Insert or update system settings record
  INSERT INTO system_settings (
    user_email,
    setting_type,
    fleet_size,
    required_captains_per_aircraft,
    required_first_officers_per_aircraft,
    training_captain_ratio,
    examiner_ratio,
    alert_days_critical,
    alert_days_warning,
    alert_days_info,
    email_notifications,
    sms_notifications,
    system_timezone,
    backup_frequency,
    updated_at
  )
  VALUES (
    p_user_email,
    p_setting_type,
    p_fleet_size,
    p_required_captains_per_aircraft,
    p_required_first_officers_per_aircraft,
    p_training_captain_ratio,
    p_examiner_ratio,
    p_alert_days_critical,
    p_alert_days_warning,
    p_alert_days_info,
    p_email_notifications,
    p_sms_notifications,
    p_system_timezone,
    p_backup_frequency,
    NOW()
  )
  ON CONFLICT (user_email, setting_type)
  DO UPDATE SET
    fleet_size = EXCLUDED.fleet_size,
    required_captains_per_aircraft = EXCLUDED.required_captains_per_aircraft,
    required_first_officers_per_aircraft = EXCLUDED.required_first_officers_per_aircraft,
    training_captain_ratio = EXCLUDED.training_captain_ratio,
    examiner_ratio = EXCLUDED.examiner_ratio,
    alert_days_critical = EXCLUDED.alert_days_critical,
    alert_days_warning = EXCLUDED.alert_days_warning,
    alert_days_info = EXCLUDED.alert_days_info,
    email_notifications = EXCLUDED.email_notifications,
    sms_notifications = EXCLUDED.sms_notifications,
    system_timezone = EXCLUDED.system_timezone,
    backup_frequency = EXCLUDED.backup_frequency,
    updated_at = NOW()
  RETURNING * INTO result_record;

  -- Return the result as JSON
  RETURN row_to_json(result_record);
END;
$$;


ALTER FUNCTION "public"."upsert_system_settings"("p_user_email" "text", "p_setting_type" "text", "p_fleet_size" integer, "p_required_captains_per_aircraft" integer, "p_required_first_officers_per_aircraft" integer, "p_training_captain_ratio" numeric, "p_examiner_ratio" numeric, "p_alert_days_critical" integer, "p_alert_days_warning" integer, "p_alert_days_info" integer, "p_email_notifications" boolean, "p_sms_notifications" boolean, "p_system_timezone" "text", "p_backup_frequency" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_admin_role"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN get_current_user_role() = 'admin';
END;
$$;


ALTER FUNCTION "public"."user_has_admin_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_admin_role"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = $1 AND role = 'admin'
    );
END;
$_$;


ALTER FUNCTION "public"."user_has_admin_role"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_role"("required_roles" "text"[]) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN get_current_user_role() = ANY(required_roles);
END;
$$;


ALTER FUNCTION "public"."user_has_role"("required_roles" "text"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."user_has_role"("required_roles" "text"[]) IS 'Checks if the current user has any of the specified roles';



CREATE OR REPLACE FUNCTION "public"."validate_crew_member_completeness"() RETURNS TABLE("crew_member_id" "uuid", "employee_id" character varying, "missing_fields" "text"[], "severity" character varying, "compliance_impact" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.id,
        cm.employee_id,
        ARRAY_AGG(DISTINCT 
            CASE 
                WHEN cm.email IS NULL THEN 'email'
                WHEN cm.birth_date IS NULL THEN 'birth_date'
                WHEN cm.hire_date IS NULL THEN 'hire_date'
                WHEN cm.home_base_id IS NULL THEN 'home_base'
                WHEN cm.pilot_license_number IS NULL AND cm.position_id IN (
                    SELECT id FROM job_positions WHERE requires_license = true
                ) THEN 'pilot_license_number'
                WHEN cm.medical_certificate_expiry IS NULL AND cm.position_id IN (
                    SELECT id FROM job_positions WHERE requires_medical = true
                ) THEN 'medical_certificate'
                WHEN cm.passport_number IS NULL THEN 'passport_number'
                WHEN cm.passport_expiry_date IS NULL THEN 'passport_expiry'
                ELSE NULL
            END
        ) FILTER (WHERE CASE 
            WHEN cm.email IS NULL THEN 'email'
            WHEN cm.birth_date IS NULL THEN 'birth_date'
            WHEN cm.hire_date IS NULL THEN 'hire_date'
            WHEN cm.home_base_id IS NULL THEN 'home_base'
            WHEN cm.pilot_license_number IS NULL AND cm.position_id IN (
                SELECT id FROM job_positions WHERE requires_license = true
            ) THEN 'pilot_license_number'
            WHEN cm.medical_certificate_expiry IS NULL AND cm.position_id IN (
                SELECT id FROM job_positions WHERE requires_medical = true
            ) THEN 'medical_certificate'
            WHEN cm.passport_number IS NULL THEN 'passport_number'
            WHEN cm.passport_expiry_date IS NULL THEN 'passport_expiry'
            ELSE NULL
        END IS NOT NULL),
        CASE 
            WHEN (cm.pilot_license_number IS NULL AND cm.position_id IN (
                SELECT id FROM job_positions WHERE requires_license = true
            )) OR (cm.medical_certificate_expiry IS NULL AND cm.position_id IN (
                SELECT id FROM job_positions WHERE requires_medical = true
            )) THEN 'critical'
            WHEN cm.email IS NULL OR cm.passport_number IS NULL THEN 'warning'
            ELSE 'info'
        END::VARCHAR,
        CASE 
            WHEN (cm.pilot_license_number IS NULL AND cm.position_id IN (
                SELECT id FROM job_positions WHERE requires_license = true
            )) THEN 'Cannot operate without valid license'
            WHEN (cm.medical_certificate_expiry IS NULL AND cm.position_id IN (
                SELECT id FROM job_positions WHERE requires_medical = true
            )) THEN 'Cannot operate without valid medical'
            WHEN cm.passport_number IS NULL THEN 'International operations restricted'
            ELSE 'Administrative impact only'
        END::TEXT
    FROM crew_members cm
    WHERE cm.employee_status = 'active'
    GROUP BY cm.id, cm.employee_id, cm.pilot_license_number, cm.medical_certificate_expiry, 
             cm.email, cm.birth_date, cm.hire_date, cm.home_base_id, cm.passport_number, 
             cm.passport_expiry_date, cm.position_id
    HAVING COUNT(*) FILTER (WHERE CASE 
        WHEN cm.email IS NULL THEN 'email'
        WHEN cm.birth_date IS NULL THEN 'birth_date'
        WHEN cm.hire_date IS NULL THEN 'hire_date'
        WHEN cm.home_base_id IS NULL THEN 'home_base'
        WHEN cm.pilot_license_number IS NULL AND cm.position_id IN (
            SELECT id FROM job_positions WHERE requires_license = true
        ) THEN 'pilot_license_number'
        WHEN cm.medical_certificate_expiry IS NULL AND cm.position_id IN (
            SELECT id FROM job_positions WHERE requires_medical = true
        ) THEN 'medical_certificate'
        WHEN cm.passport_number IS NULL THEN 'passport_number'
        WHEN cm.passport_expiry_date IS NULL THEN 'passport_expiry'
        ELSE NULL
    END IS NOT NULL) > 0;
END;
$$;


ALTER FUNCTION "public"."validate_crew_member_completeness"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_crew_references"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Ensure instructor exists and is qualified
    IF NEW.instructor_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM crew_members 
            WHERE id = NEW.instructor_id 
            AND employee_status = 'active' 
            AND is_instructor = true
        ) THEN
            RAISE EXCEPTION 'Instructor must be an active crew member with instructor qualification';
        END IF;
    END IF;

    -- Ensure examiner exists and is qualified
    IF NEW.examiner_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM crew_members 
            WHERE id = NEW.examiner_id 
            AND employee_status = 'active' 
            AND is_examiner = true
        ) THEN
            RAISE EXCEPTION 'Examiner must be an active crew member with examiner qualification';
        END IF;
    END IF;

    -- Ensure crew member is active
    IF NEW.crew_member_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM crew_members 
            WHERE id = NEW.crew_member_id 
            AND employee_status = 'active'
        ) THEN
            RAISE EXCEPTION 'Crew member must be active to schedule checks';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_crew_references"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_expiry_date"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
    IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date < CURRENT_DATE - INTERVAL '10 years' THEN
        RAISE EXCEPTION 'Expiry date cannot be more than 10 years in the past';
    END IF;
    IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date > CURRENT_DATE + INTERVAL '20 years' THEN
        RAISE EXCEPTION 'Expiry date cannot be more than 20 years in the future';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_expiry_date"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."an_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "name" character varying(255) NOT NULL,
    "role" character varying(50) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_type" "text" DEFAULT 'admin'::"text",
    CONSTRAINT "an_users_role_check" CHECK ((("role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"])))
);


ALTER TABLE "public"."an_users" OWNER TO "postgres";


COMMENT ON TABLE "public"."an_users" IS 'Admin and manager user accounts for system access';



COMMENT ON COLUMN "public"."an_users"."created_at" IS 'Account creation timestamp (UTC with timezone)';



COMMENT ON COLUMN "public"."an_users"."updated_at" IS 'Last update timestamp (UTC with timezone)';



CREATE TABLE IF NOT EXISTS "public"."task_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "color" character varying(7),
    "icon" character varying(50),
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."task_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(200) NOT NULL,
    "description" "text",
    "category_id" "uuid",
    "priority" character varying(20) DEFAULT 'MEDIUM'::character varying NOT NULL,
    "status" character varying(50) DEFAULT 'TODO'::character varying NOT NULL,
    "created_by" "uuid" NOT NULL,
    "assigned_to" "uuid",
    "related_pilot_id" "uuid",
    "related_matter_id" "uuid",
    "due_date" timestamp with time zone,
    "completed_date" timestamp with time zone,
    "estimated_hours" numeric(5,2),
    "actual_hours" numeric(5,2),
    "is_recurring" boolean DEFAULT false,
    "recurrence_pattern" "jsonb",
    "parent_task_id" "uuid",
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "checklist_items" "jsonb" DEFAULT '[]'::"jsonb",
    "progress_percentage" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tasks_priority_check" CHECK ((("priority")::"text" = ANY (ARRAY[('LOW'::character varying)::"text", ('MEDIUM'::character varying)::"text", ('HIGH'::character varying)::"text", ('URGENT'::character varying)::"text"]))),
    CONSTRAINT "tasks_progress_percentage_check" CHECK ((("progress_percentage" >= 0) AND ("progress_percentage" <= 100))),
    CONSTRAINT "tasks_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('TODO'::character varying)::"text", ('IN_PROGRESS'::character varying)::"text", ('BLOCKED'::character varying)::"text", ('COMPLETED'::character varying)::"text", ('CANCELLED'::character varying)::"text"])))
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


COMMENT ON TABLE "public"."tasks" IS 'Task management system for fleet operations';



CREATE OR REPLACE VIEW "public"."active_tasks_dashboard" WITH ("security_invoker"='true') AS
 SELECT "t"."id",
    "t"."title",
    "t"."description",
    "t"."status",
    "t"."priority",
    "t"."category_id",
    "t"."due_date",
    "t"."assigned_to",
    "t"."created_by",
    "t"."created_at",
    "t"."updated_at",
    "u"."name" AS "assigned_to_name",
    "creator"."name" AS "created_by_name",
    "cat"."name" AS "category_name"
   FROM ((("public"."tasks" "t"
     LEFT JOIN "public"."an_users" "u" ON (("t"."assigned_to" = "u"."id")))
     LEFT JOIN "public"."an_users" "creator" ON (("t"."created_by" = "creator"."id")))
     LEFT JOIN "public"."task_categories" "cat" ON (("t"."category_id" = "cat"."id")))
  WHERE (("t"."status")::"text" = ANY (ARRAY[('PENDING'::character varying)::"text", ('IN_PROGRESS'::character varying)::"text"]))
  ORDER BY
        CASE "t"."priority"
            WHEN 'URGENT'::"text" THEN 1
            WHEN 'HIGH'::"text" THEN 2
            WHEN 'NORMAL'::"text" THEN 3
            WHEN 'LOW'::"text" THEN 4
            ELSE NULL::integer
        END, "t"."due_date", "t"."created_at" DESC;


ALTER VIEW "public"."active_tasks_dashboard" OWNER TO "postgres";


COMMENT ON VIEW "public"."active_tasks_dashboard" IS 'Active and pending tasks for dashboard display';



CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at_png" timestamp with time zone,
    "user_id" "uuid",
    "user_email" "text",
    "user_role" "text",
    "action" "text" NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "old_values" "jsonb",
    "new_values" "jsonb",
    "changed_fields" "text"[],
    "description" "text",
    "ip_address" "inet",
    "user_agent" "text",
    CONSTRAINT "audit_logs_action_check" CHECK (("action" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text", 'RESTORE'::"text", 'SOFT_DELETE'::"text"])))
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."audit_logs" IS 'Comprehensive audit trail for all CRUD operations';



COMMENT ON COLUMN "public"."audit_logs"."created_at_png" IS 'PNG timezone timestamp for display';



COMMENT ON COLUMN "public"."audit_logs"."changed_fields" IS 'Array of field names that were modified';



COMMENT ON COLUMN "public"."audit_logs"."description" IS 'Human-readable description of the action';



CREATE TABLE IF NOT EXISTS "public"."pilots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "first_name" character varying(100) NOT NULL,
    "middle_name" character varying(100),
    "last_name" character varying(100) NOT NULL,
    "role" "public"."pilot_role" NOT NULL,
    "nationality" character varying(100),
    "passport_number" character varying(50),
    "passport_expiry" "date",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "employee_id" character varying(50) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "date_of_birth" "date",
    "commencement_date" "date",
    "captain_qualifications" "jsonb" DEFAULT '[]'::"jsonb",
    "qualification_notes" "text",
    "rhs_captain_expiry" "date",
    "contract_type" character varying(100),
    "seniority_number" integer,
    "contract_type_id" "uuid",
    "user_id" "uuid",
    CONSTRAINT "pilots_commencement_date_not_future" CHECK ((("commencement_date" IS NULL) OR ("commencement_date" <= CURRENT_DATE))),
    CONSTRAINT "pilots_dob_reasonable" CHECK ((("date_of_birth" IS NULL) OR (("date_of_birth" <= CURRENT_DATE) AND ("date_of_birth" >= (CURRENT_DATE - '80 years'::interval))))),
    CONSTRAINT "pilots_seniority_number_positive" CHECK ((("seniority_number" IS NULL) OR ("seniority_number" > 0)))
);


ALTER TABLE "public"."pilots" OWNER TO "postgres";


COMMENT ON TABLE "public"."pilots" IS 'Core pilot information including qualifications and seniority';



COMMENT ON COLUMN "public"."pilots"."captain_qualifications" IS 'Array of captain qualification types: line_captain, training_captain, examiner';



COMMENT ON COLUMN "public"."pilots"."qualification_notes" IS 'Additional notes about pilot qualifications';



COMMENT ON COLUMN "public"."pilots"."rhs_captain_expiry" IS 'RHS (Right Hand Seat) Captain qualification expiry date - only applicable to pilots with Captain role';



COMMENT ON COLUMN "public"."pilots"."contract_type" IS 'DEPRECATED: Use contract_type_id instead. This column references text name which is fragile.';



COMMENT ON COLUMN "public"."pilots"."seniority_number" IS 'Pilot seniority number based on commencement date (1 = most senior)';



COMMENT ON COLUMN "public"."pilots"."contract_type_id" IS 'Foreign key to contract_types.id - Use this for contract type relationships';



COMMENT ON COLUMN "public"."pilots"."user_id" IS 'Links pilot record to Supabase Auth user for portal access';



COMMENT ON CONSTRAINT "pilots_commencement_date_not_future" ON "public"."pilots" IS 'Ensures pilot commencement date is not in the future';



COMMENT ON CONSTRAINT "pilots_dob_reasonable" ON "public"."pilots" IS 'Ensures pilot date of birth is not in the future and not more than 80 years ago';



COMMENT ON CONSTRAINT "pilots_seniority_number_positive" ON "public"."pilots" IS 'Ensures pilot seniority number is always positive when set';



CREATE OR REPLACE VIEW "public"."captain_qualifications_summary" WITH ("security_invoker"='true') AS
 SELECT "id",
    "first_name",
    "last_name",
    "employee_id",
    "role",
    "captain_qualifications"
   FROM "public"."pilots" "p"
  WHERE ("role" = 'Captain'::"public"."pilot_role");


ALTER VIEW "public"."captain_qualifications_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."captain_qualifications_summary" IS 'Captain-specific qualifications tracking';



CREATE TABLE IF NOT EXISTS "public"."certification_renewal_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pilot_id" "uuid" NOT NULL,
    "check_type_id" "uuid" NOT NULL,
    "original_expiry_date" "date" NOT NULL,
    "planned_renewal_date" "date" NOT NULL,
    "planned_roster_period" character varying(20) NOT NULL,
    "renewal_window_start" "date" NOT NULL,
    "renewal_window_end" "date" NOT NULL,
    "paired_pilot_id" "uuid",
    "pair_group_id" "uuid",
    "status" character varying(20) DEFAULT 'planned'::character varying NOT NULL,
    "priority" integer DEFAULT 0 NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "certification_renewal_plans_priority_check" CHECK ((("priority" >= 0) AND ("priority" <= 10))),
    CONSTRAINT "valid_dates" CHECK (("renewal_window_start" <= "renewal_window_end")),
    CONSTRAINT "valid_renewal_window" CHECK ((("renewal_window_start" <= "planned_renewal_date") AND ("planned_renewal_date" <= "renewal_window_end"))),
    CONSTRAINT "valid_status" CHECK ((("status")::"text" = ANY ((ARRAY['planned'::character varying, 'confirmed'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."certification_renewal_plans" OWNER TO "postgres";


COMMENT ON TABLE "public"."certification_renewal_plans" IS 'Stores planned renewal schedule for pilot certifications with pairing support';



COMMENT ON COLUMN "public"."certification_renewal_plans"."renewal_window_start" IS 'Earliest date renewal can occur (expiry_date - grace_period)';



COMMENT ON COLUMN "public"."certification_renewal_plans"."renewal_window_end" IS 'Latest date renewal can occur (original expiry_date)';



COMMENT ON COLUMN "public"."certification_renewal_plans"."pair_group_id" IS 'UUID grouping multiple pilots scheduled for same renewal window';



COMMENT ON COLUMN "public"."certification_renewal_plans"."priority" IS 'Urgency scale 0-10 where 10 is most urgent';



CREATE TABLE IF NOT EXISTS "public"."check_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "check_code" character varying(50) NOT NULL,
    "check_description" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "category" character varying(100)
);


ALTER TABLE "public"."check_types" OWNER TO "postgres";


COMMENT ON TABLE "public"."check_types" IS 'Definition of certification types and categories';



CREATE TABLE IF NOT EXISTS "public"."pilot_checks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pilot_id" "uuid" NOT NULL,
    "check_type_id" "uuid" NOT NULL,
    "expiry_date" "date",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "pilot_checks_expiry_retention" CHECK ((("expiry_date" IS NULL) OR ("expiry_date" >= (CURRENT_DATE - '7 years'::interval))))
);


ALTER TABLE "public"."pilot_checks" OWNER TO "postgres";


COMMENT ON TABLE "public"."pilot_checks" IS 'Certification tracking for pilots with expiry dates';



COMMENT ON CONSTRAINT "pilot_checks_expiry_retention" ON "public"."pilot_checks" IS 'Ensures certification expiry dates are not more than 7 years in the past (data retention policy)';



CREATE OR REPLACE VIEW "public"."compliance_dashboard" WITH ("security_invoker"='true') AS
 SELECT "count"(DISTINCT "p"."id") AS "total_pilots",
    "count"(DISTINCT "p"."id") FILTER (WHERE ("p"."role" = 'Captain'::"public"."pilot_role")) AS "total_captains",
    "count"(DISTINCT "p"."id") FILTER (WHERE ("p"."role" = 'First Officer'::"public"."pilot_role")) AS "total_first_officers",
    "count"("pc"."id") AS "total_checks",
    "count"("pc"."id") FILTER (WHERE ("pc"."expiry_date" < CURRENT_DATE)) AS "expired_checks",
    "count"("pc"."id") FILTER (WHERE (("pc"."expiry_date" >= CURRENT_DATE) AND ("pc"."expiry_date" <= (CURRENT_DATE + '30 days'::interval)))) AS "expiring_soon"
   FROM ("public"."pilots" "p"
     LEFT JOIN "public"."pilot_checks" "pc" ON (("p"."id" = "pc"."pilot_id")));


ALTER VIEW "public"."compliance_dashboard" OWNER TO "postgres";


COMMENT ON VIEW "public"."compliance_dashboard" IS 'Fleet-wide compliance metrics and statistics';



CREATE TABLE IF NOT EXISTS "public"."contract_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."contract_types" OWNER TO "postgres";


COMMENT ON TABLE "public"."contract_types" IS 'Employment contract type definitions';



CREATE OR REPLACE VIEW "public"."detailed_expiring_checks" WITH ("security_invoker"='true') AS
 SELECT "pc"."id",
    "pc"."pilot_id",
    "pc"."check_type_id",
    "pc"."expiry_date",
    "p"."first_name",
    "p"."last_name",
    "p"."employee_id",
    "p"."role",
    "ct"."check_code",
    "ct"."check_description",
    "ct"."category",
        CASE
            WHEN ("pc"."expiry_date" < CURRENT_DATE) THEN 'expired'::"text"
            WHEN ("pc"."expiry_date" <= (CURRENT_DATE + '30 days'::interval)) THEN 'expiring_soon'::"text"
            ELSE 'current'::"text"
        END AS "status"
   FROM (("public"."pilot_checks" "pc"
     JOIN "public"."pilots" "p" ON (("pc"."pilot_id" = "p"."id")))
     JOIN "public"."check_types" "ct" ON (("pc"."check_type_id" = "ct"."id")))
  WHERE ("pc"."expiry_date" IS NOT NULL);


ALTER VIEW "public"."detailed_expiring_checks" OWNER TO "postgres";


COMMENT ON VIEW "public"."detailed_expiring_checks" IS 'Detailed view with FAA color coding for expiring certifications';



CREATE TABLE IF NOT EXISTS "public"."digital_forms" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "form_type" character varying(100) NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "form_schema" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "requires_approval" boolean DEFAULT true,
    "allowed_roles" "text"[],
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."digital_forms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."disciplinary_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "matter_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" character varying(50) NOT NULL,
    "field_changed" character varying(100),
    "old_value" "text",
    "new_value" "text",
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."disciplinary_audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."disciplinary_audit_log" IS 'Audit trail for all disciplinary matter changes';



CREATE TABLE IF NOT EXISTS "public"."disciplinary_matters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pilot_id" "uuid" NOT NULL,
    "incident_type_id" "uuid" NOT NULL,
    "incident_date" "date" NOT NULL,
    "reported_by" "uuid" NOT NULL,
    "reported_date" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "severity" character varying(20) NOT NULL,
    "status" character varying(50) DEFAULT 'OPEN'::character varying NOT NULL,
    "title" character varying(200) NOT NULL,
    "description" "text" NOT NULL,
    "location" character varying(200),
    "flight_number" character varying(20),
    "aircraft_registration" character varying(20),
    "witnesses" "jsonb" DEFAULT '[]'::"jsonb",
    "evidence_files" "jsonb" DEFAULT '[]'::"jsonb",
    "corrective_actions" "text",
    "resolution_notes" "text",
    "assigned_to" "uuid",
    "due_date" "date",
    "resolved_date" "date",
    "resolved_by" "uuid",
    "impact_on_operations" "text",
    "regulatory_notification_required" boolean DEFAULT false,
    "regulatory_body" character varying(100),
    "notification_date" "date",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "disciplinary_matters_severity_check" CHECK ((("severity")::"text" = ANY (ARRAY[('MINOR'::character varying)::"text", ('MODERATE'::character varying)::"text", ('SERIOUS'::character varying)::"text", ('CRITICAL'::character varying)::"text"]))),
    CONSTRAINT "disciplinary_matters_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('OPEN'::character varying)::"text", ('UNDER_INVESTIGATION'::character varying)::"text", ('RESOLVED'::character varying)::"text", ('CLOSED'::character varying)::"text", ('APPEALED'::character varying)::"text"])))
);


ALTER TABLE "public"."disciplinary_matters" OWNER TO "postgres";


COMMENT ON TABLE "public"."disciplinary_matters" IS 'Disciplinary incidents and tracking';



CREATE TABLE IF NOT EXISTS "public"."document_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "icon" character varying(50),
    "color" character varying(20) DEFAULT '#2563EB'::character varying,
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."document_categories" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."expiring_checks" WITH ("security_invoker"='true') AS
 SELECT "pc"."id",
    "pc"."pilot_id",
    "pc"."check_type_id",
    "pc"."expiry_date",
    "p"."first_name",
    "p"."last_name",
    "p"."employee_id",
    "ct"."check_code",
    "ct"."check_description",
    "ct"."category"
   FROM (("public"."pilot_checks" "pc"
     JOIN "public"."pilots" "p" ON (("pc"."pilot_id" = "p"."id")))
     JOIN "public"."check_types" "ct" ON (("pc"."check_type_id" = "ct"."id")))
  WHERE (("pc"."expiry_date" IS NOT NULL) AND ("pc"."expiry_date" <= (CURRENT_DATE + '60 days'::interval)));


ALTER VIEW "public"."expiring_checks" OWNER TO "postgres";


COMMENT ON VIEW "public"."expiring_checks" IS 'Certifications expiring within 60 days';



CREATE OR REPLACE VIEW "public"."expiring_checks_optimized" WITH ("security_invoker"='true') AS
 SELECT "pc"."id",
    "pc"."pilot_id",
    "pc"."expiry_date",
    ((("p"."first_name")::"text" || ' '::"text") || ("p"."last_name")::"text") AS "pilot_name",
    "p"."employee_id",
    "ct"."check_code",
    "ct"."check_description"
   FROM (("public"."pilot_checks" "pc"
     JOIN "public"."pilots" "p" ON (("pc"."pilot_id" = "p"."id")))
     JOIN "public"."check_types" "ct" ON (("pc"."check_type_id" = "ct"."id")))
  WHERE ("pc"."expiry_date" <= (CURRENT_DATE + '60 days'::interval));


ALTER VIEW "public"."expiring_checks_optimized" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text" DEFAULT '💬'::"text",
    "slug" "text" NOT NULL,
    "created_by" "uuid",
    "created_by_type" "text" DEFAULT 'pilot'::"text",
    "post_count" integer DEFAULT 0,
    "is_archived" boolean DEFAULT false,
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "feedback_categories_created_by_type_check" CHECK (("created_by_type" = ANY (ARRAY['pilot'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."feedback_categories" OWNER TO "postgres";


COMMENT ON TABLE "public"."feedback_categories" IS 'User-created discussion categories - Created 2025-01-10';



CREATE TABLE IF NOT EXISTS "public"."flight_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pilot_id" "uuid" NOT NULL,
    "pilot_user_id" "uuid",
    "request_type" character varying(50) NOT NULL,
    "flight_date" "date" NOT NULL,
    "description" "text" NOT NULL,
    "reason" "text",
    "status" character varying(50) DEFAULT 'PENDING'::character varying,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "reviewer_comments" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "flight_requests_date_not_past" CHECK (("flight_date" >= CURRENT_DATE)),
    CONSTRAINT "flight_requests_request_type_check" CHECK ((("request_type")::"text" = ANY ((ARRAY['ADDITIONAL_FLIGHT'::character varying, 'ROUTE_CHANGE'::character varying, 'SCHEDULE_PREFERENCE'::character varying, 'TRAINING_FLIGHT'::character varying, 'OTHER'::character varying])::"text"[]))),
    CONSTRAINT "flight_requests_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'DENIED'::character varying])::"text"[])))
);


ALTER TABLE "public"."flight_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."flight_requests" IS 'Flight requests for additional flights, routes, or schedule changes';



COMMENT ON CONSTRAINT "flight_requests_date_not_past" ON "public"."flight_requests" IS 'Ensures that flight request date is today or in the future (prevents backdating)';



CREATE TABLE IF NOT EXISTS "public"."incident_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying(50) NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "severity_level" character varying(20),
    "requires_review" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "incident_types_severity_level_check" CHECK ((("severity_level")::"text" = ANY (ARRAY[('MINOR'::character varying)::"text", ('MODERATE'::character varying)::"text", ('SERIOUS'::character varying)::"text", ('CRITICAL'::character varying)::"text"])))
);


ALTER TABLE "public"."incident_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leave_bids" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pilot_id" "uuid" NOT NULL,
    "roster_period_code" character varying(20) NOT NULL,
    "preferred_dates" "text" NOT NULL,
    "alternative_dates" "text",
    "priority" character varying(10) NOT NULL,
    "reason" "text" NOT NULL,
    "notes" "text",
    "status" character varying(20) DEFAULT 'PENDING'::character varying,
    "submitted_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "review_comments" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "leave_bids_priority_check" CHECK ((("priority")::"text" = ANY (ARRAY[('HIGH'::character varying)::"text", ('MEDIUM'::character varying)::"text", ('LOW'::character varying)::"text"]))),
    CONSTRAINT "leave_bids_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('PENDING'::character varying)::"text", ('APPROVED'::character varying)::"text", ('REJECTED'::character varying)::"text", ('WITHDRAWN'::character varying)::"text"])))
);


ALTER TABLE "public"."leave_bids" OWNER TO "postgres";


COMMENT ON TABLE "public"."leave_bids" IS 'Leave bid submissions from pilots for upcoming roster periods';



COMMENT ON COLUMN "public"."leave_bids"."roster_period_code" IS 'Roster period code (e.g., RP12/2025)';



COMMENT ON COLUMN "public"."leave_bids"."preferred_dates" IS 'Pilot preferred leave dates';



COMMENT ON COLUMN "public"."leave_bids"."alternative_dates" IS 'Alternative dates if preferred not available';



COMMENT ON COLUMN "public"."leave_bids"."priority" IS 'Priority level: HIGH, MEDIUM, LOW';



COMMENT ON COLUMN "public"."leave_bids"."reason" IS 'Reason for leave bid';



COMMENT ON COLUMN "public"."leave_bids"."notes" IS 'Additional notes or comments';



COMMENT ON COLUMN "public"."leave_bids"."status" IS 'Bid status: PENDING, APPROVED, REJECTED, WITHDRAWN';



CREATE TABLE IF NOT EXISTS "public"."leave_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pilot_id" "uuid",
    "request_type" character varying(50),
    "roster_period" character varying(20),
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "days_count" integer NOT NULL,
    "status" character varying(50) DEFAULT 'PENDING'::character varying,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "request_date" "date",
    "request_method" character varying(50),
    "is_late_request" boolean DEFAULT false,
    "review_comments" "text",
    "submission_type" "text" DEFAULT 'admin'::"text",
    "pilot_user_id" "uuid",
    "review_notes" "text",
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "leave_requests_dates_valid" CHECK (("end_date" >= "start_date")),
    CONSTRAINT "leave_requests_days_positive" CHECK (("days_count" > 0)),
    CONSTRAINT "leave_requests_duration_reasonable" CHECK (("end_date" <= ("start_date" + '365 days'::interval))),
    CONSTRAINT "leave_requests_request_method_check" CHECK ((("request_method")::"text" = ANY (ARRAY[('EMAIL'::character varying)::"text", ('ORACLE'::character varying)::"text", ('LEAVE_BIDS'::character varying)::"text", ('SYSTEM'::character varying)::"text"]))),
    CONSTRAINT "leave_requests_request_type_check" CHECK ((("request_type")::"text" = ANY (ARRAY[('RDO'::character varying)::"text", ('SDO'::character varying)::"text", ('ANNUAL'::character varying)::"text", ('SICK'::character varying)::"text", ('LSL'::character varying)::"text", ('LWOP'::character varying)::"text", ('MATERNITY'::character varying)::"text", ('COMPASSIONATE'::character varying)::"text"]))),
    CONSTRAINT "leave_requests_start_date_reasonable" CHECK (("start_date" >= (CURRENT_DATE - '90 days'::interval))),
    CONSTRAINT "leave_requests_submission_type_check" CHECK (("submission_type" = ANY (ARRAY['admin'::"text", 'pilot'::"text"])))
);


ALTER TABLE "public"."leave_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."leave_requests" IS 'Leave request submissions and approvals aligned to roster periods';



COMMENT ON COLUMN "public"."leave_requests"."created_at" IS 'Request submission timestamp (UTC with timezone)';



COMMENT ON COLUMN "public"."leave_requests"."reviewed_at" IS 'Review timestamp (UTC with timezone)';



COMMENT ON COLUMN "public"."leave_requests"."request_date" IS 'Date when the leave request was made';



COMMENT ON COLUMN "public"."leave_requests"."request_method" IS 'Method used to advise the leave (EMAIL, ORACLE, LEAVE_BIDS, SYSTEM)';



COMMENT ON COLUMN "public"."leave_requests"."is_late_request" IS 'Flag for requests with less than 21 days advance notice';



COMMENT ON COLUMN "public"."leave_requests"."review_comments" IS 'Comments from reviewer when approving/denying';



COMMENT ON CONSTRAINT "leave_requests_dates_valid" ON "public"."leave_requests" IS 'Ensures that leave request end date is on or after the start date';



COMMENT ON CONSTRAINT "leave_requests_days_positive" ON "public"."leave_requests" IS 'Ensures that leave request days count is always greater than zero';



COMMENT ON CONSTRAINT "leave_requests_duration_reasonable" ON "public"."leave_requests" IS 'Prevents leave requests spanning more than 365 days (data entry error protection)';



COMMENT ON CONSTRAINT "leave_requests_start_date_reasonable" ON "public"."leave_requests" IS 'Prevents backdating leave requests more than 90 days in the past';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "type" "public"."notification_type" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "link" "text",
    "read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notifications_message_not_empty" CHECK (("length"(TRIM(BOTH FROM "message")) >= 1)),
    CONSTRAINT "notifications_title_not_empty" CHECK (("length"(TRIM(BOTH FROM "title")) >= 1))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON CONSTRAINT "notifications_message_not_empty" ON "public"."notifications" IS 'Ensures notification messages contain at least 1 non-whitespace character';



COMMENT ON CONSTRAINT "notifications_title_not_empty" ON "public"."notifications" IS 'Ensures notification titles contain at least 1 non-whitespace character';



CREATE TABLE IF NOT EXISTS "public"."password_reset_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."password_reset_tokens" OWNER TO "postgres";


COMMENT ON TABLE "public"."password_reset_tokens" IS 'Stores password reset tokens for pilot portal users';



COMMENT ON COLUMN "public"."password_reset_tokens"."token" IS 'Unique cryptographic token sent via email';



COMMENT ON COLUMN "public"."password_reset_tokens"."expires_at" IS 'Token expiration time (typically 1 hour from creation)';



COMMENT ON COLUMN "public"."password_reset_tokens"."used_at" IS 'Timestamp when token was used (prevents reuse)';



CREATE TABLE IF NOT EXISTS "public"."pilot_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "text",
    "email" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "rank" "text",
    "seniority_number" integer,
    "registration_approved" boolean DEFAULT false,
    "registration_date" timestamp with time zone DEFAULT "now"(),
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "last_login_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "date_of_birth" "date",
    "phone_number" "text",
    "address" "text",
    "denial_reason" "text",
    "password_hash" "text",
    "auth_user_id" "uuid",
    "user_type" "text" DEFAULT 'pilot'::"text",
    "pilot_id" "uuid",
    CONSTRAINT "pilot_users_rank_check" CHECK (("rank" = ANY (ARRAY['Captain'::"text", 'First Officer'::"text"])))
);


ALTER TABLE "public"."pilot_users" OWNER TO "postgres";


COMMENT ON TABLE "public"."pilot_users" IS 'Pilot portal user accounts linked to pilot records';



COMMENT ON COLUMN "public"."pilot_users"."date_of_birth" IS 'Pilot date of birth for age verification';



COMMENT ON COLUMN "public"."pilot_users"."phone_number" IS 'Contact phone number';



COMMENT ON COLUMN "public"."pilot_users"."address" IS 'Residential address';



COMMENT ON COLUMN "public"."pilot_users"."denial_reason" IS 'Reason for registration denial (if applicable)';



CREATE OR REPLACE VIEW "public"."pending_pilot_registrations" WITH ("security_invoker"='true') AS
 SELECT "pu"."id",
    "pu"."employee_id",
    "pu"."email",
    "pu"."first_name",
    "pu"."last_name",
    "pu"."rank",
    "pu"."registration_date",
    "pu"."created_at",
    "p"."commencement_date",
    "p"."seniority_number" AS "calculated_seniority"
   FROM ("public"."pilot_users" "pu"
     LEFT JOIN "public"."pilots" "p" ON (("pu"."employee_id" = ("p"."employee_id")::"text")))
  WHERE ("pu"."registration_approved" = false)
  ORDER BY "pu"."registration_date";


ALTER VIEW "public"."pending_pilot_registrations" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."pilot_checks_overview" WITH ("security_invoker"='true') AS
 SELECT "p"."id" AS "pilot_id",
    "p"."first_name",
    "p"."last_name",
    "p"."employee_id",
    "p"."role",
    "json_agg"("json_build_object"('check_code', "ct"."check_code", 'check_description', "ct"."check_description", 'category', "ct"."category", 'expiry_date', "pc"."expiry_date") ORDER BY "ct"."category", "ct"."check_code") AS "checks"
   FROM (("public"."pilots" "p"
     LEFT JOIN "public"."pilot_checks" "pc" ON (("p"."id" = "pc"."pilot_id")))
     LEFT JOIN "public"."check_types" "ct" ON (("pc"."check_type_id" = "ct"."id")))
  GROUP BY "p"."id", "p"."first_name", "p"."last_name", "p"."employee_id", "p"."role";


ALTER VIEW "public"."pilot_checks_overview" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pilot_feedback" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pilot_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "message" "text" NOT NULL,
    "is_anonymous" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "admin_response" "text",
    "responded_by" "uuid",
    "responded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pilot_feedback_admin_response_check" CHECK (("char_length"("admin_response") <= 2000)),
    CONSTRAINT "pilot_feedback_category_check" CHECK (("category" = ANY (ARRAY['operations'::"text", 'training'::"text", 'scheduling'::"text", 'safety'::"text", 'equipment'::"text", 'system'::"text", 'suggestion'::"text", 'other'::"text"]))),
    CONSTRAINT "pilot_feedback_message_check" CHECK ((("char_length"("message") >= 10) AND ("char_length"("message") <= 5000))),
    CONSTRAINT "pilot_feedback_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'REVIEWED'::"text", 'RESOLVED'::"text", 'DISMISSED'::"text"]))),
    CONSTRAINT "pilot_feedback_subject_check" CHECK ((("char_length"("subject") >= 5) AND ("char_length"("subject") <= 200)))
);


ALTER TABLE "public"."pilot_feedback" OWNER TO "postgres";


COMMENT ON TABLE "public"."pilot_feedback" IS 'Stores pilot feedback submissions, suggestions, and issue reports';



COMMENT ON COLUMN "public"."pilot_feedback"."category" IS 'Feedback category: operations, training, scheduling, safety, equipment, system, suggestion, other';



COMMENT ON COLUMN "public"."pilot_feedback"."is_anonymous" IS 'Whether the feedback is submitted anonymously';



COMMENT ON COLUMN "public"."pilot_feedback"."status" IS 'Feedback status: PENDING, REVIEWED, RESOLVED, DISMISSED';



COMMENT ON COLUMN "public"."pilot_feedback"."admin_response" IS 'Admin response to the feedback';



CREATE OR REPLACE VIEW "public"."pilot_qualification_summary" WITH ("security_invoker"='true') AS
 SELECT "p"."id",
    "p"."first_name",
    "p"."last_name",
    "p"."employee_id",
    "p"."role",
    "p"."captain_qualifications",
    "count"("pc"."id") AS "total_checks",
    "count"("pc"."id") FILTER (WHERE ("pc"."expiry_date" < CURRENT_DATE)) AS "expired_checks"
   FROM ("public"."pilots" "p"
     LEFT JOIN "public"."pilot_checks" "pc" ON (("p"."id" = "pc"."pilot_id")))
  GROUP BY "p"."id", "p"."first_name", "p"."last_name", "p"."employee_id", "p"."role", "p"."captain_qualifications";


ALTER VIEW "public"."pilot_qualification_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."pilot_report_summary" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::character varying(100) AS "first_name",
    NULL::character varying(100) AS "last_name",
    NULL::character varying(50) AS "employee_id",
    NULL::"public"."pilot_role" AS "role",
    NULL::integer AS "seniority_number",
    NULL::"date" AS "date_of_birth",
    NULL::"date" AS "commencement_date",
    NULL::"uuid" AS "contract_type_id",
    NULL::bigint AS "total_checks",
    NULL::bigint AS "expired_checks",
    NULL::bigint AS "expiring_soon_checks";


ALTER VIEW "public"."pilot_report_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."pilot_report_summary" IS 'Comprehensive pilot summary for reporting';



CREATE OR REPLACE VIEW "public"."pilot_requirements_compliance" WITH ("security_invoker"='true') AS
 SELECT "p"."id",
    "p"."first_name",
    "p"."last_name",
    "p"."employee_id",
    "p"."role",
    "count"("pc"."id") AS "total_checks",
    "count"("pc"."id") FILTER (WHERE ("pc"."expiry_date" >= CURRENT_DATE)) AS "valid_checks"
   FROM ("public"."pilots" "p"
     LEFT JOIN "public"."pilot_checks" "pc" ON (("p"."id" = "pc"."pilot_id")))
  GROUP BY "p"."id", "p"."first_name", "p"."last_name", "p"."employee_id", "p"."role";


ALTER VIEW "public"."pilot_requirements_compliance" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."pilot_summary_optimized" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::character varying(100) AS "first_name",
    NULL::character varying(100) AS "last_name",
    NULL::character varying(50) AS "employee_id",
    NULL::"public"."pilot_role" AS "role",
    NULL::integer AS "seniority_number",
    NULL::"date" AS "commencement_date",
    NULL::bigint AS "total_certifications",
    NULL::bigint AS "expired_count";


ALTER VIEW "public"."pilot_summary_optimized" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."pilot_user_mappings" AS
 SELECT "pu"."id" AS "pilot_user_id",
    "pu"."employee_id",
    "pu"."email",
    "pu"."first_name",
    "pu"."last_name",
    "pu"."rank",
    "pu"."seniority_number",
    "pu"."registration_approved",
    "pu"."last_login_at",
    "pu"."created_at" AS "pilot_user_created_at",
    "p"."id" AS "pilot_id",
    "p"."created_at" AS "pilot_created_at"
   FROM ("public"."pilot_users" "pu"
     LEFT JOIN "public"."pilots" "p" ON ((("p"."employee_id")::"text" = "pu"."employee_id")));


ALTER VIEW "public"."pilot_user_mappings" OWNER TO "postgres";


COMMENT ON VIEW "public"."pilot_user_mappings" IS 'Efficient mapping between pilot_users and pilots tables to eliminate N+1 queries. Use this view instead of sequential queries to pilot_users then pilots.';



CREATE OR REPLACE VIEW "public"."pilot_warning_history" WITH ("security_invoker"='true') AS
 SELECT "p"."id" AS "pilot_id",
    "p"."first_name",
    "p"."last_name",
    "p"."employee_id",
    "dm"."id" AS "matter_id",
    "dm"."title" AS "matter_title",
    "dm"."severity",
    "dm"."status" AS "matter_status",
    "u"."name" AS "issued_by_name",
    "u"."email" AS "issued_by_email",
    "dm"."incident_date",
    "dm"."created_at"
   FROM (("public"."pilots" "p"
     LEFT JOIN "public"."disciplinary_matters" "dm" ON (("p"."id" = "dm"."pilot_id")))
     LEFT JOIN "public"."an_users" "u" ON (("dm"."reported_by" = "u"."id")))
  WHERE (("dm"."severity")::"text" = ANY ((ARRAY['WARNING'::character varying, 'SEVERE'::character varying])::"text"[]))
  ORDER BY "p"."last_name", "p"."first_name", "dm"."incident_date" DESC;


ALTER VIEW "public"."pilot_warning_history" OWNER TO "postgres";


COMMENT ON VIEW "public"."pilot_warning_history" IS 'Pilot disciplinary warning and action history';



CREATE OR REPLACE VIEW "public"."pilots_with_contract_details" WITH ("security_invoker"='true') AS
 SELECT "p"."id",
    "p"."first_name",
    "p"."middle_name",
    "p"."last_name",
    "p"."role",
    "p"."nationality",
    "p"."passport_number",
    "p"."passport_expiry",
    "p"."created_at",
    "p"."updated_at",
    "p"."employee_id",
    "p"."is_active",
    "p"."date_of_birth",
    "p"."commencement_date",
    "p"."captain_qualifications",
    "p"."qualification_notes",
    "p"."rhs_captain_expiry",
    "p"."contract_type",
    "p"."seniority_number",
    "p"."contract_type_id",
    "ct"."name" AS "contract_name",
    "ct"."description" AS "contract_description"
   FROM ("public"."pilots" "p"
     LEFT JOIN "public"."contract_types" "ct" ON (("p"."contract_type_id" = "ct"."id")));


ALTER VIEW "public"."pilots_with_contract_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."renewal_plan_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "renewal_plan_id" "uuid" NOT NULL,
    "change_type" character varying(50) NOT NULL,
    "previous_date" "date",
    "new_date" "date",
    "previous_roster_period" character varying(20),
    "new_roster_period" character varying(20),
    "previous_status" character varying(20),
    "new_status" character varying(20),
    "reason" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "changed_by" "uuid",
    CONSTRAINT "valid_change_type" CHECK ((("change_type")::"text" = ANY ((ARRAY['created'::character varying, 'rescheduled'::character varying, 'paired'::character varying, 'unpaired'::character varying, 'confirmed'::character varying, 'started'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'notes_updated'::character varying, 'priority_changed'::character varying])::"text"[])))
);


ALTER TABLE "public"."renewal_plan_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."renewal_plan_history" IS 'Audit trail for all changes to renewal plans';



CREATE TABLE IF NOT EXISTS "public"."roster_period_capacity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "roster_period" character varying(20) NOT NULL,
    "period_start_date" "date" NOT NULL,
    "period_end_date" "date" NOT NULL,
    "max_pilots_per_category" "jsonb" DEFAULT '{"ID Cards": 2, "Non-renewal": 2, "Travel Visa": 2, "Flight Checks": 4, "Pilot Medical": 4, "Simulator Checks": 6, "Ground Courses Refresher": 8, "Foreign Pilot Work Permit": 2}'::"jsonb" NOT NULL,
    "current_allocations" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "valid_period_dates" CHECK (("period_start_date" <= "period_end_date"))
);


ALTER TABLE "public"."roster_period_capacity" OWNER TO "postgres";


COMMENT ON TABLE "public"."roster_period_capacity" IS 'Tracks capacity limits and allocations for each roster period';



COMMENT ON COLUMN "public"."roster_period_capacity"."max_pilots_per_category" IS 'JSON object defining max pilots per certification category';



COMMENT ON COLUMN "public"."roster_period_capacity"."current_allocations" IS 'JSON object tracking current pilot count per category';



CREATE TABLE IF NOT EXISTS "public"."settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" character varying(100) NOT NULL,
    "value" "jsonb" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."settings" IS 'System configuration settings - Only admins can modify, all authenticated users can read';



CREATE TABLE IF NOT EXISTS "public"."task_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" character varying(50) NOT NULL,
    "field_changed" character varying(100),
    "old_value" "text",
    "new_value" "text",
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."task_audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."task_audit_log" IS 'Audit trail for all task-related changes';



ALTER TABLE ONLY "public"."an_users"
    ADD CONSTRAINT "an_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."an_users"
    ADD CONSTRAINT "an_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."certification_renewal_plans"
    ADD CONSTRAINT "certification_renewal_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."check_types"
    ADD CONSTRAINT "check_types_check_code_key" UNIQUE ("check_code");



ALTER TABLE ONLY "public"."check_types"
    ADD CONSTRAINT "check_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_types"
    ADD CONSTRAINT "contract_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."contract_types"
    ADD CONSTRAINT "contract_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."digital_forms"
    ADD CONSTRAINT "digital_forms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."disciplinary_audit_log"
    ADD CONSTRAINT "disciplinary_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."disciplinary_matters"
    ADD CONSTRAINT "disciplinary_matters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_categories"
    ADD CONSTRAINT "document_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback_categories"
    ADD CONSTRAINT "feedback_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."feedback_categories"
    ADD CONSTRAINT "feedback_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback_categories"
    ADD CONSTRAINT "feedback_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."flight_requests"
    ADD CONSTRAINT "flight_requests_pilot_date_type_unique" UNIQUE ("pilot_user_id", "flight_date", "request_type");



COMMENT ON CONSTRAINT "flight_requests_pilot_date_type_unique" ON "public"."flight_requests" IS 'Prevents duplicate flight requests: pilot cannot submit same request type for same date';



ALTER TABLE ONLY "public"."flight_requests"
    ADD CONSTRAINT "flight_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."incident_types"
    ADD CONSTRAINT "incident_types_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."incident_types"
    ADD CONSTRAINT "incident_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leave_bids"
    ADD CONSTRAINT "leave_bids_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_pilot_dates_unique" UNIQUE ("pilot_user_id", "start_date", "end_date");



COMMENT ON CONSTRAINT "leave_requests_pilot_dates_unique" ON "public"."leave_requests" IS 'Prevents duplicate leave requests: pilot cannot submit same dates twice';



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pilot_checks"
    ADD CONSTRAINT "pilot_checks_pilot_id_check_type_id_key" UNIQUE ("pilot_id", "check_type_id");



ALTER TABLE ONLY "public"."pilot_checks"
    ADD CONSTRAINT "pilot_checks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pilot_feedback"
    ADD CONSTRAINT "pilot_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pilot_users"
    ADD CONSTRAINT "pilot_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."pilot_users"
    ADD CONSTRAINT "pilot_users_employee_id_key" UNIQUE ("employee_id");



ALTER TABLE ONLY "public"."pilot_users"
    ADD CONSTRAINT "pilot_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "pilots_employee_id_key" UNIQUE ("employee_id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "pilots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."renewal_plan_history"
    ADD CONSTRAINT "renewal_plan_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roster_period_capacity"
    ADD CONSTRAINT "roster_period_capacity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roster_period_capacity"
    ADD CONSTRAINT "roster_period_capacity_roster_period_key" UNIQUE ("roster_period");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_audit_log"
    ADD CONSTRAINT "task_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_categories"
    ADD CONSTRAINT "task_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."task_categories"
    ADD CONSTRAINT "task_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "token_unique" UNIQUE ("token");



ALTER TABLE ONLY "public"."certification_renewal_plans"
    ADD CONSTRAINT "unique_pilot_check_plan" UNIQUE ("pilot_id", "check_type_id", "original_expiry_date");



CREATE INDEX "idx_an_users_email" ON "public"."an_users" USING "btree" ("email");



CREATE INDEX "idx_an_users_role" ON "public"."an_users" USING "btree" ("role");



CREATE INDEX "idx_audit_logs_action" ON "public"."audit_logs" USING "btree" ("action");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_record_id" ON "public"."audit_logs" USING "btree" ("record_id");



CREATE INDEX "idx_audit_logs_table_name" ON "public"."audit_logs" USING "btree" ("table_name");



CREATE INDEX "idx_audit_logs_user_email" ON "public"."audit_logs" USING "btree" ("user_email");



CREATE INDEX "idx_check_types_category" ON "public"."check_types" USING "btree" ("category") WHERE ("category" IS NOT NULL);



CREATE INDEX "idx_check_types_code" ON "public"."check_types" USING "btree" ("check_code");



CREATE INDEX "idx_digital_forms_created_at" ON "public"."digital_forms" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_digital_forms_form_type" ON "public"."digital_forms" USING "btree" ("form_type") WHERE ("is_active" = true);



COMMENT ON INDEX "public"."idx_digital_forms_form_type" IS 'Optimizes form_type lookups for active forms';



CREATE INDEX "idx_digital_forms_requires_approval" ON "public"."digital_forms" USING "btree" ("requires_approval") WHERE ("is_active" = true);



COMMENT ON INDEX "public"."idx_digital_forms_requires_approval" IS 'Optimizes approval workflow queries for active forms';



CREATE INDEX "idx_disciplinary_assigned" ON "public"."disciplinary_matters" USING "btree" ("assigned_to");



CREATE INDEX "idx_disciplinary_audit_log_action" ON "public"."disciplinary_audit_log" USING "btree" ("action");



CREATE INDEX "idx_disciplinary_audit_log_matter_id" ON "public"."disciplinary_audit_log" USING "btree" ("matter_id");



CREATE INDEX "idx_disciplinary_audit_log_timestamp" ON "public"."disciplinary_audit_log" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_disciplinary_audit_log_user_id" ON "public"."disciplinary_audit_log" USING "btree" ("user_id");



CREATE INDEX "idx_disciplinary_audit_matter" ON "public"."disciplinary_audit_log" USING "btree" ("matter_id");



CREATE INDEX "idx_disciplinary_audit_timestamp" ON "public"."disciplinary_audit_log" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_disciplinary_date" ON "public"."disciplinary_matters" USING "btree" ("incident_date" DESC);



CREATE INDEX "idx_disciplinary_pilot" ON "public"."disciplinary_matters" USING "btree" ("pilot_id");



CREATE INDEX "idx_disciplinary_severity" ON "public"."disciplinary_matters" USING "btree" ("severity");



CREATE INDEX "idx_disciplinary_status" ON "public"."disciplinary_matters" USING "btree" ("status");



CREATE INDEX "idx_document_categories_display_order" ON "public"."document_categories" USING "btree" ("display_order") WHERE ("is_active" = true);



COMMENT ON INDEX "public"."idx_document_categories_display_order" IS 'Optimizes category ordering queries for active categories';



CREATE INDEX "idx_document_categories_name" ON "public"."document_categories" USING "btree" ("name") WHERE ("is_active" = true);



COMMENT ON INDEX "public"."idx_document_categories_name" IS 'Optimizes category name lookups for active categories';



CREATE INDEX "idx_feedback_categories_active" ON "public"."feedback_categories" USING "btree" ("is_archived") WHERE ("is_archived" = false);



CREATE INDEX "idx_feedback_categories_slug" ON "public"."feedback_categories" USING "btree" ("slug");



CREATE INDEX "idx_flight_requests_created" ON "public"."flight_requests" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_flight_requests_created_at" ON "public"."flight_requests" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_flight_requests_flight_date" ON "public"."flight_requests" USING "btree" ("flight_date");



CREATE INDEX "idx_flight_requests_pilot_date_type" ON "public"."flight_requests" USING "btree" ("pilot_user_id", "flight_date", "request_type") WHERE ("pilot_user_id" IS NOT NULL);



CREATE INDEX "idx_flight_requests_pilot_id" ON "public"."flight_requests" USING "btree" ("pilot_id");



CREATE INDEX "idx_flight_requests_pilot_status" ON "public"."flight_requests" USING "btree" ("pilot_user_id", "status");



COMMENT ON INDEX "public"."idx_flight_requests_pilot_status" IS 'Performance: Filter flight requests by pilot and status';



CREATE INDEX "idx_flight_requests_pilot_user_id" ON "public"."flight_requests" USING "btree" ("pilot_user_id");



CREATE INDEX "idx_flight_requests_status" ON "public"."flight_requests" USING "btree" ("status");



CREATE INDEX "idx_flight_requests_status_flight_date" ON "public"."flight_requests" USING "btree" ("status", "flight_date");



COMMENT ON INDEX "public"."idx_flight_requests_status_flight_date" IS 'Performance: Filter flights by status and upcoming dates';



CREATE INDEX "idx_leave_bids_pilot_id" ON "public"."leave_bids" USING "btree" ("pilot_id");



CREATE INDEX "idx_leave_bids_roster_period" ON "public"."leave_bids" USING "btree" ("roster_period_code");



CREATE INDEX "idx_leave_bids_status" ON "public"."leave_bids" USING "btree" ("status");



CREATE INDEX "idx_leave_bids_submitted_at" ON "public"."leave_bids" USING "btree" ("submitted_at" DESC);



CREATE INDEX "idx_leave_requests_created" ON "public"."leave_requests" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_leave_requests_date_range_gist" ON "public"."leave_requests" USING "gist" ("pilot_id", "daterange"("start_date", "end_date", '[]'::"text")) WHERE (("status")::"text" = ANY (ARRAY[('PENDING'::character varying)::"text", ('APPROVED'::character varying)::"text"]));



COMMENT ON INDEX "public"."idx_leave_requests_date_range_gist" IS 'Optimizes leave conflict detection using GiST date range index';



CREATE INDEX "idx_leave_requests_dates" ON "public"."leave_requests" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_leave_requests_pending" ON "public"."leave_requests" USING "btree" ("status", "created_at") WHERE (("status")::"text" = 'PENDING'::"text");



CREATE INDEX "idx_leave_requests_pilot_dates" ON "public"."leave_requests" USING "btree" ("pilot_user_id", "start_date", "end_date") WHERE ("pilot_user_id" IS NOT NULL);



CREATE INDEX "idx_leave_requests_pilot_id" ON "public"."leave_requests" USING "btree" ("pilot_id");



COMMENT ON INDEX "public"."idx_leave_requests_pilot_id" IS 'Index for foreign key leave_requests_pilot_id_fkey to improve join performance';



CREATE INDEX "idx_leave_requests_pilot_status" ON "public"."leave_requests" USING "btree" ("pilot_id", "status");



COMMENT ON INDEX "public"."idx_leave_requests_pilot_status" IS 'Optimizes pilot leave history and status filtering queries';



CREATE INDEX "idx_leave_requests_pilot_user" ON "public"."leave_requests" USING "btree" ("pilot_user_id");



CREATE INDEX "idx_leave_requests_reviewed_by" ON "public"."leave_requests" USING "btree" ("reviewed_by");



COMMENT ON INDEX "public"."idx_leave_requests_reviewed_by" IS 'Index for foreign key leave_requests_reviewed_by_fkey to improve join performance';



CREATE INDEX "idx_leave_requests_roster_period" ON "public"."leave_requests" USING "btree" ("roster_period") WHERE ("roster_period" IS NOT NULL);



CREATE INDEX "idx_leave_requests_status" ON "public"."leave_requests" USING "btree" ("status");



CREATE INDEX "idx_leave_requests_status_roster" ON "public"."leave_requests" USING "btree" ("status", "roster_period") WHERE (("status")::"text" = 'pending'::"text");



COMMENT ON INDEX "public"."idx_leave_requests_status_roster" IS 'Optimizes roster period filtering with status';



CREATE INDEX "idx_leave_requests_status_start_date" ON "public"."leave_requests" USING "btree" ("status", "start_date");



COMMENT ON INDEX "public"."idx_leave_requests_status_start_date" IS 'Performance: Filter leave by status and upcoming dates';



CREATE INDEX "idx_leave_requests_submission_type" ON "public"."leave_requests" USING "btree" ("submission_type");



CREATE INDEX "idx_notifications_recipient" ON "public"."notifications" USING "btree" ("recipient_id");



CREATE INDEX "idx_notifications_unread" ON "public"."notifications" USING "btree" ("recipient_id", "read") WHERE ("read" = false);



CREATE INDEX "idx_password_reset_tokens_expires_at" ON "public"."password_reset_tokens" USING "btree" ("expires_at");



CREATE INDEX "idx_password_reset_tokens_token" ON "public"."password_reset_tokens" USING "btree" ("token");



CREATE INDEX "idx_password_reset_tokens_user_id" ON "public"."password_reset_tokens" USING "btree" ("user_id");



CREATE INDEX "idx_pilot_checks_check_type" ON "public"."pilot_checks" USING "btree" ("check_type_id");



CREATE INDEX "idx_pilot_checks_check_type_id" ON "public"."pilot_checks" USING "btree" ("check_type_id");



CREATE INDEX "idx_pilot_checks_expiry" ON "public"."pilot_checks" USING "btree" ("expiry_date") WHERE ("expiry_date" IS NOT NULL);



CREATE INDEX "idx_pilot_checks_expiry_date" ON "public"."pilot_checks" USING "btree" ("expiry_date");



CREATE INDEX "idx_pilot_checks_expiry_range" ON "public"."pilot_checks" USING "btree" ("expiry_date") WHERE ("expiry_date" IS NOT NULL);



COMMENT ON INDEX "public"."idx_pilot_checks_expiry_range" IS 'Optimized partial index for expiring certifications queries';



CREATE INDEX "idx_pilot_checks_expiry_type" ON "public"."pilot_checks" USING "btree" ("expiry_date", "check_type_id", "pilot_id") WHERE ("expiry_date" IS NOT NULL);



CREATE INDEX "idx_pilot_checks_pilot_expiry" ON "public"."pilot_checks" USING "btree" ("pilot_id", "expiry_date") WHERE ("expiry_date" IS NOT NULL);



CREATE INDEX "idx_pilot_checks_pilot_id" ON "public"."pilot_checks" USING "btree" ("pilot_id");



CREATE INDEX "idx_pilot_feedback_category" ON "public"."pilot_feedback" USING "btree" ("category");



CREATE INDEX "idx_pilot_feedback_created_at" ON "public"."pilot_feedback" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_pilot_feedback_pilot_id" ON "public"."pilot_feedback" USING "btree" ("pilot_id");



CREATE INDEX "idx_pilot_feedback_status" ON "public"."pilot_feedback" USING "btree" ("status");



CREATE INDEX "idx_pilot_users_approved" ON "public"."pilot_users" USING "btree" ("registration_approved");



CREATE INDEX "idx_pilot_users_auth_user_id" ON "public"."pilot_users" USING "btree" ("auth_user_id");



CREATE INDEX "idx_pilot_users_email" ON "public"."pilot_users" USING "btree" ("email");



CREATE INDEX "idx_pilot_users_employee_id" ON "public"."pilot_users" USING "btree" ("employee_id");



CREATE INDEX "idx_pilot_users_pilot_id" ON "public"."pilot_users" USING "btree" ("pilot_id");



CREATE INDEX "idx_pilot_users_registration_approved" ON "public"."pilot_users" USING "btree" ("registration_approved") WHERE ("registration_approved" = false);



CREATE INDEX "idx_pilots_active" ON "public"."pilots" USING "btree" ("id", "role", "seniority_number") WHERE ("is_active" = true);



CREATE INDEX "idx_pilots_active_role_seniority" ON "public"."pilots" USING "btree" ("is_active", "role", "seniority_number") WHERE ("is_active" = true);



COMMENT ON INDEX "public"."idx_pilots_active_role_seniority" IS 'Optimized compound index for active pilots queries';



CREATE INDEX "idx_pilots_commencement" ON "public"."pilots" USING "btree" ("commencement_date") WHERE ("commencement_date" IS NOT NULL);



CREATE INDEX "idx_pilots_contract_type_id" ON "public"."pilots" USING "btree" ("contract_type_id");



COMMENT ON INDEX "public"."idx_pilots_contract_type_id" IS 'Index for foreign key fk_pilots_contract_type_id to improve join performance';



CREATE INDEX "idx_pilots_dob" ON "public"."pilots" USING "btree" ("date_of_birth") WHERE ("date_of_birth" IS NOT NULL);



CREATE INDEX "idx_pilots_employee_id" ON "public"."pilots" USING "btree" ("employee_id");



CREATE INDEX "idx_pilots_first_name" ON "public"."pilots" USING "btree" ("first_name");



CREATE INDEX "idx_pilots_last_name" ON "public"."pilots" USING "btree" ("last_name");



CREATE INDEX "idx_pilots_role_active" ON "public"."pilots" USING "btree" ("role", "is_active");



CREATE INDEX "idx_pilots_seniority" ON "public"."pilots" USING "btree" ("seniority_number") WHERE ("seniority_number" IS NOT NULL);



CREATE INDEX "idx_pilots_seniority_number" ON "public"."pilots" USING "btree" ("seniority_number");



CREATE INDEX "idx_pilots_user_id" ON "public"."pilots" USING "btree" ("user_id");



CREATE INDEX "idx_renewal_history_change_type" ON "public"."renewal_plan_history" USING "btree" ("change_type");



CREATE INDEX "idx_renewal_history_changed_at" ON "public"."renewal_plan_history" USING "btree" ("changed_at" DESC);



CREATE INDEX "idx_renewal_history_plan" ON "public"."renewal_plan_history" USING "btree" ("renewal_plan_id");



CREATE INDEX "idx_renewal_plans_check_type" ON "public"."certification_renewal_plans" USING "btree" ("check_type_id");



CREATE INDEX "idx_renewal_plans_pair_group" ON "public"."certification_renewal_plans" USING "btree" ("pair_group_id");



CREATE INDEX "idx_renewal_plans_paired_pilot" ON "public"."certification_renewal_plans" USING "btree" ("paired_pilot_id");



CREATE INDEX "idx_renewal_plans_pilot" ON "public"."certification_renewal_plans" USING "btree" ("pilot_id");



CREATE INDEX "idx_renewal_plans_planned_date" ON "public"."certification_renewal_plans" USING "btree" ("planned_renewal_date");



CREATE INDEX "idx_renewal_plans_roster_period" ON "public"."certification_renewal_plans" USING "btree" ("planned_roster_period");



CREATE INDEX "idx_renewal_plans_status" ON "public"."certification_renewal_plans" USING "btree" ("status");



CREATE INDEX "idx_roster_capacity_period" ON "public"."roster_period_capacity" USING "btree" ("roster_period");



CREATE INDEX "idx_roster_capacity_start_date" ON "public"."roster_period_capacity" USING "btree" ("period_start_date");



CREATE INDEX "idx_task_audit_log_action" ON "public"."task_audit_log" USING "btree" ("action");



CREATE INDEX "idx_task_audit_log_task_id" ON "public"."task_audit_log" USING "btree" ("task_id");



CREATE INDEX "idx_task_audit_log_timestamp" ON "public"."task_audit_log" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_task_audit_log_user_id" ON "public"."task_audit_log" USING "btree" ("user_id");



CREATE INDEX "idx_task_audit_task" ON "public"."task_audit_log" USING "btree" ("task_id");



CREATE INDEX "idx_task_audit_timestamp" ON "public"."task_audit_log" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_tasks_assigned" ON "public"."tasks" USING "btree" ("assigned_to");



CREATE INDEX "idx_tasks_creator" ON "public"."tasks" USING "btree" ("created_by");



CREATE INDEX "idx_tasks_due_date" ON "public"."tasks" USING "btree" ("due_date");



CREATE INDEX "idx_tasks_parent" ON "public"."tasks" USING "btree" ("parent_task_id");



CREATE INDEX "idx_tasks_priority" ON "public"."tasks" USING "btree" ("priority");



CREATE INDEX "idx_tasks_related_matter" ON "public"."tasks" USING "btree" ("related_matter_id");



CREATE INDEX "idx_tasks_related_pilot" ON "public"."tasks" USING "btree" ("related_pilot_id");



CREATE INDEX "idx_tasks_status" ON "public"."tasks" USING "btree" ("status");



CREATE OR REPLACE VIEW "public"."pilot_report_summary" WITH ("security_invoker"='true') AS
 SELECT "p"."id",
    "p"."first_name",
    "p"."last_name",
    "p"."employee_id",
    "p"."role",
    "p"."seniority_number",
    "p"."date_of_birth",
    "p"."commencement_date",
    "p"."contract_type_id",
    "count"("pc"."id") AS "total_checks",
    "count"("pc"."id") FILTER (WHERE ("pc"."expiry_date" < CURRENT_DATE)) AS "expired_checks",
    "count"("pc"."id") FILTER (WHERE (("pc"."expiry_date" >= CURRENT_DATE) AND ("pc"."expiry_date" <= (CURRENT_DATE + '30 days'::interval)))) AS "expiring_soon_checks"
   FROM ("public"."pilots" "p"
     LEFT JOIN "public"."pilot_checks" "pc" ON (("p"."id" = "pc"."pilot_id")))
  GROUP BY "p"."id";



CREATE OR REPLACE VIEW "public"."pilot_summary_optimized" WITH ("security_invoker"='true') AS
 SELECT "p"."id",
    "p"."first_name",
    "p"."last_name",
    "p"."employee_id",
    "p"."role",
    "p"."seniority_number",
    "p"."commencement_date",
    "count"("pc"."id") AS "total_certifications",
    "count"("pc"."id") FILTER (WHERE ("pc"."expiry_date" < CURRENT_DATE)) AS "expired_count"
   FROM ("public"."pilots" "p"
     LEFT JOIN "public"."pilot_checks" "pc" ON (("p"."id" = "pc"."pilot_id")))
  GROUP BY "p"."id";



CREATE OR REPLACE TRIGGER "log_pilot_users_changes_trigger" AFTER UPDATE ON "public"."pilot_users" FOR EACH ROW EXECUTE FUNCTION "public"."log_pilot_users_changes"();



CREATE OR REPLACE TRIGGER "set_check_types_updated_at" BEFORE UPDATE ON "public"."check_types" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_pilot_checks_updated_at" BEFORE UPDATE ON "public"."pilot_checks" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_updated_at"();



CREATE OR REPLACE TRIGGER "set_pilots_updated_at" BEFORE UPDATE ON "public"."pilots" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_log_renewal_plan_change" AFTER UPDATE ON "public"."certification_renewal_plans" FOR EACH ROW EXECUTE FUNCTION "public"."log_renewal_plan_change"();



CREATE OR REPLACE TRIGGER "trigger_update_pilot_feedback_updated_at" BEFORE UPDATE ON "public"."pilot_feedback" FOR EACH ROW EXECUTE FUNCTION "public"."update_pilot_feedback_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_pilot_users_timestamp" BEFORE UPDATE ON "public"."pilot_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_pilot_users_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_renewal_plan_timestamp" BEFORE UPDATE ON "public"."certification_renewal_plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_renewal_plan_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_roster_capacity_timestamp" BEFORE UPDATE ON "public"."roster_period_capacity" FOR EACH ROW EXECUTE FUNCTION "public"."update_renewal_plan_timestamp"();



CREATE OR REPLACE TRIGGER "update_disciplinary_matters_updated_at" BEFORE UPDATE ON "public"."disciplinary_matters" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_flight_requests_updated_at" BEFORE UPDATE ON "public"."flight_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_flight_requests_updated_at"();



CREATE OR REPLACE TRIGGER "update_leave_requests_updated_at" BEFORE UPDATE ON "public"."leave_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_pilot_checks_updated_at" BEFORE UPDATE ON "public"."pilot_checks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_pilots_updated_at" BEFORE UPDATE ON "public"."pilots" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."certification_renewal_plans"
    ADD CONSTRAINT "certification_renewal_plans_check_type_id_fkey" FOREIGN KEY ("check_type_id") REFERENCES "public"."check_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certification_renewal_plans"
    ADD CONSTRAINT "certification_renewal_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."an_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."certification_renewal_plans"
    ADD CONSTRAINT "certification_renewal_plans_paired_pilot_id_fkey" FOREIGN KEY ("paired_pilot_id") REFERENCES "public"."pilots"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."certification_renewal_plans"
    ADD CONSTRAINT "certification_renewal_plans_pilot_id_fkey" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."digital_forms"
    ADD CONSTRAINT "digital_forms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."an_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."disciplinary_audit_log"
    ADD CONSTRAINT "disciplinary_audit_log_matter_id_fkey" FOREIGN KEY ("matter_id") REFERENCES "public"."disciplinary_matters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."disciplinary_audit_log"
    ADD CONSTRAINT "disciplinary_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."an_users"("id");



ALTER TABLE ONLY "public"."disciplinary_matters"
    ADD CONSTRAINT "disciplinary_matters_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."an_users"("id");



ALTER TABLE ONLY "public"."disciplinary_matters"
    ADD CONSTRAINT "disciplinary_matters_incident_type_id_fkey" FOREIGN KEY ("incident_type_id") REFERENCES "public"."incident_types"("id");



ALTER TABLE ONLY "public"."disciplinary_matters"
    ADD CONSTRAINT "disciplinary_matters_pilot_id_fkey" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."disciplinary_matters"
    ADD CONSTRAINT "disciplinary_matters_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "public"."an_users"("id");



ALTER TABLE ONLY "public"."disciplinary_matters"
    ADD CONSTRAINT "disciplinary_matters_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."an_users"("id");



ALTER TABLE ONLY "public"."feedback_categories"
    ADD CONSTRAINT "feedback_categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."pilot_users"("id") ON DELETE CASCADE;



COMMENT ON CONSTRAINT "feedback_categories_created_by_fkey" ON "public"."feedback_categories" IS 'Cascade delete: When pilot_user is deleted, their created categories are also deleted';



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "fk_pilots_contract_type_id" FOREIGN KEY ("contract_type_id") REFERENCES "public"."contract_types"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."flight_requests"
    ADD CONSTRAINT "flight_requests_pilot_id_fkey" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."flight_requests"
    ADD CONSTRAINT "flight_requests_pilot_user_id_fkey" FOREIGN KEY ("pilot_user_id") REFERENCES "public"."pilot_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."flight_requests"
    ADD CONSTRAINT "flight_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."an_users"("id");



ALTER TABLE ONLY "public"."leave_bids"
    ADD CONSTRAINT "leave_bids_pilot_id_fkey" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leave_bids"
    ADD CONSTRAINT "leave_bids_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."an_users"("id");



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_pilot_id_fkey" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_pilot_user_id_fkey" FOREIGN KEY ("pilot_user_id") REFERENCES "public"."pilot_users"("id") ON DELETE CASCADE;



COMMENT ON CONSTRAINT "leave_requests_pilot_user_id_fkey" ON "public"."leave_requests" IS 'Cascade delete: When pilot_user is deleted, their leave requests are also deleted';



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."an_users"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."pilot_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pilot_checks"
    ADD CONSTRAINT "pilot_checks_check_type_id_fkey" FOREIGN KEY ("check_type_id") REFERENCES "public"."check_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pilot_checks"
    ADD CONSTRAINT "pilot_checks_pilot_id_fkey" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pilot_feedback"
    ADD CONSTRAINT "pilot_feedback_pilot_id_fkey" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pilot_feedback"
    ADD CONSTRAINT "pilot_feedback_responded_by_fkey" FOREIGN KEY ("responded_by") REFERENCES "public"."an_users"("id");



ALTER TABLE ONLY "public"."pilot_users"
    ADD CONSTRAINT "pilot_users_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."an_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pilot_users"
    ADD CONSTRAINT "pilot_users_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pilot_users"
    ADD CONSTRAINT "pilot_users_pilot_id_fkey" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "pilots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."renewal_plan_history"
    ADD CONSTRAINT "renewal_plan_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."an_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."renewal_plan_history"
    ADD CONSTRAINT "renewal_plan_history_renewal_plan_id_fkey" FOREIGN KEY ("renewal_plan_id") REFERENCES "public"."certification_renewal_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_audit_log"
    ADD CONSTRAINT "task_audit_log_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_audit_log"
    ADD CONSTRAINT "task_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."an_users"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."an_users"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."task_categories"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."an_users"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_parent_task_id_fkey" FOREIGN KEY ("parent_task_id") REFERENCES "public"."tasks"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_related_matter_id_fkey" FOREIGN KEY ("related_matter_id") REFERENCES "public"."disciplinary_matters"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_related_pilot_id_fkey" FOREIGN KEY ("related_pilot_id") REFERENCES "public"."pilots"("id");



CREATE POLICY "Admins and managers can update leave bids" ON "public"."leave_bids" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"]))))));



CREATE POLICY "Admins can delete leave bids" ON "public"."leave_bids" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can delete pilot registrations" ON "public"."pilot_users" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can delete pilot users" ON "public"."pilot_users" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = "auth"."uid"()) AND (("an_users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can manage categories" ON "public"."feedback_categories" USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"]))))));



CREATE POLICY "Admins can manage document categories" ON "public"."document_categories" USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can manage forms" ON "public"."digital_forms" USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can update feedback" ON "public"."pilot_feedback" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = "auth"."uid"()) AND (("an_users"."role")::"text" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = "auth"."uid"()) AND (("an_users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can update flight requests" ON "public"."flight_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = "auth"."uid"()) AND (("an_users"."role")::"text" = ANY ((ARRAY['admin'::character varying, 'manager'::character varying])::"text"[]))))));



CREATE POLICY "Admins can update pilot registrations" ON "public"."pilot_users" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"]))))));



CREATE POLICY "Admins can update pilot users" ON "public"."pilot_users" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = "auth"."uid"()) AND (("an_users"."role")::"text" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = "auth"."uid"()) AND (("an_users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can view all feedback" ON "public"."pilot_feedback" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = "auth"."uid"()) AND (("an_users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can view all flight requests" ON "public"."flight_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = "auth"."uid"()) AND (("an_users"."role")::"text" = ANY ((ARRAY['admin'::character varying, 'manager'::character varying])::"text"[]))))));



CREATE POLICY "Admins can view all pilot profiles" ON "public"."pilot_users" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"]))))));



CREATE POLICY "Admins can view all pilot users" ON "public"."pilot_users" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = "auth"."uid"()) AND (("an_users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Allow authenticated insert of password reset tokens" ON "public"."password_reset_tokens" FOR INSERT TO "anon", "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated read of password reset tokens" ON "public"."password_reset_tokens" FOR SELECT TO "anon", "authenticated" USING (true);



CREATE POLICY "Allow authenticated update of password reset tokens" ON "public"."password_reset_tokens" FOR UPDATE TO "anon", "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public registration inserts" ON "public"."pilot_users" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow registration inserts" ON "public"."pilot_users" FOR INSERT TO "anon", "authenticated" WITH CHECK (true);



CREATE POLICY "Anyone can view active categories" ON "public"."feedback_categories" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Anyone can view active document categories" ON "public"."document_categories" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view active forms" ON "public"."digital_forms" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Authenticated users can insert leave bids" ON "public"."leave_bids" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can read audit logs" ON "public"."audit_logs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read settings" ON "public"."settings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view all an_users" ON "public"."an_users" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view leave bids" ON "public"."leave_bids" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Only admins can delete settings" ON "public"."settings" FOR DELETE TO "authenticated" USING ("public"."current_user_is_an_admin"());



CREATE POLICY "Only admins can insert settings" ON "public"."settings" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_is_an_admin"());



CREATE POLICY "Only admins can update settings" ON "public"."settings" FOR UPDATE TO "authenticated" USING ("public"."current_user_is_an_admin"()) WITH CHECK ("public"."current_user_is_an_admin"());



CREATE POLICY "Pilots can create categories" ON "public"."feedback_categories" FOR INSERT WITH CHECK ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) AND (( SELECT "auth"."uid"() AS "uid") IS NOT NULL)));



CREATE POLICY "Pilots can create flight requests" ON "public"."flight_requests" FOR INSERT WITH CHECK (("pilot_user_id" = "auth"."uid"()));



CREATE POLICY "Pilots can insert own feedback" ON "public"."pilot_feedback" FOR INSERT TO "authenticated" WITH CHECK (("pilot_id" IN ( SELECT "pilots"."id"
   FROM "public"."pilots"
  WHERE ("pilots"."id" = "pilot_feedback"."pilot_id"))));



CREATE POLICY "Pilots can insert own leave requests, admins/managers can inser" ON "public"."leave_requests" FOR INSERT WITH CHECK ((("auth"."uid"() IN ( SELECT "an_users"."id"
   FROM "public"."an_users"
  WHERE (("an_users"."role")::"text" = ANY ((ARRAY['admin'::character varying, 'manager'::character varying])::"text"[])))) OR ("pilot_user_id" IN ( SELECT "pu"."id"
   FROM "public"."pilot_users" "pu"
  WHERE (("pu"."email" = ("auth"."jwt"() ->> 'email'::"text")) AND ("pu"."registration_approved" = true))))));



CREATE POLICY "Pilots can update own pending flight requests" ON "public"."flight_requests" FOR UPDATE USING ((("pilot_user_id" = "auth"."uid"()) AND (("status")::"text" = 'PENDING'::"text"))) WITH CHECK ((("pilot_user_id" = "auth"."uid"()) AND (("status")::"text" = 'PENDING'::"text")));



CREATE POLICY "Pilots can update own profile" ON "public"."pilot_users" FOR UPDATE USING (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Pilots can view own feedback" ON "public"."pilot_feedback" FOR SELECT TO "authenticated" USING (("pilot_id" IN ( SELECT "pilots"."id"
   FROM "public"."pilots"
  WHERE ("pilots"."id" = "pilot_feedback"."pilot_id"))));



CREATE POLICY "Pilots can view own flight requests" ON "public"."flight_requests" FOR SELECT USING (("pilot_user_id" = "auth"."uid"()));



CREATE POLICY "Pilots can view own profile" ON "public"."pilot_users" FOR SELECT USING (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Service role can insert audit logs" ON "public"."audit_logs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Service role can modify check types" ON "public"."check_types" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can modify contract types" ON "public"."contract_types" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can modify pilot checks" ON "public"."pilot_checks" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can modify pilots" ON "public"."pilots" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can modify settings" ON "public"."settings" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to password reset tokens" ON "public"."password_reset_tokens" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can update own profile" ON "public"."pilot_users" FOR UPDATE TO "authenticated" USING ((("id" = "auth"."uid"()) AND ("registration_approved" = true))) WITH CHECK ((("id" = "auth"."uid"()) AND ("registration_approved" = true)));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Users can view own leave requests, admins can view all" ON "public"."leave_requests" FOR SELECT USING ((("pilot_id" IN ( SELECT "pilots"."id"
   FROM "public"."pilots"
  WHERE (("pilots"."employee_id")::"text" = (( SELECT "pilots"."employee_id"
           FROM "public"."an_users"
          WHERE ("an_users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text"))) OR (( SELECT "auth"."uid"() AS "uid") IN ( SELECT "an_users"."id"
   FROM "public"."an_users"
  WHERE (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"]))))));



CREATE POLICY "Users can view own profile" ON "public"."an_users" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can view own registration" ON "public"."pilot_users" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "recipient_id"));



ALTER TABLE "public"."an_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "an_users_delete_policy" ON "public"."an_users" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "an_users_1"."id"
   FROM "public"."an_users" "an_users_1"
  WHERE (("an_users_1"."role")::"text" = 'admin'::"text"))));



CREATE POLICY "an_users_insert_policy" ON "public"."an_users" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "an_users_1"."id"
   FROM "public"."an_users" "an_users_1"
  WHERE (("an_users_1"."role")::"text" = 'admin'::"text"))));



CREATE POLICY "an_users_update_policy" ON "public"."an_users" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "an_users_1"."id"
   FROM "public"."an_users" "an_users_1"
  WHERE (("an_users_1"."role")::"text" = 'admin'::"text"))));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."check_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "check_types_delete_policy" ON "public"."check_types" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "an_users"."id"
   FROM "public"."an_users"
  WHERE (("an_users"."role")::"text" = 'admin'::"text"))));



CREATE POLICY "check_types_insert_policy" ON "public"."check_types" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "an_users"."id"
   FROM "public"."an_users"
  WHERE (("an_users"."role")::"text" = 'admin'::"text"))));



CREATE POLICY "check_types_select_policy" ON "public"."check_types" FOR SELECT USING (true);



CREATE POLICY "check_types_update_policy" ON "public"."check_types" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "an_users"."id"
   FROM "public"."an_users"
  WHERE (("an_users"."role")::"text" = 'admin'::"text"))));



ALTER TABLE "public"."contract_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contract_types_delete_policy" ON "public"."contract_types" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "an_users"."id"
   FROM "public"."an_users"
  WHERE (("an_users"."role")::"text" = 'admin'::"text"))));



CREATE POLICY "contract_types_insert_policy" ON "public"."contract_types" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "an_users"."id"
   FROM "public"."an_users"
  WHERE (("an_users"."role")::"text" = 'admin'::"text"))));



CREATE POLICY "contract_types_select_policy" ON "public"."contract_types" FOR SELECT USING (true);



CREATE POLICY "contract_types_update_policy" ON "public"."contract_types" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "an_users"."id"
   FROM "public"."an_users"
  WHERE (("an_users"."role")::"text" = 'admin'::"text"))));



ALTER TABLE "public"."digital_forms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."disciplinary_audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "disciplinary_audit_log_insert" ON "public"."disciplinary_audit_log" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "disciplinary_audit_log_no_delete" ON "public"."disciplinary_audit_log" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "disciplinary_audit_log_no_update" ON "public"."disciplinary_audit_log" FOR UPDATE TO "authenticated" USING (false);



CREATE POLICY "disciplinary_audit_log_select" ON "public"."disciplinary_audit_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"]))))));



CREATE POLICY "disciplinary_audit_select" ON "public"."disciplinary_audit_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"]))))));



CREATE POLICY "disciplinary_delete" ON "public"."disciplinary_matters" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "disciplinary_insert" ON "public"."disciplinary_matters" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"]))))));



ALTER TABLE "public"."disciplinary_matters" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "disciplinary_select" ON "public"."disciplinary_matters" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"]))))));



CREATE POLICY "disciplinary_update" ON "public"."disciplinary_matters" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"]))))));



ALTER TABLE "public"."document_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."flight_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "flight_requests_delete_own" ON "public"."flight_requests" FOR DELETE USING ((("pilot_user_id" = "auth"."uid"()) AND (("status")::"text" = 'PENDING'::"text")));



CREATE POLICY "flight_requests_insert_own" ON "public"."flight_requests" FOR INSERT WITH CHECK (("pilot_user_id" = "auth"."uid"()));



CREATE POLICY "flight_requests_select_managers" ON "public"."flight_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = "auth"."uid"()) AND (("an_users"."role")::"text" = ANY ((ARRAY['admin'::character varying, 'manager'::character varying])::"text"[]))))));



CREATE POLICY "flight_requests_select_own" ON "public"."flight_requests" FOR SELECT USING (("pilot_user_id" = "auth"."uid"()));



CREATE POLICY "flight_requests_update_managers" ON "public"."flight_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = "auth"."uid"()) AND (("an_users"."role")::"text" = ANY ((ARRAY['admin'::character varying, 'manager'::character varying])::"text"[]))))));



CREATE POLICY "flight_requests_update_own" ON "public"."flight_requests" FOR UPDATE USING ((("pilot_user_id" = "auth"."uid"()) AND (("status")::"text" = 'PENDING'::"text"))) WITH CHECK ((("pilot_user_id" = "auth"."uid"()) AND (("status")::"text" = 'PENDING'::"text")));



ALTER TABLE "public"."incident_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "incident_types_all" ON "public"."incident_types" USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"]))))));



CREATE POLICY "incident_types_select" ON "public"."incident_types" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."leave_bids" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leave_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "leave_requests_delete_own" ON "public"."leave_requests" FOR DELETE USING ((("pilot_user_id" = "auth"."uid"()) AND (("status")::"text" = 'PENDING'::"text")));



CREATE POLICY "leave_requests_delete_policy" ON "public"."leave_requests" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "an_users"."id"
   FROM "public"."an_users"
  WHERE (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"])))));



CREATE POLICY "leave_requests_insert_own" ON "public"."leave_requests" FOR INSERT WITH CHECK (("pilot_user_id" = "auth"."uid"()));



CREATE POLICY "leave_requests_select_managers" ON "public"."leave_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = "auth"."uid"()) AND (("an_users"."role")::"text" = ANY ((ARRAY['admin'::character varying, 'manager'::character varying])::"text"[]))))));



CREATE POLICY "leave_requests_select_own" ON "public"."leave_requests" FOR SELECT USING (("pilot_user_id" = "auth"."uid"()));



CREATE POLICY "leave_requests_update_managers" ON "public"."leave_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = "auth"."uid"()) AND (("an_users"."role")::"text" = ANY ((ARRAY['admin'::character varying, 'manager'::character varying])::"text"[]))))));



CREATE POLICY "leave_requests_update_own" ON "public"."leave_requests" FOR UPDATE USING ((("pilot_user_id" = "auth"."uid"()) AND (("status")::"text" = 'PENDING'::"text"))) WITH CHECK ((("pilot_user_id" = "auth"."uid"()) AND (("status")::"text" = 'PENDING'::"text")));



CREATE POLICY "leave_requests_update_policy" ON "public"."leave_requests" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "an_users"."id"
   FROM "public"."an_users"
  WHERE (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"])))));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."password_reset_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pilot_checks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pilot_checks_delete_policy" ON "public"."pilot_checks" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "an_users"."id"
   FROM "public"."an_users"
  WHERE (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"])))));



CREATE POLICY "pilot_checks_insert_policy" ON "public"."pilot_checks" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "an_users"."id"
   FROM "public"."an_users"
  WHERE (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"])))));



CREATE POLICY "pilot_checks_select_policy" ON "public"."pilot_checks" FOR SELECT USING (true);



CREATE POLICY "pilot_checks_update_policy" ON "public"."pilot_checks" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "an_users"."id"
   FROM "public"."an_users"
  WHERE (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"])))));



ALTER TABLE "public"."pilot_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pilots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pilots_delete_policy" ON "public"."pilots" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "an_users"."id"
   FROM "public"."an_users"
  WHERE (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"])))));



CREATE POLICY "pilots_insert_policy" ON "public"."pilots" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "an_users"."id"
   FROM "public"."an_users"
  WHERE (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"])))));



CREATE POLICY "pilots_select_policy" ON "public"."pilots" FOR SELECT USING (true);



CREATE POLICY "pilots_update_policy" ON "public"."pilots" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "an_users"."id"
   FROM "public"."an_users"
  WHERE (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"])))));



ALTER TABLE "public"."settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "task_audit_log_insert" ON "public"."task_audit_log" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "task_audit_log_no_delete" ON "public"."task_audit_log" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "task_audit_log_no_update" ON "public"."task_audit_log" FOR UPDATE TO "authenticated" USING (false);



CREATE POLICY "task_audit_log_select" ON "public"."task_audit_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"]))))));



CREATE POLICY "task_audit_select" ON "public"."task_audit_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"]))))));



ALTER TABLE "public"."task_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "task_categories_all" ON "public"."task_categories" USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"]))))));



CREATE POLICY "task_categories_select" ON "public"."task_categories" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tasks_delete" ON "public"."tasks" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "tasks_insert" ON "public"."tasks" FOR INSERT WITH CHECK ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"])))))));



CREATE POLICY "tasks_select" ON "public"."tasks" FOR SELECT USING ((("assigned_to" = ( SELECT "auth"."uid"() AS "uid")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"])))))));



CREATE POLICY "tasks_update" ON "public"."tasks" FOR UPDATE USING ((("assigned_to" = ( SELECT "auth"."uid"() AS "uid")) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."an_users"
  WHERE (("an_users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND (("an_users"."role")::"text" = ANY (ARRAY[('admin'::character varying)::"text", ('manager'::character varying)::"text"])))))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey16_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey16_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey16_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey16_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey16_out"("public"."gbtreekey16") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey16_out"("public"."gbtreekey16") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey16_out"("public"."gbtreekey16") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey16_out"("public"."gbtreekey16") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey2_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey2_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey2_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey2_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey2_out"("public"."gbtreekey2") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey2_out"("public"."gbtreekey2") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey2_out"("public"."gbtreekey2") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey2_out"("public"."gbtreekey2") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey32_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey32_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey32_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey32_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey32_out"("public"."gbtreekey32") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey32_out"("public"."gbtreekey32") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey32_out"("public"."gbtreekey32") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey32_out"("public"."gbtreekey32") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey4_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey4_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey4_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey4_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey4_out"("public"."gbtreekey4") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey4_out"("public"."gbtreekey4") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey4_out"("public"."gbtreekey4") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey4_out"("public"."gbtreekey4") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey8_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey8_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey8_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey8_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey8_out"("public"."gbtreekey8") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey8_out"("public"."gbtreekey8") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey8_out"("public"."gbtreekey8") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey8_out"("public"."gbtreekey8") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey_var_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbtreekey_var_out"("public"."gbtreekey_var") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_out"("public"."gbtreekey_var") TO "anon";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_out"("public"."gbtreekey_var") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_out"("public"."gbtreekey_var") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."acknowledge_alert"("alert_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."acknowledge_alert"("alert_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."acknowledge_alert"("alert_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."acknowledge_alert"("alert_id" "uuid", "acknowledger_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."acknowledge_alert"("alert_id" "uuid", "acknowledger_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."acknowledge_alert"("alert_id" "uuid", "acknowledger_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_crew_check"("p_crew_member_id" "uuid", "p_check_type_code" "text", "p_completion_date" "date", "p_expiry_date" "date", "p_result" "text", "p_certificate_number" "text", "p_examiner_name" "text", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_crew_check"("p_crew_member_id" "uuid", "p_check_type_code" "text", "p_completion_date" "date", "p_expiry_date" "date", "p_result" "text", "p_certificate_number" "text", "p_examiner_name" "text", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_crew_check"("p_crew_member_id" "uuid", "p_check_type_code" "text", "p_completion_date" "date", "p_expiry_date" "date", "p_result" "text", "p_certificate_number" "text", "p_examiner_name" "text", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."alert_level"("expiry_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."alert_level"("expiry_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."alert_level"("expiry_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."alert_level"("days_until_expiry" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."alert_level"("days_until_expiry" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."alert_level"("days_until_expiry" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_leave_request"("p_request_id" "uuid", "p_approved_by" "uuid", "p_approval_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_leave_request"("p_request_id" "uuid", "p_approved_by" "uuid", "p_approval_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_leave_request"("p_request_id" "uuid", "p_approved_by" "uuid", "p_approval_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_leave_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_status" "text", "p_comments" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_leave_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_status" "text", "p_comments" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_leave_request"("p_request_id" "uuid", "p_reviewer_id" "uuid", "p_status" "text", "p_comments" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_expiry_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_expiry_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_expiry_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_pilot_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_pilot_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_sensitive_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_sensitive_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_sensitive_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_table_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_table_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_table_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."aus_to_date"("date_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."aus_to_date"("date_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."aus_to_date"("date_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."batch_update_certifications"("p_updates" "jsonb"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."batch_update_certifications"("p_updates" "jsonb"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."batch_update_certifications"("p_updates" "jsonb"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."bulk_delete_certifications"("p_certification_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."bulk_delete_certifications"("p_certification_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_delete_certifications"("p_certification_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_check_status"("expiry_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_check_status"("expiry_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_check_status"("expiry_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_check_status"("validity_date" "date", "renewal_date" "date", "advance_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_check_status"("validity_date" "date", "renewal_date" "date", "advance_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_check_status"("validity_date" "date", "renewal_date" "date", "advance_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_check_status"("expiry_date" "date", "warning_days" integer, "critical_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_check_status"("expiry_date" "date", "warning_days" integer, "critical_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_check_status"("expiry_date" "date", "warning_days" integer, "critical_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_check_status"("completion_date" "date", "validity_date" "date", "expiry_date" "date", "advance_renewal_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_check_status"("completion_date" "date", "validity_date" "date", "expiry_date" "date", "advance_renewal_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_check_status"("completion_date" "date", "validity_date" "date", "expiry_date" "date", "advance_renewal_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_days_remaining"("expiry_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_days_remaining"("expiry_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_days_remaining"("expiry_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_days_until_expiry"("expiry_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_days_until_expiry"("expiry_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_days_until_expiry"("expiry_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_leave_days"("start_date" "date", "end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_leave_days"("start_date" "date", "end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_leave_days"("start_date" "date", "end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_optimal_renewal_date"("current_expiry_date" "date", "validity_period_months" integer, "advance_renewal_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_optimal_renewal_date"("current_expiry_date" "date", "validity_period_months" integer, "advance_renewal_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_optimal_renewal_date"("current_expiry_date" "date", "validity_period_months" integer, "advance_renewal_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_pilot_to_hull_ratio"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_pilot_to_hull_ratio"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_pilot_to_hull_ratio"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_rdo_days"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_rdo_days"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_rdo_days"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_required_examiners"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_required_examiners"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_required_training_captains"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_required_training_captains"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_years_in_service"("commencement_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_years_in_service"("commencement_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_years_in_service"("pilot_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_years_in_service"("pilot_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_years_in_service"("pilot_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_years_to_retirement"("birth_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_years_to_retirement"("birth_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_years_to_retirement"("birth_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_years_to_retirement"("pilot_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_years_to_retirement"("pilot_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_years_to_retirement"("pilot_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_pilot_data"("pilot_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_pilot_data"("pilot_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_pilot_data"("pilot_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cash_dist"("money", "money") TO "postgres";
GRANT ALL ON FUNCTION "public"."cash_dist"("money", "money") TO "anon";
GRANT ALL ON FUNCTION "public"."cash_dist"("money", "money") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cash_dist"("money", "money") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_training_currency"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_training_currency"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_training_currency"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_tri_tre_compliance"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_tri_tre_compliance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_tri_tre_compliance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_audit_logs"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_audit_logs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_audit_logs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_password_reset_tokens"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_password_reset_tokens"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_password_reset_tokens"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_expiry_alerts"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_expiry_alerts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_expiry_alerts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_audit_log"("p_action" character varying, "p_entity_type" character varying, "p_entity_id" "uuid", "p_old_values" "jsonb", "p_new_values" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_audit_log"("p_action" character varying, "p_entity_type" character varying, "p_entity_id" "uuid", "p_old_values" "jsonb", "p_new_values" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_audit_log"("p_action" character varying, "p_entity_type" character varying, "p_entity_id" "uuid", "p_old_values" "jsonb", "p_new_values" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_link" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_link" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_link" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("p_recipient_id" "uuid", "p_recipient_type" "text", "p_sender_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification"("p_recipient_id" "uuid", "p_recipient_type" "text", "p_sender_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification"("p_recipient_id" "uuid", "p_recipient_type" "text", "p_sender_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_pilot_with_certifications"("p_pilot_data" "jsonb", "p_certifications" "jsonb"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_pilot_with_certifications"("p_pilot_data" "jsonb", "p_certifications" "jsonb"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_pilot_with_certifications"("p_pilot_data" "jsonb", "p_certifications" "jsonb"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_is_an_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_is_an_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_is_an_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."daily_database_maintenance"() TO "anon";
GRANT ALL ON FUNCTION "public"."daily_database_maintenance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."daily_database_maintenance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."daily_expiry_maintenance"() TO "anon";
GRANT ALL ON FUNCTION "public"."daily_expiry_maintenance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."daily_expiry_maintenance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."daily_maintenance"() TO "anon";
GRANT ALL ON FUNCTION "public"."daily_maintenance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."daily_maintenance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."daily_status_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."daily_status_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."daily_status_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."date_dist"("date", "date") TO "postgres";
GRANT ALL ON FUNCTION "public"."date_dist"("date", "date") TO "anon";
GRANT ALL ON FUNCTION "public"."date_dist"("date", "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."date_dist"("date", "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."days_until_expiry"("expiry_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."days_until_expiry"("expiry_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."days_until_expiry"("expiry_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_pilot_with_cascade"("p_pilot_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_pilot_with_cascade"("p_pilot_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_pilot_with_cascade"("p_pilot_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."excel_date_to_pg_date"("excel_serial" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."excel_date_to_pg_date"("excel_serial" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."excel_date_to_pg_date"("excel_serial" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."find_check_type_by_code"("code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."find_check_type_by_code"("code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_check_type_by_code"("code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."find_crew_member_by_name"("search_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."find_crew_member_by_name"("search_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_crew_member_by_name"("search_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."float4_dist"(real, real) TO "postgres";
GRANT ALL ON FUNCTION "public"."float4_dist"(real, real) TO "anon";
GRANT ALL ON FUNCTION "public"."float4_dist"(real, real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."float4_dist"(real, real) TO "service_role";



GRANT ALL ON FUNCTION "public"."float8_dist"(double precision, double precision) TO "postgres";
GRANT ALL ON FUNCTION "public"."float8_dist"(double precision, double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."float8_dist"(double precision, double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."float8_dist"(double precision, double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_consistent"("internal", bit, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_consistent"("internal", bit, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_consistent"("internal", bit, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_consistent"("internal", bit, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bit_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bit_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bit_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bit_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_consistent"("internal", boolean, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_consistent"("internal", boolean, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_consistent"("internal", boolean, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_consistent"("internal", boolean, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_same"("public"."gbtreekey2", "public"."gbtreekey2", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_same"("public"."gbtreekey2", "public"."gbtreekey2", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_same"("public"."gbtreekey2", "public"."gbtreekey2", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_same"("public"."gbtreekey2", "public"."gbtreekey2", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bool_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bool_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bool_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bool_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bpchar_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bpchar_consistent"("internal", character, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_consistent"("internal", character, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_consistent"("internal", character, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_consistent"("internal", character, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_consistent"("internal", "bytea", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_consistent"("internal", "bytea", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_consistent"("internal", "bytea", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_consistent"("internal", "bytea", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_bytea_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_bytea_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_bytea_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_bytea_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_consistent"("internal", "money", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_consistent"("internal", "money", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_consistent"("internal", "money", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_consistent"("internal", "money", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_distance"("internal", "money", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_distance"("internal", "money", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_distance"("internal", "money", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_distance"("internal", "money", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_cash_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_cash_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_cash_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_cash_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_consistent"("internal", "date", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_consistent"("internal", "date", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_consistent"("internal", "date", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_consistent"("internal", "date", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_distance"("internal", "date", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_distance"("internal", "date", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_distance"("internal", "date", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_distance"("internal", "date", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_date_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_date_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_date_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_date_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_consistent"("internal", "anyenum", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_consistent"("internal", "anyenum", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_consistent"("internal", "anyenum", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_consistent"("internal", "anyenum", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_enum_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_enum_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_enum_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_enum_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_consistent"("internal", real, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_consistent"("internal", real, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_consistent"("internal", real, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_consistent"("internal", real, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_distance"("internal", real, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_distance"("internal", real, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_distance"("internal", real, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_distance"("internal", real, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float4_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float4_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float4_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float4_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_consistent"("internal", double precision, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_consistent"("internal", double precision, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_consistent"("internal", double precision, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_consistent"("internal", double precision, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_distance"("internal", double precision, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_distance"("internal", double precision, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_distance"("internal", double precision, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_distance"("internal", double precision, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_float8_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_float8_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_float8_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_float8_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_consistent"("internal", "inet", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_consistent"("internal", "inet", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_consistent"("internal", "inet", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_consistent"("internal", "inet", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_inet_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_inet_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_inet_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_inet_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_consistent"("internal", smallint, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_consistent"("internal", smallint, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_consistent"("internal", smallint, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_consistent"("internal", smallint, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_distance"("internal", smallint, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_distance"("internal", smallint, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_distance"("internal", smallint, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_distance"("internal", smallint, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_same"("public"."gbtreekey4", "public"."gbtreekey4", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_same"("public"."gbtreekey4", "public"."gbtreekey4", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_same"("public"."gbtreekey4", "public"."gbtreekey4", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_same"("public"."gbtreekey4", "public"."gbtreekey4", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int2_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int2_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int2_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int2_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_consistent"("internal", integer, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_consistent"("internal", integer, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_consistent"("internal", integer, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_consistent"("internal", integer, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_distance"("internal", integer, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_distance"("internal", integer, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_distance"("internal", integer, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_distance"("internal", integer, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int4_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int4_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int4_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int4_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_consistent"("internal", bigint, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_consistent"("internal", bigint, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_consistent"("internal", bigint, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_consistent"("internal", bigint, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_distance"("internal", bigint, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_distance"("internal", bigint, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_distance"("internal", bigint, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_distance"("internal", bigint, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_int8_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_int8_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_int8_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_int8_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_consistent"("internal", interval, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_consistent"("internal", interval, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_consistent"("internal", interval, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_consistent"("internal", interval, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_distance"("internal", interval, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_distance"("internal", interval, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_distance"("internal", interval, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_distance"("internal", interval, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_intv_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_intv_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_intv_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_intv_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_consistent"("internal", "macaddr8", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_consistent"("internal", "macaddr8", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_consistent"("internal", "macaddr8", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_consistent"("internal", "macaddr8", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad8_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad8_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad8_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad8_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_consistent"("internal", "macaddr", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_consistent"("internal", "macaddr", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_consistent"("internal", "macaddr", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_consistent"("internal", "macaddr", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_macad_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_macad_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_macad_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_macad_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_consistent"("internal", numeric, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_consistent"("internal", numeric, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_consistent"("internal", numeric, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_consistent"("internal", numeric, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_numeric_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_numeric_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_numeric_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_numeric_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_consistent"("internal", "oid", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_consistent"("internal", "oid", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_consistent"("internal", "oid", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_consistent"("internal", "oid", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_distance"("internal", "oid", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_distance"("internal", "oid", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_distance"("internal", "oid", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_distance"("internal", "oid", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_oid_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_oid_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_oid_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_oid_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_text_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_text_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_text_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_text_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_consistent"("internal", time without time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_consistent"("internal", time without time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_consistent"("internal", time without time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_consistent"("internal", time without time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_distance"("internal", time without time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_distance"("internal", time without time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_distance"("internal", time without time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_distance"("internal", time without time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_time_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_time_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_time_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_time_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_timetz_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_timetz_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_timetz_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_timetz_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_timetz_consistent"("internal", time with time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_timetz_consistent"("internal", time with time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_timetz_consistent"("internal", time with time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_timetz_consistent"("internal", time with time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_consistent"("internal", timestamp without time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_consistent"("internal", timestamp without time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_consistent"("internal", timestamp without time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_consistent"("internal", timestamp without time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_distance"("internal", timestamp without time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_distance"("internal", timestamp without time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_distance"("internal", timestamp without time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_distance"("internal", timestamp without time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_ts_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_ts_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_ts_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_ts_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_tstz_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_tstz_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_tstz_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_tstz_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_tstz_consistent"("internal", timestamp with time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_tstz_consistent"("internal", timestamp with time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_tstz_consistent"("internal", timestamp with time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_tstz_consistent"("internal", timestamp with time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_tstz_distance"("internal", timestamp with time zone, smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_tstz_distance"("internal", timestamp with time zone, smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_tstz_distance"("internal", timestamp with time zone, smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_tstz_distance"("internal", timestamp with time zone, smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_consistent"("internal", "uuid", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_consistent"("internal", "uuid", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_consistent"("internal", "uuid", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_consistent"("internal", "uuid", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_uuid_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_uuid_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_uuid_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_uuid_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_var_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_var_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_var_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_var_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gbt_var_fetch"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gbt_var_fetch"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gbt_var_fetch"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gbt_var_fetch"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_certification_alerts"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_certification_alerts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_certification_alerts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_check_alerts"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_check_alerts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_check_alerts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_compliance_report"("start_date" "date", "end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_compliance_report"("start_date" "date", "end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_compliance_report"("start_date" "date", "end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_comprehensive_expiry_alerts"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_comprehensive_expiry_alerts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_comprehensive_expiry_alerts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_expiry_alerts"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_expiry_alerts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_expiry_alerts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_simplified_expiry_alerts"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_simplified_expiry_alerts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_simplified_expiry_alerts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_staff_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_staff_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_staff_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_certification_compliance_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_certification_compliance_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_certification_compliance_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_certification_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_certification_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_check_category_distribution"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_check_category_distribution"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_check_category_distribution"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_check_status"("expiry_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_check_status"("expiry_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_check_status"("expiry_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_crew_audit_trail"("crew_member_uuid" "uuid", "days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_crew_audit_trail"("crew_member_uuid" "uuid", "days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_crew_audit_trail"("crew_member_uuid" "uuid", "days_back" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_crew_expiry_summary"("crew_member_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_crew_expiry_summary"("crew_member_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_crew_expiry_summary"("crew_member_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_crew_member_expiring_items"("p_crew_member_id" "uuid", "p_days_ahead" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_crew_member_expiring_items"("p_crew_member_id" "uuid", "p_days_ahead" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_crew_member_expiring_items"("p_crew_member_id" "uuid", "p_days_ahead" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_alert_severity_and_type"("days_remaining" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_alert_severity_and_type"("days_remaining" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_pilot_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_pilot_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_pilot_id"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_current_user_role"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_metrics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_database_performance_metrics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_database_performance_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_database_performance_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_expiring_certifications_with_email"("days_threshold" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_expiring_certifications_with_email"("days_threshold" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_expiring_certifications_with_email"("days_threshold" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_expiring_checks"("days_ahead" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_expiring_checks"("days_ahead" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_expiring_checks"("days_ahead" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_expiry_statistics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_expiry_statistics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_expiry_statistics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_fleet_compliance_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_fleet_compliance_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_fleet_compliance_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_fleet_expiry_statistics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_fleet_expiry_statistics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_fleet_expiry_statistics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_monthly_expiry_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_monthly_expiry_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_monthly_expiry_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pending_pilot_registrations"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_pending_pilot_registrations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_pilot_registrations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pilot_check_types"("pilot_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_pilot_check_types"("pilot_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pilot_check_types"("pilot_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pilot_compliance_stats"("pilot_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_pilot_compliance_stats"("pilot_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pilot_compliance_stats"("pilot_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pilot_dashboard_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_pilot_dashboard_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pilot_dashboard_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pilot_data_with_checks"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_pilot_data_with_checks"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pilot_data_with_checks"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pilot_details"("pilot_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_pilot_details"("pilot_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pilot_details"("pilot_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pilot_expiries"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pilot_expiries"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pilot_expiry_summary"("pilot_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_pilot_expiry_summary"("pilot_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pilot_expiry_summary"("pilot_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pilot_statistics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_pilot_statistics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pilot_statistics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pilot_warning_count"("pilot_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_pilot_warning_count"("pilot_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pilot_warning_count"("pilot_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_renewal_recommendations"("days_ahead" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_renewal_recommendations"("days_ahead" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_renewal_recommendations"("days_ahead" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_system_settings"("p_user_email" "text", "p_setting_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_system_settings"("p_user_email" "text", "p_setting_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_system_settings"("p_user_email" "text", "p_setting_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_years_in_service"("commencement_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_years_in_service"("commencement_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_years_to_retirement"("birth_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_years_to_retirement"("birth_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_years_to_retirement"("birth_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_btree_consistent"("internal", smallint, "anyelement", integer, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_btree_consistent"("internal", smallint, "anyelement", integer, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_btree_consistent"("internal", smallint, "anyelement", integer, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_btree_consistent"("internal", smallint, "anyelement", integer, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_anyenum"("anyenum", "anyenum", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_anyenum"("anyenum", "anyenum", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_anyenum"("anyenum", "anyenum", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_anyenum"("anyenum", "anyenum", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bit"(bit, bit, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bit"(bit, bit, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bit"(bit, bit, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bit"(bit, bit, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bool"(boolean, boolean, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bool"(boolean, boolean, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bool"(boolean, boolean, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bool"(boolean, boolean, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bpchar"(character, character, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bpchar"(character, character, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bpchar"(character, character, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bpchar"(character, character, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bytea"("bytea", "bytea", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bytea"("bytea", "bytea", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bytea"("bytea", "bytea", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bytea"("bytea", "bytea", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_char"("char", "char", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_char"("char", "char", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_char"("char", "char", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_char"("char", "char", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_cidr"("cidr", "cidr", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_cidr"("cidr", "cidr", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_cidr"("cidr", "cidr", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_cidr"("cidr", "cidr", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_date"("date", "date", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_date"("date", "date", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_date"("date", "date", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_date"("date", "date", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float4"(real, real, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float4"(real, real, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float4"(real, real, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float4"(real, real, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float8"(double precision, double precision, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float8"(double precision, double precision, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float8"(double precision, double precision, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float8"(double precision, double precision, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_inet"("inet", "inet", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_inet"("inet", "inet", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_inet"("inet", "inet", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_inet"("inet", "inet", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int2"(smallint, smallint, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int2"(smallint, smallint, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int2"(smallint, smallint, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int2"(smallint, smallint, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int4"(integer, integer, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int4"(integer, integer, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int4"(integer, integer, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int4"(integer, integer, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int8"(bigint, bigint, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int8"(bigint, bigint, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int8"(bigint, bigint, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int8"(bigint, bigint, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_interval"(interval, interval, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_interval"(interval, interval, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_interval"(interval, interval, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_interval"(interval, interval, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr"("macaddr", "macaddr", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr"("macaddr", "macaddr", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr"("macaddr", "macaddr", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr"("macaddr", "macaddr", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr8"("macaddr8", "macaddr8", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr8"("macaddr8", "macaddr8", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr8"("macaddr8", "macaddr8", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr8"("macaddr8", "macaddr8", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_money"("money", "money", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_money"("money", "money", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_money"("money", "money", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_money"("money", "money", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_name"("name", "name", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_name"("name", "name", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_name"("name", "name", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_name"("name", "name", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_numeric"(numeric, numeric, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_numeric"(numeric, numeric, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_numeric"(numeric, numeric, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_numeric"(numeric, numeric, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_oid"("oid", "oid", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_oid"("oid", "oid", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_oid"("oid", "oid", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_oid"("oid", "oid", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_text"("text", "text", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_text"("text", "text", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_text"("text", "text", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_text"("text", "text", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_time"(time without time zone, time without time zone, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_time"(time without time zone, time without time zone, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_time"(time without time zone, time without time zone, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_time"(time without time zone, time without time zone, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamp"(timestamp without time zone, timestamp without time zone, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamp"(timestamp without time zone, timestamp without time zone, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamp"(timestamp without time zone, timestamp without time zone, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamp"(timestamp without time zone, timestamp without time zone, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamptz"(timestamp with time zone, timestamp with time zone, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamptz"(timestamp with time zone, timestamp with time zone, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamptz"(timestamp with time zone, timestamp with time zone, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamptz"(timestamp with time zone, timestamp with time zone, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timetz"(time with time zone, time with time zone, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timetz"(time with time zone, time with time zone, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timetz"(time with time zone, time with time zone, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timetz"(time with time zone, time with time zone, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_uuid"("uuid", "uuid", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_uuid"("uuid", "uuid", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_uuid"("uuid", "uuid", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_uuid"("uuid", "uuid", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_varbit"(bit varying, bit varying, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_varbit"(bit varying, bit varying, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_varbit"(bit varying, bit varying, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_varbit"(bit varying, bit varying, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_enum_cmp"("anyenum", "anyenum") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_enum_cmp"("anyenum", "anyenum") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_enum_cmp"("anyenum", "anyenum") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_enum_cmp"("anyenum", "anyenum") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_anyenum"("anyenum", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_anyenum"("anyenum", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_anyenum"("anyenum", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_anyenum"("anyenum", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_bit"(bit, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bit"(bit, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bit"(bit, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bit"(bit, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_bool"(boolean, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bool"(boolean, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bool"(boolean, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bool"(boolean, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_bpchar"(character, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bpchar"(character, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bpchar"(character, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bpchar"(character, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_bytea"("bytea", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bytea"("bytea", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bytea"("bytea", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bytea"("bytea", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_char"("char", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_char"("char", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_char"("char", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_char"("char", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_cidr"("cidr", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_cidr"("cidr", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_cidr"("cidr", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_cidr"("cidr", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_date"("date", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_date"("date", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_date"("date", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_date"("date", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_float4"(real, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_float4"(real, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_float4"(real, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_float4"(real, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_float8"(double precision, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_float8"(double precision, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_float8"(double precision, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_float8"(double precision, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_inet"("inet", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_inet"("inet", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_inet"("inet", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_inet"("inet", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_int2"(smallint, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int2"(smallint, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int2"(smallint, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int2"(smallint, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_int4"(integer, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int4"(integer, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int4"(integer, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int4"(integer, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_int8"(bigint, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int8"(bigint, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int8"(bigint, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int8"(bigint, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_interval"(interval, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_interval"(interval, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_interval"(interval, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_interval"(interval, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr"("macaddr", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr"("macaddr", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr"("macaddr", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr"("macaddr", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr8"("macaddr8", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr8"("macaddr8", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr8"("macaddr8", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr8"("macaddr8", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_money"("money", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_money"("money", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_money"("money", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_money"("money", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_name"("name", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_name"("name", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_name"("name", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_name"("name", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_numeric"(numeric, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_numeric"(numeric, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_numeric"(numeric, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_numeric"(numeric, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_oid"("oid", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_oid"("oid", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_oid"("oid", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_oid"("oid", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_text"("text", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_text"("text", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_text"("text", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_text"("text", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_time"(time without time zone, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_time"(time without time zone, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_time"(time without time zone, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_time"(time without time zone, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamp"(timestamp without time zone, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamp"(timestamp without time zone, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamp"(timestamp without time zone, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamp"(timestamp without time zone, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamptz"(timestamp with time zone, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamptz"(timestamp with time zone, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamptz"(timestamp with time zone, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamptz"(timestamp with time zone, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_timetz"(time with time zone, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timetz"(time with time zone, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timetz"(time with time zone, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timetz"(time with time zone, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_uuid"("uuid", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_uuid"("uuid", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_uuid"("uuid", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_uuid"("uuid", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_varbit"(bit varying, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_varbit"(bit varying, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_varbit"(bit varying, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_varbit"(bit varying, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_anyenum"("anyenum", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_anyenum"("anyenum", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_anyenum"("anyenum", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_anyenum"("anyenum", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_bit"(bit, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bit"(bit, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bit"(bit, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bit"(bit, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_bool"(boolean, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bool"(boolean, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bool"(boolean, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bool"(boolean, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_bpchar"(character, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bpchar"(character, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bpchar"(character, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bpchar"(character, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_bytea"("bytea", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bytea"("bytea", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bytea"("bytea", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bytea"("bytea", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_char"("char", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_char"("char", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_char"("char", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_char"("char", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_cidr"("cidr", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_cidr"("cidr", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_cidr"("cidr", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_cidr"("cidr", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_date"("date", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_date"("date", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_date"("date", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_date"("date", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_float4"(real, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_float4"(real, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_float4"(real, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_float4"(real, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_float8"(double precision, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_float8"(double precision, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_float8"(double precision, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_float8"(double precision, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_inet"("inet", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_inet"("inet", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_inet"("inet", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_inet"("inet", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_int2"(smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int2"(smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int2"(smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int2"(smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_int4"(integer, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int4"(integer, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int4"(integer, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int4"(integer, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_int8"(bigint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int8"(bigint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int8"(bigint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int8"(bigint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_interval"(interval, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_interval"(interval, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_interval"(interval, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_interval"(interval, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr"("macaddr", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr"("macaddr", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr"("macaddr", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr"("macaddr", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr8"("macaddr8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr8"("macaddr8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr8"("macaddr8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr8"("macaddr8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_money"("money", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_money"("money", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_money"("money", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_money"("money", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_name"("name", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_name"("name", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_name"("name", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_name"("name", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_numeric"(numeric, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_numeric"(numeric, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_numeric"(numeric, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_numeric"(numeric, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_oid"("oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_oid"("oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_oid"("oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_oid"("oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_text"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_text"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_text"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_text"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_time"(time without time zone, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_time"(time without time zone, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_time"(time without time zone, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_time"(time without time zone, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamp"(timestamp without time zone, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamp"(timestamp without time zone, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamp"(timestamp without time zone, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamp"(timestamp without time zone, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamptz"(timestamp with time zone, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamptz"(timestamp with time zone, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamptz"(timestamp with time zone, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamptz"(timestamp with time zone, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_timetz"(time with time zone, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timetz"(time with time zone, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timetz"(time with time zone, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timetz"(time with time zone, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_uuid"("uuid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_uuid"("uuid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_uuid"("uuid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_uuid"("uuid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_varbit"(bit varying, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_varbit"(bit varying, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_varbit"(bit varying, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_varbit"(bit varying, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_numeric_cmp"(numeric, numeric) TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_numeric_cmp"(numeric, numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."gin_numeric_cmp"(numeric, numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_numeric_cmp"(numeric, numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."import_crew_check"("p_crew_name" character varying, "p_check_code" character varying, "p_validity_serial" numeric, "p_renewal_serial" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."import_crew_check"("p_crew_name" character varying, "p_check_code" character varying, "p_validity_serial" numeric, "p_renewal_serial" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."import_crew_check"("p_crew_name" character varying, "p_check_code" character varying, "p_validity_serial" numeric, "p_renewal_serial" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_post_view_count"("post_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_post_view_count"("post_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_post_view_count"("post_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_crew_checks_batch"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_crew_checks_batch"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_crew_checks_batch"() TO "service_role";



GRANT ALL ON FUNCTION "public"."int2_dist"(smallint, smallint) TO "postgres";
GRANT ALL ON FUNCTION "public"."int2_dist"(smallint, smallint) TO "anon";
GRANT ALL ON FUNCTION "public"."int2_dist"(smallint, smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."int2_dist"(smallint, smallint) TO "service_role";



GRANT ALL ON FUNCTION "public"."int4_dist"(integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."int4_dist"(integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."int4_dist"(integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."int4_dist"(integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."int8_dist"(bigint, bigint) TO "postgres";
GRANT ALL ON FUNCTION "public"."int8_dist"(bigint, bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."int8_dist"(bigint, bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."int8_dist"(bigint, bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."interval_dist"(interval, interval) TO "postgres";
GRANT ALL ON FUNCTION "public"."interval_dist"(interval, interval) TO "anon";
GRANT ALL ON FUNCTION "public"."interval_dist"(interval, interval) TO "authenticated";
GRANT ALL ON FUNCTION "public"."interval_dist"(interval, interval) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_current_user"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_current_user"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_current_user"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_manager_or_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_manager_or_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_manager_or_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_pilot_owner"("pilot_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_pilot_owner"("pilot_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_pilot_owner"("pilot_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_pilot_users_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_pilot_users_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_pilot_users_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_renewal_plan_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_renewal_plan_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_renewal_plan_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."map_crew_name_to_id"("check_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."map_crew_name_to_id"("check_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."map_crew_name_to_id"("check_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_check_complete"("check_id" "uuid", "completion_date" "date", "expiry_date" "date", "document_ref" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_check_complete"("check_id" "uuid", "completion_date" "date", "expiry_date" "date", "document_ref" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_check_complete"("check_id" "uuid", "completion_date" "date", "expiry_date" "date", "document_ref" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_check_complete"("p_crew_member_id" "uuid", "p_check_type_code" character varying, "p_completion_date" "date", "p_validity_months" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."mark_check_complete"("p_crew_member_id" "uuid", "p_check_type_code" character varying, "p_completion_date" "date", "p_validity_months" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_check_complete"("p_crew_member_id" "uuid", "p_check_type_code" character varying, "p_completion_date" "date", "p_validity_months" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."monitor_compliance_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."monitor_compliance_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."monitor_compliance_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."oid_dist"("oid", "oid") TO "postgres";
GRANT ALL ON FUNCTION "public"."oid_dist"("oid", "oid") TO "anon";
GRANT ALL ON FUNCTION "public"."oid_dist"("oid", "oid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."oid_dist"("oid", "oid") TO "service_role";



GRANT ALL ON FUNCTION "public"."parse_cert_date"("date_str" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."parse_cert_date"("date_str" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."parse_cert_date"("date_str" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."parse_excel_date"("excel_serial" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."parse_excel_date"("excel_serial" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."parse_excel_date"("excel_serial" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."parse_excel_date"("excel_value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."parse_excel_date"("excel_value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."parse_excel_date"("excel_value" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_pending_reminders"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_pending_reminders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_pending_reminders"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_all_expiry_views"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_all_expiry_views"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_all_expiry_views"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_dashboard_metrics"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_dashboard_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_dashboard_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_dashboard_views"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_dashboard_views"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_dashboard_views"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_expiry_materialized_views"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_expiry_materialized_views"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_expiry_materialized_views"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_expiry_views"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_expiry_views"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_expiry_views"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_pilot_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_pilot_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."safe_to_date"("date_str" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."safe_to_date"("date_str" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_to_date"("date_str" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_pilots_by_name"("search_term" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_pilots_by_name"("search_term" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_pilots_by_name"("search_term" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_feedback_post_tx"("p_pilot_user_id" "uuid", "p_title" "text", "p_content" "text", "p_category_id" "uuid", "p_is_anonymous" boolean, "p_author_display_name" "text", "p_author_rank" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_feedback_post_tx"("p_pilot_user_id" "uuid", "p_title" "text", "p_content" "text", "p_category_id" "uuid", "p_is_anonymous" boolean, "p_author_display_name" "text", "p_author_rank" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_feedback_post_tx"("p_pilot_user_id" "uuid", "p_title" "text", "p_content" "text", "p_category_id" "uuid", "p_is_anonymous" boolean, "p_author_display_name" "text", "p_author_rank" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_flight_request_tx"("p_pilot_user_id" "uuid", "p_request_type" "text", "p_flight_date" "date", "p_description" "text", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_flight_request_tx"("p_pilot_user_id" "uuid", "p_request_type" "text", "p_flight_date" "date", "p_description" "text", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_flight_request_tx"("p_pilot_user_id" "uuid", "p_request_type" "text", "p_flight_date" "date", "p_description" "text", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_flight_request_tx"("p_pilot_id" "uuid", "p_request_type" "text", "p_route_details" "text", "p_preferred_date" "date", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_flight_request_tx"("p_pilot_id" "uuid", "p_request_type" "text", "p_route_details" "text", "p_preferred_date" "date", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_flight_request_tx"("p_pilot_id" "uuid", "p_request_type" "text", "p_route_details" "text", "p_preferred_date" "date", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_leave_request_tx"("p_pilot_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_roster_period" "text", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_leave_request_tx"("p_pilot_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_roster_period" "text", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_leave_request_tx"("p_pilot_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_roster_period" "text", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_leave_request_tx"("p_pilot_user_id" "uuid", "p_request_type" "text", "p_start_date" "date", "p_end_date" "date", "p_days_count" integer, "p_roster_period" "text", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_leave_request_tx"("p_pilot_user_id" "uuid", "p_request_type" "text", "p_start_date" "date", "p_end_date" "date", "p_days_count" integer, "p_roster_period" "text", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_leave_request_tx"("p_pilot_user_id" "uuid", "p_request_type" "text", "p_start_date" "date", "p_end_date" "date", "p_days_count" integer, "p_roster_period" "text", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."system_health_check"() TO "anon";
GRANT ALL ON FUNCTION "public"."system_health_check"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."system_health_check"() TO "service_role";



GRANT ALL ON FUNCTION "public"."time_dist"(time without time zone, time without time zone) TO "postgres";
GRANT ALL ON FUNCTION "public"."time_dist"(time without time zone, time without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."time_dist"(time without time zone, time without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."time_dist"(time without time zone, time without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_audit_log"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_audit_log"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_audit_log"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_check_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_check_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_check_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ts_dist"(timestamp without time zone, timestamp without time zone) TO "postgres";
GRANT ALL ON FUNCTION "public"."ts_dist"(timestamp without time zone, timestamp without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."ts_dist"(timestamp without time zone, timestamp without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."ts_dist"(timestamp without time zone, timestamp without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."tstz_dist"(timestamp with time zone, timestamp with time zone) TO "postgres";
GRANT ALL ON FUNCTION "public"."tstz_dist"(timestamp with time zone, timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."tstz_dist"(timestamp with time zone, timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."tstz_dist"(timestamp with time zone, timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_all_expiry_statuses"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_all_expiry_statuses"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_all_expiry_statuses"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_auth_users_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_auth_users_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_auth_users_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_category_post_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_category_post_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_category_post_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_certification_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_certification_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_check_expiry_dates"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_check_expiry_dates"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_check_expiry_dates"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_check_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_check_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_check_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_check_statuses"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_check_statuses"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_check_statuses"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_crew_certification_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_crew_certification_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_crew_certification_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_crew_instructor_status"("p_crew_member_id" "uuid", "p_is_tre" boolean, "p_is_tri" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_crew_instructor_status"("p_crew_member_id" "uuid", "p_is_tre" boolean, "p_is_tri" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_crew_instructor_status"("p_crew_member_id" "uuid", "p_is_tre" boolean, "p_is_tri" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_flight_requests_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_flight_requests_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_flight_requests_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_full_name"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_full_name"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_full_name"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_pilot_checks_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_pilot_checks_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_pilot_checks_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_pilot_feedback_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_pilot_feedback_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_pilot_feedback_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_pilot_leave_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_pilot_leave_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_pilot_leave_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_pilot_users_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_pilot_users_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_pilot_users_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_position_from_role_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_position_from_role_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_position_from_role_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_post_comment_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_post_comment_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_post_comment_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_renewal_plan_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_renewal_plan_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_renewal_plan_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_system_settings"("p_user_email" "text", "p_setting_type" "text", "p_fleet_size" integer, "p_required_captains_per_aircraft" integer, "p_required_first_officers_per_aircraft" integer, "p_training_captain_ratio" numeric, "p_examiner_ratio" numeric, "p_alert_days_critical" integer, "p_alert_days_warning" integer, "p_alert_days_info" integer, "p_email_notifications" boolean, "p_sms_notifications" boolean, "p_system_timezone" "text", "p_backup_frequency" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_system_settings"("p_user_email" "text", "p_setting_type" "text", "p_fleet_size" integer, "p_required_captains_per_aircraft" integer, "p_required_first_officers_per_aircraft" integer, "p_training_captain_ratio" numeric, "p_examiner_ratio" numeric, "p_alert_days_critical" integer, "p_alert_days_warning" integer, "p_alert_days_info" integer, "p_email_notifications" boolean, "p_sms_notifications" boolean, "p_system_timezone" "text", "p_backup_frequency" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_system_settings"("p_user_email" "text", "p_setting_type" "text", "p_fleet_size" integer, "p_required_captains_per_aircraft" integer, "p_required_first_officers_per_aircraft" integer, "p_training_captain_ratio" numeric, "p_examiner_ratio" numeric, "p_alert_days_critical" integer, "p_alert_days_warning" integer, "p_alert_days_info" integer, "p_email_notifications" boolean, "p_sms_notifications" boolean, "p_system_timezone" "text", "p_backup_frequency" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_admin_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_admin_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_admin_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_admin_role"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_admin_role"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_admin_role"("user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."user_has_role"("required_roles" "text"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."user_has_role"("required_roles" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_role"("required_roles" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_role"("required_roles" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_crew_member_completeness"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_crew_member_completeness"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_crew_member_completeness"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_crew_references"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_crew_references"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_crew_references"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_expiry_date"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_expiry_date"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."an_users" TO "anon";
GRANT ALL ON TABLE "public"."an_users" TO "authenticated";
GRANT ALL ON TABLE "public"."an_users" TO "service_role";



GRANT ALL ON TABLE "public"."task_categories" TO "anon";
GRANT ALL ON TABLE "public"."task_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."task_categories" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."active_tasks_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."active_tasks_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."active_tasks_dashboard" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."pilots" TO "anon";
GRANT ALL ON TABLE "public"."pilots" TO "authenticated";
GRANT ALL ON TABLE "public"."pilots" TO "service_role";



GRANT ALL ON TABLE "public"."captain_qualifications_summary" TO "anon";
GRANT ALL ON TABLE "public"."captain_qualifications_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."captain_qualifications_summary" TO "service_role";



GRANT ALL ON TABLE "public"."certification_renewal_plans" TO "anon";
GRANT ALL ON TABLE "public"."certification_renewal_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."certification_renewal_plans" TO "service_role";



GRANT ALL ON TABLE "public"."check_types" TO "anon";
GRANT ALL ON TABLE "public"."check_types" TO "authenticated";
GRANT ALL ON TABLE "public"."check_types" TO "service_role";



GRANT ALL ON TABLE "public"."pilot_checks" TO "anon";
GRANT ALL ON TABLE "public"."pilot_checks" TO "authenticated";
GRANT ALL ON TABLE "public"."pilot_checks" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."compliance_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_dashboard" TO "service_role";



GRANT ALL ON TABLE "public"."contract_types" TO "anon";
GRANT ALL ON TABLE "public"."contract_types" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_types" TO "service_role";



GRANT ALL ON TABLE "public"."detailed_expiring_checks" TO "anon";
GRANT ALL ON TABLE "public"."detailed_expiring_checks" TO "authenticated";
GRANT ALL ON TABLE "public"."detailed_expiring_checks" TO "service_role";



GRANT ALL ON TABLE "public"."digital_forms" TO "anon";
GRANT ALL ON TABLE "public"."digital_forms" TO "authenticated";
GRANT ALL ON TABLE "public"."digital_forms" TO "service_role";



GRANT ALL ON TABLE "public"."disciplinary_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."disciplinary_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."disciplinary_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."disciplinary_matters" TO "anon";
GRANT ALL ON TABLE "public"."disciplinary_matters" TO "authenticated";
GRANT ALL ON TABLE "public"."disciplinary_matters" TO "service_role";



GRANT ALL ON TABLE "public"."document_categories" TO "anon";
GRANT ALL ON TABLE "public"."document_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."document_categories" TO "service_role";



GRANT ALL ON TABLE "public"."expiring_checks" TO "anon";
GRANT ALL ON TABLE "public"."expiring_checks" TO "authenticated";
GRANT ALL ON TABLE "public"."expiring_checks" TO "service_role";



GRANT ALL ON TABLE "public"."expiring_checks_optimized" TO "anon";
GRANT ALL ON TABLE "public"."expiring_checks_optimized" TO "authenticated";
GRANT ALL ON TABLE "public"."expiring_checks_optimized" TO "service_role";



GRANT ALL ON TABLE "public"."feedback_categories" TO "anon";
GRANT ALL ON TABLE "public"."feedback_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback_categories" TO "service_role";



GRANT ALL ON TABLE "public"."flight_requests" TO "anon";
GRANT ALL ON TABLE "public"."flight_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."flight_requests" TO "service_role";



GRANT ALL ON TABLE "public"."incident_types" TO "anon";
GRANT ALL ON TABLE "public"."incident_types" TO "authenticated";
GRANT ALL ON TABLE "public"."incident_types" TO "service_role";



GRANT ALL ON TABLE "public"."leave_bids" TO "anon";
GRANT ALL ON TABLE "public"."leave_bids" TO "authenticated";
GRANT ALL ON TABLE "public"."leave_bids" TO "service_role";



GRANT ALL ON TABLE "public"."leave_requests" TO "anon";
GRANT ALL ON TABLE "public"."leave_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."leave_requests" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."password_reset_tokens" TO "anon";
GRANT ALL ON TABLE "public"."password_reset_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."password_reset_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."pilot_users" TO "anon";
GRANT ALL ON TABLE "public"."pilot_users" TO "authenticated";
GRANT ALL ON TABLE "public"."pilot_users" TO "service_role";



GRANT ALL ON TABLE "public"."pending_pilot_registrations" TO "anon";
GRANT ALL ON TABLE "public"."pending_pilot_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."pending_pilot_registrations" TO "service_role";



GRANT ALL ON TABLE "public"."pilot_checks_overview" TO "anon";
GRANT ALL ON TABLE "public"."pilot_checks_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."pilot_checks_overview" TO "service_role";



GRANT ALL ON TABLE "public"."pilot_feedback" TO "anon";
GRANT ALL ON TABLE "public"."pilot_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."pilot_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."pilot_qualification_summary" TO "anon";
GRANT ALL ON TABLE "public"."pilot_qualification_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."pilot_qualification_summary" TO "service_role";



GRANT ALL ON TABLE "public"."pilot_report_summary" TO "anon";
GRANT ALL ON TABLE "public"."pilot_report_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."pilot_report_summary" TO "service_role";



GRANT ALL ON TABLE "public"."pilot_requirements_compliance" TO "anon";
GRANT ALL ON TABLE "public"."pilot_requirements_compliance" TO "authenticated";
GRANT ALL ON TABLE "public"."pilot_requirements_compliance" TO "service_role";



GRANT ALL ON TABLE "public"."pilot_summary_optimized" TO "anon";
GRANT ALL ON TABLE "public"."pilot_summary_optimized" TO "authenticated";
GRANT ALL ON TABLE "public"."pilot_summary_optimized" TO "service_role";



GRANT ALL ON TABLE "public"."pilot_user_mappings" TO "anon";
GRANT ALL ON TABLE "public"."pilot_user_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."pilot_user_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."pilot_warning_history" TO "anon";
GRANT ALL ON TABLE "public"."pilot_warning_history" TO "authenticated";
GRANT ALL ON TABLE "public"."pilot_warning_history" TO "service_role";



GRANT ALL ON TABLE "public"."pilots_with_contract_details" TO "anon";
GRANT ALL ON TABLE "public"."pilots_with_contract_details" TO "authenticated";
GRANT ALL ON TABLE "public"."pilots_with_contract_details" TO "service_role";



GRANT ALL ON TABLE "public"."renewal_plan_history" TO "anon";
GRANT ALL ON TABLE "public"."renewal_plan_history" TO "authenticated";
GRANT ALL ON TABLE "public"."renewal_plan_history" TO "service_role";



GRANT ALL ON TABLE "public"."roster_period_capacity" TO "anon";
GRANT ALL ON TABLE "public"."roster_period_capacity" TO "authenticated";
GRANT ALL ON TABLE "public"."roster_period_capacity" TO "service_role";



GRANT ALL ON TABLE "public"."settings" TO "anon";
GRANT ALL ON TABLE "public"."settings" TO "authenticated";
GRANT ALL ON TABLE "public"."settings" TO "service_role";



GRANT ALL ON TABLE "public"."task_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."task_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."task_audit_log" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
