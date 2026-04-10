// Maurice Rondeau — Roster PDF Viewer
'use client'

import { useState, useCallback } from 'react'
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
  const [downloading, setDownloading] = useState(false)

  // Same-origin API URL — no CORS issues for iframe, download, or new tab
  const pdfUrl = `/api/published-rosters/${rosterId}/pdf`

  const handleDownload = useCallback(async () => {
    setDownloading(true)
    try {
      const res = await fetch(pdfUrl)
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
      // Silent fail — user can retry
    } finally {
      setDownloading(false)
    }
  }, [pdfUrl, periodCode])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-w-5xl flex-col">
        <DialogHeader>
          <DialogTitle>Published Roster — {periodCode}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
          {open && (
            <iframe src={pdfUrl} className="h-full w-full" title={`Roster PDF — ${periodCode}`} />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" asChild>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="gap-1.5">
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
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
