/**
 * Renewal Planning PDF Generation Service
 *
 * Creates professional PDF reports for certification renewal planning.
 * Reports are organized BY CATEGORY for easy distribution to respective teams.
 */

import type JsPDF from 'jspdf'
import { formatDate } from '@/lib/utils/date-utils'
import type { PairedCrew, UnpairedPilot, PairingStatistics } from '@/lib/types/pairing'
// jsPDF type augmentation for lastAutoTable is in types/jspdf-autotable.d.ts

// Module-level reference for dynamically-loaded autoTable (assigned in generateRenewalPlanPDF before use)
let autoTable: any

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
  // Pairing fields
  pairing_status?: 'paired' | 'unpaired_solo' | 'not_applicable'
  paired_pilot_name?: string
  paired_pilot_employee_id?: string
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

interface PairingData {
  pairs: PairedCrew[]
  unpaired: UnpairedPilot[]
  statistics: PairingStatistics
}

interface RenewalPlanPDFData {
  year: number
  summaries: RosterPeriodSummary[]
  renewals: RenewalItem[]
  generatedAt: Date
  // Optional pairing data for Flight/Simulator checks
  pairingData?: PairingData
}

// Category configuration
const CATEGORIES = [
  { id: 'Pilot Medical', label: 'Pilot Medical', color: [220, 53, 69] as [number, number, number] },
  { id: 'Flight Checks', label: 'Flight Checks', color: [0, 123, 255] as [number, number, number] },
  {
    id: 'Simulator Checks',
    label: 'Simulator Checks',
    color: [111, 66, 193] as [number, number, number],
  },
  {
    id: 'Ground Courses Refresher',
    label: 'Ground Courses',
    color: [40, 167, 69] as [number, number, number],
  },
]

/**
 * Generate complete renewal planning PDF - organized BY CATEGORY
 */
export async function generateRenewalPlanPDF(data: RenewalPlanPDFData): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf')
  const autoTableMod = await import('jspdf-autotable')
  autoTable = autoTableMod.default
  const doc = new jsPDF()

  // Page 1: Cover Page
  addCoverPage(doc, data)

  // Page 2: Executive Summary (Category-focused)
  doc.addPage()
  addExecutiveSummary(doc, data)

  // Page 3: Pairing Summary (if pairing data exists)
  if (data.pairingData) {
    doc.addPage()
    addPairingSummaryPage(doc, data)
  }

  // Pages 4-7: One page per category
  CATEGORIES.forEach((category, index) => {
    const categoryRenewals = data.renewals.filter((r) => r.check_type.category === category.id)
    if (categoryRenewals.length > 0 || true) {
      // Always include category page
      doc.addPage()
      addCategoryPage(doc, category, data, categoryRenewals)
    }
  })

  // Final Page: Combined Pilot Schedules (all categories)
  doc.addPage()
  addPilotSchedules(doc, data)

  return doc.output('blob')
}

/**
 * Cover Page
 */
function addCoverPage(doc: JsPDF, data: RenewalPlanPDFData) {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Title
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('Certification Renewal Planning', pageWidth / 2, 80, { align: 'center' })

  doc.setFontSize(20)
  doc.setFont('helvetica', 'normal')
  doc.text(`${data.year} Annual Plan`, pageWidth / 2, 100, { align: 'center' })

  // Subtitle
  doc.setFontSize(14)
  doc.setTextColor(100, 100, 100)
  doc.text('Organized by Category', pageWidth / 2, 115, { align: 'center' })

  // Metadata
  doc.setFontSize(12)
  doc.text(`Generated: ${formatDate(data.generatedAt)}`, pageWidth / 2, 140, { align: 'center' })
  doc.text('Air Niugini - B767 Fleet', pageWidth / 2, 150, { align: 'center' })
  doc.text('Fleet Management System', pageWidth / 2, 160, { align: 'center' })

  // Category Summary Box
  doc.setDrawColor(41, 128, 185)
  doc.setLineWidth(0.5)
  doc.rect(30, 180, pageWidth - 60, 80)

  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text('Category Summary', pageWidth / 2, 195, { align: 'center' })

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  // Count by category
  const byCategory = data.renewals.reduce(
    (acc, r) => {
      const cat = r.check_type.category
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  let yPos = 210
  CATEGORIES.forEach((cat) => {
    const count = byCategory[cat.id] || 0
    doc.setTextColor(cat.color[0], cat.color[1], cat.color[2])
    doc.text(`${cat.label}: ${count} renewals`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 12
  })

  // Total
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total: ${data.renewals.length} renewals`, pageWidth / 2, yPos + 5, { align: 'center' })

  // Footer
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 150, 150)
  doc.text('B767 Pilot Management System', pageWidth / 2, 280, { align: 'center' })

  // Reset colors
  doc.setTextColor(0, 0, 0)
}

/**
 * Executive Summary Page - Category Focused
 */
function addExecutiveSummary(doc: JsPDF, data: RenewalPlanPDFData) {
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Executive Summary', 15, 20)

  const totalRenewals = data.summaries.reduce((sum, s) => sum + s.totalPlannedRenewals, 0)
  const totalCapacity = data.summaries.reduce((sum, s) => sum + s.totalCapacity, 0)
  const avgUtilization = totalCapacity > 0 ? (totalRenewals / totalCapacity) * 100 : 0

  // Category-based statistics
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('By Category', 15, 35)

  // Create category summary table
  const categoryTableData = CATEGORIES.map((cat) => {
    const catRenewals = data.renewals.filter((r) => r.check_type.category === cat.id)
    const catCapacity = data.summaries.reduce(
      (sum, s) => sum + (s.categoryBreakdown[cat.id]?.capacity || 0),
      0
    )
    const catUtil = catCapacity > 0 ? (catRenewals.length / catCapacity) * 100 : 0
    const highRiskPeriods = data.summaries.filter((s) => {
      const catBreakdown = s.categoryBreakdown[cat.id]
      if (!catBreakdown || catBreakdown.capacity === 0) return false
      return (catBreakdown.plannedCount / catBreakdown.capacity) * 100 > 80
    }).length

    return [
      cat.label,
      catRenewals.length.toString(),
      catCapacity.toString(),
      `${Math.round(catUtil)}%`,
      highRiskPeriods > 0 ? `${highRiskPeriods} periods` : 'None',
    ]
  })

  autoTable(doc, {
    head: [['Category', 'Renewals', 'Capacity', 'Utilization', 'High Risk']],
    body: categoryTableData,
    startY: 42,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    didParseCell: (cellData: any) => {
      // Color code categories
      if (cellData.section === 'body' && cellData.column.index === 0) {
        const catIndex = cellData.row.index
        if (catIndex < CATEGORIES.length) {
          cellData.cell.styles.textColor = CATEGORIES[catIndex].color
          cellData.cell.styles.fontStyle = 'bold'
        }
      }
      // Color code high risk
      if (cellData.section === 'body' && cellData.column.index === 4) {
        const value = cellData.cell.raw
        if (value !== 'None') {
          cellData.cell.styles.textColor = [220, 53, 69]
          cellData.cell.styles.fontStyle = 'bold'
        }
      }
    },
  })

  const afterTableY = doc.lastAutoTable?.finalY || 100

  // Overall Statistics
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Overall Statistics', 15, afterTableY + 15)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  const stats = [
    `Total Renewals Planned: ${totalRenewals}`,
    `Total Capacity: ${totalCapacity}`,
    `Overall Utilization: ${Math.round(avgUtilization)}%`,
    `Roster Periods: 13 (11 eligible, 2 excluded)`,
    `Excluded: December & January (holiday months)`,
  ]

  let yPos = afterTableY + 25
  stats.forEach((stat) => {
    doc.text(stat, 20, yPos)
    yPos += 8
  })

  // Key Notes
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Key Notes', 15, yPos + 10)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const notes = [
    '• This report is organized BY CATEGORY for easy distribution to respective teams',
    '• Each category section contains period distribution and pilot assignments',
    '• All 13 roster periods (RP1-RP13) are available for scheduling',
    '• Capacity limits: Flight (4), Simulator (6), Ground (8) per period',
    '• High-risk periods (>80% utilization) are highlighted in each category section',
  ]

  yPos += 20
  notes.forEach((note) => {
    doc.text(note, 20, yPos)
    yPos += 7
  })
}

/**
 * Category Detail Page
 */
function addCategoryPage(
  doc: JsPDF,
  category: { id: string; label: string; color: [number, number, number] },
  data: RenewalPlanPDFData,
  categoryRenewals: RenewalItem[]
) {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Category Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(category.color[0], category.color[1], category.color[2])
  doc.text(category.label, 15, 20)

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`${data.year} Renewal Schedule`, 15, 28)

  // Category Summary Stats
  const totalCapacity = data.summaries.reduce(
    (sum, s) => sum + (s.categoryBreakdown[category.id]?.capacity || 0),
    0
  )
  const utilization = totalCapacity > 0 ? (categoryRenewals.length / totalCapacity) * 100 : 0

  doc.setFontSize(11)
  doc.text(`Total Renewals: ${categoryRenewals.length}`, 15, 40)
  doc.text(`Total Capacity: ${totalCapacity}`, 15, 48)
  doc.text(`Utilization: ${Math.round(utilization)}%`, 15, 56)

  // Period Distribution Table
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Distribution by Roster Period', 15, 70)

  const periodTableData = data.summaries
    .filter((s) => {
      const month = s.periodStartDate.getMonth()
      return month !== 0 && month !== 11 // Exclude December/January
    })
    .map((s) => {
      const catBreakdown = s.categoryBreakdown[category.id]
      const planned = catBreakdown?.plannedCount || 0
      const capacity = catBreakdown?.capacity || 0
      const util = capacity > 0 ? (planned / capacity) * 100 : 0

      return [
        s.rosterPeriod,
        `${formatDate(s.periodStartDate)} - ${formatDate(s.periodEndDate)}`,
        `${planned} / ${capacity}`,
        `${Math.round(util)}%`,
        getUtilizationStatus(util),
      ]
    })

  autoTable(doc, {
    head: [['Period', 'Dates', 'Renewals', 'Util%', 'Status']],
    body: periodTableData,
    startY: 76,
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: category.color, textColor: 255 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 55 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 25 },
    },
    didParseCell: (cellData: any) => {
      // Color code status
      if (cellData.section === 'body' && cellData.column.index === 4) {
        const status = cellData.cell.raw
        if (status === 'High Risk') {
          cellData.cell.styles.textColor = [220, 53, 69]
          cellData.cell.styles.fontStyle = 'bold'
        } else if (status === 'Medium') {
          cellData.cell.styles.textColor = [255, 193, 7]
        } else {
          cellData.cell.styles.textColor = [40, 167, 69]
        }
      }
    },
  })

  const afterPeriodTable = doc.lastAutoTable?.finalY || 150

  // Pilot Assignments Table
  if (categoryRenewals.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Pilot Assignments', 15, afterPeriodTable + 12)

    // Sort by roster period, then by pilot name
    const sortedRenewals = [...categoryRenewals].sort((a, b) => {
      const periodCompare = a.roster_period.localeCompare(b.roster_period)
      if (periodCompare !== 0) return periodCompare
      return `${a.pilot.last_name} ${a.pilot.first_name}`.localeCompare(
        `${b.pilot.last_name} ${b.pilot.first_name}`
      )
    })

    const pilotTableData = sortedRenewals.map((r) => [
      r.roster_period,
      `${r.pilot.first_name} ${r.pilot.last_name}`,
      r.pilot.employee_id,
      r.check_type.check_code,
      formatDate(r.planned_renewal_date),
    ])

    autoTable(doc, {
      head: [['Period', 'Pilot', 'Emp ID', 'Check', 'Planned Date']],
      body: pilotTableData,
      startY: afterPeriodTable + 18,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: category.color, textColor: 255 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    })
  } else {
    doc.setFontSize(11)
    doc.setTextColor(150, 150, 150)
    doc.text('No renewals scheduled for this category', 15, afterPeriodTable + 20)
    doc.setTextColor(0, 0, 0)
  }
}

/**
 * Pilot Schedules Page - All categories combined
 */
function addPilotSchedules(doc: JsPDF, data: RenewalPlanPDFData) {
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Complete Pilot Schedules', 15, 20)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('All categories combined - grouped by pilot', 15, 28)

  // Group renewals by pilot
  const byPilot = data.renewals.reduce(
    (acc, r) => {
      const key = `${r.pilot.last_name}, ${r.pilot.first_name}`
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
    // Sort renewals by roster period
    const sortedRenewals = pilot.renewals.sort((a, b) =>
      a.roster_period.localeCompare(b.roster_period)
    )

    return sortedRenewals.map((r, index) => [
      index === 0 ? pilotName : '', // Only show pilot name on first row
      index === 0 ? pilot.empId : '',
      r.check_type.category,
      r.check_type.check_code,
      r.roster_period,
      formatDate(r.planned_renewal_date),
    ])
  })

  autoTable(doc, {
    head: [['Pilot', 'Emp ID', 'Category', 'Check', 'Period', 'Date']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [52, 73, 94], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    didParseCell: (cellData: any) => {
      // Color code categories
      if (cellData.section === 'body' && cellData.column.index === 2) {
        const category = cellData.cell.raw
        const cat = CATEGORIES.find((c) => c.id === category)
        if (cat) {
          cellData.cell.styles.textColor = cat.color
        }
      }
    },
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

/**
 * Pairing Summary Page - Captain/FO Pairing for Flight and Simulator Checks
 */
function addPairingSummaryPage(doc: JsPDF, data: RenewalPlanPDFData) {
  if (!data.pairingData) return

  const { pairs, unpaired, statistics } = data.pairingData
  const pageWidth = doc.internal.pageSize.getWidth()

  // Page Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Captain/FO Pairing Summary', 15, 20)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text('Flight Checks and Simulator Checks require Captain + First Officer pairing', 15, 28)
  doc.setTextColor(0, 0, 0)

  // Pairing Statistics
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Pairing Statistics', 15, 42)

  const statsTableData = [
    ['Total Paired Crews', statistics.totalPairs.toString()],
    ['Total Unpaired (Solo)', statistics.totalUnpaired.toString()],
    ['Urgent Solo (<30 days)', statistics.urgentUnpaired.toString()],
    ['Average Window Overlap', `${Math.round(statistics.averageOverlapDays)} days`],
  ]

  autoTable(doc, {
    body: statsTableData,
    startY: 48,
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 40 },
    },
    theme: 'plain',
  })

  const afterStatsY = doc.lastAutoTable?.finalY || 90

  // Category Breakdown
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('By Category', 15, afterStatsY + 10)

  const categoryBreakdownData = statistics.byCategory.map((cat) => [
    cat.category,
    cat.pairsCount.toString(),
    cat.unpairedCount.toString(),
    `${cat.captainsUnpaired} CPT / ${cat.firstOfficersUnpaired} FO`,
  ])

  autoTable(doc, {
    head: [['Category', 'Pairs', 'Unpaired', 'Solo Breakdown']],
    body: categoryBreakdownData,
    startY: afterStatsY + 16,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [0, 139, 139], textColor: 255 }, // Cyan for pairing
    didParseCell: (cellData: any) => {
      // Color code categories
      if (cellData.section === 'body' && cellData.column.index === 0) {
        const catName = cellData.cell.raw
        const cat = CATEGORIES.find((c) => c.id === catName)
        if (cat) {
          cellData.cell.styles.textColor = cat.color
          cellData.cell.styles.fontStyle = 'bold'
        }
      }
      // Highlight unpaired
      if (cellData.section === 'body' && cellData.column.index === 2) {
        const count = parseInt(cellData.cell.raw, 10)
        if (count > 0) {
          cellData.cell.styles.textColor = [255, 140, 0] // Orange
          cellData.cell.styles.fontStyle = 'bold'
        }
      }
    },
  })

  const afterCategoryY = doc.lastAutoTable?.finalY || 150

  // Paired Crews List (if any)
  if (pairs.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Paired Crews', 15, afterCategoryY + 12)

    // Group pairs by roster period
    const pairsByPeriod = pairs.reduce(
      (acc, pair) => {
        if (!acc[pair.plannedRosterPeriod]) {
          acc[pair.plannedRosterPeriod] = []
        }
        acc[pair.plannedRosterPeriod].push(pair)
        return acc
      },
      {} as Record<string, PairedCrew[]>
    )

    const pairedTableData = Object.entries(pairsByPeriod)
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([period, periodPairs]) =>
        periodPairs.map((pair, idx) => [
          idx === 0 ? period : '',
          pair.category,
          `CPT: ${pair.captain.name}`,
          `FO: ${pair.firstOfficer.name}`,
          `${pair.renewalWindowOverlap.days}d`,
        ])
      )

    autoTable(doc, {
      head: [['Period', 'Category', 'Captain', 'First Officer', 'Overlap']],
      body: pairedTableData,
      startY: afterCategoryY + 18,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [40, 167, 69], textColor: 255 }, // Green for paired
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 35 },
        2: { cellWidth: 50 },
        3: { cellWidth: 50 },
        4: { cellWidth: 20 },
      },
    })
  }

  // Unpaired Pilots Warning Section (if any)
  if (unpaired.length > 0) {
    const startY = pairs.length > 0 ? (doc.lastAutoTable?.finalY || 200) + 15 : afterCategoryY + 12

    // Check if we need a new page
    if (startY > 250) {
      doc.addPage()
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Unpaired Pilots - Solo Scheduling', 15, 20)
    } else {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Unpaired Pilots - Solo Scheduling', 15, startY)
    }

    // Warning banner
    const bannerY = startY > 250 ? 28 : startY + 8
    doc.setFillColor(255, 243, 205) // Yellow background
    doc.rect(15, bannerY, pageWidth - 30, 12, 'F')
    doc.setFontSize(10)
    doc.setTextColor(133, 100, 4)
    doc.text(
      `⚠ ${unpaired.length} pilot(s) scheduled solo due to pairing constraints. Review recommended.`,
      20,
      bannerY + 8
    )
    doc.setTextColor(0, 0, 0)

    // Sort unpaired by urgency
    const sortedUnpaired = [...unpaired].sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, normal: 2 }
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    })

    const unpairedTableData = sortedUnpaired.map((pilot) => [
      pilot.name,
      pilot.employeeId,
      pilot.role,
      pilot.category,
      pilot.plannedRosterPeriod,
      `${pilot.daysUntilExpiry}d`,
      pilot.urgency.toUpperCase(),
    ])

    autoTable(doc, {
      head: [['Pilot', 'Emp ID', 'Role', 'Category', 'Period', 'Expiry', 'Urgency']],
      body: unpairedTableData,
      startY: bannerY + 16,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [255, 140, 0], textColor: 255 }, // Orange for unpaired
      didParseCell: (cellData: any) => {
        // Color code urgency
        if (cellData.section === 'body' && cellData.column.index === 6) {
          const urgency = cellData.cell.raw
          if (urgency === 'CRITICAL') {
            cellData.cell.styles.textColor = [220, 53, 69]
            cellData.cell.styles.fontStyle = 'bold'
          } else if (urgency === 'HIGH') {
            cellData.cell.styles.textColor = [255, 140, 0]
            cellData.cell.styles.fontStyle = 'bold'
          }
        }
        // Color code low expiry days
        if (cellData.section === 'body' && cellData.column.index === 5) {
          const days = parseInt(cellData.cell.raw, 10)
          if (days <= 14) {
            cellData.cell.styles.textColor = [220, 53, 69]
            cellData.cell.styles.fontStyle = 'bold'
          } else if (days <= 30) {
            cellData.cell.styles.textColor = [255, 140, 0]
          }
        }
      },
    })
  }
}
