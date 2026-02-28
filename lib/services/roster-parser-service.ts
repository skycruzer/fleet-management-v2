/**
 * Roster PDF Parser Service
 *
 * Parses B767 Analytic Roster Tool PDFs using pdfjs-dist for position-aware
 * text extraction. Extracts date headers, pilot names, ranks, and 28 activity codes.
 *
 * Developer: Maurice Rondeau
 */

import * as pdfjsLib from 'pdfjs-dist'

// Configure worker for server-side parsing
if (typeof window === 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
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
    const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise

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
          const periodMatch = titleMatch.match(/RP\d{2}\/\d{4}/)
          if (periodMatch) periodCode = periodMatch[0]
        }

        const dates = extractDateHeaders(items)
        if (dates.length > 0) {
          dateRange.start = dates[0]
          dateRange.end = dates[dates.length - 1]
        }
      }

      // Extract pilot sections
      const sections = extractPilotSections(items)

      if (sections.captains && sections.captains.length > 0) {
        captains = sections.captains.map((pilotData) =>
          buildPilotAssignment(pilotData, 'CAPTAIN', dateRange)
        )
      }

      if (sections.firstOfficers && sections.firstOfficers.length > 0) {
        firstOfficers = sections.firstOfficers.map((pilotData) =>
          buildPilotAssignment(pilotData, 'FIRST_OFFICER', dateRange)
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
function extractDateHeaders(items: any[]): string[] {
  const dates: string[] = []
  const datePattern = /^(\d{1,2})\s+([A-Za-z]+)$/

  for (const item of items) {
    const match = item.str.match(datePattern)
    if (match) {
      const day = parseInt(match[1])
      const monthStr = match[2].toLowerCase()
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

      const month = monthMap[monthStr]
      if (month) {
        const year = new Date().getFullYear()
        const date = new Date(year, month - 1, day)
        dates.push(date.toISOString().split('T')[0])
      }
    }
  }

  return [...new Set(dates)].sort()
}

/**
 * Extracts pilot sections (CAPTAINS and FIRST OFFICERS) from PDF items
 */
function extractPilotSections(items: any[]): {
  captains: string[][]
  firstOfficers: string[][]
} {
  const captains: string[][] = []
  const firstOfficers: string[][] = []
  let currentSection: 'CAPTAINS' | 'FIRST_OFFICERS' | null = null
  let currentPilot: string[] = []

  for (const item of items) {
    const text = item.str.trim()

    if (text.toUpperCase().includes('CAPTAINS')) {
      currentSection = 'CAPTAINS'
      continue
    }
    if (text.toUpperCase().includes('FIRST OFFICER')) {
      currentSection = 'FIRST_OFFICERS'
      continue
    }

    if (!text || text.match(/^[A-Z\s]+$/) || text.includes('Day') || text.includes('Date')) {
      continue
    }

    if (currentSection) {
      currentPilot.push(text)

      if (currentPilot.length > 25 && (text.match(/^[A-Z]/) || text.match(/^\d+$/))) {
        if (currentSection === 'CAPTAINS') {
          captains.push([...currentPilot])
        } else {
          firstOfficers.push([...currentPilot])
        }
        currentPilot = []
      }
    }
  }

  if (currentPilot.length > 0) {
    if (currentSection === 'CAPTAINS') {
      captains.push(currentPilot)
    } else {
      firstOfficers.push(currentPilot)
    }
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
  const fullName = pilotData[0] || 'UNKNOWN'
  const [lastName, firstName] = parsePilotName(fullName)
  const activityCodes = pilotData.slice(1, 29).map((code) => code || '')
  const dates = generateDateRange(dateRange.start, dateRange.end)

  const assignments = activityCodes.slice(0, 28).map((code, index) => ({
    dayNumber: index + 1,
    date: dates[index] || '',
    activityCode: code,
  }))

  return {
    pilotName: fullName,
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
