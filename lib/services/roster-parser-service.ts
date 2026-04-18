/**
 * Roster PDF Parser Service
 *
 * Parses B767 Analytic Roster Tool PDFs using pdfjs-dist for position-aware
 * text extraction. Extracts date headers, pilot names, ranks, and 28 activity codes.
 *
 * Developer: Maurice Rondeau
 */

import { getRosterPeriodFromDate } from '@/lib/utils/roster-utils'

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
 * Parses a B767 roster PDF and extracts structured roster data.
 *
 * The period code is derived from the PDF's **date grid** (via
 * getRosterPeriodFromDate), not from the title text. Titles are often
 * typo'd or reformatted by the airline; the 28-day date grid is the
 * canonical signal for which roster period the PDF represents.
 *
 * @param pdfBuffer PDF file bytes
 * @param hintPeriodCode Optional "RPNN/YYYY" — used only to disambiguate
 *   year when the grid straddles a year boundary (e.g., Dec → Jan).
 *   Never used to override what the grid actually says.
 */
export async function parseRosterPdf(
  pdfBuffer: Buffer,
  hintPeriodCode?: string
): Promise<ParsedRosterData> {
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
    let titleDerivedCode = ''
    const dateRange = { start: '', end: '' }

    const hintYear = hintPeriodCode?.match(/\/(\d{4})$/)?.[1]
    const yearHint = hintYear ? parseInt(hintYear, 10) : new Date().getFullYear()

    // Process all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const items = textContent.items as any[]

      // On first page, extract title (informational) and dates (authoritative)
      if (pageNum === 1) {
        const titleInfo = extractTitle(items)
        if (titleInfo) {
          rosterTitle = titleInfo.title
          titleDerivedCode = titleInfo.periodCode
        }

        const dates = extractDateHeaders(items, yearHint)
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

    // Authoritative: derive the period from the date grid
    if (dateRange.start) {
      const firstDate = new Date(`${dateRange.start}T00:00:00Z`)
      if (!Number.isNaN(firstDate.getTime())) {
        const derived = getRosterPeriodFromDate(firstDate)
        periodCode = derived.code
      }
    }

    // Fallback: title-based code if the date grid couldn't be parsed
    if (!periodCode && titleDerivedCode) {
      periodCode = titleDerivedCode
    }

    if (!periodCode) {
      throw new Error(
        'Could not determine roster period from PDF. Neither the date grid nor the title was readable.'
      )
    }

    // If the title disagrees with the grid, the grid wins. Log for visibility.
    if (titleDerivedCode && titleDerivedCode !== periodCode) {
      console.warn(
        `Roster PDF title says ${titleDerivedCode} but the date grid is for ${periodCode}. ` +
          `Trusting the date grid.`
      )
    }

    // Make sure downstream code always has a non-empty title for display
    if (!rosterTitle) {
      rosterTitle = `Roster ${periodCode}`
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
 * Extracts the roster title and any title-embedded period code.
 *
 * First tries individual items for a clean "title line" for display.
 * Then concatenates the whole page's text and sweeps it for any known
 * period-code pattern — handles cases where the title is split across
 * multiple PDF text items, or uses an unusual layout.
 *
 * Returns null only when neither a title line nor a period code can be
 * found. The caller should still attempt date-grid extraction as the
 * authoritative source.
 */
function extractTitle(
  items: any[]
): { title: string; periodCode: string } | null {
  let title = ''

  for (const item of items) {
    const text = item.str.toUpperCase()
    if (text.includes('ROSTER PERIOD') && text.match(/\d{4}/)) {
      title = item.str
      break
    }
    if (text.includes('B767') && (text.includes('ROSTER') || text.includes('ANALYTIC'))) {
      title = item.str
      break
    }
  }

  // Build a single normalized blob of the first-page text for fallback matching
  const joined = items
    .map((i: any) => (typeof i?.str === 'string' ? i.str : ''))
    .join(' ')
    .replace(/\s+/g, ' ')

  const periodCode = findPeriodCodeInText(joined)

  if (!title && !periodCode) {
    return null
  }

  return { title: title || periodCode, periodCode }
}

/**
 * Scans arbitrary text for a roster period code in any of the known formats.
 * Returns the canonical "RPNN/YYYY" form, or '' if nothing matches.
 */
function findPeriodCodeInText(text: string): string {
  // Canonical form: "RP05/2026" or "RP5/2026"
  const slash = text.match(/RP\s*(\d{1,2})\s*\/\s*(\d{4})/i)
  if (slash) {
    return `RP${slash[1].padStart(2, '0')}/${slash[2]}`
  }

  // "RP05 ART 2026" / "RP05 2026" — code followed by a 4-digit year
  const spaced = text.match(/\bRP\s*(\d{1,2})\b[^\d]{0,40}(\d{4})\b/i)
  if (spaced) {
    return `RP${spaced[1].padStart(2, '0')}/${spaced[2]}`
  }

  // "ROSTER PERIOD 05 ... 2026"
  const long = text.match(/ROSTER\s+PERIOD\s+(\d{1,2})\b[^\d]{0,80}(\d{4})\b/i)
  if (long) {
    return `RP${long[1].padStart(2, '0')}/${long[2]}`
  }

  return ''
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
