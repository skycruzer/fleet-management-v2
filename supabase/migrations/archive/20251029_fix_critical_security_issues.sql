-- Enable RLS on an_users table
ALTER TABLE public.an_users ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'an_users' AND relnamespace = 'public'::regnamespace) THEN
    RAISE EXCEPTION 'RLS not enabled on an_users table!';
  END IF;
  RAISE NOTICE 'SUCCESS: RLS is now enabled on an_users table';
END $$;

-- Log result
SELECT 'RLS enabled on an_users' AS status, now() AS timestamp;
