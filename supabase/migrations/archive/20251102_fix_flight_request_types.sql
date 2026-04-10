-- Fix flight_requests table request_type constraint
-- Update CHECK constraint to match pilot portal request types
--
-- Current constraint allows: ADDITIONAL_FLIGHT, ROUTE_CHANGE, SCHEDULE_PREFERENCE, TRAINING_FLIGHT, OTHER
-- Need to allow: FLIGHT_REQUEST, RDO, SDO, OFFICE_DAY
--
-- Migration created: 2025-11-02

-- Drop existing CHECK constraint
ALTER TABLE flight_requests
DROP CONSTRAINT IF EXISTS flight_requests_request_type_check;

-- Add new CHECK constraint with correct values
ALTER TABLE flight_requests
ADD CONSTRAINT flight_requests_request_type_check
CHECK (request_type IN ('FLIGHT_REQUEST', 'RDO', 'SDO', 'OFFICE_DAY'));

-- Add comment explaining the request types
COMMENT ON COLUMN flight_requests.request_type IS
'Type of flight request: FLIGHT_REQUEST (additional flight), RDO (rostered day off), SDO (scheduled day off), OFFICE_DAY (office duty day)';
