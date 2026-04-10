-- Fleet Management V2 - Dashboard Data Accuracy Verification Queries
-- Date: 2025-10-25
-- Purpose: SQL queries to verify dashboard data accuracy
-- Database: Supabase Project (wgdmgvonqysflwdiiols)

-- ============================================================================
-- 1. VERIFY PILOT REQUIREMENTS SETTINGS EXISTS AND IS VALID
-- ============================================================================

-- Check if pilot_requirements setting exists
SELECT 
  id,
  key,
  value,
  description,
  created_at,
  updated_at
FROM settings
WHERE key = 'pilot_requirements';

-- Detailed check of requirements values (extract each field)
SELECT 
  value->>'pilot_retirement_age' as retirement_age,
  value->>'number_of_aircraft' as aircraft,
  value->>'captains_per_hull' as captains_per_hull,
  value->>'first_officers_per_hull' as first_officers_per_hull,
  value->>'minimum_captains_per_hull' as min_captains_per_hull,
  value->>'minimum_first_officers_per_hull' as min_first_officers_per_hull,
  value->>'training_captains_per_pilots' as training_captain_ratio,
  value->>'examiners_per_pilots' as examiner_ratio
FROM settings
WHERE key = 'pilot_requirements';

-- ============================================================================
-- 2. VERIFY PILOT COUNTS BY ROLE AND STATUS
-- ============================================================================

-- Overall pilot count summary
SELECT 
  role,
  is_active,
  COUNT(*) as count
FROM pilots
GROUP BY role, is_active
ORDER BY role, is_active;

-- Total active pilots
SELECT COUNT(*) as total_active_pilots
FROM pilots
WHERE is_active = true;

-- Active captains
SELECT COUNT(*) as active_captains
FROM pilots
WHERE role = 'Captain' AND is_active = true;

-- Active first officers
SELECT COUNT(*) as active_first_officers
FROM pilots
WHERE role = 'First Officer' AND is_active = true;

-- ============================================================================
-- 3. VERIFY CAPTAIN QUALIFICATIONS
-- ============================================================================

-- Count examiners (Captains with 'examiner' qualification)
SELECT COUNT(*) as total_examiners
FROM pilots
WHERE role = 'Captain' 
  AND is_active = true
  AND captain_qualifications ? 'examiner';

-- Count training captains (Captains with 'training_captain' qualification)
SELECT COUNT(*) as total_training_captains
FROM pilots
WHERE role = 'Captain' 
  AND is_active = true
  AND captain_qualifications ? 'training_captain';

-- Detail view of all captains with qualifications
SELECT 
  id,
  employee_id,
  first_name,
  last_name,
  captain_qualifications,
  is_active
FROM pilots
WHERE role = 'Captain'
ORDER BY last_name, first_name;

-- Count captains with multiple qualifications
SELECT COUNT(*) as captains_with_multiple_qualifications
FROM pilots
WHERE role = 'Captain'
  AND is_active = true
  AND jsonb_array_length(COALESCE(captain_qualifications, '[]'::jsonb)) > 1;

-- ============================================================================
-- 4. VERIFY LEAVE ELIGIBILITY CREW REQUIREMENTS
-- ============================================================================

-- Calculate required minimum crew vs actual
SELECT 
  'Captains' as crew_type,
  (SELECT COUNT(*) FROM pilots WHERE role = 'Captain' AND is_active = true) as actual_count,
  (SELECT (value->>'minimum_captains_per_hull')::integer * 
          (value->>'number_of_aircraft')::integer 
   FROM settings WHERE key = 'pilot_requirements') as required_minimum,
  (SELECT COUNT(*) FROM pilots WHERE role = 'Captain' AND is_active = true) -
  (SELECT (value->>'minimum_captains_per_hull')::integer * 
          (value->>'number_of_aircraft')::integer 
   FROM settings WHERE key = 'pilot_requirements') as difference
UNION ALL
SELECT 
  'First Officers' as crew_type,
  (SELECT COUNT(*) FROM pilots WHERE role = 'First Officer' AND is_active = true) as actual_count,
  (SELECT (value->>'minimum_first_officers_per_hull')::integer * 
          (value->>'number_of_aircraft')::integer 
   FROM settings WHERE key = 'pilot_requirements') as required_minimum,
  (SELECT COUNT(*) FROM pilots WHERE role = 'First Officer' AND is_active = true) -
  (SELECT (value->>'minimum_first_officers_per_hull')::integer * 
          (value->>'number_of_aircraft')::integer 
   FROM settings WHERE key = 'pilot_requirements') as difference;

-- ============================================================================
-- 5. VERIFY STAFFING LEVEL CALCULATIONS
-- ============================================================================

-- Calculate required total pilots vs actual
SELECT 
  (SELECT (value->>'captains_per_hull')::integer + 
          (value->>'first_officers_per_hull')::integer 
   FROM settings WHERE key = 'pilot_requirements') *
  (SELECT (value->>'number_of_aircraft')::integer 
   FROM settings WHERE key = 'pilot_requirements') as required_total_pilots,
  COUNT(*) as actual_total_pilots,
  ROUND(100.0 * COUNT(*) / (
    (SELECT (value->>'captains_per_hull')::integer + 
            (value->>'first_officers_per_hull')::integer 
     FROM settings WHERE key = 'pilot_requirements') *
    (SELECT (value->>'number_of_aircraft')::integer 
     FROM settings WHERE key = 'pilot_requirements')
  ))::integer as compliance_percentage
FROM pilots
WHERE is_active = true;

-- ============================================================================
-- 6. VERIFY EXAMINER AND TRAINING CAPTAIN REQUIREMENTS
-- ============================================================================

-- Calculate required vs actual examiners
SELECT 
  COUNT(*) as actual_examiners,
  CEIL(COUNT(*) * 1.0 / 
    (SELECT (value->>'examiners_per_pilots')::integer 
     FROM settings WHERE key = 'pilot_requirements')) as required_examiners_calculated,
  (SELECT (value->>'examiners_per_pilots')::integer 
   FROM settings WHERE key = 'pilot_requirements') as examiner_ratio
FROM pilots
WHERE role = 'Captain' AND is_active = true AND captain_qualifications ? 'examiner';

-- Calculate required vs actual training captains
SELECT 
  COUNT(*) as actual_training_captains,
  CEIL(COUNT(*) * 1.0 / 
    (SELECT (value->>'training_captains_per_pilots')::integer 
     FROM settings WHERE key = 'pilot_requirements')) as required_training_captains_calculated,
  (SELECT (value->>'training_captains_per_pilots')::integer 
   FROM settings WHERE key = 'pilot_requirements') as training_captain_ratio
FROM pilots
WHERE role = 'Captain' AND is_active = true AND captain_qualifications ? 'training_captain';

-- ============================================================================
-- 7. VERIFY DATA INTEGRITY
-- ============================================================================

-- Check for pilots with invalid role
SELECT COUNT(*) as pilots_with_invalid_role
FROM pilots
WHERE role NOT IN ('Captain', 'First Officer');

-- Check for pilots with NULL captain_qualifications (should be NULL or array)
SELECT COUNT(*) as captains_with_null_qualifications
FROM pilots
WHERE role = 'Captain' AND captain_qualifications IS NULL;

-- Check for captain_qualifications that are not arrays
SELECT id, first_name, last_name, captain_qualifications
FROM pilots
WHERE role = 'Captain' 
  AND captain_qualifications IS NOT NULL
  AND jsonb_typeof(captain_qualifications) != 'array';

-- Verify all pilot_checks have valid pilot references
SELECT COUNT(*) as orphaned_checks
FROM pilot_checks pc
WHERE NOT EXISTS (
  SELECT 1 FROM pilots p WHERE p.id = pc.pilot_id
);

-- ============================================================================
-- 8. ANALYZE LEAVE REQUEST IMPACT ON CREW AVAILABILITY
-- ============================================================================

-- Current approved leave by role
SELECT 
  'Captains' as role,
  COUNT(DISTINCT lr.pilot_id) as pilots_on_leave,
  COUNT(DISTINCT lr.id) as approved_leave_requests
FROM leave_requests lr
JOIN pilots p ON p.id = lr.pilot_id
WHERE p.role = 'Captain' 
  AND lr.status = 'APPROVED'
  AND lr.end_date >= CURRENT_DATE
UNION ALL
SELECT 
  'First Officers' as role,
  COUNT(DISTINCT lr.pilot_id) as pilots_on_leave,
  COUNT(DISTINCT lr.id) as approved_leave_requests
FROM leave_requests lr
JOIN pilots p ON p.id = lr.pilot_id
WHERE p.role = 'First Officer' 
  AND lr.status = 'APPROVED'
  AND lr.end_date >= CURRENT_DATE;

-- Current pending leave by role
SELECT 
  'Captains' as role,
  COUNT(DISTINCT lr.pilot_id) as pilots_requesting_leave,
  COUNT(DISTINCT lr.id) as pending_leave_requests
FROM leave_requests lr
JOIN pilots p ON p.id = lr.pilot_id
WHERE p.role = 'Captain' 
  AND lr.status = 'PENDING'
UNION ALL
SELECT 
  'First Officers' as role,
  COUNT(DISTINCT lr.pilot_id) as pilots_requesting_leave,
  COUNT(DISTINCT lr.id) as pending_leave_requests
FROM leave_requests lr
JOIN pilots p ON p.id = lr.pilot_id
WHERE p.role = 'First Officer' 
  AND lr.status = 'PENDING';

-- ============================================================================
-- 9. VERIFY CERTIFICATION DATA FOR COMPLIANCE CALCULATION
-- ============================================================================

-- Certification compliance metrics
SELECT 
  'Total Certifications' as metric,
  COUNT(*) as count
FROM pilot_checks
UNION ALL
SELECT 
  'Current (>30 days)' as metric,
  COUNT(*) as count
FROM pilot_checks
WHERE expiry_date IS NULL OR expiry_date > CURRENT_DATE + INTERVAL '30 days'
UNION ALL
SELECT 
  'Expiring Soon (≤30 days)' as metric,
  COUNT(*) as count
FROM pilot_checks
WHERE expiry_date IS NOT NULL 
  AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
  AND expiry_date > CURRENT_DATE
UNION ALL
SELECT 
  'Expired (<0 days)' as metric,
  COUNT(*) as count
FROM pilot_checks
WHERE expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE;

-- ============================================================================
-- 10. VERIFY CACHE KEY REFERENCES
-- ============================================================================

-- Check if cache-service references exist (these would be in application code)
-- This is informational - verifies dashboard_metrics cache key pattern
SELECT 'Cache Key Pattern: dashboard_metrics' as info,
       'TTL: 5 minutes (300,000 ms)' as detail;

-- ============================================================================
-- SUMMARY REPORT QUERY
-- ============================================================================

-- One-query summary for quick verification
SELECT
  json_build_object(
    'pilot_counts', json_build_object(
      'total_active', (SELECT COUNT(*) FROM pilots WHERE is_active = true),
      'captains', (SELECT COUNT(*) FROM pilots WHERE role = 'Captain' AND is_active = true),
      'first_officers', (SELECT COUNT(*) FROM pilots WHERE role = 'First Officer' AND is_active = true),
      'examiners', (SELECT COUNT(*) FROM pilots WHERE role = 'Captain' AND is_active = true AND captain_qualifications ? 'examiner'),
      'training_captains', (SELECT COUNT(*) FROM pilots WHERE role = 'Captain' AND is_active = true AND captain_qualifications ? 'training_captain')
    ),
    'requirements', (
      SELECT json_build_object(
        'retirement_age', (value->>'pilot_retirement_age')::integer,
        'aircraft', (value->>'number_of_aircraft')::integer,
        'captains_per_hull', (value->>'captains_per_hull')::integer,
        'first_officers_per_hull', (value->>'first_officers_per_hull')::integer,
        'min_captains_per_hull', (value->>'minimum_captains_per_hull')::integer,
        'min_first_officers_per_hull', (value->>'minimum_first_officers_per_hull')::integer,
        'examiner_ratio', (value->>'examiners_per_pilots')::integer,
        'training_captain_ratio', (value->>'training_captains_per_pilots')::integer
      )
      FROM settings WHERE key = 'pilot_requirements'
    ),
    'crew_status', json_build_object(
      'captains_available', (SELECT COUNT(*) FROM pilots WHERE role = 'Captain' AND is_active = true),
      'captains_minimum_required', (SELECT (value->>'minimum_captains_per_hull')::integer * (value->>'number_of_aircraft')::integer FROM settings WHERE key = 'pilot_requirements'),
      'first_officers_available', (SELECT COUNT(*) FROM pilots WHERE role = 'First Officer' AND is_active = true),
      'first_officers_minimum_required', (SELECT (value->>'minimum_first_officers_per_hull')::integer * (value->>'number_of_aircraft')::integer FROM settings WHERE key = 'pilot_requirements')
    )
  ) as dashboard_data_summary;

