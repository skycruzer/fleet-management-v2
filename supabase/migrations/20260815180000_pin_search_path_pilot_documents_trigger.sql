-- Pin the search_path on the last function that still had a mutable one.
--
-- `public.set_pilot_documents_updated_at()` is SECURITY DEFINER with no
-- `search_path` setting, so it resolved unqualified names using the caller's
-- search_path — the pattern Supabase's `function_search_path_mutable` linter
-- flags, because a caller-controlled schema can shadow a built-in and run as
-- the function's owner.
--
-- Its body is `NEW.updated_at = now(); RETURN NEW;`. `now()` lives in
-- pg_catalog, which is always searched, so an empty search_path is safe here
-- and needs no qualification changes.
--
-- After this, `supabase db advisors --type security` reports zero
-- function_search_path_mutable findings.

alter function public.set_pilot_documents_updated_at() set search_path = '';
