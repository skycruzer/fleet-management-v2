/**
 * Leave Bids PDF Generation Service
 * Author: Maurice Rondeau
 * Generates comprehensive PDF reports for leave bid management
 * Enhanced with roster period columns, grouping, and detailed summary stats
 */

import { readFileSync } from 'fs'
import { join } from 'path'
// jsPDF and autoTable are dynamically imported to avoid bundling ~300KB in non-PDF paths

interface LeaveBidOption {
  id: string
  priority: number
  start_date: string
  end_date: string
  roster_periods?: string[]
}

interface Pilot {
  id: string
  first_name: string
  last_name: string
  middle_name: string | null
  employee_id: string | null
  role: string | null
  seniority_number: number | null
}

interface LeaveBid {
  id: string
  roster_period_code: string
  status: string
  created_at: string
  updated_at: string | null
  reviewed_at: string | null
  review_comments: string | null
  pilots?: Pilot
  pilot?: Pilot
  leave_bid_options: LeaveBidOption[]
  bid_year: number
  name?: string
  rank?: string
  seniority?: number
  roster_periods_all?: string[]
}

interface LeaveBidsSummary {
  totalBids: number
  byStatus: {
    pending: number
    processing: number
    approved: number
    rejected: number
  }
  byRank: {
    captain: number
    firstOfficer: number
  }
  bidsByRosterPeriod?: Record<string, number>
  approvalRate?: number
}

function formatDate(dateString: string): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function getStatusColor(status: string): [number, number, number] {
  switch (status?.toUpperCase()) {
    case 'APPROVED':
      return [34, 197, 94] // green-500
    case 'PENDING':
    case 'PROCESSING':
      return [234, 179, 8] // yellow-500
    case 'REJECTED':
      return [239, 68, 68] // red-500
    default:
      return [156, 163, 175] // gray-400
  }
}

function getPilotName(bid: LeaveBid): string {
  if (bid.name && bid.name !== 'N/A') return bid.name
  const pilot = bid.pilots || bid.pilot
  if (pilot) return `${pilot.first_name} ${pilot.last_name}`
  return 'N/A'
}

function getPilotRank(bid: LeaveBid): string {
  if (bid.rank && bid.rank !== 'N/A') return bid.rank
  const pilot = bid.pilots || bid.pilot
  return pilot?.role || 'N/A'
}

function getPilotSeniority(bid: LeaveBid): string {
  if (bid.seniority && bid.seniority > 0) return `#${bid.seniority}`
  const pilot = bid.pilots || bid.pilot
  return pilot?.seniority_number ? `#${pilot.seniority_number}` : 'N/A'
}

export async function generateLeaveBidsPDF(
  bids: LeaveBid[],
  year: number,
  statusFilter: string = 'all',
  summary?: LeaveBidsSummary,
  groupBy?: string[]
): Promise<Buffer> {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height

  // Logo
  try {
    const logoPath = join(process.cwd(), 'public', 'images', 'air-niugini-logo.jpg')
    const logoData = readFileSync(logoPath)
    const logoBase64 = `data:image/jpeg;base64,${logoData.toString('base64')}`
    doc.addImage(logoBase64, 'JPEG', 14, 5, 18, 18)
  } catch {
    // Logo not found — continue without it
  }

  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Leave Bid Management Report', pageWidth / 2, 15, { align: 'center' })

  // Subtitle
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  const subtitle = `Year: ${year}${statusFilter !== 'all' ? ` | Status: ${statusFilter.toUpperCase()}` : ''} | Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
  doc.text(subtitle, pageWidth / 2, 22, { align: 'center' })

  // Statistics Summary
  const pendingCount =
    summary?.byStatus.pending ??
    bids.filter((b) => b.status === 'PENDING' || b.status === 'PROCESSING').length
  const processingCount = summary?.byStatus.processing ?? 0
  const approvedCount =
    summary?.byStatus.approved ?? bids.filter((b) => b.status === 'APPROVED').length
  const rejectedCount =
    summary?.byStatus.rejected ?? bids.filter((b) => b.status === 'REJECTED').length

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary Statistics:', 14, 30)

  doc.setFont('helvetica', 'normal')
  doc.text(`Total Bids: ${summary?.totalBids ?? bids.length}`, 14, 36)
  doc.text(`Pending: ${pendingCount + processingCount}`, 60, 36)
  doc.text(`Approved: ${approvedCount}`, 90, 36)
  doc.text(`Rejected: ${rejectedCount}`, 125, 36)

  let yPosition = 42

  // Enhanced summary stats
  if (summary) {
    if (summary.approvalRate !== undefined) {
      doc.text(`Approval Rate: ${summary.approvalRate}%`, 160, 36)
    }

    // Bids by rank
    if (summary.byRank) {
      doc.text(
        `Captains: ${summary.byRank.captain} | First Officers: ${summary.byRank.firstOfficer}`,
        14,
        yPosition
      )
      yPosition += 6
    }

    // Bids by roster period
    if (summary.bidsByRosterPeriod && Object.keys(summary.bidsByRosterPeriod).length > 0) {
      const rpEntries = Object.entries(summary.bidsByRosterPeriod)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([rp, count]) => `${rp}: ${count}`)
        .join(' | ')
      doc.text(`Bids per RP: ${rpEntries}`, 14, yPosition)
      yPosition += 6
    }
  }

  yPosition += 4

  // Check if we should group by roster period
  const shouldGroupByRP = groupBy?.includes('rosterPeriod')

  if (shouldGroupByRP) {
    // Group bids by roster_period_code
    const grouped = new Map<string, LeaveBid[]>()
    bids.forEach((bid) => {
      const rp = bid.roster_period_code || 'N/A'
      const existing = grouped.get(rp) || []
      existing.push(bid)
      grouped.set(rp, existing)
    })

    const sortedKeys = Array.from(grouped.keys()).sort()

    for (const rpCode of sortedKeys) {
      const rpBids = grouped.get(rpCode) || []

      // RP group header
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = 15
      }

      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(41, 128, 185)
      doc.text(`Roster Period: ${rpCode} (${rpBids.length} bids)`, 14, yPosition)
      doc.setTextColor(0, 0, 0)
      yPosition += 7

      // Render table for this group
      const tableData = rpBids.map((bid) => buildTableRow(bid))

      autoTable(doc, {
        startY: yPosition,
        head: [getTableHeaders()],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
        },
        bodyStyles: { fontSize: 7, cellPadding: 2 },
        columnStyles: getColumnStyles(),
        didDrawPage: () => renderFooter(doc, pageWidth, pageHeight),
      })

      yPosition = (doc.lastAutoTable?.finalY ?? yPosition) + 12
    }
  } else {
    // Group bids by status (default rendering)
    const bidsByStatus = {
      PENDING: bids.filter((b) => b.status === 'PENDING' || b.status === 'PROCESSING'),
      APPROVED: bids.filter((b) => b.status === 'APPROVED'),
      REJECTED: bids.filter((b) => b.status === 'REJECTED'),
    }

    for (const [status, statusBids] of Object.entries(bidsByStatus)) {
      if (statusBids.length === 0) continue

      // Status header
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = 15
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      const color = getStatusColor(status)
      doc.setTextColor(color[0], color[1], color[2])
      doc.text(`${status} (${statusBids.length})`, 14, yPosition)
      doc.setTextColor(0, 0, 0)
      yPosition += 7

      // Table data for this status
      const tableData = statusBids.map((bid) => buildTableRow(bid))

      autoTable(doc, {
        startY: yPosition,
        head: [getTableHeaders()],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: color,
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
        },
        bodyStyles: { fontSize: 7, cellPadding: 2 },
        columnStyles: getColumnStyles(),
        didDrawPage: () => renderFooter(doc, pageWidth, pageHeight),
      })

      yPosition = (doc.lastAutoTable?.finalY ?? yPosition) + 10
    }
  }

  // Convert to Buffer
  const pdfArrayBuffer = doc.output('arraybuffer')
  return Buffer.from(pdfArrayBuffer)
}

function getTableHeaders(): string[] {
  return [
    'Sen.',
    'Pilot Name',
    'Rank',
    'Preferences, Date Ranges & Roster Periods',
    'Status',
    'Submitted',
    'Comments',
  ]
}

function getColumnStyles(): Record<number, { cellWidth: number }> {
  return {
    0: { cellWidth: 14 }, // Seniority
    1: { cellWidth: 32 }, // Pilot Name
    2: { cellWidth: 20 }, // Rank
    3: { cellWidth: 110 }, // Preferences with dates & roster periods
    4: { cellWidth: 20 }, // Status
    5: { cellWidth: 22 }, // Submitted
    6: { cellWidth: 40 }, // Comments
  }
}

function buildTableRow(bid: LeaveBid): string[] {
  const pilotName = getPilotName(bid)
  const seniority = getPilotSeniority(bid)
  const rank = getPilotRank(bid)

  // Format each preference with its date range, roster periods, and option status
  const options = [...(bid.leave_bid_options || [])].sort((a, b) => a.priority - b.priority)
  const optionStatuses = (bid as any).option_statuses || {}
  const optionsText = options
    .map((opt, idx) => {
      const ordinal =
        opt.priority === 1
          ? '1st'
          : opt.priority === 2
            ? '2nd'
            : opt.priority === 3
              ? '3rd'
              : `${opt.priority}th`
      const days =
        opt.start_date && opt.end_date
          ? Math.ceil(
              (new Date(opt.end_date).getTime() - new Date(opt.start_date).getTime()) /
                (1000 * 60 * 60 * 24)
            ) + 1
          : 0
      const rps =
        opt.roster_periods && opt.roster_periods.length > 0
          ? ` → ${opt.roster_periods.join(', ')}`
          : ''
      const optStatus = optionStatuses[String(idx)]
      const statusTag = optStatus ? ` [${optStatus}]` : ''
      return `${ordinal}: ${formatDate(opt.start_date)} – ${formatDate(opt.end_date)} (${days}d)${rps}${statusTag}`
    })
    .join('\n')

  return [
    seniority,
    pilotName,
    rank,
    optionsText,
    bid.status || 'N/A',
    formatDate(bid.created_at),
    bid.review_comments || '-',
  ]
}

function renderFooter(doc: any, pageWidth: number, pageHeight: number): void {
  const pageCount = doc.getNumberOfPages()
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text(
    `Page ${doc.getCurrentPageInfo().pageNumber} of ${pageCount}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )
  doc.text('Air Niugini - B767 Fleet Management', 14, pageHeight - 10)
}
