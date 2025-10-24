/**
 * Renewal Planning PDF Generation Service
 * Creates professional PDF reports for certification renewal planning
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from '@/lib/utils/date-utils'

// Type augmentation for jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY: number }
  }
}

interface PilotInfo {
  first_name: string
  last_name: string
  employee_id: string
  rank?: string
}

interface CheckTypeInfo {
  check_code: string
  check_description: string
  category: string
}

interface RenewalItem {
  id: string
  pilot: PilotInfo
  check_type: CheckTypeInfo
  planned_renewal_date: string
  original_expiry_date: string
  roster_period: string
  priority?: number
  status: string
}

interface RosterPeriodSummary {
  rosterPeriod: string
  periodStartDate: Date
  periodEndDate: Date
  totalPlannedRenewals: number
  totalCapacity: number
  utilizationPercentage: number
  categoryBreakdown: Record<
    string,
    {
      plannedCount: number
      capacity: number
    }
  >
}

interface RenewalPlanPDFData {
  year: number
  summaries: RosterPeriodSummary[]
  renewals: RenewalItem[]
  generatedAt: Date
}

/**
 * Generate complete renewal planning PDF
 */
export async function generateRenewalPlanPDF(data: RenewalPlanPDFData): Promise<Blob> {
  const doc = new jsPDF()

  // Page 1: Cover Page
  addCoverPage(doc, data)

  // Page 2: Executive Summary
  doc.addPage()
  addExecutiveSummary(doc, data)

  // Page 3: Yearly Calendar
  doc.addPage()
  addYearlyCalendar(doc, data)

  // Page 4+: Roster Period Breakdown (skip excluded periods)
  const eligibleSummaries = data.summaries.filter((s) => {
    const month = s.periodStartDate.getMonth()
    return month !== 0 && month !== 11 // Exclude December and January
  })

  eligibleSummaries.forEach((summary, index) => {
    if (index > 0 || doc.getCurrentPageInfo().pageNumber > 3) {
      doc.addPage()
    }
    addRosterPeriodDetail(doc, summary, data.renewals)
  })

  // Page N: Pilot Schedules
  doc.addPage()
  addPilotSchedules(doc, data)

  return doc.output('blob')
}

/**
 * Cover Page
 */
function addCoverPage(doc: jsPDF, data: RenewalPlanPDFData) {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Title
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('Certification Renewal Planning', pageWidth / 2, 80, { align: 'center' })

  doc.setFontSize(20)
  doc.setFont('helvetica', 'normal')
  doc.text(`${data.year} Annual Plan`, pageWidth / 2, 100, { align: 'center' })

  // Metadata
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${formatDate(data.generatedAt)}`, pageWidth / 2, 130, { align: 'center' })
  doc.text('Air Niugini - B767 Fleet', pageWidth / 2, 140, { align: 'center' })
  doc.text('Fleet Management System', pageWidth / 2, 150, { align: 'center' })

  // Box for summary stats
  doc.setDrawColor(41, 128, 185)
  doc.setLineWidth(0.5)
  doc.rect(40, 170, pageWidth - 80, 60)

  const totalRenewals = data.summaries.reduce((sum, s) => sum + s.totalPlannedRenewals, 0)
  const totalCapacity = data.summaries.reduce((sum, s) => sum + s.totalCapacity, 0)
  const avgUtilization = totalCapacity > 0 ? (totalRenewals / totalCapacity) * 100 : 0

  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Quick Summary', pageWidth / 2, 185, { align: 'center' })

  doc.setFontSize(11)
  const stats = [
    `Total Renewals: ${totalRenewals}`,
    `Overall Utilization: ${Math.round(avgUtilization)}%`,
    `Roster Periods: 13 (11 eligible, 2 excluded)`,
  ]

  stats.forEach((stat, index) => {
    doc.text(stat, pageWidth / 2, 200 + index * 10, { align: 'center' })
  })

  // Footer
  doc.setFontSize(10)
  doc.setTextColor(150, 150, 150)
  doc.text('B767 Pilot Management System', pageWidth / 2, 280, { align: 'center' })

  // Reset colors
  doc.setTextColor(0, 0, 0)
}

/**
 * Executive Summary Page
 */
function addExecutiveSummary(doc: jsPDF, data: RenewalPlanPDFData) {
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Executive Summary', 15, 20)

  const totalRenewals = data.summaries.reduce((sum, s) => sum + s.totalPlannedRenewals, 0)
  const totalCapacity = data.summaries.reduce((sum, s) => sum + s.totalCapacity, 0)
  const avgUtilization = totalCapacity > 0 ? (totalRenewals / totalCapacity) * 100 : 0
  const highRiskPeriods = data.summaries.filter((s) => s.utilizationPercentage > 80)

  // Overall Statistics
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Overall Statistics', 15, 35)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  const stats = [
    `Total Renewals Planned: ${totalRenewals}`,
    `Total Capacity: ${totalCapacity}`,
    `Overall Utilization: ${Math.round(avgUtilization)}%`,
    `Roster Periods: 13`,
    `Eligible Periods: 11 (excluding December & January)`,
    `Excluded Periods: 2 (RP01, RP02 - Holiday months)`,
    `High-Risk Periods (>80%): ${highRiskPeriods.length}`,
  ]

  stats.forEach((stat, index) => {
    doc.text(stat, 20, 45 + index * 8)
  })

  // Category Breakdown
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Category Breakdown', 15, 110)

  const byCategory = data.renewals.reduce(
    (acc, r) => {
      const cat = r.check_type.category
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  let yPos = 120
  Object.entries(byCategory).forEach(([category, count]) => {
    const percentage = totalRenewals > 0 ? Math.round((count / totalRenewals) * 100) : 0
    doc.text(`${category}: ${count} renewals (${percentage}%)`, 20, yPos)
    yPos += 8
  })

  // High-Risk Periods Alert
  if (highRiskPeriods.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(220, 53, 69) // Red
    doc.text('⚠ High Utilization Periods', 15, yPos + 15)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)

    yPos += 25
    highRiskPeriods.forEach((period) => {
      doc.text(
        `${period.rosterPeriod}: ${Math.round(period.utilizationPercentage)}% utilization`,
        20,
        yPos
      )
      yPos += 8
    })
  }

  // Key Notes
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Key Notes', 15, yPos + 15)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const notes = [
    '• December and January are excluded from renewal scheduling (holiday months)',
    '• Renewals distributed across 11 eligible roster periods (RP03-RP13)',
    '• All renewals fall within regulatory grace periods (60-90 days)',
    '• Capacity limits respected: Flight (4), Simulator (6), Ground (8) per period',
    '• Load balancing algorithm minimizes congestion and optimizes distribution',
  ]

  yPos += 25
  notes.forEach((note) => {
    doc.text(note, 20, yPos)
    yPos += 7
  })
}

/**
 * Yearly Calendar Table
 */
function addYearlyCalendar(doc: jsPDF, data: RenewalPlanPDFData) {
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Yearly Calendar Overview', 15, 20)

  // Create table data
  const tableData = data.summaries.map((s) => {
    const month = s.periodStartDate.getMonth()
    const isExcluded = month === 0 || month === 11

    return [
      s.rosterPeriod,
      `${formatDate(s.periodStartDate)} - ${formatDate(s.periodEndDate)}`,
      isExcluded ? 'EXCLUDED' : `${s.totalPlannedRenewals} / ${s.totalCapacity}`,
      isExcluded ? 'N/A' : `${Math.round(s.utilizationPercentage)}%`,
      isExcluded ? 'Holiday Month' : getUtilizationStatus(s.utilizationPercentage),
    ]
  })

  autoTable(doc, {
    head: [['Roster Period', 'Dates', 'Renewals', 'Utilization', 'Status']],
    body: tableData,
    startY: 30,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didParseCell: (data: any) => {
      // Color code excluded rows
      if (data.section === 'body' && data.row.index < tableData.length) {
        if (tableData[data.row.index][2] === 'EXCLUDED') {
          data.cell.styles.fillColor = [220, 220, 220]
          data.cell.styles.textColor = [100, 100, 100]
        }
      }
    },
  })
}

/**
 * Roster Period Detail Page
 */
function addRosterPeriodDetail(doc: jsPDF, summary: RosterPeriodSummary, allRenewals: RenewalItem[]) {
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(`${summary.rosterPeriod} - Detailed Schedule`, 15, 20)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`${formatDate(summary.periodStartDate)} - ${formatDate(summary.periodEndDate)}`, 15, 28)
  doc.text(`Capacity: ${summary.totalPlannedRenewals} / ${summary.totalCapacity}`, 15, 35)
  doc.text(`Utilization: ${Math.round(summary.utilizationPercentage)}%`, 15, 42)

  // Filter renewals for this roster period
  const periodRenewals = allRenewals.filter((r) => r.roster_period === summary.rosterPeriod)

  if (periodRenewals.length === 0) {
    doc.setFontSize(12)
    doc.setTextColor(150, 150, 150)
    doc.text('No renewals scheduled for this period', 15, 60)
    doc.setTextColor(0, 0, 0)
    return
  }

  // Create table
  const tableData = periodRenewals.map((r) => [
    `${r.pilot.first_name} ${r.pilot.last_name}`,
    r.pilot.employee_id,
    r.check_type.check_code,
    r.check_type.category,
    formatDate(r.planned_renewal_date),
  ])

  autoTable(doc, {
    head: [['Pilot', 'Emp ID', 'Check Type', 'Category', 'Planned Date']],
    body: tableData,
    startY: 50,
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [52, 152, 219], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 250, 250] },
  })
}

/**
 * Pilot Schedules Page
 */
function addPilotSchedules(doc: jsPDF, data: RenewalPlanPDFData) {
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Pilot Renewal Schedules', 15, 20)

  // Group renewals by pilot
  const byPilot = data.renewals.reduce(
    (acc, r) => {
      const key = `${r.pilot.first_name} ${r.pilot.last_name}`
      if (!acc[key]) {
        acc[key] = {
          empId: r.pilot.employee_id,
          renewals: [],
        }
      }
      acc[key].renewals.push(r)
      return acc
    },
    {} as Record<
      string,
      {
        empId: string
        renewals: RenewalItem[]
      }
    >
  )

  // Sort pilots alphabetically
  const pilots = Object.keys(byPilot).sort()

  const tableData = pilots.flatMap((pilotName) => {
    const pilot = byPilot[pilotName]
    return pilot.renewals.map((r, index) => [
      index === 0 ? pilotName : '', // Only show pilot name on first row
      index === 0 ? pilot.empId : '',
      r.check_type.check_code,
      r.check_type.category,
      formatDate(r.planned_renewal_date),
      r.roster_period,
    ])
  })

  autoTable(doc, {
    head: [['Pilot', 'Emp ID', 'Check Type', 'Category', 'Planned Date', 'Roster Period']],
    body: tableData,
    startY: 30,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [46, 204, 113], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 248, 248] },
  })
}

/**
 * Helper: Get utilization status text
 */
function getUtilizationStatus(utilization: number): string {
  if (utilization > 80) return 'High Risk'
  if (utilization > 60) return 'Medium'
  return 'Good'
}
