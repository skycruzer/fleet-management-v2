// Maurice Rondeau — Roster PDF Viewer
'use client'

import { useState, useEffect } from 'react'
import { Download, Loader2, ExternalLink } from 'lucide-react'
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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!open || !rosterId) return

    let cancelled = false
    setLoading(true)
    setError('')

    fetch(`/api/published-rosters/${rosterId}/pdf`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.success && json.data?.url) {
          setPdfUrl(json.data.url)
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

  const handleClose = () => {
    setPdfUrl(null)
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="h-[85vh] max-w-4xl">
        <DialogHeader>
          <DialogTitle>Published Roster — {periodCode}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden rounded-lg border">
          {loading && (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          )}

          {pdfUrl && !loading && (
            <iframe src={pdfUrl} className="h-full w-full" title={`Roster PDF — ${periodCode}`} />
          )}
        </div>

        <DialogFooter>
          {pdfUrl && (
            <>
              <Button variant="outline" size="sm" asChild>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={pdfUrl} download={`roster-${periodCode}.pdf`} className="gap-1.5">
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </Button>
            </>
          )}
          <Button onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
