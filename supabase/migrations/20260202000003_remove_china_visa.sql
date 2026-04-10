/**
 * Migration: Remove China Visa
 *
 * Developer: Maurice Rondeau
 * Date: February 2, 2026
 *
 * Removes 'China' from the visa_type enum and deletes any related records.
 */

-- Step 1: Delete any pilot_visas records with visa_type = 'China' (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pilot_visas') THEN
        DELETE FROM pilot_visas WHERE visa_type = 'China';
    END IF;
END $$;

-- Step 2: Create new enum without China
CREATE TYPE visa_type_new AS ENUM (
    'Australia',
    'New Zealand',
    'Japan',
    'Canada'
);

-- Step 3: Update any columns using the old enum
-- Check if pilot_visas table exists and update it
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pilot_visas') THEN
        ALTER TABLE pilot_visas
            ALTER COLUMN visa_type TYPE visa_type_new
            USING visa_type::text::visa_type_new;
    END IF;
END $$;

-- Step 4: Drop old enum and rename new one
DROP TYPE visa_type;
ALTER TYPE visa_type_new RENAME TO visa_type;

-- Grant permissions on the new type
GRANT USAGE ON TYPE visa_type TO authenticated;
GRANT USAGE ON TYPE visa_type TO service_role;
