'use client'

/**
 * Leave Request Submission Page
 * Developer: Maurice Rondeau
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  PilotLeaveRequestSchema,
  type PilotLeaveRequestInput,
} from '@/lib/validations/pilot-leave-schema'
import { csrfHeaders } from '@/lib/hooks/use-csrf-token'
import { useFormUnsavedChanges } from '@/lib/hooks/use-unsaved-changes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileUpload } from '@/components/ui/file-upload'
import { PageHead } from '@/components/ui/page-head'
import { Calendar, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

const LEAVE_TYPES = [
  { value: 'ANNUAL', label: 'Annual Leave' },
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'LSL', label: 'Long Service Leave' },
  { value: 'LWOP', label: 'Leave Without Pay' },
  { value: 'MATERNITY', label: 'Maternity Leave' },
  { value: 'COMPASSIONATE', label: 'Compassionate Leave' },
]

export default function NewLeaveRequestPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLateRequest, setIsLateRequest] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string>('')

  const form = useForm<PilotLeaveRequestInput>({
    resolver: zodResolver(PilotLeaveRequestSchema),
    defaultValues: {
      request_type: 'ANNUAL',
      start_date: '',
      end_date: '',
      reason: '',
      source_attachment_url: null,
    },
  })

  const watchRequestType = form.watch('request_type')
  const watchStartDate = form.watch('start_date')

  // Today in YYYY-MM-DD (local time) for native date-picker min constraints
  const today = format(new Date(), 'yyyy-MM-dd')

  // Warn about unsaved changes when navigating away
  useFormUnsavedChanges(form, { skipWarning: isLoading || success })

  const checkLateRequest = (startDate: string) => {
    if (!startDate) return
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(startDate)
    const daysDiff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    setIsLateRequest(daysDiff < 21)
  }

  const handleFileSelect = useCallback((file: File | null) => {
    setUploadError('')
    if (!file) {
      setSelectedFile(null)
      return
    }
    // Add to the attachment list (multiple files supported) and reset the picker
    setAttachedFiles((files) =>
      files.some((f) => f.name === file.name && f.size === file.size) ? files : [...files, file]
    )
    setSelectedFile(null)
  }, [])

  const handleAttachmentRemove = useCallback(
    (index: number) => {
      setAttachedFiles((files) => files.filter((_, i) => i !== index))
      setUploadError('')
      form.setValue('source_attachment_url', null)
    },
    [form]
  )

  const uploadMedicalCertificate = async (
    file: File
  ): Promise<{ url: string | null; documentId: string | null } | null> => {
    setUploadError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/portal/upload/medical-certificate', {
        method: 'POST',
        headers: { ...csrfHeaders() },
        body: formData,
        credentials: 'include',
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        const errorMessage =
          typeof result.error === 'string'
            ? `${file.name}: ${result.error}`
            : `Failed to upload ${file.name}. Please try again.`
        setUploadError(errorMessage)
        return null
      }
      return {
        url: result.data?.url || null,
        documentId: result.data?.documentId || null,
      }
    } catch {
      setUploadError(`Failed to upload ${file.name}. Please try again.`)
      return null
    }
  }

  const onSubmit = async (data: PilotLeaveRequestInput) => {
    setIsLoading(true)
    setError('')
    setUploadError('')

    try {
      let attachmentUrl: string | null = null
      const documentIds: string[] = []
      if (data.request_type === 'SICK' && attachedFiles.length > 0) {
        setIsUploading(true)
        for (const file of attachedFiles) {
          const uploaded = await uploadMedicalCertificate(file)
          if (!uploaded) {
            setIsUploading(false)
            setIsLoading(false)
            return
          }
          // Legacy single-URL field keeps the first attachment for older views
          if (!attachmentUrl && uploaded.url) attachmentUrl = uploaded.url
          if (uploaded.documentId) documentIds.push(uploaded.documentId)
        }
        setIsUploading(false)
      }

      const submitData = { ...data, source_attachment_url: attachmentUrl }
      const response = await fetch('/api/portal/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify(submitData),
        credentials: 'include',
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        const errorMessage =
          typeof result.error === 'string'
            ? result.error
            : result.error?.message || 'Failed to submit leave request. Please try again.'
        setError(errorMessage)
        setIsLoading(false)
        return
      }

      // Link uploaded documents to the new request (best effort — files
      // already live on the pilot's Documents tab even if linking fails)
      const requestId: string | undefined = result.data?.id
      if (requestId && documentIds.length > 0) {
        try {
          await fetch('/api/portal/leave-requests/link-documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
            body: JSON.stringify({ request_id: requestId, document_ids: documentIds }),
            credentials: 'include',
          })
        } catch {
          // Non-fatal: reviewers can still find the files on the pilot record
        }
      }

      setSuccess(true)
      setIsLoading(false)

      await new Promise((resolve) => setTimeout(resolve, 1500))
      await queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      router.refresh()
      await new Promise((resolve) => setTimeout(resolve, 300))
      router.push('/portal/requests?tab=leave')
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div>
        <PageHead
          title="Request submitted"
          description="Your leave request has been sent for review."
        />
        <main className="px-4 py-8 sm:px-6 lg:px-8">
          <Card className="mx-auto max-w-2xl p-6">
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                You will receive a notification once fleet management reviews your request.
              </AlertDescription>
            </Alert>
            <p className="text-muted-foreground mt-4 text-center text-sm">
              Redirecting to your requests…
            </p>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div>
      <PageHead
        title="Submit leave request"
        description="Requests should be submitted at least 21 days in advance."
        breadcrumbs={
          <Link
            href="/portal/requests?tab=leave"
            className="text-muted-foreground hover:text-foreground"
          >
            ← My Requests
          </Link>
        }
      />

      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Card className="mx-auto max-w-2xl">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 p-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isLateRequest && (
                <Alert
                  variant="default"
                  className="border-[var(--color-warning-500)] bg-[var(--color-warning-muted)]"
                >
                  <AlertCircle className="h-4 w-4 text-[var(--color-warning-600)]" />
                  <AlertDescription className="text-[var(--color-warning-600)]">
                    Late request (less than 21 days advance notice). Approval is subject to
                    operational requirements.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="request_type">Leave type *</Label>
                <Select
                  onValueChange={(value) =>
                    form.setValue('request_type', value as PilotLeaveRequestInput['request_type'])
                  }
                  defaultValue={form.getValues('request_type')}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.request_type && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.request_type.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    min={today}
                    {...form.register('start_date')}
                    onChange={(e) => {
                      form.register('start_date').onChange(e)
                      checkLateRequest(e.target.value)
                    }}
                    disabled={isLoading}
                  />
                  {form.formState.errors.start_date && (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.start_date.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    min={watchStartDate || today}
                    {...form.register('end_date')}
                    disabled={isLoading}
                  />
                  {form.formState.errors.end_date && (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.end_date.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">
                  Reason <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Provide additional context for your leave request…"
                  rows={4}
                  maxLength={500}
                  {...form.register('reason')}
                  disabled={isLoading}
                />
                <p className="text-muted-foreground text-xs">
                  {form.watch('reason')?.length || 0}/500 characters
                </p>
                {form.formState.errors.reason && (
                  <p className="text-destructive text-sm">{form.formState.errors.reason.message}</p>
                )}
              </div>

              {watchRequestType === 'SICK' && (
                <div className="space-y-2">
                  <FileUpload
                    label="Supporting documents (optional)"
                    helperText="Attach medical certificates or other supporting documents (PDF, Word, JPG or PNG — max 10MB each). You can add multiple files."
                    value={selectedFile}
                    onFileSelect={handleFileSelect}
                    disabled={isLoading || isUploading}
                    isUploading={isUploading}
                    error={uploadError}
                  />
                  {attachedFiles.length > 0 && (
                    <ul className="space-y-1">
                      {attachedFiles.map((file, index) => (
                        <li
                          key={`${file.name}-${file.size}`}
                          className="bg-muted/40 flex items-center justify-between rounded-md px-3 py-2 text-sm"
                        >
                          <span className="min-w-0 truncate">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAttachmentRemove(index)}
                            disabled={isLoading || isUploading}
                            aria-label={`Remove ${file.name}`}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> Leave requests should be submitted at least 21 days in
                  advance. Late requests may be denied based on operational requirements.
                </AlertDescription>
              </Alert>
            </CardContent>

            <div className="border-border flex justify-end gap-2 border-t px-6 py-4">
              <Link href="/portal/requests?tab=leave">
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Submitting…' : 'Submit request'}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  )
}
