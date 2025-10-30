-- Move extensions from public schema to extensions schema
-- This follows Supabase best practices to keep public schema clean

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move btree_gin extension
DO $$
BEGIN
  -- Drop from public if it exists
  IF EXISTS (
    SELECT 1 FROM pg_extension
    WHERE extname = 'btree_gin'
    AND extnamespace = 'public'::regnamespace
  ) THEN
    DROP EXTENSION IF EXISTS btree_gin CASCADE;
    CREATE EXTENSION IF NOT EXISTS btree_gin SCHEMA extensions;
    RAISE NOTICE 'Moved btree_gin to extensions schema';
  ELSE
    -- Just ensure it exists in extensions schema
    CREATE EXTENSION IF NOT EXISTS btree_gin SCHEMA extensions;
    RAISE NOTICE 'Created btree_gin in extensions schema';
  END IF;
END $$;

-- Move btree_gist extension
DO $$
BEGIN
  -- Drop from public if it exists
  IF EXISTS (
    SELECT 1 FROM pg_extension
    WHERE extname = 'btree_gist'
    AND extnamespace = 'public'::regnamespace
  ) THEN
    DROP EXTENSION IF EXISTS btree_gist CASCADE;
    CREATE EXTENSION IF NOT EXISTS btree_gist SCHEMA extensions;
    RAISE NOTICE 'Moved btree_gist to extensions schema';
  ELSE
    -- Just ensure it exists in extensions schema
    CREATE EXTENSION IF NOT EXISTS btree_gist SCHEMA extensions;
    RAISE NOTICE 'Created btree_gist in extensions schema';
  END IF;
END $$;

-- Move pg_trgm extension
DO $$
BEGIN
  -- Drop from public if it exists
  IF EXISTS (
    SELECT 1 FROM pg_extension
    WHERE extname = 'pg_trgm'
    AND extnamespace = 'public'::regnamespace
  ) THEN
    DROP EXTENSION IF EXISTS pg_trgm CASCADE;
    CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;
    RAISE NOTICE 'Moved pg_trgm to extensions schema';
  ELSE
    -- Just ensure it exists in extensions schema
    CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;
    RAISE NOTICE 'Created pg_trgm in extensions schema';
  END IF;
END $$;

-- Verify all extensions are now in extensions schema
SELECT
  'Extensions moved to extensions schema' AS status,
  COUNT(*) AS extension_count,
  now() AS timestamp
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE n.nspname = 'extensions'
  AND e.extname IN ('btree_gin', 'btree_gist', 'pg_trgm');
