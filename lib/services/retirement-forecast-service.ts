/**
 * Retirement Forecast Service
 * Calculate pilot retirement forecasts for dashboard analytics
 *
 * @version 1.0.0
 * @since 2025-10-25
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type Pilot = Database['public']['Tables']['pilots']['Row']

export interface RetirementForecast {
  twoYears: {
    count: number
    pilots: Array<{
      id: string
      name: string
      rank: string
      retirementDate: Date
      monthsUntilRetirement: number
    }>
  }
  fiveYears: {
    count: number
    pilots: Array<{
      id: string
      name: string
      rank: string
      retirementDate: Date
      monthsUntilRetirement: number
    }>
  }
}

/**
 * Calculate retirement forecast for pilots
 * Shows how many pilots will retire in 2 years and 5 years
 *
 * @param retirementAge - Retirement age from system settings
 * @returns Retirement forecast data
 */
export async function getRetirementForecast(
  retirementAge: number = 65
): Promise<RetirementForecast> {
  const supabase = await createClient()

  // Fetch all active pilots with date of birth
  const { data: pilots, error } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, role, date_of_birth')
    .eq('is_active', true)
    .not('date_of_birth', 'is', null)

  if (error) {
    console.error('Error fetching pilots for retirement forecast:', error)
    throw new Error('Failed to fetch pilot data for retirement forecast')
  }

  if (!pilots || pilots.length === 0) {
    return {
      twoYears: { count: 0, pilots: [] },
      fiveYears: { count: 0, pilots: [] },
    }
  }

  const today = new Date()
  const twoYearsFromNow = new Date(today)
  twoYearsFromNow.setFullYear(today.getFullYear() + 2)
  const fiveYearsFromNow = new Date(today)
  fiveYearsFromNow.setFullYear(today.getFullYear() + 5)

  const twoYearPilots: RetirementForecast['twoYears']['pilots'] = []
  const fiveYearPilots: RetirementForecast['fiveYears']['pilots'] = []

  pilots.forEach((pilot) => {
    if (!pilot.date_of_birth) return

    const birthDate = new Date(pilot.date_of_birth)
    const retirementDate = new Date(birthDate)
    retirementDate.setFullYear(birthDate.getFullYear() + retirementAge)

    // Already retired
    if (retirementDate <= today) return

    const monthsUntilRetirement = Math.floor(
      (retirementDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    )

    const pilotData = {
      id: pilot.id,
      name: `${pilot.first_name} ${pilot.last_name}`,
      rank: pilot.role || 'Unknown',
      retirementDate,
      monthsUntilRetirement,
    }

    // Retiring within 2 years
    if (retirementDate <= twoYearsFromNow) {
      twoYearPilots.push(pilotData)
    }

    // Retiring within 5 years
    if (retirementDate <= fiveYearsFromNow) {
      fiveYearPilots.push(pilotData)
    }
  })

  // Sort by retirement date (earliest first)
  const sortByRetirementDate = (
    a: RetirementForecast['twoYears']['pilots'][0],
    b: RetirementForecast['twoYears']['pilots'][0]
  ) => a.retirementDate.getTime() - b.retirementDate.getTime()

  twoYearPilots.sort(sortByRetirementDate)
  fiveYearPilots.sort(sortByRetirementDate)

  return {
    twoYears: {
      count: twoYearPilots.length,
      pilots: twoYearPilots,
    },
    fiveYears: {
      count: fiveYearPilots.length,
      pilots: fiveYearPilots,
    },
  }
}

/**
 * Get retirement forecast by rank breakdown
 * Shows Captain vs First Officer retirement forecasts
 *
 * @param retirementAge - Retirement age from system settings
 * @returns Retirement forecast grouped by rank
 */
export async function getRetirementForecastByRank(retirementAge: number = 65): Promise<{
  twoYears: {
    captains: number
    firstOfficers: number
    total: number
    captainsList: Array<{ id: string; name: string; retirementDate: Date; monthsUntilRetirement: number }>
    firstOfficersList: Array<{ id: string; name: string; retirementDate: Date; monthsUntilRetirement: number }>
  }
  fiveYears: {
    captains: number
    firstOfficers: number
    total: number
    captainsList: Array<{ id: string; name: string; retirementDate: Date; monthsUntilRetirement: number }>
    firstOfficersList: Array<{ id: string; name: string; retirementDate: Date; monthsUntilRetirement: number }>
  }
}> {
  const forecast = await getRetirementForecast(retirementAge)

  const twoYearCaptains = forecast.twoYears.pilots.filter((p) => p.rank === 'Captain')
  const twoYearFOs = forecast.twoYears.pilots.filter((p) => p.rank === 'First Officer')

  const fiveYearCaptains = forecast.fiveYears.pilots.filter((p) => p.rank === 'Captain')
  const fiveYearFOs = forecast.fiveYears.pilots.filter((p) => p.rank === 'First Officer')

  return {
    twoYears: {
      captains: twoYearCaptains.length,
      firstOfficers: twoYearFOs.length,
      total: forecast.twoYears.count,
      captainsList: twoYearCaptains.map((p) => ({
        id: p.id,
        name: p.name,
        retirementDate: p.retirementDate,
        monthsUntilRetirement: p.monthsUntilRetirement,
      })),
      firstOfficersList: twoYearFOs.map((p) => ({
        id: p.id,
        name: p.name,
        retirementDate: p.retirementDate,
        monthsUntilRetirement: p.monthsUntilRetirement,
      })),
    },
    fiveYears: {
      captains: fiveYearCaptains.length,
      firstOfficers: fiveYearFOs.length,
      total: forecast.fiveYears.count,
      captainsList: fiveYearCaptains.map((p) => ({
        id: p.id,
        name: p.name,
        retirementDate: p.retirementDate,
        monthsUntilRetirement: p.monthsUntilRetirement,
      })),
      firstOfficersList: fiveYearFOs.map((p) => ({
        id: p.id,
        name: p.name,
        retirementDate: p.retirementDate,
        monthsUntilRetirement: p.monthsUntilRetirement,
      })),
    },
  }
}

/**
 * Get monthly retirement timeline for visualization
 * Returns month-by-month breakdown of retirements for next 5 years
 *
 * @param retirementAge - Retirement age from system settings
 * @returns Monthly timeline data for charts
 */
export async function getMonthlyRetirementTimeline(retirementAge: number = 65): Promise<{
  timeline: Array<{
    month: string
    year: number
    captains: number
    firstOfficers: number
    total: number
    pilots: Array<{
      id: string
      name: string
      rank: string
      retirementDate: Date
    }>
  }>
  summary: {
    totalRetirements: number
    peakMonth: string
    peakCount: number
  }
}> {
  const supabase = await createClient()

  // Fetch all active pilots with date of birth
  const { data: pilots, error } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, role, date_of_birth')
    .eq('is_active', true)
    .not('date_of_birth', 'is', null)

  if (error) {
    console.error('Error fetching pilots for retirement timeline:', error)
    throw new Error('Failed to fetch pilot data for retirement timeline')
  }

  if (!pilots || pilots.length === 0) {
    return {
      timeline: [],
      summary: {
        totalRetirements: 0,
        peakMonth: 'N/A',
        peakCount: 0,
      },
    }
  }

  const today = new Date()
  const fiveYearsFromNow = new Date(today)
  fiveYearsFromNow.setFullYear(today.getFullYear() + 5)

  // Create month buckets for next 5 years
  const monthlyBuckets = new Map<string, {
    month: string
    year: number
    captains: number
    firstOfficers: number
    total: number
    pilots: Array<{
      id: string
      name: string
      rank: string
      retirementDate: Date
    }>
  }>()

  // Initialize buckets for all months in next 5 years
  const current = new Date(today)
  while (current <= fiveYearsFromNow) {
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
    monthlyBuckets.set(key, {
      month: key,
      year: current.getFullYear(),
      captains: 0,
      firstOfficers: 0,
      total: 0,
      pilots: [],
    })
    current.setMonth(current.getMonth() + 1)
  }

  // Distribute pilots into monthly buckets
  pilots.forEach((pilot) => {
    if (!pilot.date_of_birth) return

    const birthDate = new Date(pilot.date_of_birth)
    const retirementDate = new Date(birthDate)
    retirementDate.setFullYear(birthDate.getFullYear() + retirementAge)

    // Skip if already retired or beyond 5 years
    if (retirementDate <= today || retirementDate > fiveYearsFromNow) return

    const monthKey = `${retirementDate.getFullYear()}-${String(retirementDate.getMonth() + 1).padStart(2, '0')}`
    const bucket = monthlyBuckets.get(monthKey)

    if (bucket) {
      bucket.total++
      bucket.pilots.push({
        id: pilot.id,
        name: `${pilot.first_name} ${pilot.last_name}`,
        rank: pilot.role || 'Unknown',
        retirementDate,
      })

      if (pilot.role === 'Captain') {
        bucket.captains++
      } else if (pilot.role === 'First Officer') {
        bucket.firstOfficers++
      }
    }
  })

  // Convert to array and sort by date
  const timeline = Array.from(monthlyBuckets.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  )

  // Find peak month
  let peakMonth = 'N/A'
  let peakCount = 0
  timeline.forEach((bucket) => {
    if (bucket.total > peakCount) {
      peakCount = bucket.total
      peakMonth = bucket.month
    }
  })

  const totalRetirements = timeline.reduce((sum, bucket) => sum + bucket.total, 0)

  return {
    timeline,
    summary: {
      totalRetirements,
      peakMonth,
      peakCount,
    },
  }
}

/**
 * Get crew impact analysis
 * Analyzes periods where retirements may cause crew shortages
 *
 * @param retirementAge - Retirement age from system settings
 * @param requiredCaptains - Minimum required Captains (default 10)
 * @param requiredFirstOfficers - Minimum required First Officers (default 10)
 * @returns Crew impact data with warnings
 */
export async function getCrewImpactAnalysis(
  retirementAge: number = 65,
  requiredCaptains: number = 10,
  requiredFirstOfficers: number = 10
): Promise<{
  monthly: Array<{
    month: string
    availableCaptains: number
    availableFirstOfficers: number
    requiredCaptains: number
    requiredFirstOfficers: number
    captainShortage: number
    firstOfficerShortage: number
    captainUtilization: number // Percentage
    firstOfficerUtilization: number // Percentage
    warningLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
  }>
  warnings: Array<{
    month: string
    rank: string
    severity: 'warning' | 'critical'
    message: string
    shortage: number
  }>
  summary: {
    totalWarnings: number
    criticalMonths: number
    averageCaptainUtilization: number
    averageFirstOfficerUtilization: number
  }
}> {
  const supabase = await createClient()

  // Get current pilot counts
  const { data: currentPilots, error: currentError } = await supabase
    .from('pilots')
    .select('role')
    .eq('is_active', true)

  if (currentError) {
    throw new Error('Failed to fetch current pilot counts')
  }

  const currentCaptains = currentPilots?.filter((p) => p.role === 'Captain').length || 0
  const currentFirstOfficers = currentPilots?.filter((p) => p.role === 'First Officer').length || 0

  // Get monthly retirement timeline
  const { timeline } = await getMonthlyRetirementTimeline(retirementAge)

  const monthly: Array<{
    month: string
    availableCaptains: number
    availableFirstOfficers: number
    requiredCaptains: number
    requiredFirstOfficers: number
    captainShortage: number
    firstOfficerShortage: number
    captainUtilization: number
    firstOfficerUtilization: number
    warningLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
  }> = []

  const warnings: Array<{
    month: string
    rank: string
    severity: 'warning' | 'critical'
    message: string
    shortage: number
  }> = []

  let runningCaptains = currentCaptains
  let runningFirstOfficers = currentFirstOfficers

  timeline.forEach((bucket) => {
    // Subtract retirements from running totals
    runningCaptains -= bucket.captains
    runningFirstOfficers -= bucket.firstOfficers

    const captainShortage = Math.max(0, requiredCaptains - runningCaptains)
    const firstOfficerShortage = Math.max(0, requiredFirstOfficers - runningFirstOfficers)

    const captainUtilization = (requiredCaptains / runningCaptains) * 100
    const firstOfficerUtilization = (requiredFirstOfficers / runningFirstOfficers) * 100

    // Determine warning level based on utilization
    let warningLevel: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none'
    const maxUtilization = Math.max(captainUtilization, firstOfficerUtilization)

    if (maxUtilization >= 100) {
      warningLevel = 'critical'
    } else if (maxUtilization >= 85) {
      warningLevel = 'high'
    } else if (maxUtilization >= 75) {
      warningLevel = 'medium'
    } else if (maxUtilization >= 65) {
      warningLevel = 'low'
    }

    monthly.push({
      month: bucket.month,
      availableCaptains: runningCaptains,
      availableFirstOfficers: runningFirstOfficers,
      requiredCaptains,
      requiredFirstOfficers,
      captainShortage,
      firstOfficerShortage,
      captainUtilization: Math.round(captainUtilization),
      firstOfficerUtilization: Math.round(firstOfficerUtilization),
      warningLevel,
    })

    // Add warnings for shortages
    if (captainShortage > 0) {
      warnings.push({
        month: bucket.month,
        rank: 'Captain',
        severity: 'critical',
        message: `Only ${runningCaptains} Captains available (${requiredCaptains} required). Shortage: ${captainShortage} Captains.`,
        shortage: captainShortage,
      })
    }

    if (firstOfficerShortage > 0) {
      warnings.push({
        month: bucket.month,
        rank: 'First Officer',
        severity: 'critical',
        message: `Only ${runningFirstOfficers} First Officers available (${requiredFirstOfficers} required). Shortage: ${firstOfficerShortage} First Officers.`,
        shortage: firstOfficerShortage,
      })
    }

    // Add warnings for high utilization (no shortage yet, but concerning)
    if (captainUtilization >= 85 && captainShortage === 0) {
      warnings.push({
        month: bucket.month,
        rank: 'Captain',
        severity: 'warning',
        message: `Captain capacity at ${Math.round(captainUtilization)}% utilization (${runningCaptains}/${requiredCaptains} available). Consider recruitment.`,
        shortage: 0,
      })
    }

    if (firstOfficerUtilization >= 85 && firstOfficerShortage === 0) {
      warnings.push({
        month: bucket.month,
        rank: 'First Officer',
        severity: 'warning',
        message: `First Officer capacity at ${Math.round(firstOfficerUtilization)}% utilization (${runningFirstOfficers}/${requiredFirstOfficers} available). Consider recruitment.`,
        shortage: 0,
      })
    }
  })

  const criticalMonths = monthly.filter((m) => m.warningLevel === 'critical').length
  const avgCaptainUtil = Math.round(
    monthly.reduce((sum, m) => sum + m.captainUtilization, 0) / monthly.length
  )
  const avgFirstOfficerUtil = Math.round(
    monthly.reduce((sum, m) => sum + m.firstOfficerUtilization, 0) / monthly.length
  )

  return {
    monthly,
    warnings,
    summary: {
      totalWarnings: warnings.length,
      criticalMonths,
      averageCaptainUtilization: avgCaptainUtil,
      averageFirstOfficerUtilization: avgFirstOfficerUtil,
    },
  }
}

/**
 * Generate retirement forecast PDF report
 * Uses Puppeteer to render HTML template as PDF
 *
 * @param retirementAge - Retirement age from system settings
 * @returns PDF buffer
 */
export async function generateRetirementForecastPDF(
  retirementAge: number = 65
): Promise<Buffer> {
  const puppeteer = await import('puppeteer')

  const { timeline, summary } = await getMonthlyRetirementTimeline(retirementAge)
  const { warnings, summary: impactSummary } = await getCrewImpactAnalysis(retirementAge)

  // Generate HTML template
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Retirement Forecast Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      color: #2563eb;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
    }
    h2 {
      color: #1e40af;
      margin-top: 30px;
      border-bottom: 2px solid #ddd;
      padding-bottom: 5px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .summary {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .summary-item {
      margin: 10px 0;
      font-size: 16px;
    }
    .warning {
      background: #fef2f2;
      border-left: 4px solid #dc2626;
      padding: 15px;
      margin: 15px 0;
    }
    .warning.critical {
      background: #fef2f2;
      border-left: 4px solid #dc2626;
    }
    .warning.info {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #2563eb;
      color: white;
      padding: 12px;
      text-align: left;
    }
    td {
      border: 1px solid #ddd;
      padding: 10px;
    }
    tr:nth-child(even) {
      background: #f9fafb;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>FLEET MANAGEMENT V2</h1>
    <h2>Retirement Forecast Report</h2>
    <p>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div class="summary">
    <h2>EXECUTIVE SUMMARY</h2>
    <div class="summary-item">• <strong>Total Retirements (5 years):</strong> ${summary.totalRetirements} pilots</div>
    <div class="summary-item">• <strong>Peak Retirement Month:</strong> ${summary.peakMonth} (${summary.peakCount} pilots)</div>
    <div class="summary-item">• <strong>Critical Months:</strong> ${impactSummary.criticalMonths} months with crew shortages</div>
    <div class="summary-item">• <strong>Total Warnings:</strong> ${impactSummary.totalWarnings}</div>
  </div>

  <h2>CREW IMPACT WARNINGS</h2>
  ${warnings.length === 0 ? '<p>No crew shortages detected for the forecast period.</p>' : ''}
  ${warnings.map((w) => `
    <div class="warning ${w.severity === 'critical' ? 'critical' : 'info'}">
      <strong>${w.severity === 'critical' ? '🔴 CRITICAL' : '🟡 WARNING'}: ${w.month}</strong><br>
      ${w.message}
    </div>
  `).join('')}

  <h2>RETIREMENT SCHEDULE</h2>
  <table>
    <thead>
      <tr>
        <th>Month</th>
        <th>Captains</th>
        <th>First Officers</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${timeline.filter((m) => m.total > 0).map((m) => `
        <tr>
          <td>${m.month}</td>
          <td>${m.captains}</td>
          <td>${m.firstOfficers}</td>
          <td><strong>${m.total}</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>This report was automatically generated by the Fleet Management V2 system.</p>
    <p>For questions or clarifications, please contact the Fleet Office.</p>
  </div>
</body>
</html>
  `

  // Launch Puppeteer and generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
      printBackground: true,
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}

/**
 * Generate retirement forecast CSV export
 * Uses PapaParse for proper CSV formatting
 *
 * @param retirementAge - Retirement age from system settings
 * @returns CSV string
 */
export async function generateRetirementForecastCSV(
  retirementAge: number = 65
): Promise<string> {
  const Papa = await import('papaparse')

  const { timeline } = await getMonthlyRetirementTimeline(retirementAge)

  // Flatten pilot data for CSV export
  const rows: Array<{
    'Month': string
    'Pilot ID': string
    'Employee ID': string
    'Name': string
    'Rank': string
    'Retirement Date': string
    'Days Until Retirement': number
  }> = []

  timeline.forEach((bucket) => {
    bucket.pilots.forEach((pilot) => {
      const today = new Date()
      const daysUntil = Math.floor(
        (pilot.retirementDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      rows.push({
        'Month': bucket.month,
        'Pilot ID': pilot.id,
        'Employee ID': 'N/A', // Could be fetched if needed
        'Name': pilot.name,
        'Rank': pilot.rank,
        'Retirement Date': pilot.retirementDate.toISOString().split('T')[0],
        'Days Until Retirement': daysUntil,
      })
    })
  })

  // Sort by retirement date
  rows.sort((a, b) => a['Days Until Retirement'] - b['Days Until Retirement'])

  // Convert to CSV using PapaParse
  const csv = Papa.unparse(rows, {
    header: true,
    quotes: true, // Quote all fields
  })

  return csv
}
