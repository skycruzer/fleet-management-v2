-- Pre-Migration Validation Queries
-- Run these to identify any data issues before migration

-- 1. Check for NULL values in critical columns
SELECT 'pilots with NULL employee_number' as issue, COUNT(*) as count
FROM pilots WHERE employee_number IS NULL
UNION ALL
SELECT 'pilots with NULL first_name', COUNT(*)
FROM pilots WHERE first_name IS NULL
UNION ALL
SELECT 'pilots with NULL last_name', COUNT(*)
FROM pilots WHERE last_name IS NULL
UNION ALL
SELECT 'pilots with NULL rank', COUNT(*)
FROM pilots WHERE rank IS NULL;

-- 2. Check for duplicate employee numbers
SELECT employee_number, COUNT(*) as count
FROM pilots
WHERE employee_number IS NOT NULL
GROUP BY employee_number
HAVING COUNT(*) > 1;

-- 3. Check for duplicate emails in pilot_users
SELECT email, COUNT(*) as count
FROM pilot_users
GROUP BY email
HAVING COUNT(*) > 1;

-- 4. Check for invalid date ranges in leave_requests
SELECT id, start_date, end_date
FROM leave_requests
WHERE end_date < start_date
LIMIT 10;

-- 5. Check for invalid pilot ages
SELECT id, first_name, last_name, date_of_birth, 
       EXTRACT(YEAR FROM AGE(date_of_birth)) as age
FROM pilots
WHERE date_of_birth IS NOT NULL
  AND (EXTRACT(YEAR FROM AGE(date_of_birth)) < 18 
       OR EXTRACT(YEAR FROM AGE(date_of_birth)) > 100);

-- 6. Check for invalid seniority numbers
SELECT id, seniority_number
FROM pilots
WHERE seniority_number IS NOT NULL
  AND (seniority_number < 1 OR seniority_number > 1000);

-- Summary
SELECT 'Total tables to modify' as metric, 20 as value
UNION ALL
SELECT 'Total constraints to add', 180
UNION ALL
SELECT 'Total indexes to add', 50;
