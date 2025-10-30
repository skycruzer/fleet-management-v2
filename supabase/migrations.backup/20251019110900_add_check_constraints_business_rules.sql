-- Migration: Add CHECK Constraints for Business Rules
-- Description: Add database-level validation constraints to prevent invalid data
-- Priority: P1 (CRITICAL) - Data Integrity
-- Created: 2025-10-19
-- Reference: TODO #039

-- ============================================================================
-- DROP EXISTING CONSTRAINTS IF THEY EXIST
-- ============================================================================
DO $$
BEGIN
  -- Drop leave_requests constraints
  ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_dates_valid;
  ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_days_positive;
  ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_start_date_reasonable;
  ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_duration_reasonable;

  -- Drop flight_requests constraints
  ALTER TABLE flight_requests DROP CONSTRAINT IF EXISTS flight_requests_date_not_past;

  -- Drop an_users constraints
  ALTER TABLE an_users DROP CONSTRAINT IF EXISTS an_users_email_format;
  ALTER TABLE an_users DROP CONSTRAINT IF EXISTS an_users_password_min_length;

  -- Drop pilots constraints
  ALTER TABLE pilots DROP CONSTRAINT IF EXISTS pilots_dob_reasonable;
  ALTER TABLE pilots DROP CONSTRAINT IF EXISTS pilots_commencement_date_not_future;
  ALTER TABLE pilots DROP CONSTRAINT IF EXISTS pilots_seniority_number_positive;

  -- Drop pilot_checks constraints
  ALTER TABLE pilot_checks DROP CONSTRAINT IF EXISTS pilot_checks_issue_date_not_future;
  ALTER TABLE pilot_checks DROP CONSTRAINT IF EXISTS pilot_checks_expiry_after_issue;
  ALTER TABLE pilot_checks DROP CONSTRAINT IF EXISTS pilot_checks_expiry_retention;

  -- Drop notifications constraints
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_title_not_empty;
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_message_not_empty;

  -- Drop disciplinary_actions constraints (table may not exist yet)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'disciplinary_actions') THEN
    ALTER TABLE disciplinary_actions DROP CONSTRAINT IF EXISTS disciplinary_actions_effective_date_valid;
    ALTER TABLE disciplinary_actions DROP CONSTRAINT IF EXISTS disciplinary_actions_expiry_date_valid;
  END IF;

  -- Drop feedback-related constraints (tables may not exist yet)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'feedback_posts') THEN
    ALTER TABLE feedback_posts DROP CONSTRAINT IF EXISTS feedback_posts_title_not_whitespace CASCADE;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'feedback_comments') THEN
    ALTER TABLE feedback_comments DROP CONSTRAINT IF EXISTS feedback_comments_content_not_whitespace;
    ALTER TABLE feedback_comments DROP CONSTRAINT IF EXISTS feedback_comments_content_not_empty;
  END IF;
END $$;

-- ============================================================================
-- LEAVE REQUESTS CONSTRAINTS
-- ============================================================================

-- Constraint 1: Ensure end_date is on or after start_date
ALTER TABLE leave_requests
  ADD CONSTRAINT leave_requests_dates_valid
  CHECK (end_date >= start_date);

COMMENT ON CONSTRAINT leave_requests_dates_valid ON leave_requests IS
  'Ensures that leave request end date is on or after the start date';

-- Constraint 2: Ensure days_count is positive
ALTER TABLE leave_requests
  ADD CONSTRAINT leave_requests_days_positive
  CHECK (days_count > 0);

COMMENT ON CONSTRAINT leave_requests_days_positive ON leave_requests IS
  'Ensures that leave request days count is always greater than zero';

-- Constraint 6: Ensure leave request start_date is not too far in the past
ALTER TABLE leave_requests
  ADD CONSTRAINT leave_requests_start_date_reasonable
  CHECK (start_date >= current_date - INTERVAL '90 days');

COMMENT ON CONSTRAINT leave_requests_start_date_reasonable ON leave_requests IS
  'Prevents backdating leave requests more than 90 days in the past';

-- Constraint 7: Ensure leave request doesn't span more than 365 days
ALTER TABLE leave_requests
  ADD CONSTRAINT leave_requests_duration_reasonable
  CHECK (end_date <= start_date + INTERVAL '365 days');

COMMENT ON CONSTRAINT leave_requests_duration_reasonable ON leave_requests IS
  'Prevents leave requests spanning more than 365 days (data entry error protection)';

-- ============================================================================
-- FLIGHT REQUESTS CONSTRAINTS
-- ============================================================================

-- Constraint 4: Ensure flight_date is not in the past
ALTER TABLE flight_requests
  ADD CONSTRAINT flight_requests_date_not_past
  CHECK (flight_date >= current_date);

COMMENT ON CONSTRAINT flight_requests_date_not_past ON flight_requests IS
  'Ensures that flight request date is today or in the future (prevents backdating)';

-- ============================================================================
-- PILOT DATA CONSTRAINTS
-- ============================================================================

-- Constraint 14: Ensure pilot date_of_birth is reasonable
ALTER TABLE pilots
  ADD CONSTRAINT pilots_dob_reasonable
  CHECK (
    date_of_birth IS NULL OR
    (date_of_birth <= current_date AND date_of_birth >= current_date - INTERVAL '80 years')
  );

COMMENT ON CONSTRAINT pilots_dob_reasonable ON pilots IS
  'Ensures pilot date of birth is not in the future and not more than 80 years ago';

-- Constraint 15: Ensure pilot commencement_date is not in the future
ALTER TABLE pilots
  ADD CONSTRAINT pilots_commencement_date_not_future
  CHECK (commencement_date IS NULL OR commencement_date <= current_date);

COMMENT ON CONSTRAINT pilots_commencement_date_not_future ON pilots IS
  'Ensures pilot commencement date is not in the future';

-- Constraint 16: Ensure seniority_number is positive
ALTER TABLE pilots
  ADD CONSTRAINT pilots_seniority_number_positive
  CHECK (seniority_number IS NULL OR seniority_number > 0);

COMMENT ON CONSTRAINT pilots_seniority_number_positive ON pilots IS
  'Ensures pilot seniority number is always positive when set';

-- ============================================================================
-- CERTIFICATION CONSTRAINTS
-- ============================================================================

-- Constraint 17: Ensure pilot_checks expiry_date retention (7 years)
ALTER TABLE pilot_checks
  ADD CONSTRAINT pilot_checks_expiry_retention
  CHECK (expiry_date IS NULL OR expiry_date >= current_date - INTERVAL '7 years');

COMMENT ON CONSTRAINT pilot_checks_expiry_retention ON pilot_checks IS
  'Ensures certification expiry dates are not more than 7 years in the past (data retention policy)';

-- ============================================================================
-- NOTIFICATION CONSTRAINTS
-- ============================================================================

-- Constraint 12: Ensure notification titles are not empty
ALTER TABLE notifications
  ADD CONSTRAINT notifications_title_not_empty
  CHECK (length(trim(title)) >= 1);

COMMENT ON CONSTRAINT notifications_title_not_empty ON notifications IS
  'Ensures notification titles contain at least 1 non-whitespace character';

-- Constraint 13: Ensure notification messages are not empty
ALTER TABLE notifications
  ADD CONSTRAINT notifications_message_not_empty
  CHECK (length(trim(message)) >= 1);

COMMENT ON CONSTRAINT notifications_message_not_empty ON notifications IS
  'Ensures notification messages contain at least 1 non-whitespace character';

-- ============================================================================
-- CONDITIONAL CONSTRAINTS FOR TABLES CREATED IN LATER MIGRATIONS
-- ============================================================================

-- Disciplinary actions constraints
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'disciplinary_actions') THEN
    ALTER TABLE disciplinary_actions
      ADD CONSTRAINT disciplinary_actions_effective_date_valid
      CHECK (effective_date IS NULL OR effective_date >= action_date);

    COMMENT ON CONSTRAINT disciplinary_actions_effective_date_valid ON disciplinary_actions IS
      'Ensures disciplinary action effective date is on or after the action date';

    ALTER TABLE disciplinary_actions
      ADD CONSTRAINT disciplinary_actions_expiry_date_valid
      CHECK (expiry_date IS NULL OR effective_date IS NULL OR expiry_date > effective_date);

    COMMENT ON CONSTRAINT disciplinary_actions_expiry_date_valid ON disciplinary_actions IS
      'Ensures disciplinary action expiry date is after the effective date';
  END IF;
END $$;

-- Feedback posts constraints
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'feedback_posts') THEN
    ALTER TABLE feedback_posts
      ADD CONSTRAINT feedback_posts_title_not_whitespace
      CHECK (length(trim(title)) >= 3);

    COMMENT ON CONSTRAINT feedback_posts_title_not_whitespace ON feedback_posts IS
      'Ensures that feedback post title is not empty or whitespace-only (minimum 3 characters after trimming)';
  END IF;
END $$;

-- Feedback comments constraints
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'feedback_comments') THEN
    ALTER TABLE feedback_comments
      ADD CONSTRAINT feedback_comments_content_not_empty
      CHECK (length(trim(content)) >= 1);

    COMMENT ON CONSTRAINT feedback_comments_content_not_empty ON feedback_comments IS
      'Ensures feedback comments contain at least 1 non-whitespace character';
  END IF;
END $$;
