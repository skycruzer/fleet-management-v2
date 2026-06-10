/**
 * Migration: Create pilot_documents Table
 *
 * Developer: Maurice Rondeau
 * Date: June 10, 2026
 *
 * Metadata table for documents attached to pilots (contract change memos,
 * qualifications, general files) and optionally linked to a pilot_requests
 * row (e.g. sick-leave medical certificates / supporting documents).
 *
 * Files themselves live in the private 'pilot-documents' storage bucket
 * (or 'medical-certificates' for legacy sick-leave certs) at
 * {pilot_id}/{timestamp}-{filename}; this table stores the path, never URLs
 * (signed URLs are generated on demand and expire).
 */

CREATE TABLE IF NOT EXISTS public.pilot_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id uuid NOT NULL REFERENCES public.pilots(id) ON DELETE CASCADE,
  -- Optional link to a leave/flight request (sick-leave attachments)
  request_id uuid REFERENCES public.pilot_requests(id) ON DELETE SET NULL,
  document_type text NOT NULL DEFAULT 'OTHER'
    CHECK (document_type IN ('CONTRACT', 'MEMO', 'QUALIFICATION', 'MEDICAL', 'OTHER')),
  title text,
  file_name text NOT NULL,
  file_path text NOT NULL UNIQUE,
  storage_bucket text NOT NULL DEFAULT 'pilot-documents',
  file_size integer NOT NULL CHECK (file_size > 0),
  mime_type text NOT NULL,
  -- Uploader: an_users covers both admin staff and pilot portal users
  uploaded_by uuid REFERENCES public.an_users(id) ON DELETE SET NULL,
  uploaded_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pilot_documents_pilot_id
  ON public.pilot_documents (pilot_id);

CREATE INDEX IF NOT EXISTS idx_pilot_documents_request_id
  ON public.pilot_documents (request_id)
  WHERE request_id IS NOT NULL;

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_pilot_documents_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pilot_documents_updated_at ON public.pilot_documents;
CREATE TRIGGER trg_pilot_documents_updated_at
  BEFORE UPDATE ON public.pilot_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_pilot_documents_updated_at();

-- Row Level Security
ALTER TABLE public.pilot_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage pilot documents" ON public.pilot_documents;
DROP POLICY IF EXISTS "Authenticated users can read pilot documents" ON public.pilot_documents;

-- Service role ONLY: full access (API layer enforces admin/manager roles
-- and pilot ownership before using this client). No `TO authenticated`
-- policy — all reads also flow through the API's service-role client,
-- so direct client-side access stays denied by default (least privilege).
CREATE POLICY "Service role can manage pilot documents"
ON public.pilot_documents
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMENT ON TABLE public.pilot_documents IS
  'Documents attached to pilots (contracts, memos, qualifications) and optionally to pilot_requests (sick-leave attachments). Files stored in private Supabase Storage buckets.';
COMMENT ON COLUMN public.pilot_documents.file_path IS
  'Storage object path: {pilot_id}/{timestamp}-{filename}. Signed URLs generated on demand.';
COMMENT ON COLUMN public.pilot_documents.storage_bucket IS
  'Bucket holding the file: pilot-documents (default) or medical-certificates (legacy sick-leave certs).';
