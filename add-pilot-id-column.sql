-- Add pilot_id column to pilot_users table to link with pilots table
ALTER TABLE pilot_users
ADD COLUMN IF NOT EXISTS pilot_id UUID REFERENCES pilots(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_pilot_users_pilot_id ON pilot_users(pilot_id);

-- Update existing records to link by employee_id
UPDATE pilot_users pu
SET pilot_id = p.id
FROM pilots p
WHERE pu.employee_id = p.employee_id
  AND pu.pilot_id IS NULL;

-- Show the updated record
SELECT id, email, employee_id, pilot_id, first_name, last_name
FROM pilot_users
WHERE email = 'mrondeau@airniugini.com.pg';
