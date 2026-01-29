/**
 * Leave Bids PDF Generation Service
 * Generates comprehensive PDF reports for leave bid management
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface LeaveBidOption {
  id: string
  priority: number
  start_date: string
  end_date: string
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
  pilots: Pilot
  leave_bid_options: LeaveBidOption[]
  bid_year: number
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

export async function generateLeaveBidsPDF(
  bids: LeaveBid[],
  year: number,
  statusFilter: string = 'all'
): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height

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
  const pendingCount = bids.filter(
    (b) => b.status === 'PENDING' || b.status === 'PROCESSING'
  ).length
  const approvedCount = bids.filter((b) => b.status === 'APPROVED').length
  const rejectedCount = bids.filter((b) => b.status === 'REJECTED').length

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary Statistics:', 14, 30)

  doc.setFont('helvetica', 'normal')
  doc.text(`Total Bids: ${bids.length}`, 14, 36)
  doc.text(`Pending: ${pendingCount}`, 60, 36)
  doc.text(`Approved: ${approvedCount}`, 90, 36)
  doc.text(`Rejected: ${rejectedCount}`, 125, 36)

  let yPosition = 45

  // Group bids by status
  const bidsByStatus = {
    PENDING: bids.filter((b) => b.status === 'PENDING' || b.status === 'PROCESSING'),
    APPROVED: bids.filter((b) => b.status === 'APPROVED'),
    REJECTED: bids.filter((b) => b.status === 'REJECTED'),
  }

  // Render each status group
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
    const tableData = statusBids.map((bid) => {
      const pilot = bid.pilots
      const pilotName = `${pilot.first_name} ${pilot.last_name}`
      const seniority = pilot.seniority_number ? `#${pilot.seniority_number}` : 'N/A'
      const rank = pilot.role || 'N/A'

      // Format leave options
      const optionsText = bid.leave_bid_options
        .sort((a, b) => a.priority - b.priority)
        .map(
          (opt) => `P${opt.priority}: ${formatDate(opt.start_date)} - ${formatDate(opt.end_date)}`
        )
        .join('\n')

      return [
        seniority,
        pilotName,
        rank,
        bid.roster_period_code || 'N/A',
        optionsText,
        formatDate(bid.created_at),
        bid.reviewed_at ? formatDate(bid.reviewed_at) : 'Not reviewed',
        bid.review_comments || '-',
      ]
    })

    // Add table
    autoTable(doc, {
      startY: yPosition,
      head: [
        [
          'Seniority',
          'Pilot Name',
          'Rank',
          'Roster Period',
          'Leave Preferences',
          'Submitted',
          'Reviewed',
          'Comments',
        ],
      ],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: color,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 18 }, // Seniority
        1: { cellWidth: 35 }, // Pilot Name
        2: { cellWidth: 25 }, // Rank
        3: { cellWidth: 25 }, // Roster Period
        4: { cellWidth: 70 }, // Leave Preferences
        5: { cellWidth: 25 }, // Submitted
        6: { cellWidth: 25 }, // Reviewed
        7: { cellWidth: 35 }, // Comments
      },
      didDrawPage: (data) => {
        // Footer
        const pageCount = doc.getNumberOfPages()
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(
          `Page ${doc.getCurrentPageInfo().pageNumber} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        )
        doc.text('Fleet Management V2 - Leave Bid Report', 14, pageHeight - 10)
      },
    })

    yPosition = (doc.lastAutoTable?.finalY ?? yPosition) + 10
  }

  // Convert to Buffer
  const pdfArrayBuffer = doc.output('arraybuffer')
  return Buffer.from(pdfArrayBuffer)
}
