/**
 * Roster PDF Service
 *
 * Generates PDF reports for roster periods using jsPDF.
 * Creates professional PDF documents for submission to the rostering team.
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 *
 * NOTE: This service requires jsPDF and jsPDF-AutoTable packages.
 * Install with: npm install jspdf jspdf-autotable
 */

import type { RosterPeriodReport, RosterRequestItem } from './roster-report-service'
import { logger } from './logging-service'

// ============================================================================
// Type Definitions
// ============================================================================

export interface PDFGenerationOptions {
  /**
   * Include denied requests in report
   */
  includeDenied?: boolean

  /**
   * Include crew availability analysis
   */
  includeAvailability?: boolean

  /**
   * Company logo URL
   */
  logoUrl?: string

  /**
   * Custom footer text
   */
  footerText?: string
}

export interface PDFGenerationResult {
  success: boolean
  pdfBlob?: Blob
  pdfBase64?: string
  error?: string
}

// ============================================================================
// PDF Generation Functions
// ============================================================================

/**
 * Generate PDF document from roster period report
 *
 * This function uses jsPDF to create a professional PDF report.
 * The PDF will be generated on the client-side and can be downloaded or uploaded.
 *
 * @param report - Roster period report data
 * @param options - PDF generation options
 * @returns PDF blob and base64 string
 */
export async function generateRosterPDF(
  report: RosterPeriodReport,
  options: PDFGenerationOptions = {}
): Promise<PDFGenerationResult> {
  try {
    logger.info('Generating roster period PDF', {
      rosterPeriod: report.rosterPeriod.code,
      reportType: report.metadata.reportType,
    })

    // Check if we're running on the server or client
    if (typeof window === 'undefined') {
      // Server-side: Return a placeholder or use a different library
      return {
        success: false,
        error: 'PDF generation must be done on the client-side or use a server-compatible library',
      }
    }

    // Dynamic import of jsPDF (client-side only)
    const jsPDF = (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default

    // Create new PDF document (A4 size, portrait)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    let currentY = 20

    // ========================================================================
    // Header Section
    // ========================================================================

    // Company Logo (if provided)
    if (options.logoUrl) {
      try {
        // Note: In production, you'd load and add the actual logo image
        // doc.addImage(logoData, 'PNG', 15, 15, 30, 30)
        currentY += 35
      } catch (error) {
        logger.warn('Failed to add logo to PDF', { error: error instanceof Error ? error : String(error) })
      }
    }

    // Report Title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Roster Period Request Report', 105, currentY, { align: 'center' })
    currentY += 10

    // Roster Period Information
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text(`Roster Period: ${report.rosterPeriod.code}`, 105, currentY, { align: 'center' })
    currentY += 7

    doc.setFontSize(10)
    doc.text(
      `${formatDate(report.rosterPeriod.startDate)} to ${formatDate(report.rosterPeriod.endDate)}`,
      105,
      currentY,
      { align: 'center' }
    )
    currentY += 10

    // Report Metadata
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(
      `Generated: ${formatDateTime(report.metadata.generatedAt)} | Type: ${report.metadata.reportType}`,
      105,
      currentY,
      { align: 'center' }
    )
    currentY += 15

    // ========================================================================
    // Statistics Summary Section
    // ========================================================================

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Request Summary', 15, currentY)
    currentY += 7

    const statsData = [
      ['Total Requests', report.statistics.totalRequests.toString()],
      ['Approved', report.statistics.approvedCount.toString()],
      ['Denied', report.statistics.deniedCount.toString()],
      ['Pending Review', report.statistics.pendingCount.toString()],
      ['Withdrawn', report.statistics.withdrawnCount.toString()],
    ]

    autoTable(doc, {
      startY: currentY,
      head: [['Status', 'Count']],
      body: statsData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 40, halign: 'center' },
      },
    })

    currentY = (doc as any).lastAutoTable.finalY + 15

    // ========================================================================
    // Approved Leave Requests Section
    // ========================================================================

    if (report.approvedRequests.leaveRequests.length > 0) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`Approved Leave Requests (${report.approvedRequests.leaveRequests.length})`, 15, currentY)
      currentY += 7

      const leaveData = report.approvedRequests.leaveRequests.map((req) => [
        req.pilotName,
        req.employeeNumber,
        req.rank,
        req.requestType,
        formatDate(req.startDate),
        req.endDate ? formatDate(req.endDate) : '-',
        req.daysCount?.toString() || '-',
      ])

      autoTable(doc, {
        startY: currentY,
        head: [['Pilot', 'Emp #', 'Rank', 'Type', 'Start', 'End', 'Days']],
        body: leaveData,
        theme: 'striped',
        headStyles: { fillColor: [46, 204, 113], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 20 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
          6: { cellWidth: 15, halign: 'center' },
        },
      })

      currentY = (doc as any).lastAutoTable.finalY + 15
    }

    // ========================================================================
    // Approved Flight Requests Section
    // ========================================================================

    if (report.approvedRequests.flightRequests.length > 0) {
      if (currentY > 240) {
        doc.addPage()
        currentY = 20
      }

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(
        `Approved Flight Requests (${report.approvedRequests.flightRequests.length})`,
        15,
        currentY
      )
      currentY += 7

      const flightData = report.approvedRequests.flightRequests.map((req) => [
        req.pilotName,
        req.employeeNumber,
        req.rank,
        req.requestType,
        formatDate(req.startDate),
        req.reason || '-',
      ])

      autoTable(doc, {
        startY: currentY,
        head: [['Pilot', 'Emp #', 'Rank', 'Type', 'Date', 'Reason']],
        body: flightData,
        theme: 'striped',
        headStyles: { fillColor: [155, 89, 182], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 20 },
          2: { cellWidth: 25 },
          3: { cellWidth: 35 },
          4: { cellWidth: 25 },
          5: { cellWidth: 30 },
        },
      })

      currentY = (doc as any).lastAutoTable.finalY + 15
    }

    // ========================================================================
    // Denied Requests Section (if enabled)
    // ========================================================================

    if (options.includeDenied && report.deniedRequests.length > 0) {
      if (currentY > 240) {
        doc.addPage()
        currentY = 20
      }

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`Denied Requests (${report.deniedRequests.length})`, 15, currentY)
      currentY += 7

      const deniedData = report.deniedRequests.map((req) => [
        req.pilotName,
        req.employeeNumber,
        req.requestType,
        formatDate(req.startDate),
        req.reviewComments || 'No comment provided',
      ])

      autoTable(doc, {
        startY: currentY,
        head: [['Pilot', 'Emp #', 'Type', 'Start Date', 'Reason for Denial']],
        body: deniedData,
        theme: 'striped',
        headStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 20 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
          4: { cellWidth: 55 },
        },
      })

      currentY = (doc as any).lastAutoTable.finalY + 15
    }

    // ========================================================================
    // Crew Availability Analysis (if enabled)
    // ========================================================================

    if (options.includeAvailability) {
      if (currentY > 220) {
        doc.addPage()
        currentY = 20
      }

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Crew Availability Analysis', 15, currentY)
      currentY += 7

      const availabilityData = [
        [
          'Captains',
          report.crewAvailability.captains.totalCrew.toString(),
          report.crewAvailability.captains.onLeave.toString(),
          report.crewAvailability.captains.available.toString(),
          report.crewAvailability.captains.percentageAvailable.toFixed(1) + '%',
          report.crewAvailability.captains.belowMinimum ? 'YES ⚠️' : 'No',
        ],
        [
          'First Officers',
          report.crewAvailability.firstOfficers.totalCrew.toString(),
          report.crewAvailability.firstOfficers.onLeave.toString(),
          report.crewAvailability.firstOfficers.available.toString(),
          report.crewAvailability.firstOfficers.percentageAvailable.toFixed(1) + '%',
          report.crewAvailability.firstOfficers.belowMinimum ? 'YES ⚠️' : 'No',
        ],
      ]

      autoTable(doc, {
        startY: currentY,
        head: [['Rank', 'Total', 'On Leave', 'Available', '% Available', 'Below Min']],
        body: availabilityData,
        theme: 'grid',
        headStyles: { fillColor: [52, 73, 94], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 30, halign: 'center' },
          5: { cellWidth: 30, halign: 'center' },
        },
      })

      currentY = (doc as any).lastAutoTable.finalY + 10

      // Minimum crew warning (if applicable)
      if (report.crewAvailability.minimumCrewDate) {
        doc.setFontSize(10)
        doc.setTextColor(231, 76, 60)
        doc.text(
          `⚠️ Minimum crew availability occurs on ${formatDate(report.crewAvailability.minimumCrewDate)}`,
          15,
          currentY
        )
        currentY += 5
        doc.text(
          `   Captains: ${report.crewAvailability.minimumCrewCaptains} | First Officers: ${report.crewAvailability.minimumCrewFirstOfficers}`,
          15,
          currentY
        )
      }
    }

    // ========================================================================
    // Footer
    // ========================================================================

    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      const footerText =
        options.footerText || 'Fleet Management System - Air Niugini B767 Operations'
      doc.text(footerText, 105, 285, { align: 'center' })
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' })
    }

    // ========================================================================
    // Generate Output
    // ========================================================================

    const pdfBlob = doc.output('blob')
    const pdfBase64 = doc.output('datauristring')

    logger.info('Roster period PDF generated successfully', {
      rosterPeriod: report.rosterPeriod.code,
      pages: pageCount,
    })

    return {
      success: true,
      pdfBlob,
      pdfBase64,
    }
  } catch (error: any) {
    logger.error('Failed to generate roster period PDF', { error })
    return {
      success: false,
      error: error.message || 'Failed to generate PDF',
    }
  }
}

/**
 * Download PDF to user's device
 *
 * @param pdfBlob - PDF blob data
 * @param filename - Download filename
 */
export function downloadPDF(pdfBlob: Blob, filename: string): void {
  const url = URL.createObjectURL(pdfBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateTimeString: string): string {
  const date = new Date(dateTimeString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
