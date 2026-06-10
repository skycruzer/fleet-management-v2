/**
 * Migration: Pilot Documents Storage Bucket + Word MIME Types
 *
 * Developer: Maurice Rondeau
 * Date: June 10, 2026
 *
 * 1. Creates a private storage bucket for pilot documents (contract change
 *    memos, qualifications, general attachments) following the
 *    medical-certificates bucket pattern.
 *    - Bucket: pilot-documents (private)
 *    - File path convention: {pilot_id}/{timestamp}-{filename}
 *    - Max size: 10MB
 *    - Allowed types: PDF, DOC, DOCX, JPG, PNG
 * 2. Extends the existing medical-certificates bucket to accept Word
 *    documents (sick-leave attachments now allow PDF/Word/JPEG/PNG).
 */

-- Create the pilot-documents bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pilot-documents',
  'pilot-documents',
  false,  -- Private bucket - requires signed URLs
  10485760,  -- 10MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Extend medical-certificates bucket to accept Word documents
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]::text[]
WHERE id = 'medical-certificates';

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Authenticated users can upload pilot documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view pilot documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete pilot documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all pilot documents" ON storage.objects;

-- Policy: Service role ONLY can manage pilot documents.
-- All access goes through the API layer (admin routes enforce
-- getAuthenticatedAdmin + requireRole; the pilot portal uses custom auth),
-- and every code path uses the service-role client — so no broad
-- `TO authenticated` policies are created (least privilege).
-- (No COMMENT ON POLICY here: the migration role does not own storage.objects,
-- so COMMENT fails with 42501 when pushed via the CLI.)
CREATE POLICY "Service role can manage all pilot documents"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'pilot-documents')
WITH CHECK (bucket_id = 'pilot-documents');
