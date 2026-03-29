// Maurice Rondeau — Roster PDF Viewer
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Download, Loader2, ExternalLink, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface RosterPdfViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rosterId: string
  periodCode: string
}

export function RosterPdfViewer({
  open,
  onOpenChange,
  rosterId,
  periodCode,
}: RosterPdfViewerProps) {
  // signedUrl: the Supabase signed URL (for download/open-in-new-tab)
  // blobUrl: object URL from fetched blob (for iframe rendering — avoids CORS/X-Frame-Options)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!open || !rosterId) return

    let cancelled = false
    setLoading(true)
    setError('')
    setSignedUrl(null)
    setBlobUrl(null)

    fetch(`/api/published-rosters/${rosterId}/pdf`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch PDF URL')
        return res.json()
      })
      .then(async (json) => {
        if (cancelled) return
        if (json.success && json.data?.url) {
          setSignedUrl(json.data.url)
          // Fetch as blob for iframe display (cross-origin signed URLs block iframe embedding)
          const pdfRes = await fetch(json.data.url)
          if (cancelled) return
          const blob = await pdfRes.blob()
          if (cancelled) return
          const url = URL.createObjectURL(blob)
          setBlobUrl(url)
        } else {
          setError(json.error || 'Failed to load PDF')
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load PDF')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, rosterId])

  // Clean up blob URL on unmount or close
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [blobUrl])

  const handleDownload = useCallback(async () => {
    if (!signedUrl) return
    setDownloading(true)
    try {
      const res = await fetch(signedUrl)
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `roster-${periodCode.replace('/', '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)
    } catch {
      setError('Download failed')
    } finally {
      setDownloading(false)
    }
  }, [signedUrl, periodCode])

  const handleClose = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl)
    setSignedUrl(null)
    setBlobUrl(null)
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex h-[90vh] max-w-5xl flex-col">
        <DialogHeader>
          <DialogTitle>Published Roster — {periodCode}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
          {loading && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Loader2 className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
                <p className="text-muted-foreground mt-2 text-sm">Loading PDF...</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="text-muted-foreground mx-auto h-8 w-8" />
                <p className="text-muted-foreground mt-2 text-sm">{error}</p>
              </div>
            </div>
          )}

          {blobUrl && !loading && (
            <iframe
              src={`${blobUrl}#toolbar=1&navpanes=0`}
              className="h-full w-full"
              title={`Roster PDF — ${periodCode}`}
            />
          )}
        </div>

        <DialogFooter>
          {signedUrl && (
            <>
              <Button variant="outline" size="sm" asChild>
                <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={downloading}
                className="gap-1.5"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download
              </Button>
            </>
          )}
          <Button onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
