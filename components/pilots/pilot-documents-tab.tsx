/**
 * Pilot Documents Tab Component
 *
 * Lists and manages documents attached to a pilot (contract change memos,
 * qualifications, sick-leave attachments). Upload restricted to
 * admin/manager (enforced server-side via requireRole).
 *
 * Developer: Maurice Rondeau
 * @date June 2026
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/ui/file-upload'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatFileSize, ACCEPT_STRING, MAX_FILE_SIZE } from '@/lib/validations/file-upload-schema'
import type { PilotDocument, PilotDocumentType } from '@/lib/services/pilot-document-service'
import { FileText, Eye, Trash2, Upload, Loader2 } from 'lucide-react'

const DOCUMENT_TYPE_LABELS: Record<PilotDocumentType, string> = {
  CONTRACT: 'Contract',
  MEMO: 'Memo',
  QUALIFICATION: 'Qualification',
  MEDICAL: 'Medical',
  OTHER: 'Other',
}

interface PilotDocumentsTabProps {
  pilotId: string
  csrfToken: string | null
}

export function PilotDocumentsTab({ pilotId, csrfToken }: PilotDocumentsTabProps) {
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  const [documents, setDocuments] = useState<PilotDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState<PilotDocumentType>('MEMO')
  const [title, setTitle] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/pilots/${pilotId}/documents`)
      const json = await response.json()
      if (response.ok && json.success) {
        setDocuments(json.data || [])
      } else {
        toast({
          title: 'Failed to load documents',
          description: json.error,
          variant: 'destructive',
        })
      }
    } catch {
      toast({ title: 'Failed to load documents', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [pilotId, toast])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  // A long-lived tab can outlive the csrf_secret cookie (24h) or hold a token
  // from before a redeploy; on CSRF rejection, fetch a fresh token (which also
  // re-sets the secret cookie) and retry once instead of failing the action.
  const fetchWithCsrfRetry = useCallback(
    async (input: string, init: RequestInit): Promise<Response> => {
      const send = (token: string | null) =>
        fetch(input, {
          ...init,
          headers: {
            ...(init.headers as Record<string, string>),
            ...(token ? { 'x-csrf-token': token } : {}),
          },
        })

      let response = await send(csrfToken)
      if (response.status === 403) {
        try {
          const csrfResponse = await fetch('/api/csrf')
          const csrfJson = await csrfResponse.json()
          if (csrfJson?.csrfToken) {
            response = await send(csrfJson.csrfToken)
          }
        } catch {
          // fall through with the original 403 response
        }
      }
      return response
    },
    [csrfToken]
  )

  const handleUpload = async () => {
    if (!selectedFile) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('documentType', documentType)
      if (title.trim()) formData.append('title', title.trim())

      const response = await fetchWithCsrfRetry(`/api/pilots/${pilotId}/documents`, {
        method: 'POST',
        body: formData,
      })
      const json = await response.json()

      if (response.ok && json.success) {
        toast({ title: 'Document uploaded', description: selectedFile.name })
        setSelectedFile(null)
        setTitle('')
        await loadDocuments()
      } else {
        toast({
          title: 'Upload failed',
          description: json.error || 'Please try again.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleView = async (doc: PilotDocument) => {
    try {
      const response = await fetch(`/api/pilots/${pilotId}/documents/${doc.id}`)
      const json = await response.json()
      if (response.ok && json.success && json.data?.url) {
        window.open(json.data.url, '_blank', 'noopener,noreferrer')
      } else {
        toast({
          title: 'Could not open document',
          description: json.error,
          variant: 'destructive',
        })
      }
    } catch {
      toast({ title: 'Could not open document', variant: 'destructive' })
    }
  }

  const handleDelete = async (doc: PilotDocument) => {
    const confirmed = await confirm({
      title: 'Delete document?',
      description: `"${doc.title || doc.file_name}" will be permanently deleted.`,
      confirmText: 'Delete',
      variant: 'destructive',
    })
    if (!confirmed) return

    setDeletingId(doc.id)
    try {
      const response = await fetchWithCsrfRetry(`/api/pilots/${pilotId}/documents/${doc.id}`, {
        method: 'DELETE',
      })
      const json = await response.json()
      if (response.ok && json.success) {
        toast({ title: 'Document deleted' })
        setDocuments((docs) => docs.filter((d) => d.id !== doc.id))
      } else {
        toast({
          title: 'Delete failed',
          description: json.error,
          variant: 'destructive',
        })
      }
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog />

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Upload Document</h3>
        <div className="space-y-4">
          <FileUpload
            label="File"
            helperText="PDF, Word (DOC/DOCX), JPG or PNG — max 10MB"
            accept={ACCEPT_STRING}
            maxSize={MAX_FILE_SIZE}
            value={selectedFile}
            onFileSelect={setSelectedFile}
            disabled={isUploading}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="document-type" className="mb-1.5 block text-sm font-medium">
                Document type
              </label>
              <Select
                value={documentType}
                onValueChange={(value) => setDocumentType(value as PilotDocumentType)}
                disabled={isUploading}
              >
                <SelectTrigger id="document-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="document-title" className="mb-1.5 block text-sm font-medium">
                Title <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="document-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Contract amendment May 2026"
                maxLength={120}
                disabled={isUploading}
              />
            </div>
          </div>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isUploading ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Documents</h3>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading documents…</p>
        ) : documents.length === 0 ? (
          <p className="text-muted-foreground text-sm">No documents attached to this pilot yet.</p>
        ) : (
          <ul className="divide-y">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 py-3">
                <FileText className="text-muted-foreground h-5 w-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.title || doc.file_name}</p>
                  <p className="text-muted-foreground text-xs">
                    {doc.file_name} · {formatFileSize(doc.file_size)} ·{' '}
                    {new Date(doc.created_at).toLocaleDateString()}
                    {doc.uploaded_by_name ? ` · ${doc.uploaded_by_name}` : ''}
                  </p>
                </div>
                <Badge variant="secondary">{DOCUMENT_TYPE_LABELS[doc.document_type]}</Badge>
                {doc.request_id && <Badge variant="outline">Leave request</Badge>}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleView(doc)}
                  aria-label={`View ${doc.title || doc.file_name}`}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc)}
                  disabled={deletingId === doc.id}
                  aria-label={`Delete ${doc.title || doc.file_name}`}
                >
                  {deletingId === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="text-destructive h-4 w-4" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
