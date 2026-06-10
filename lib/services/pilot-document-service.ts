/**
 * Pilot Document Service
 *
 * Developer: Maurice Rondeau
 * Date: June 10, 2026
 *
 * Service layer for documents attached to pilots (contract change memos,
 * qualifications, general files) and to leave requests (sick-leave
 * supporting documents). Metadata lives in the pilot_documents table;
 * files live in the private 'pilot-documents' Supabase Storage bucket
 * (legacy sick-leave certificates remain in 'medical-certificates').
 *
 * Security:
 * - Uses the service-role client (pilot portal uses custom auth); callers
 *   MUST enforce admin roles / pilot ownership before invoking mutations.
 * - Signed URLs expire after 1 hour; paths, not URLs, are persisted.
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  PILOT_DOCUMENTS_BUCKET,
  uploadFileToBucket,
  getSignedUrlForBucket,
  deleteFileFromBucket,
} from '@/lib/services/file-upload-service'
import { ServiceResponse } from '@/lib/types/service-response'

// ============================================================================
// TYPES
// ============================================================================

export const PILOT_DOCUMENT_TYPES = [
  'CONTRACT',
  'MEMO',
  'QUALIFICATION',
  'MEDICAL',
  'OTHER',
] as const

export type PilotDocumentType = (typeof PILOT_DOCUMENT_TYPES)[number]

export interface PilotDocument {
  id: string
  pilot_id: string
  request_id: string | null
  document_type: PilotDocumentType
  title: string | null
  file_name: string
  file_path: string
  storage_bucket: string
  file_size: number
  mime_type: string
  uploaded_by: string | null
  uploaded_by_name: string | null
  created_at: string
  updated_at: string
}

export interface UploadPilotDocumentInput {
  pilotId: string
  file: Uint8Array
  filename: string
  mimeType: string
  documentType: PilotDocumentType
  title?: string
  requestId?: string
  uploadedBy?: string
  uploadedByName?: string
}

function pilotDocumentsTable() {
  return createServiceRoleClient().from('pilot_documents')
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * List all documents for a pilot, newest first.
 * Includes documents linked to the pilot's requests (sick-leave attachments).
 */
export async function listPilotDocuments(
  pilotId: string
): Promise<ServiceResponse<PilotDocument[]>> {
  try {
    const { data, error } = await pilotDocumentsTable()
      .select('*')
      .eq('pilot_id', pilotId)
      .order('created_at', { ascending: false })

    if (error) {
      return ServiceResponse.error('Failed to load pilot documents', error)
    }

    return ServiceResponse.success((data ?? []) as PilotDocument[])
  } catch (error) {
    return ServiceResponse.error('Failed to load pilot documents', error)
  }
}

/**
 * List documents linked to a specific request (e.g. sick-leave attachments).
 */
export async function listRequestDocuments(
  requestId: string
): Promise<ServiceResponse<PilotDocument[]>> {
  try {
    const { data, error } = await pilotDocumentsTable()
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false })

    if (error) {
      return ServiceResponse.error('Failed to load request documents', error)
    }

    return ServiceResponse.success((data ?? []) as PilotDocument[])
  } catch (error) {
    return ServiceResponse.error('Failed to load request documents', error)
  }
}

/**
 * Upload a document file and create its metadata row.
 * If the metadata insert fails, the uploaded file is removed (no orphans).
 */
export async function uploadPilotDocument(
  input: UploadPilotDocumentInput
): Promise<ServiceResponse<PilotDocument>> {
  try {
    const uploadResult = await uploadFileToBucket(PILOT_DOCUMENTS_BUCKET, {
      file: input.file,
      filename: input.filename,
      mimeType: input.mimeType,
      pilotId: input.pilotId,
    })

    if (!uploadResult.success || !uploadResult.path) {
      return ServiceResponse.error(uploadResult.error || 'File upload failed')
    }

    const { data, error } = await pilotDocumentsTable()
      .insert({
        pilot_id: input.pilotId,
        request_id: input.requestId ?? null,
        document_type: input.documentType,
        title: input.title ?? null,
        file_name: input.filename,
        file_path: uploadResult.path,
        storage_bucket: PILOT_DOCUMENTS_BUCKET,
        file_size: input.file.length,
        mime_type: input.mimeType,
        uploaded_by: input.uploadedBy ?? null,
        uploaded_by_name: input.uploadedByName ?? null,
      })
      .select('*')
      .single()

    if (error) {
      // Roll back the orphaned storage object
      await deleteFileFromBucket(PILOT_DOCUMENTS_BUCKET, uploadResult.path)
      return ServiceResponse.error('Failed to save document metadata', error)
    }

    return ServiceResponse.success(data as PilotDocument)
  } catch (error) {
    return ServiceResponse.error('Failed to upload document', error)
  }
}

export interface RecordUploadedDocumentInput {
  pilotId: string
  filePath: string
  storageBucket: string
  filename: string
  fileSize: number
  mimeType: string
  documentType: PilotDocumentType
  requestId?: string
  uploadedBy?: string
  uploadedByName?: string
}

/**
 * Record metadata for a file that was already uploaded to storage
 * (e.g. the portal medical-certificate upload endpoint).
 */
export async function recordUploadedDocument(
  input: RecordUploadedDocumentInput
): Promise<ServiceResponse<PilotDocument>> {
  try {
    const { data, error } = await pilotDocumentsTable()
      .insert({
        pilot_id: input.pilotId,
        request_id: input.requestId ?? null,
        document_type: input.documentType,
        title: null,
        file_name: input.filename,
        file_path: input.filePath,
        storage_bucket: input.storageBucket,
        file_size: input.fileSize,
        mime_type: input.mimeType,
        uploaded_by: input.uploadedBy ?? null,
        uploaded_by_name: input.uploadedByName ?? null,
      })
      .select('*')
      .single()

    if (error) {
      return ServiceResponse.error('Failed to record document metadata', error)
    }

    return ServiceResponse.success(data as PilotDocument)
  } catch (error) {
    return ServiceResponse.error('Failed to record document metadata', error)
  }
}

/**
 * Get a short-lived signed URL for a document.
 */
export async function getPilotDocumentSignedUrl(
  documentId: string
): Promise<ServiceResponse<{ url: string; document: PilotDocument }>> {
  try {
    const { data, error } = await pilotDocumentsTable().select('*').eq('id', documentId).single()

    if (error || !data) {
      return ServiceResponse.notFound('Document not found')
    }

    const document = data as PilotDocument
    const url = await getSignedUrlForBucket(document.storage_bucket, document.file_path)

    if (!url) {
      return ServiceResponse.error('Failed to generate document link')
    }

    return ServiceResponse.success({ url, document })
  } catch (error) {
    return ServiceResponse.error('Failed to generate document link', error)
  }
}

/**
 * Delete a document (storage object + metadata row).
 */
export async function deletePilotDocument(documentId: string): Promise<ServiceResponse<void>> {
  try {
    const { data, error } = await pilotDocumentsTable().select('*').eq('id', documentId).single()

    if (error || !data) {
      return ServiceResponse.notFound('Document not found')
    }

    const document = data as PilotDocument

    // Remove the storage object first; if that fails we keep the row so the
    // document doesn't silently vanish while its file lingers.
    const removed = await deleteFileFromBucket(document.storage_bucket, document.file_path)
    if (!removed) {
      return ServiceResponse.error('Failed to delete document file from storage')
    }

    const { error: deleteError } = await pilotDocumentsTable().delete().eq('id', documentId)

    if (deleteError) {
      return ServiceResponse.error('Failed to delete document record', deleteError)
    }

    return ServiceResponse.successWithoutData()
  } catch (error) {
    return ServiceResponse.error('Failed to delete document', error)
  }
}

/**
 * Link previously uploaded documents to a request.
 * Ownership-guarded: only documents belonging to pilotId are linked.
 * Used by the portal after creating a sick-leave request.
 */
export async function linkDocumentsToRequest(
  documentIds: string[],
  requestId: string,
  pilotId: string
): Promise<ServiceResponse<number>> {
  try {
    if (documentIds.length === 0) {
      return ServiceResponse.success(0)
    }

    // Verify the request belongs to this pilot before linking anything
    const supabase = createServiceRoleClient()
    const { data: requestRow, error: requestError } = await supabase
      .from('pilot_requests')
      .select('id, pilot_id')
      .eq('id', requestId)
      .single()

    if (requestError || !requestRow || requestRow.pilot_id !== pilotId) {
      return ServiceResponse.notFound('Request not found')
    }

    const { data, error } = await pilotDocumentsTable()
      .update({ request_id: requestId })
      .in('id', documentIds)
      .eq('pilot_id', pilotId)
      .is('request_id', null)
      .select('id')

    if (error) {
      return ServiceResponse.error('Failed to link documents to request', error)
    }

    return ServiceResponse.success((data ?? []).length)
  } catch (error) {
    return ServiceResponse.error('Failed to link documents to request', error)
  }
}
