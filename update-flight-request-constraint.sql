-- Update flight_requests table CHECK constraint to match new enum values
-- Developer: Maurice Rondeau
-- Date: November 2, 2025

-- Step 1: Drop existing constraint if it exists
ALTER TABLE flight_requests
DROP CONSTRAINT IF EXISTS flight_requests_request_type_check;

-- Step 2: Add new constraint with updated enum values
ALTER TABLE flight_requests
ADD CONSTRAINT flight_requests_request_type_check
  CHECK (request_type IN ('FLIGHT_REQUEST', 'RDO', 'SDO', 'OFFICE_DAY'));

-- Verification query to check the constraint
SELECT conname AS constraint_name,
       pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'flight_requests'::regclass
  AND contype = 'c'
  AND conname = 'flight_requests_request_type_check';
