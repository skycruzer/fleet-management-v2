/**
 * Backfill request_method for existing leave_requests
 * Author: Maurice Rondeau
 * Date: November 11, 2025
 *
 * Problem: Existing leave requests have NULL request_method, causing reports to return 0 records
 * Solution: Set request_method based on pilot_user_id (pilot portal) or default to EMAIL (admin-created)
 */

-- Backfill request_method for existing records
-- If pilot_user_id is set, it came from pilot portal (SYSTEM)
-- Otherwise, assume admin-created via email (EMAIL)
UPDATE leave_requests
SET request_method = CASE
  WHEN pilot_user_id IS NOT NULL THEN 'SYSTEM'
  ELSE 'EMAIL'
END
WHERE request_method IS NULL;

-- Log the changes
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled request_method for % records', updated_count;
END $$;
