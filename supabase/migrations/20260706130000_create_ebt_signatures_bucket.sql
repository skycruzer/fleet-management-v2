-- EBT report sign-off lifecycle depends on a private `signatures` storage bucket.
-- The EBT server client is service-role (bypasses storage RLS), so the bucket only
-- needs to exist; objects are written at `<reportId>/<kind>.png` by signature-actions.ts.
-- Applied to production 2026-07-06 via MCP; recorded here for reproducibility.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('signatures', 'signatures', false, 5242880, array['image/png'])
on conflict (id) do nothing;
