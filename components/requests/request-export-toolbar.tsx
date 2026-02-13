/**
 * Request Export Toolbar Component
 *
 * Provides Email, PDF, and CSV export buttons for filtered pilot requests.
 * Sits between the filter bar and the requests table.
 *
 * @author Maurice Rondeau
 * @date February 2026
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Mail, FileText, Download, Loader2 } from 'lucide-react'
import { exportToCSV, generateFilename, formatDateForExport } from '@/lib/utils/export-utils'
import { RequestEmailReportDialog } from './request-email-report-dialog'
import type { PilotRequest } from './requests-table'

// ============================================================================
// Types
// ============================================================================

interface RequestExportToolbarProps {
  requests: PilotRequest[]
  filterSummary?: string
}

// ============================================================================
// PDF Generation Helpers
// ============================================================================

async function loadLogoAsBase64(): Promise<string | null> {
  try {
    const response = await fetch('/images/air-niugini-logo.jpg')
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function getStatusColor(status: string): [number, number, number] {
  switch (status) {
    case 'APPROVED':
      return [16, 185, 129]
    case 'DENIED':
      return [239, 68, 68]
    case 'SUBMITTED':
    case 'IN_REVIEW':
      return [245, 158, 11]
    case 'WITHDRAWN':
      return [107, 114, 128]
    default:
      return [51, 51, 51]
  }
}

function formatCategory(cat: string): string {
  switch (cat) {
    case 'LEAVE':
      return 'Leave'
    case 'FLIGHT':
      return 'Flight'
    case 'LEAVE_BID':
      return 'Leave Bid'
    default:
      return cat
  }
}

function formatStatus(status: string): string {
  switch (status) {
    case 'IN_REVIEW':
      return 'In Review'
    default:
      return status.charAt(0) + status.slice(1).toLowerCase()
  }
}

function formatPdfDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// ============================================================================
// Component
// ============================================================================

export function RequestExportToolbar({ requests, filterSummary }: RequestExportToolbarProps) {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const { toast } = useToast()

  const isEmpty = requests.length === 0

  // ============================================================================
  // PDF Export
  // ============================================================================

  async function handleExportPdf() {
    if (isEmpty) return
    setGeneratingPdf(true)

    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF({ orientation: 'landscape' })
      const pageWidth = doc.internal.pageSize.getWidth()

      // Logo
      const logoBase64 = await loadLogoAsBase64()
      if (logoBase64) {
        doc.addImage(logoBase64, 'JPEG', 14, 10, 20, 20)
      }

      // Title
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('Pilot Requests Report', logoBase64 ? 40 : 14, 22)

      // Subtitle with filter summary
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(107, 114, 128)
      const subtitle = filterSummary
        ? `${requests.length} requests | Filters: ${filterSummary}`
        : `${requests.length} requests`
      doc.text(subtitle, logoBase64 ? 40 : 14, 29)

      // Generated date
      doc.setFontSize(9)
      doc.text(
        `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        pageWidth - 14,
        22,
        { align: 'right' }
      )

      doc.setTextColor(0, 0, 0)

      // Table data
      const tableBody = requests.map((r, i) => [
        (i + 1).toString(),
        r.name || 'Unknown',
        r.rank || '—',
        formatCategory(r.request_category),
        r.request_type,
        formatPdfDate(r.start_date),
        formatPdfDate(r.end_date),
        r.days_count?.toString() ?? '—',
        r.roster_period,
        formatStatus(r.workflow_status),
      ])

      autoTable(doc, {
        startY: 36,
        head: [['#', 'Pilot Name', 'Rank', 'Category', 'Type', 'Start Date', 'End Date', 'Days', 'Roster Period', 'Status']],
        body: tableBody,
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          7: { halign: 'center' },
        },
        didParseCell: (data) => {
          // Color-code the Status column
          if (data.section === 'body' && data.column.index === 9) {
            const statusText = data.cell.raw as string
            const statusMap: Record<string, string> = {
              Approved: 'APPROVED',
              Denied: 'DENIED',
              Submitted: 'SUBMITTED',
              'In Review': 'IN_REVIEW',
              Withdrawn: 'WITHDRAWN',
              Draft: 'DRAFT',
            }
            const statusKey = statusMap[statusText] || statusText.toUpperCase()
            const color = getStatusColor(statusKey)
            data.cell.styles.textColor = color
            data.cell.styles.fontStyle = 'bold'
          }
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Footer on every page
          const pageHeight = doc.internal.pageSize.getHeight()
          doc.setFontSize(8)
          doc.setTextColor(107, 114, 128)
          doc.text(
            'Air Niugini B767 Operations — Fleet Management System',
            14,
            pageHeight - 10
          )
          doc.text(
            `Page ${data.pageNumber}`,
            pageWidth - 14,
            pageHeight - 10,
            { align: 'right' }
          )
        },
      })

      doc.save(`Requests_Report_${new Date().toISOString().split('T')[0]}.pdf`)

      toast({
        title: 'PDF Downloaded',
        description: `Report with ${requests.length} request${requests.length !== 1 ? 's' : ''} saved`,
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'PDF Error',
        description: error.message || 'Failed to generate PDF',
      })
    } finally {
      setGeneratingPdf(false)
    }
  }

  // ============================================================================
  // CSV Export
  // ============================================================================

  function handleExportCsv() {
    if (isEmpty) return

    exportToCSV(
      requests,
      [
        { header: 'Pilot Name', accessor: (r) => r.name || 'Unknown' },
        { header: 'Rank', accessor: (r) => r.rank || '' },
        { header: 'Category', accessor: (r) => formatCategory(r.request_category) },
        { header: 'Type', accessor: (r) => r.request_type },
        { header: 'Start Date', accessor: (r) => formatDateForExport(r.start_date) },
        { header: 'End Date', accessor: (r) => formatDateForExport(r.end_date) },
        { header: 'Days', accessor: (r) => r.days_count ?? '' },
        { header: 'Roster Period', accessor: (r) => r.roster_period },
        { header: 'Status', accessor: (r) => formatStatus(r.workflow_status) },
        { header: 'Channel', accessor: (r) => r.submission_channel },
        { header: 'Late Request', accessor: (r) => (r.is_late_request ? 'Yes' : 'No') },
      ],
      generateFilename('Requests_Report')
    )

    toast({
      title: 'CSV Downloaded',
      description: `Report with ${requests.length} request${requests.length !== 1 ? 's' : ''} saved`,
    })
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-normal">
            {requests.length} request{requests.length !== 1 ? 's' : ''}
          </Badge>
          {filterSummary && (
            <span className="text-muted-foreground text-xs">{filterSummary}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEmailDialogOpen(true)}
            disabled={isEmpty}
          >
            <Mail className="mr-2 h-4 w-4" />
            Email Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={isEmpty || generatingPdf}
          >
            {generatingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={isEmpty}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <RequestEmailReportDialog
        requests={requests}
        filterSummary={filterSummary}
        isOpen={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
      />
    </>
  )
}
