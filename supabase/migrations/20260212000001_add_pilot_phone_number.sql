-- Add phone number field to pilots table
-- Flexible TEXT field supporting international formats (+, digits, spaces, dashes)
ALTER TABLE pilots ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add comment for documentation
COMMENT ON COLUMN pilots.phone_number IS 'Pilot phone number in international format (e.g. +675 XXX XXXX)';
