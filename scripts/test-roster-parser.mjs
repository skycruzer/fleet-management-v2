// Test script for roster PDF parser — run with: node scripts/test-roster-parser.mjs
import { readFileSync } from 'fs'
import { resolve } from 'path'

// We need to use dynamic import for the TypeScript service
// So we'll replicate the core parsing logic here for testing

const PDFS = [
  {
    name: 'RP01/2026',
    path: '/Users/skycruzer/Library/CloudStorage/OneDrive-Personal/B767 Fleet Office/B767 Final Rosters/2026/SECOND DRAFT - B767 ANALYTIC ROSTER TOOL - RP01 ART 2026.pdf',
  },
  {
    name: 'RP02/2026',
    path: '/Users/skycruzer/Library/CloudStorage/OneDrive-Personal/B767 Fleet Office/B767 Final Rosters/2026/Published - B767 ANALYTIC ROSTER TOOL - RP02 ART 2026.pdf',
  },
  {
    name: 'RP03/2026',
    path: '/Users/skycruzer/Library/CloudStorage/OneDrive-Personal/B767 Fleet Office/B767 Final Rosters/2026/PUBLISHED - B767 ANALYTIC ROSTER TOOL - RP03 ART 2026.pdf',
  },
]

const MONTH_MAP = {
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

async function testParser() {
  // Polyfill DOMMatrix for Node.js (pdfjs-dist v5.x requires it at import time)
  if (typeof globalThis.DOMMatrix === 'undefined') {
    const { default: DOMMatrixPolyfill } = await import('@thednp/dommatrix')
    globalThis.DOMMatrix = DOMMatrixPolyfill
  }

  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

  for (const pdf of PDFS) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Testing: ${pdf.name}`)
    console.log('='.repeat(60))

    try {
      const buffer = readFileSync(pdf.path)
      const data = new Uint8Array(buffer)

      const doc = await pdfjsLib.getDocument({ data }).promise
      const page = await doc.getPage(1)
      const textContent = await page.getTextContent()

      const items = textContent.items
        .filter((item) => typeof item === 'object' && 'str' in item)
        .map((item) => ({
          str: item.str.trim(),
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          height: item.height,
        }))
        .filter((item) => item.str.length > 0)

      // Sort by y descending, then x ascending
      items.sort((a, b) => {
        const yDiff = b.y - a.y
        if (Math.abs(yDiff) > 2) return yDiff
        return a.x - b.x
      })

      // Group into rows
      const rows = []
      let currentRow = []
      let currentY = items[0]?.y ?? 0

      for (const item of items) {
        if (Math.abs(item.y - currentY) > 3) {
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

      // Find sections
      const captainRowIdx = rows.findIndex((row) =>
        row.some((item) => item.str.includes('BOEING 767 CAPTAINS'))
      )
      const foRowIdx = rows.findIndex((row) =>
        row.some((item) => item.str.includes('BOEING 767 FIRST OFFICERS'))
      )

      console.log(`Total rows: ${rows.length}`)
      console.log(`Captains section at row: ${captainRowIdx}`)
      console.log(`FO section at row: ${foRowIdx}`)

      // Find day number headers
      const captainDayHeaderIdx = findDayNumberHeader(rows, captainRowIdx, foRowIdx)
      const foDayHeaderIdx = findDayNumberHeader(rows, foRowIdx, rows.length)

      console.log(`Captain day header at row: ${captainDayHeaderIdx}`)
      console.log(`FO day header at row: ${foDayHeaderIdx}`)

      // Extract period info
      const periodInfo = extractPeriodInfo(rows, captainRowIdx)
      console.log(
        `\nPeriod: RP${String(periodInfo.periodNumber).padStart(2, '0')}/${periodInfo.year}`
      )
      console.log(`Dates: ${periodInfo.startDate} to ${periodInfo.endDate}`)
      console.log(`Title: ${periodInfo.title}`)

      // Get column positions
      const columns = extractDayColumns(rows[captainDayHeaderIdx])
      console.log(`\nDay columns found: ${columns.size}`)

      // Parse captains
      const captains = parsePilotRows(rows, captainDayHeaderIdx, foRowIdx, columns, 'CAPTAIN')
      console.log(`\nCAPTAINS: ${captains.length}`)
      for (const p of captains) {
        const filled = p.assignments.filter((a) => a.activityCode).length
        console.log(
          `  ${p.number}. ${p.lastName.padEnd(15)} ${p.firstName.padEnd(12)} ${filled}/28 days filled`
        )

        // Show first 7 days as a sample
        const sample = []
        for (let d = 1; d <= 7; d++) {
          const a = p.assignments.find((a) => a.dayNumber === d)
          sample.push(a ? a.activityCode.padEnd(8) : '---     ')
        }
        console.log(`     Days 1-7: ${sample.join(' ')}`)
      }

      // Parse FOs
      const foColumns = foDayHeaderIdx !== -1 ? extractDayColumns(rows[foDayHeaderIdx]) : columns
      const foEndIdx = findSectionEnd(rows, foDayHeaderIdx !== -1 ? foDayHeaderIdx : foRowIdx)
      const firstOfficers = parsePilotRows(
        rows,
        foDayHeaderIdx !== -1 ? foDayHeaderIdx : foRowIdx,
        foEndIdx,
        foColumns,
        'FIRST_OFFICER'
      )
      console.log(`\nFIRST OFFICERS: ${firstOfficers.length}`)
      for (const p of firstOfficers) {
        const filled = p.assignments.filter((a) => a.activityCode).length
        console.log(
          `  ${p.number}. ${p.lastName.padEnd(15)} ${p.firstName.padEnd(12)} ${filled}/28 days filled`
        )
      }

      doc.destroy()
      console.log(`\n[OK] ${pdf.name} parsed successfully`)
    } catch (err) {
      console.error(`[FAIL] ${pdf.name}: ${err.message}`)
      console.error(err.stack)
    }
  }
}

// ─── Helpers (copied from parser service) ───────────────────────

function findDayNumberHeader(rows, sectionStart, sectionEnd) {
  const searchStart = Math.max(0, sectionStart - 2)
  const searchEnd = Math.min(sectionEnd, sectionStart + 10)

  for (let i = searchStart; i < searchEnd; i++) {
    const numericItems = rows[i].filter((item) => {
      const num = parseInt(item.str, 10)
      return !isNaN(num) && num >= 1 && num <= 28
    })
    if (numericItems.length >= 20) return i
  }
  return -1
}

function extractDayColumns(headerRow) {
  const columns = new Map()
  for (const item of headerRow) {
    const num = parseInt(item.str, 10)
    if (!isNaN(num) && num >= 1 && num <= 28) {
      columns.set(num, item.x + item.width / 2)
    }
  }
  return columns
}

function extractPeriodInfo(rows, sectionStart) {
  for (let i = sectionStart; i < Math.min(sectionStart + 8, rows.length); i++) {
    const rowText = rows[i].map((item) => item.str).join(' ')
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
      const startYear = startMonth > endMonth ? year - 1 : year

      const startDate = new Date(Date.UTC(startYear, startMonth, startDay))
      const endDate = new Date(Date.UTC(year, endMonth, endDay))

      let updateDate = null
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
        year,
        title: `B767 ANALYTIC ROSTER TOOL - RP${String(periodNumber).padStart(2, '0')} ART ${year}`,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        updateDate,
      }
    }
  }
  throw new Error('Could not extract roster period info from PDF')
}

function parsePilotRows(rows, headerIdx, sectionEnd, columns, rank) {
  const pilots = []
  for (let i = headerIdx + 1; i < sectionEnd; i++) {
    const row = rows[i]
    if (row.length < 3) continue

    const firstItem = row[0]
    const pilotNumber = parseInt(firstItem.str, 10)
    if (isNaN(pilotNumber) || pilotNumber < 1 || pilotNumber > 50) continue

    const pilot = extractPilotFromRow(row, pilotNumber, columns, rank)
    if (pilot) pilots.push(pilot)
  }
  return pilots
}

function extractPilotFromRow(row, pilotNumber, columns, rank) {
  const minDayX = Math.min(...Array.from(columns.values()))

  const nameItems = row
    .filter((item) => {
      if (parseInt(item.str, 10) === pilotNumber && item.x < minDayX - 50) return false
      return item.x < minDayX - 20
    })
    .filter((item) => item.str !== 'LT' && parseInt(item.str, 10) !== pilotNumber)

  if (nameItems.length < 2) {
    const allNameish = row.filter(
      (item) => item.x < minDayX - 20 && isNaN(parseInt(item.str, 10)) && item.str !== 'LT'
    )
    if (allNameish.length < 2) return null
    nameItems.length = 0
    nameItems.push(...allNameish)
  }

  const lastName = nameItems[0]?.str || ''
  const firstName = nameItems[1]?.str || ''
  if (!lastName || !firstName) return null

  const activityItems = row.filter((item) => {
    if (item.x < minDayX - 30) return false
    if (parseInt(item.str, 10) === pilotNumber && item.x < minDayX) return false
    if (item.str === 'LT') return false
    return true
  })

  const assignments = []
  for (const item of activityItems) {
    const dayNumber = findNearestDay(item.x + item.width / 2, columns)
    if (dayNumber !== null) {
      const day28X = columns.get(28)
      if (day28X && item.x > day28X + 40) continue
      assignments.push({ dayNumber, activityCode: item.str })
    }
  }

  // Deduplicate
  const dayMap = new Map()
  for (const a of assignments) {
    const colX = columns.get(a.dayNumber)
    if (!colX) continue
    const item = activityItems.find((i) => i.str === a.activityCode)
    const distance = item ? Math.abs(item.x + item.width / 2 - colX) : Infinity
    const existing = dayMap.get(a.dayNumber)
    if (!existing || distance < existing.distance) {
      dayMap.set(a.dayNumber, { activityCode: a.activityCode, distance })
    }
  }

  const dedupedAssignments = Array.from(dayMap.entries())
    .map(([dayNumber, { activityCode }]) => ({ dayNumber, activityCode }))
    .sort((a, b) => a.dayNumber - b.dayNumber)

  return { number: pilotNumber, lastName, firstName, rank, assignments: dedupedAssignments }
}

function findNearestDay(x, columns) {
  let nearest = null
  let minDist = Infinity
  for (const [day, colX] of columns) {
    const dist = Math.abs(x - colX)
    if (dist < minDist) {
      minDist = dist
      nearest = day
    }
  }
  if (minDist > 30) return null
  return nearest
}

function findSectionEnd(rows, foHeaderIdx) {
  for (let i = foHeaderIdx + 1; i < rows.length; i++) {
    const rowText = rows[i].map((item) => item.str).join(' ')
    if (
      rowText.includes('WEEK') ||
      rowText.includes('ANALYSIS') ||
      rowText.includes('A/LEAVE') ||
      rowText.includes('TOTAL')
    )
      return i
  }
  return rows.length
}

testParser().catch(console.error)
