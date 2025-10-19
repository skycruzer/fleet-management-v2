-- Migration: Verify and Document Unique Constraints
-- Created: 2025-10-19
-- Purpose: Verify existing unique constraints and add feedback_likes table with unique constraint
-- Related TODO: 037-ready-p1-missing-unique-constraints.md

-- ============================================================================
-- VERIFICATION: Existing Unique Constraints
-- ============================================================================

-- The following unique constraints ALREADY EXIST (verified 2025-10-19):
-- 1. leave_requests_pilot_dates_unique (pilot_user_id, start_date, end_date)
-- 2. flight_requests_pilot_date_type_unique (pilot_user_id, flight_date, request_type)

-- These prevent duplicate submissions as required by the business rules.

-- ============================================================================
-- CREATE: feedback_likes table (if not exists)
-- ============================================================================

-- This table was referenced in the TODO but doesn't exist yet.
-- Creating it with the required unique constraint to prevent duplicate votes.

CREATE TABLE IF NOT EXISTS feedback_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES feedback_posts(id) ON DELETE CASCADE,
    pilot_user_id UUID NOT NULL REFERENCES pilot_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- UNIQUE CONSTRAINT: Prevent duplicate votes
    CONSTRAINT feedback_likes_post_user_unique UNIQUE (post_id, pilot_user_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_feedback_likes_post_id ON feedback_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_feedback_likes_pilot_user_id ON feedback_likes(pilot_user_id);

-- Enable Row Level Security
ALTER TABLE feedback_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view all likes
CREATE POLICY "Users can view all likes"
    ON feedback_likes
    FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policy: Users can only like posts as themselves
CREATE POLICY "Users can only create their own likes"
    ON feedback_likes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        pilot_user_id IN (
            SELECT id FROM pilot_users WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Users can only delete their own likes
CREATE POLICY "Users can only delete their own likes"
    ON feedback_likes
    FOR DELETE
    TO authenticated
    USING (
        pilot_user_id IN (
            SELECT id FROM pilot_users WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- VERIFICATION QUERIES (for documentation purposes)
-- ============================================================================

-- Query to verify all unique constraints exist:
-- SELECT
--     tc.table_name,
--     tc.constraint_name,
--     string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
-- FROM information_schema.table_constraints tc
-- LEFT JOIN information_schema.key_column_usage kcu
--     ON tc.constraint_name = kcu.constraint_name
--     AND tc.table_schema = kcu.table_schema
-- WHERE tc.table_schema = 'public'
--     AND tc.table_name IN ('feedback_likes', 'leave_requests', 'flight_requests')
--     AND tc.constraint_type = 'UNIQUE'
-- GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
-- ORDER BY tc.table_name;

-- Expected results:
-- feedback_likes | feedback_likes_post_user_unique | post_id, pilot_user_id
-- flight_requests | flight_requests_pilot_date_type_unique | pilot_user_id, flight_date, request_type
-- leave_requests | leave_requests_pilot_dates_unique | pilot_user_id, start_date, end_date

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE feedback_likes IS 'Stores pilot likes/votes on feedback posts. Unique constraint prevents duplicate votes.';
COMMENT ON CONSTRAINT feedback_likes_post_user_unique ON feedback_likes IS 'Prevents a pilot from voting multiple times on the same post';
COMMENT ON CONSTRAINT leave_requests_pilot_dates_unique ON leave_requests IS 'Prevents duplicate leave requests for the same pilot and date range';
COMMENT ON CONSTRAINT flight_requests_pilot_date_type_unique ON flight_requests IS 'Prevents duplicate flight requests for the same pilot, date, and request type';
