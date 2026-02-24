// Maurice Rondeau — Published Roster PDF Parser Service
// Parses B767 Analytic Roster Tool PDFs into structured assignment data.
// Uses pdfjs-dist for server-side text extraction with position coordinates.

import type { Database } from '@/types/supabase'

type RosterAssignmentInsert = Database['public']['Tables']['roster_assignments']['Insert']

export interface ParsedPilot {
  number: number
  lastName: string
  firstName: string
  rank: 'CAPTAIN' | 'FIRST_OFFICER'
  assignments: { dayNumber: number; activityCode: string }[]
}

export interface ParsedRoster {
  periodCode: string // e.g., "RP02/2026"
  periodNumber: number
  title: string
  startDate: string // ISO date
  endDate: string // ISO date
  updateDate: string | null
  captains: ParsedPilot[]
  firstOfficers: ParsedPilot[]
}

interface TextItem {
  str: string
  x: number
  y: number
  width: number
  height: number
}

// Month name to number mapping
const MONTH_MAP: Record<string, number> = {
  JANUARY: 0,
  FEBRUARY: 1,
  MARCH: 2,
  APRIL: 3,
  MAY: 4,
  JUNE: 5,
  JULY: 6,
  AUGUST: 7,
  SEPTEMBER: 8,
  OCTOBER: 9,
  NOVEMBER: 10,
  DECEMBER: 11,
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11,
}

/**
 * Parse a B767 Analytic Roster Tool PDF into structured data.
 * The PDF is a single-page Excel-generated document with two sections:
 * BOEING 767 CAPTAINS and BOEING 767 FIRST OFFICERS.
 * Each section has a 28-day grid with pilot names and activity codes.
 */
export async function parseRosterPdf(fileBuffer: ArrayBuffer): Promise<ParsedRoster> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) }).promise
  let items: TextItem[]
  try {
    if (doc.numPages > 1) {
      throw new Error(
        `Expected a single-page roster PDF but got ${doc.numPages} pages. Only page 1 will be parsed.`
      )
    }
    const page = await doc.getPage(1)
    const textContent = await page.getTextContent()

    // Extract text items with positions
    items = textContent.items
      .filter((item: Record<string, unknown>) => typeof item === 'object' && 'str' in item)
      .map((item: Record<string, unknown>) => {
        const transform = item.transform as number[]
        return {
          str: (item.str as string).trim(),
          x: transform[4],
          y: transform[5],
          width: item.width as number,
          height: item.height as number,
        }
      })
      .filter((item: TextItem) => item.str.length > 0)
  } finally {
    doc.destroy()
  }

  // Sort by y descending (top of page first), then x ascending
  items.sort((a, b) => {
    const yDiff = b.y - a.y
    if (Math.abs(yDiff) > 2) return yDiff
    return a.x - b.x
  })

  // Group items into rows by y-coordinate (within 3pt tolerance)
  const rows = groupIntoRows(items, 3)

  // Find section boundaries
  const captainRowIdx = rows.findIndex((row) =>
    row.some((item) => item.str.includes('BOEING 767 CAPTAINS'))
  )
  const foRowIdx = rows.findIndex((row) =>
    row.some((item) => item.str.includes('BOEING 767 FIRST OFFICERS'))
  )

  if (captainRowIdx === -1 || foRowIdx === -1) {
    throw new Error('Could not find CAPTAINS and/or FIRST OFFICERS sections in PDF')
  }

  // Extract period info from the ROSTER PERIOD line
  const periodInfo = extractPeriodInfo(rows, captainRowIdx)

  // Find day number header rows for each section (the row with "1 2 3 ... 28")
  const captainDayHeaderIdx = findDayNumberHeader(rows, captainRowIdx, foRowIdx)
  const foDayHeaderIdx = findDayNumberHeader(rows, foRowIdx, rows.length)

  if (captainDayHeaderIdx === -1) {
    throw new Error('Could not find day number header for CAPTAINS section')
  }

  // Get column x-positions from day number headers
  const captainColumns = extractDayColumns(rows[captainDayHeaderIdx])
  const foColumns = foDayHeaderIdx !== -1 ? extractDayColumns(rows[foDayHeaderIdx]) : captainColumns

  // Parse pilot rows for each section
  const captains = parsePilotRows(rows, captainDayHeaderIdx, foRowIdx, captainColumns, 'CAPTAIN')

  // Find the analysis/summary section that ends the FO section
  const foEndIdx = findSectionEnd(rows, foDayHeaderIdx !== -1 ? foDayHeaderIdx : foRowIdx)
  const firstOfficers = parsePilotRows(
    rows,
    foDayHeaderIdx !== -1 ? foDayHeaderIdx : foRowIdx,
    foEndIdx,
    foColumns,
    'FIRST_OFFICER'
  )

  return {
    periodCode: `RP${String(periodInfo.periodNumber).padStart(2, '0')}/${periodInfo.year}`,
    periodNumber: periodInfo.periodNumber,
    title: periodInfo.title,
    startDate: periodInfo.startDate,
    endDate: periodInfo.endDate,
    updateDate: periodInfo.updateDate,
    captains,
    firstOfficers,
  }
}

/**
 * Convert parsed roster data to database insert rows.
 */
export function toAssignmentInserts(
  parsed: ParsedRoster,
  publishedRosterId: string,
  pilotMap: Map<string, string> // "LASTNAME_FIRSTNAME" -> pilot UUID
): Omit<RosterAssignmentInsert, 'id' | 'created_at'>[] {
  const inserts: Omit<RosterAssignmentInsert, 'id' | 'created_at'>[] = []

  const allPilots = [...parsed.captains, ...parsed.firstOfficers]

  for (const pilot of allPilots) {
    const nameKey = `${pilot.lastName.toUpperCase()}_${pilot.firstName.toUpperCase()}`
    const pilotId = pilotMap.get(nameKey) || null

    for (const assignment of pilot.assignments) {
      if (!assignment.activityCode) continue // skip empty cells

      const date = calculateDate(parsed.startDate, assignment.dayNumber)

      inserts.push({
        published_roster_id: publishedRosterId,
        roster_period_code: parsed.periodCode,
        pilot_id: pilotId,
        pilot_name: `${pilot.lastName} ${pilot.firstName}`,
        pilot_last_name: pilot.lastName,
        pilot_first_name: pilot.firstName,
        rank: pilot.rank,
        day_number: assignment.dayNumber,
        date,
        activity_code: assignment.activityCode,
      })
    }
  }

  return inserts
}

// ─── Internal Helpers ───────────────────────────────────────────────

function groupIntoRows(items: TextItem[], tolerance: number): TextItem[][] {
  const rows: TextItem[][] = []
  let currentRow: TextItem[] = []
  let currentY = items[0]?.y ?? 0

  for (const item of items) {
    if (Math.abs(item.y - currentY) > tolerance) {
      if (currentRow.length > 0) {
        currentRow.sort((a, b) => a.x - b.x)
        rows.push(currentRow)
      }
      currentRow = [item]
      currentY = item.y
    } else {
      currentRow.push(item)
    }
  }

  if (currentRow.length > 0) {
    currentRow.sort((a, b) => a.x - b.x)
    rows.push(currentRow)
  }

  return rows
}

interface PeriodInfo {
  periodNumber: number
  year: number
  title: string
  startDate: string
  endDate: string
  updateDate: string | null
}

function extractPeriodInfo(rows: TextItem[][], sectionStart: number): PeriodInfo {
  // Search within 5 rows after the section header for the ROSTER PERIOD line
  for (let i = sectionStart; i < Math.min(sectionStart + 8, rows.length); i++) {
    const rowText = rows[i].map((item) => item.str).join(' ')

    // Match: ROSTER PERIOD 02 - ** 03 JANUARY - 30 JANUARY 2026**
    const periodMatch = rowText.match(
      /ROSTER\s+PERIOD\s+(\d+)\s*-\s*\*\*\s*(\d+)\s+(\w+)\s*(?:\d{4}\s*)?-\s*(\d+)\s+(\w+)\s+(\d{4})\s*\*\*/i
    )

    if (periodMatch) {
      const periodNumber = parseInt(periodMatch[1], 10)
      const startDay = parseInt(periodMatch[2], 10)
      const startMonthStr = periodMatch[3].toUpperCase()
      const endDay = parseInt(periodMatch[4], 10)
      const endMonthStr = periodMatch[5].toUpperCase()
      const year = parseInt(periodMatch[6], 10)

      const startMonth = MONTH_MAP[startMonthStr]
      const endMonth = MONTH_MAP[endMonthStr]

      if (startMonth === undefined || endMonth === undefined) {
        throw new Error(`Unknown month: ${startMonthStr} or ${endMonthStr}`)
      }

      // Determine start year — if start month > end month, start is previous year
      const startYear = startMonth > endMonth ? year - 1 : year
      const endYear = year

      const startDate = new Date(Date.UTC(startYear, startMonth, startDay))
      const endDate = new Date(Date.UTC(endYear, endMonth, endDay))

      // Look for update date (DD/MM/YYYY format at end of row)
      let updateDate: string | null = null
      const updateMatch = rowText.match(/(\d{2})\/(\d{2})\/(\d{4})\s*$/)
      if (updateMatch) {
        const ud = new Date(
          Date.UTC(
            parseInt(updateMatch[3], 10),
            parseInt(updateMatch[2], 10) - 1,
            parseInt(updateMatch[1], 10)
          )
        )
        updateDate = ud.toISOString().split('T')[0]
      }

      return {
        periodNumber,
        year: endYear,
        title: `B767 ANALYTIC ROSTER TOOL - RP${String(periodNumber).padStart(2, '0')} ART ${endYear}`,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        updateDate,
      }
    }
  }

  throw new Error('Could not extract roster period info from PDF')
}

function findDayNumberHeader(rows: TextItem[][], sectionStart: number, sectionEnd: number): number {
  // The day number header is a row containing items "1", "2", ... up to "28"
  // It appears just before or at the section header
  // Look for a row that has at least 20 numeric items between 1-28

  // Search from sectionStart-2 (it's typically just above the section title) to sectionStart+2
  const searchStart = Math.max(0, sectionStart - 2)
  const searchEnd = Math.min(sectionEnd, sectionStart + 10)

  for (let i = searchStart; i < searchEnd; i++) {
    const numericItems = rows[i].filter((item) => {
      const num = parseInt(item.str, 10)
      return !isNaN(num) && num >= 1 && num <= 28
    })

    if (numericItems.length >= 20) {
      return i
    }
  }

  return -1
}

function extractDayColumns(headerRow: TextItem[]): Map<number, number> {
  const columns = new Map<number, number>()

  for (const item of headerRow) {
    const num = parseInt(item.str, 10)
    if (!isNaN(num) && num >= 1 && num <= 28) {
      // Use the center of the text item as the column position
      columns.set(num, item.x + item.width / 2)
    }
  }

  return columns
}

function parsePilotRows(
  rows: TextItem[][],
  headerIdx: number,
  sectionEnd: number,
  columns: Map<number, number>,
  rank: 'CAPTAIN' | 'FIRST_OFFICER'
): ParsedPilot[] {
  const pilots: ParsedPilot[] = []

  // Pilot rows start after the header rows (typically 4-6 rows of header)
  // Look for rows that start with a number (pilot number)
  for (let i = headerIdx + 1; i < sectionEnd; i++) {
    const row = rows[i]
    if (row.length < 3) continue

    // Check if first item is a pilot number (1-30)
    const firstItem = row[0]
    const pilotNumber = parseInt(firstItem.str, 10)

    if (isNaN(pilotNumber) || pilotNumber < 1 || pilotNumber > 50) continue

    // Extract pilot name — items between pilot number and the first activity column
    const pilot = extractPilotFromRow(row, pilotNumber, columns, rank)
    if (pilot) {
      pilots.push(pilot)
    }
  }

  return pilots
}

function extractPilotFromRow(
  row: TextItem[],
  pilotNumber: number,
  columns: Map<number, number>,
  rank: 'CAPTAIN' | 'FIRST_OFFICER'
): ParsedPilot | null {
  // Get the x-position of day 1 column to separate name from assignments
  const day1X = columns.get(1)
  if (day1X === undefined) return null

  // Find the leftmost day column x-position
  const minDayX = Math.min(...Array.from(columns.values()))

  // Name items are those before the first day column
  // The name area typically contains: [number] [lastName] [firstName]
  const nameItems = row.filter((item) => {
    const num = parseInt(item.str, 10)
    // Skip the pilot number itself
    if (!isNaN(num) && num === pilotNumber && item.x < minDayX - 50) return false
    return item.x < minDayX - 20
  })

  // Also skip any "LT" items in the name area
  const filteredNameItems = nameItems.filter(
    (item) => item.str !== 'LT' && parseInt(item.str, 10) !== pilotNumber
  )

  if (filteredNameItems.length < 2) {
    // Try getting just the first two non-number items
    const allNameish = row.filter(
      (item) => item.x < minDayX - 20 && isNaN(parseInt(item.str, 10)) && item.str !== 'LT'
    )
    if (allNameish.length < 2) return null
    filteredNameItems.length = 0
    filteredNameItems.push(...allNameish)
  }

  const lastName = filteredNameItems[0]?.str || ''
  const firstName = filteredNameItems[1]?.str || ''

  if (!lastName || !firstName) return null

  // Calculate right boundary — anything beyond this is a summary/total column
  const day28X = columns.get(28)
  const day1Xval = columns.get(1)
  let maxActivityX = Infinity
  if (day28X !== undefined && day1Xval !== undefined) {
    const avgSpacing = (day28X - day1Xval) / 27
    maxActivityX = day28X + avgSpacing / 2
  }

  // Get activity items (items within the day columns area, excluding summary columns)
  const activityItems = row.filter((item) => {
    if (item.x < minDayX - 30) return false
    if (parseInt(item.str, 10) === pilotNumber && item.x < minDayX) return false
    if (item.str === 'LT') return false
    // Skip items past the right boundary (summary/total columns)
    if (item.x + item.width / 2 > maxActivityX) return false
    return true
  })

  // Map each activity item to nearest day, dedup by keeping closest to column center
  const dayMap = new Map<number, { activityCode: string; distance: number }>()

  for (const item of activityItems) {
    const itemCenterX = item.x + item.width / 2
    const dayNumber = findNearestDay(itemCenterX, columns)
    if (dayNumber !== null) {
      const colX = columns.get(dayNumber)!
      const distance = Math.abs(itemCenterX - colX)
      const existing = dayMap.get(dayNumber)
      if (!existing || distance < existing.distance) {
        dayMap.set(dayNumber, { activityCode: item.str, distance })
      }
    }
  }

  const assignments = Array.from(dayMap.entries())
    .map(([dayNumber, { activityCode }]) => ({ dayNumber, activityCode }))
    .sort((a, b) => a.dayNumber - b.dayNumber)

  return {
    number: pilotNumber,
    lastName,
    firstName,
    rank,
    assignments,
  }
}

function findNearestDay(x: number, columns: Map<number, number>): number | null {
  let nearest: number | null = null
  let minDist = Infinity

  for (const [day, colX] of columns) {
    const dist = Math.abs(x - colX)
    if (dist < minDist) {
      minDist = dist
      nearest = day
    }
  }

  // Allow some tolerance — column spacing is typically ~20-30pt
  // If the nearest column is more than 25pt away, it's likely a summary column
  if (minDist > 30) return null

  return nearest
}

function findSectionEnd(rows: TextItem[][], foHeaderIdx: number): number {
  // The FO section ends at the ANALYSIS/WEEK summary section
  for (let i = foHeaderIdx + 1; i < rows.length; i++) {
    const rowText = rows[i].map((item) => item.str).join(' ')
    if (
      rowText.includes('WEEK') ||
      rowText.includes('ANALYSIS') ||
      rowText.includes('A/LEAVE') ||
      rowText.includes('TOTAL')
    ) {
      return i
    }
  }
  return rows.length
}

function calculateDate(startDateStr: string, dayNumber: number): string {
  const start = new Date(startDateStr + 'T00:00:00Z')
  const d = new Date(start)
  d.setUTCDate(d.getUTCDate() + dayNumber - 1)
  return d.toISOString().split('T')[0]
}
