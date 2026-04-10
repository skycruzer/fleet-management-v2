-- Fix CAR activity code: it's Part 122 Requirement, not Car Transport
UPDATE activity_codes
SET name = 'Part 122 Requirement',
    category = 'TRAINING',
    color = 'bg-indigo-100'
WHERE code = 'CAR';
