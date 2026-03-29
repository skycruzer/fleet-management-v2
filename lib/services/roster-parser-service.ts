/**
 * Roster PDF Parser Service
 *
 * Parses B767 Analytic Roster Tool PDFs using pdfjs-dist for position-aware
 * text extraction. Extracts date headers, pilot names, ranks, and 28 activity codes.
 *
 * Developer: Maurice Rondeau
 */

// Polyfill DOMMatrix for serverless environments (Vercel) where it's missing.
// pdfjs-dist requires it even in the legacy build as of v5.x.
if (typeof globalThis.DOMMatrix === 'undefined') {
  class DOMMatrixPolyfill {
    a = 1
    b = 0
    c = 0
    d = 1
    e = 0
    f = 0
    m11 = 1
    m12 = 0
    m13 = 0
    m14 = 0
    m21 = 0
    m22 = 1
    m23 = 0
    m24 = 0
    m31 = 0
    m32 = 0
    m33 = 1
    m34 = 0
    m41 = 0
    m42 = 0
    m43 = 0
    m44 = 1
    is2D = true
    isIdentity = true

    constructor(init?: string | number[]) {
      if (Array.isArray(init) && init.length === 6) {
        ;[this.a, this.b, this.c, this.d, this.e, this.f] = init
        this.m11 = this.a
        this.m12 = this.b
        this.m21 = this.c
        this.m22 = this.d
        this.m41 = this.e
        this.m42 = this.f
        this.isIdentity = false
      }
    }

    transformPoint(p: { x?: number; y?: number } = {}) {
      const x = p.x ?? 0,
        y = p.y ?? 0
      return {
        x: this.a * x + this.c * y + this.e,
        y: this.b * x + this.d * y + this.f,
        z: 0,
        w: 1,
      }
    }

    multiply() {
      return new DOMMatrixPolyfill()
    }
    inverse() {
      return new DOMMatrixPolyfill()
    }
    translate() {
      return new DOMMatrixPolyfill()
    }
    scale() {
      return new DOMMatrixPolyfill()
    }
    static fromMatrix() {
      return new DOMMatrixPolyfill()
    }
    static fromFloat64Array() {
      return new DOMMatrixPolyfill()
    }
    static fromFloat32Array() {
      return new DOMMatrixPolyfill()
    }
  }
  globalThis.DOMMatrix = DOMMatrixPolyfill as any
}

export interface PilotAssignment {
  pilotName: string
  pilotLastName: string
  pilotFirstName: string
  rank: 'CAPTAIN' | 'FIRST_OFFICER'
  assignments: Array<{
    dayNumber: number
    date: string
    activityCode: string
  }>
}

export interface ParsedRosterData {
  captains: PilotAssignment[]
  firstOfficers: PilotAssignment[]
  periodCode: string
  rosterTitle: string
  dates: {
    start: string
    end: string
  }
  captainCount: number
  foCount: number
}

/**
 * Parses a B767 roster PDF and extracts structured roster data
 */
export async function parseRosterPdf(pdfBuffer: Buffer): Promise<ParsedRosterData> {
  try {
    // Use legacy build for broadest Node.js compatibility
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    // pdfjs-dist v5+ requires Uint8Array, not Buffer
    const data = new Uint8Array(pdfBuffer)
    const pdf = await pdfjsLib.getDocument({ data }).promise

    let captains: PilotAssignment[] = []
    let firstOfficers: PilotAssignment[] = []
    let periodCode = ''
    let rosterTitle = ''
    const dateRange = { start: '', end: '' }

    // Process all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const items = textContent.items as any[]

      // On first page, extract title and dates
      if (pageNum === 1) {
        const titleMatch = extractTitle(items)
        if (titleMatch) {
          rosterTitle = titleMatch
          // Try "RP05/2026" format first
          const rpMatch = titleMatch.match(/RP(\d{1,2})\/(\d{4})/)
          if (rpMatch) {
            periodCode = rpMatch[0]
          } else {
            // Try "ROSTER PERIOD 05 ... 2026" format
            const longMatch = titleMatch.match(/ROSTER\s+PERIOD\s+(\d{1,2})\b.*?(\d{4})/i)
            if (longMatch) {
              periodCode = `RP${longMatch[1].padStart(2, '0')}/${longMatch[2]}`
            }
          }
        }

        // Extract year from period code for date parsing
        const yearMatch = periodCode.match(/\/(\d{4})$/)
        const rosterYear = yearMatch ? parseInt(yearMatch[1]) : undefined
        const dates = extractDateHeaders(items, rosterYear)
        if (dates.length > 0) {
          dateRange.start = dates[0]
          dateRange.end = dates[dates.length - 1]
        }
      }

      // Extract pilot rows using position-based grouping
      const sections = extractPilotSectionsByPosition(items)

      if (sections.captains.length > 0) {
        captains = captains.concat(
          sections.captains.map((pilotData) =>
            buildPilotAssignment(pilotData, 'CAPTAIN', dateRange)
          )
        )
      }

      if (sections.firstOfficers.length > 0) {
        firstOfficers = firstOfficers.concat(
          sections.firstOfficers.map((pilotData) =>
            buildPilotAssignment(pilotData, 'FIRST_OFFICER', dateRange)
          )
        )
      }
    }

    if (!periodCode) {
      throw new Error('Could not extract roster period code from PDF')
    }

    if (captains.length === 0 && firstOfficers.length === 0) {
      throw new Error('No pilot assignments found in roster PDF')
    }

    return {
      captains,
      firstOfficers,
      periodCode,
      rosterTitle,
      dates: dateRange,
      captainCount: captains.length,
      foCount: firstOfficers.length,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown PDF parsing error'
    throw new Error(`Failed to parse roster PDF: ${errorMessage}`)
  }
}

/**
 * Extracts the roster title/header from PDF text items
 */
function extractTitle(items: any[]): string | null {
  for (const item of items) {
    const text = item.str.toUpperCase()
    // Match "ROSTER PERIOD XX" line (primary format in newer PDFs)
    if (text.includes('ROSTER PERIOD') && text.match(/\d{4}/)) {
      return item.str
    }
    // Legacy format: "B767" combined with "ROSTER" or "ANALYTIC" in same item
    if (text.includes('B767') && (text.includes('ROSTER') || text.includes('ANALYTIC'))) {
      return item.str
    }
  }
  return null
}

/**
 * Extracts date headers from the roster grid
 * Returns dates in YYYY-MM-DD format
 */
function extractDateHeaders(items: any[], rosterYear?: number): string[] {
  const dates: string[] = []
  // Match "28 MAR", "01 APR LT", "15 APR LT" etc.
  const datePattern = /^(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i

  const monthMap: { [key: string]: number } = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  }

  for (const item of items) {
    const match = item.str.trim().match(datePattern)
    if (match) {
      const day = parseInt(match[1])
      const monthStr = match[2].toLowerCase()
      const month = monthMap[monthStr]

      if (month) {
        const year = rosterYear || new Date().getFullYear()
        const date = new Date(year, month - 1, day)
        dates.push(date.toISOString().split('T')[0])
      }
    }
  }

  return [...new Set(dates)].sort()
}

/**
 * Extracts pilot sections using position-based row grouping.
 * Groups text items by Y-coordinate into rows, identifies section headers
 * (BOEING 767 CAPTAINS / FIRST OFFICERS), then parses pilot data rows.
 *
 * Each pilot row contains: [No, LastName, FirstName, ...28 activity codes, DO, RDO, SDO, SHORT BLK]
 */
function extractPilotSectionsByPosition(items: any[]): {
  captains: string[][]
  firstOfficers: string[][]
} {
  // Group items into rows by Y position (rounded to nearest 2px to handle slight offsets)
  const rowMap = new Map<number, { x: number; str: string }[]>()
  for (const item of items) {
    const y = Math.round(item.transform[5] / 2) * 2
    const x = Math.round(item.transform[4])
    const str = item.str.trim()
    if (!str) continue
    if (!rowMap.has(y)) rowMap.set(y, [])
    rowMap.get(y)!.push({ x, str })
  }

  // Sort rows top-to-bottom (descending Y in PDF coordinate system)
  const sortedYs = [...rowMap.keys()].sort((a, b) => b - a)

  const captains: string[][] = []
  const firstOfficers: string[][] = []
  let currentSection: 'CAPTAINS' | 'FIRST_OFFICERS' | null = null

  // Skip rows that are headers, day numbers, dates, or column labels
  const isHeaderRow = (cells: string[]) => {
    const joined = cells.join(' ').toUpperCase()
    return (
      (joined.includes('NO.') && joined.includes('LAST NAME')) ||
      (joined.includes('SAT') && joined.includes('MON') && joined.includes('FRI')) ||
      (joined.includes('MAR') && joined.includes('APR')) ||
      joined.includes('ROSTER PERIOD') ||
      joined.includes('UPDATE') ||
      joined.includes('TOTA') ||
      joined.includes('WEEK') ||
      joined.includes('ANALYSIS') ||
      joined.includes('RANK') ||
      joined.includes('SICK LEAVE') ||
      joined.includes('RESERVE') ||
      joined.includes('A/LEAVE') ||
      joined.includes('CPT/FO') ||
      // Row of only "LT" values (timezone indicator row)
      cells.every((c) => c === 'LT') ||
      (/^[\d\s|]+$/.test(cells.join('')) && cells.every((c) => /^\d{1,2}$/.test(c) || c === 'LT'))
    )
  }

  for (const y of sortedYs) {
    const row = rowMap.get(y)!.sort((a, b) => a.x - b.x)
    const cells = row.map((r) => r.str)
    const joined = cells.join(' ').toUpperCase()

    // Detect section headers
    if (joined.includes('CAPTAINS') && joined.includes('767')) {
      currentSection = 'CAPTAINS'
      continue
    }
    if (joined.includes('FIRST OFFICER') && joined.includes('767')) {
      currentSection = 'FIRST_OFFICERS'
      continue
    }

    if (!currentSection) continue
    if (isHeaderRow(cells)) continue

    // Pilot rows come in two formats:
    // 1. [seqNo, lastName, firstName, ...codes] - number + name on same row
    // 2. [lastName, firstName, ...codes] - name row without number (number on adjacent Y)
    // Summary/total rows are short (< 10 cells) and only contain numbers.
    if (cells.length < 10) continue

    let pilotCells: string[]
    const firstCell = cells[0]

    if (/^\d{1,2}$/.test(firstCell) && cells.length > 10 && /[A-Za-z]/.test(cells[1])) {
      // Format 1: starts with sequence number, then name
      pilotCells = cells.slice(1)
    } else if (/[A-Za-z]/.test(firstCell) && /[A-Za-z]/.test(cells[1] || '')) {
      // Format 2: starts directly with lastName, firstName
      pilotCells = cells
    } else {
      continue
    }

    const target = currentSection === 'CAPTAINS' ? captains : firstOfficers
    target.push(pilotCells)
  }

  return { captains, firstOfficers }
}

/**
 * Builds a PilotAssignment from raw pilot data
 */
function buildPilotAssignment(
  pilotData: string[],
  rank: 'CAPTAIN' | 'FIRST_OFFICER',
  dateRange: { start: string; end: string }
): PilotAssignment {
  // pilotData format: [lastName, firstName, code1, code2, ..., code28, DO, RDO, SDO, SHORT_BLK]
  const lastName = pilotData[0] || 'UNKNOWN'
  const firstName = pilotData[1] || ''
  const activityCodes = pilotData.slice(2, 30).map((code) => code || '')
  const dates = generateDateRange(dateRange.start, dateRange.end)

  const assignments = activityCodes.slice(0, 28).map((code, index) => ({
    dayNumber: index + 1,
    date: dates[index] || '',
    activityCode: code,
  }))

  return {
    pilotName: `${lastName}, ${firstName}`.trim().replace(/,\s*$/, ''),
    pilotLastName: lastName,
    pilotFirstName: firstName,
    rank,
    assignments,
  }
}

/**
 * Parses pilot name into last and first name
 */
function parsePilotName(fullName: string): [string, string] {
  const trimmed = fullName.trim()

  if (trimmed.includes(',')) {
    const [last, first] = trimmed.split(',').map((s) => s.trim())
    return [last, first]
  }

  const parts = trimmed.split(/\s+/)
  if (parts.length >= 2) {
    return [parts[0], parts.slice(1).join(' ')]
  }

  return [trimmed, '']
}

/**
 * Generates date range array (28 days)
 */
function generateDateRange(startStr: string, endStr: string): string[] {
  const dates: string[] = []
  const start = new Date(startStr)
  const end = new Date(endStr)

  for (let i = 0; i < 28; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    if (date <= end) {
      dates.push(date.toISOString().split('T')[0])
    } else {
      break
    }
  }

  while (dates.length < 28) {
    dates.push('')
  }

  return dates.slice(0, 28)
}
