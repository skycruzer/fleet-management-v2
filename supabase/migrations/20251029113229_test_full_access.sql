-- Test Full Access Migration
-- Developer: Maurice Rondeau
-- This migration tests full read/write access for Supabase CLI

-- Test 1: Create a test table
CREATE TABLE IF NOT EXISTS test_permissions (
    id SERIAL PRIMARY KEY,
    test_column TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Test 2: Insert data
INSERT INTO test_permissions (test_column) VALUES ('test_data');

-- Test 3: Create a function
CREATE OR REPLACE FUNCTION test_function()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Function created successfully';
END;
$$ LANGUAGE plpgsql;

-- Test 4: Create a view
CREATE OR REPLACE VIEW test_view AS
SELECT * FROM test_permissions;

-- Test 5: Create an index
CREATE INDEX IF NOT EXISTS idx_test_permissions_test_column
ON test_permissions(test_column);

-- Test 6: Update data
UPDATE test_permissions SET test_column = 'updated_test_data' WHERE test_column = 'test_data';

-- Test 7: Grant permissions
GRANT SELECT ON test_permissions TO anon;
GRANT SELECT ON test_view TO anon;

-- Test 8: Add comment
COMMENT ON TABLE test_permissions IS 'Test table to verify full access permissions';

-- Clean up test objects (optional - comment out if you want to keep them)
DROP VIEW IF EXISTS test_view;
DROP FUNCTION IF EXISTS test_function();
DROP TABLE IF EXISTS test_permissions CASCADE;

-- Success message
SELECT 'All permission tests passed successfully!' AS result;
