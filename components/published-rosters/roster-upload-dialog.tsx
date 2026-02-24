// Maurice Rondeau — Roster Upload Dialog
'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'
import { formatFileSize } from '@/lib/validations/file-upload-schema'

interface RosterUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  periodCode: string
  onUploadComplete: () => void
}

interface UploadResult {
  roster: { id: string; period_code: string }
  captainCount: number
  foCount: number
  newActivityCodes: string[]
  unmatchedPilots: string[]
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

export function RosterUploadDialog({
  open,
  onOpenChange,
  periodCode,
  onUploadComplete,
}: RosterUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [result, setResult] = useState<UploadResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { csrfToken } = useCsrfToken()

  const handleFileSelect = useCallback((selected: File | null) => {
    if (!selected) {
      setFile(null)
      return
    }
    if (selected.type !== 'application/pdf') {
      setErrorMsg('Only PDF files are accepted')
      return
    }
    if (selected.size > 10 * 1024 * 1024) {
      setErrorMsg('File exceeds 10MB size limit')
      return
    }
    setErrorMsg('')
    setFile(selected)
  }, [])

  const handleUpload = async (replace = false) => {
    if (!file) return
    if (!csrfToken) {
      setUploadState('error')
      setErrorMsg('Security token not available. Please refresh the page and try again.')
      return
    }

    setUploadState('uploading')
    setErrorMsg('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('rosterPeriodCode', periodCode)
      if (replace) formData.append('replace', 'true')

      const res = await fetch('/api/published-rosters', {
        method: 'POST',
        headers: { 'x-csrf-token': csrfToken },
        body: formData,
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Upload failed')
      }

      setResult({
        roster: json.data,
        captainCount: json.meta?.captainCount ?? 0,
        foCount: json.meta?.foCount ?? 0,
        newActivityCodes: json.meta?.newActivityCodes ?? [],
        unmatchedPilots: json.meta?.unmatchedPilots ?? [],
      })
      setUploadState('success')
      toast.success(`Roster ${periodCode} ${replace ? 'replaced' : 'uploaded'} successfully`)
    } catch (err) {
      setUploadState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed')
      toast.error('Failed to upload roster')
    }
  }

  const handleClose = () => {
    if (uploadState === 'success') {
      onUploadComplete()
    }
    setFile(null)
    setUploadState('idle')
    setResult(null)
    setErrorMsg('')
    setIsDragging(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Roster — {periodCode}</DialogTitle>
          <DialogDescription>
            Upload the published roster PDF. The file will be parsed to extract pilot assignments.
          </DialogDescription>
        </DialogHeader>

        {uploadState === 'idle' && (
          <div className="min-w-0 space-y-4">
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelect(e.target.files[0])
              }}
              className="hidden"
            />

            {file ? (
              /* Compact file card once a file is selected */
              <div className="bg-muted/30 flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    setFile(null)
                    if (inputRef.current) inputRef.current.value = ''
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              /* Drop zone — only shown when no file selected */
              <div
                className={cn(
                  'cursor-pointer rounded-lg border-2 border-dashed p-8 transition-colors',
                  isDragging && 'border-primary bg-primary/5',
                  errorMsg && 'border-destructive bg-destructive/5',
                  !isDragging && !errorMsg && 'border-border hover:border-primary/50'
                )}
                onDragEnter={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                  const dropped = e.dataTransfer.files
                  if (dropped.length > 0) handleFileSelect(dropped[0])
                }}
                onClick={() => inputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <Upload
                    className={cn('h-8 w-8', isDragging ? 'text-primary' : 'text-muted-foreground')}
                  />
                  <div>
                    <p className="text-sm">
                      <span className="text-primary font-medium">Click to upload</span> or drag and
                      drop
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">PDF only, max 10MB</p>
                  </div>
                </div>
              </div>
            )}

            {errorMsg && <p className="text-destructive text-xs">{errorMsg}</p>}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => handleUpload()} disabled={!file}>
                Upload & Parse
              </Button>
            </DialogFooter>
          </div>
        )}

        {uploadState === 'uploading' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="text-primary h-10 w-10 animate-spin" />
            <p className="text-muted-foreground text-sm">
              Parsing roster PDF and extracting assignments...
            </p>
          </div>
        )}

        {uploadState === 'success' && result && (
          <>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Roster parsed successfully</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/30 rounded-lg border p-3">
                  <p className="text-muted-foreground">Captains</p>
                  <p className="text-2xl font-semibold">{result.captainCount}</p>
                </div>
                <div className="bg-muted/30 rounded-lg border p-3">
                  <p className="text-muted-foreground">First Officers</p>
                  <p className="text-2xl font-semibold">{result.foCount}</p>
                </div>
              </div>

              {result.newActivityCodes.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
                  <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    New activity codes discovered
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.newActivityCodes.map((code) => (
                      <Badge key={code} variant="secondary" className="font-mono text-xs">
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {result.unmatchedPilots.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
                  <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    {result.unmatchedPilots.length} pilots not matched to database
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    {result.unmatchedPilots.slice(0, 5).join(', ')}
                    {result.unmatchedPilots.length > 5 &&
                      ` and ${result.unmatchedPilots.length - 5} more`}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}

        {uploadState === 'error' && (
          <>
            <div className="space-y-3 py-4">
              <div className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Upload failed</span>
              </div>
              <p className="text-muted-foreground text-sm">{errorMsg}</p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {errorMsg.includes('already exists') ? (
                <Button variant="destructive" onClick={() => handleUpload(true)}>
                  Replace Existing
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setUploadState('idle')
                    setErrorMsg('')
                  }}
                >
                  Try Again
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
