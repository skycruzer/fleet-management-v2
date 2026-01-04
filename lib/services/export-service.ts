/**
 * Export Service
 * Author: Maurice Rondeau
 *
 * Handles data export functionality for analytics, reports, and user data.
 * Supports CSV, PDF, and JSON export formats.
 *
 * @version 1.0.0
 * @since 2025-11-09
 */

import { format } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Export format types
 */
export type ExportFormat = 'csv' | 'pdf' | 'json'

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat
  filename?: string
  includeTimestamp?: boolean
  title?: string
  description?: string
}

/**
 * Analytics data structure for export
 */
export interface AnalyticsExportData {
  pilot: {
    total: number
    active: number
    inactive: number
    captains: number
    firstOfficers: number
    retirementPlanning: {
      retiringIn2Years: number
      retiringIn5Years: number
    }
  }
  certification: {
    total: number
    current: number
    expiring: number
    expired: number
    complianceRate: number
  }
  leave: {
    total: number
    pending: number
    approved: number
    denied: number
  }
  fleet: {
    utilization: number
    availability: number
    readiness: number
  }
  risk: {
    overallRiskScore: number
  }
}

/**
 * Generate CSV content from analytics data
 *
 * @param data - Analytics data to export
 * @param options - Export options
 * @returns CSV content as string
 */
export function generateAnalyticsCSV(
  data: AnalyticsExportData,
  options: Partial<ExportOptions> = {}
): string {
  const { title = 'Fleet Analytics Report', includeTimestamp = true } = options

  const rows: string[][] = []

  // Header
  rows.push([title])
  if (includeTimestamp) {
    rows.push([`Generated: ${format(new Date(), 'PPpp')}`])
  }
  rows.push([''])

  // Pilot Distribution
  rows.push(['PILOT DISTRIBUTION'])
  rows.push(['Metric', 'Count'])
  rows.push(['Total Pilots', data.pilot.total.toString()])
  rows.push(['Active Pilots', data.pilot.active.toString()])
  rows.push(['Inactive Pilots', data.pilot.inactive.toString()])
  rows.push(['Captains', data.pilot.captains.toString()])
  rows.push(['First Officers', data.pilot.firstOfficers.toString()])
  rows.push(['Retiring in 2 Years', data.pilot.retirementPlanning.retiringIn2Years.toString()])
  rows.push(['Retiring in 5 Years', data.pilot.retirementPlanning.retiringIn5Years.toString()])
  rows.push([''])

  // Certification Status
  rows.push(['CERTIFICATION STATUS'])
  rows.push(['Status', 'Count'])
  rows.push(['Total Certifications', data.certification.total.toString()])
  rows.push(['Current', data.certification.current.toString()])
  rows.push(['Expiring (≤30 days)', data.certification.expiring.toString()])
  rows.push(['Expired', data.certification.expired.toString()])
  rows.push(['Compliance Rate (%)', data.certification.complianceRate.toFixed(1)])
  rows.push([''])

  // Leave Requests
  rows.push(['LEAVE REQUESTS'])
  rows.push(['Status', 'Count'])
  rows.push(['Total Requests', data.leave.total.toString()])
  rows.push(['Pending', data.leave.pending.toString()])
  rows.push(['Approved', data.leave.approved.toString()])
  rows.push(['Denied', data.leave.denied.toString()])
  rows.push([''])

  // Fleet Metrics
  rows.push(['FLEET METRICS'])
  rows.push(['Metric', 'Value (%)'])
  rows.push(['Fleet Utilization', data.fleet.utilization.toFixed(1)])
  rows.push(['Pilot Availability', data.fleet.availability.toFixed(1)])
  rows.push(['Fleet Readiness', data.fleet.readiness.toFixed(1)])
  rows.push([''])

  // Risk Assessment
  rows.push(['RISK ASSESSMENT'])
  rows.push(['Overall Risk Score', data.risk.overallRiskScore.toString()])

  // Convert to CSV string
  return rows.map((row) => row.join(',')).join('\n')
}

/**
 * Generate PDF document from analytics data
 *
 * @param data - Analytics data to export
 * @param options - Export options
 * @returns PDF as Buffer
 */
export function generateAnalyticsPDF(
  data: AnalyticsExportData,
  options: Partial<ExportOptions> = {}
): Buffer {
  const { title = 'Fleet Analytics Report', includeTimestamp = true } = options

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageWidth / 2, 20, { align: 'center' })

  if (includeTimestamp) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, pageWidth / 2, 28, { align: 'center' })
  }

  let yPos = 40

  // Pilot Distribution
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Pilot Distribution', 14, yPos)
  yPos += 10

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Count']],
    body: [
      ['Total Pilots', data.pilot.total],
      ['Active Pilots', data.pilot.active],
      ['Inactive Pilots', data.pilot.inactive],
      ['Captains', data.pilot.captains],
      ['First Officers', data.pilot.firstOfficers],
      ['Retiring in 2 Years', data.pilot.retirementPlanning.retiringIn2Years],
      ['Retiring in 5 Years', data.pilot.retirementPlanning.retiringIn5Years],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] },
    margin: { left: 14 },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Certification Status
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Certification Status', 14, yPos)
  yPos += 10

  autoTable(doc, {
    startY: yPos,
    head: [['Status', 'Count']],
    body: [
      ['Total Certifications', data.certification.total],
      ['Current', data.certification.current],
      ['Expiring (≤30 days)', data.certification.expiring],
      ['Expired', data.certification.expired],
      ['Compliance Rate', `${data.certification.complianceRate.toFixed(1)}%`],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] },
    margin: { left: 14 },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Leave Requests
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Leave Requests', 14, yPos)
  yPos += 10

  autoTable(doc, {
    startY: yPos,
    head: [['Status', 'Count']],
    body: [
      ['Total Requests', data.leave.total],
      ['Pending', data.leave.pending],
      ['Approved', data.leave.approved],
      ['Denied', data.leave.denied],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] },
    margin: { left: 14 },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Check if we need a new page
  if (yPos > 240) {
    doc.addPage()
    yPos = 20
  }

  // Fleet Metrics
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Fleet Metrics', 14, yPos)
  yPos += 10

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value (%)']],
    body: [
      ['Fleet Utilization', data.fleet.utilization.toFixed(1)],
      ['Pilot Availability', data.fleet.availability.toFixed(1)],
      ['Fleet Readiness', data.fleet.readiness.toFixed(1)],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] },
    margin: { left: 14 },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Risk Assessment
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Risk Assessment', 14, yPos)
  yPos += 10

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Score']],
    body: [['Overall Risk Score', `${data.risk.overallRiskScore}/100`]],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] },
    margin: { left: 14 },
  })

  // Footer with page numbers
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, {
      align: 'center',
    })
  }

  return Buffer.from(doc.output('arraybuffer'))
}

/**
 * Generate JSON export from analytics data
 *
 * @param data - Analytics data to export
 * @param options - Export options
 * @returns JSON string
 */
export function generateAnalyticsJSON(
  data: AnalyticsExportData,
  options: Partial<ExportOptions> = {}
): string {
  const { title = 'Fleet Analytics Report', includeTimestamp = true } = options

  const exportData = {
    title,
    generatedAt: includeTimestamp ? new Date().toISOString() : undefined,
    data,
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Generate filename with timestamp
 *
 * @param basename - Base filename (without extension)
 * @param format - Export format
 * @param includeTimestamp - Whether to include timestamp
 * @returns Generated filename
 */
export function generateExportFilename(
  basename: string,
  format: ExportFormat,
  includeTimestamp: boolean = true
): string {
  const timestamp = includeTimestamp
    ? `-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}`
    : ''
  const extension = format === 'json' ? 'json' : format === 'pdf' ? 'pdf' : 'csv'
  return `${basename}${timestamp}.${extension}`
}

/**
 * Export analytics data in specified format
 *
 * @param data - Analytics data to export
 * @param options - Export options
 * @returns Export content and metadata
 */
export function exportAnalyticsData(
  data: AnalyticsExportData,
  options: ExportOptions
): {
  content: string | Buffer
  filename: string
  mimeType: string
} {
  const { format, filename, includeTimestamp = true, title, description } = options

  const basename = filename || 'fleet-analytics'
  const generatedFilename = generateExportFilename(basename, format, includeTimestamp)

  let content: string | Buffer
  let mimeType: string

  switch (format) {
    case 'csv':
      content = generateAnalyticsCSV(data, { title, includeTimestamp })
      mimeType = 'text/csv'
      break

    case 'pdf':
      content = generateAnalyticsPDF(data, { title, includeTimestamp })
      mimeType = 'application/pdf'
      break

    case 'json':
      content = generateAnalyticsJSON(data, { title, includeTimestamp })
      mimeType = 'application/json'
      break

    default:
      throw new Error(`Unsupported export format: ${format}`)
  }

  return {
    content,
    filename: generatedFilename,
    mimeType,
  }
}

/**
 * Convert tabular data to CSV
 * Generic CSV export for any tabular data
 *
 * @param headers - Column headers
 * @param rows - Data rows
 * @param title - Optional title row
 * @returns CSV string
 */
export function generateGenericCSV(
  headers: string[],
  rows: (string | number)[][],
  title?: string
): string {
  const csvRows: string[][] = []

  if (title) {
    csvRows.push([title])
    csvRows.push([''])
  }

  csvRows.push(headers)
  csvRows.push(...rows.map((row) => row.map((cell) => cell.toString())))

  return csvRows.map((row) => row.join(',')).join('\n')
}
