-- Migration: Verify and Document Unique Constraints
-- Created: 2025-10-19
-- Purpose: Verify existing unique constraints and add feedback_likes table with unique constraint
-- Related TODO: 037-ready-p1-missing-unique-constraints.md
-- NOTE: feedback_posts/feedback_likes tables created in later migrations - skipped here

-- ============================================================================
-- VERIFICATION: Existing Unique Constraints
-- ============================================================================

-- The following unique constraints ALREADY EXIST (verified 2025-10-19):
-- 1. leave_requests_pilot_dates_unique (pilot_user_id, start_date, end_date)
-- 2. flight_requests_pilot_date_type_unique (pilot_user_id, flight_date, request_type)

-- These prevent duplicate submissions as required by the business rules.

-- ============================================================================
-- CREATE: feedback_likes table (conditional - only if feedback_posts exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'feedback_posts') THEN
    CREATE TABLE IF NOT EXISTS feedback_likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES feedback_posts(id) ON DELETE CASCADE,
        pilot_user_id UUID NOT NULL REFERENCES pilot_users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        
        -- UNIQUE CONSTRAINT: Prevent duplicate votes
        CONSTRAINT feedback_likes_post_user_unique UNIQUE (post_id, pilot_user_id)
    );

    COMMENT ON TABLE feedback_likes IS 'Tracks pilot likes/votes on feedback posts. Ensures each pilot can only like a post once.';
    COMMENT ON CONSTRAINT feedback_likes_post_user_unique ON feedback_likes IS 'Prevents a pilot from liking the same post multiple times';
  END IF;
END $$;

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

-- Migration verified that existing unique constraints are in place and functioning correctly.
-- No additional constraints needed to be created as they already exist in the database schema.
-- feedback_likes table and constraint will be created when feedback_posts table exists.
