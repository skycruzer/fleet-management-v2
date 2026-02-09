/**
 * Migration: Create Medical Certificates Storage Bucket
 *
 * Developer: Maurice Rondeau
 * Date: February 2, 2026
 *
 * Creates a private storage bucket for medical certificates attached to sick leave requests.
 * - Bucket: medical-certificates (private)
 * - File path convention: {pilot_id}/{timestamp}-{filename}
 * - Max size: 10MB (enforced in application layer)
 * - Allowed types: PDF, JPG, PNG (enforced in application layer)
 */

-- Create the medical-certificates bucket (private by default)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-certificates',
  'medical-certificates',
  false,  -- Private bucket - requires signed URLs
  10485760,  -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Pilots can upload medical certificates" ON storage.objects;
DROP POLICY IF EXISTS "Pilots can view their own medical certificates" ON storage.objects;
DROP POLICY IF EXISTS "Pilots can delete their own medical certificates" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all medical certificates" ON storage.objects;

-- Policy: Pilots can upload medical certificates
-- Note: Pilot portal uses custom auth, so we check via service role in the application layer
-- This policy allows authenticated users (for future Supabase Auth integration)
CREATE POLICY "Pilots can upload medical certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-certificates'
);

-- Policy: Pilots can view their own medical certificates
-- The file path starts with their pilot_id
CREATE POLICY "Pilots can view their own medical certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-certificates'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Pilots can delete their own medical certificates
CREATE POLICY "Pilots can delete their own medical certificates"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-certificates'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Service role can manage all medical certificates
-- This is used by the pilot portal API (custom auth bypasses RLS via service role)
CREATE POLICY "Service role can manage all medical certificates"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'medical-certificates')
WITH CHECK (bucket_id = 'medical-certificates');

COMMENT ON POLICY "Pilots can upload medical certificates" ON storage.objects IS
  'Allows authenticated pilots to upload medical certificates to the medical-certificates bucket';

COMMENT ON POLICY "Pilots can view their own medical certificates" ON storage.objects IS
  'Allows pilots to view only their own medical certificates based on folder path';

COMMENT ON POLICY "Pilots can delete their own medical certificates" ON storage.objects IS
  'Allows pilots to delete only their own medical certificates based on folder path';

COMMENT ON POLICY "Service role can manage all medical certificates" ON storage.objects IS
  'Service role has full access for pilot portal API operations';
