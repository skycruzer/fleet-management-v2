/**
 * Migration: Create password_history table
 *
 * Developer: Maurice Rondeau
 * Date: 2025-01-05
 *
 * Purpose: Track password history for pilot portal users to prevent
 * reuse of recent passwords (security best practice).
 */

-- Create password_history table
CREATE TABLE IF NOT EXISTS public.password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pilot_user_id UUID NOT NULL REFERENCES public.pilot_users(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Index for efficient lookups by user
    CONSTRAINT fk_password_history_pilot_user FOREIGN KEY (pilot_user_id)
        REFERENCES public.pilot_users(id) ON DELETE CASCADE
);

-- Create index for efficient password history queries
CREATE INDEX IF NOT EXISTS idx_password_history_pilot_user_id
    ON public.password_history(pilot_user_id);

CREATE INDEX IF NOT EXISTS idx_password_history_created_at
    ON public.password_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only system can access password history (no user access)
-- This is intentional - password history should never be exposed to users

-- Policy for service role (backend) to read password history
CREATE POLICY "Service role can read password history"
    ON public.password_history
    FOR SELECT
    TO service_role
    USING (true);

-- Policy for service role (backend) to insert password history
CREATE POLICY "Service role can insert password history"
    ON public.password_history
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Policy for service role (backend) to delete old password history
CREATE POLICY "Service role can delete password history"
    ON public.password_history
    FOR DELETE
    TO service_role
    USING (true);

-- Add comment for documentation
COMMENT ON TABLE public.password_history IS 'Stores password history hashes for pilot portal users to prevent password reuse';
COMMENT ON COLUMN public.password_history.pilot_user_id IS 'Reference to the pilot user';
COMMENT ON COLUMN public.password_history.password_hash IS 'Bcrypt hash of the password (same format as pilot_users.password_hash)';
COMMENT ON COLUMN public.password_history.created_at IS 'When this password was set';

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.password_history TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;
