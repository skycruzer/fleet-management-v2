-- Add Unique Constraint on Seniority Number
-- Developer: Maurice Rondeau | Date: January 12, 2026
-- Handles existing duplicates by reassigning sequential seniority numbers

DO $$
DECLARE
  dup_record RECORD;
  new_seniority INT;
BEGIN
  -- Find and fix duplicate seniority numbers
  FOR dup_record IN
    SELECT id, seniority_number, commencement_date
    FROM pilots
    WHERE seniority_number IN (
      SELECT seniority_number
      FROM pilots
      WHERE seniority_number IS NOT NULL
      GROUP BY seniority_number
      HAVING COUNT(*) > 1
    )
    ORDER BY commencement_date ASC, created_at ASC
  LOOP
    -- Get next available seniority number
    SELECT COALESCE(MAX(seniority_number), 0) + 1 INTO new_seniority FROM pilots;

    -- Update the duplicate (keep first by commencement_date, reassign others)
    UPDATE pilots
    SET seniority_number = new_seniority,
        updated_at = NOW()
    WHERE id = dup_record.id
    AND EXISTS (
      SELECT 1 FROM pilots p2
      WHERE p2.seniority_number = dup_record.seniority_number
      AND p2.id != dup_record.id
      AND (p2.commencement_date < dup_record.commencement_date
           OR (p2.commencement_date = dup_record.commencement_date AND p2.created_at < (SELECT created_at FROM pilots WHERE id = dup_record.id)))
    );
  END LOOP;

  RAISE NOTICE 'Duplicate seniority numbers have been resolved';
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uk_pilots_seniority_number
ON pilots (seniority_number)
WHERE seniority_number IS NOT NULL;
