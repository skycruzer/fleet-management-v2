/**
 * Analytics Export API Route
 * Exports analytics data to PDF or CSV formats
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exportAnalyticsData } from '@/lib/services/export-service'
import type { AnalyticsExportData, ExportFormat } from '@/lib/services/export-service'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

export const dynamic = 'force-dynamic'

// Legacy functions kept for reference but not used (using export-service instead)
/**
 * Export analytics data to CSV format
 * @deprecated Use export-service.ts instead
 */
async function exportToCSV(data: any) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  // Pilot Distribution CSV
  const pilotCSV = [
    ['Fleet Analytics Report'],
    [`Generated: ${new Date().toLocaleString()}`],
    [''],
    ['PILOT DISTRIBUTION'],
    ['Metric', 'Count'],
    ['Total Pilots', data.pilot.total],
    ['Active Pilots', data.pilot.active],
    ['Inactive Pilots', data.pilot.inactive],
    ['Captains', data.pilot.captains],
    ['First Officers', data.pilot.firstOfficers],
    ['Retiring in 2 Years', data.pilot.retirementPlanning.retiringIn2Years],
    ['Retiring in 5 Years', data.pilot.retirementPlanning.retiringIn5Years],
    [''],
    ['CERTIFICATION STATUS'],
    ['Status', 'Count'],
    ['Total Certifications', data.certification.total],
    ['Current', data.certification.current],
    ['Expiring (≤30 days)', data.certification.expiring],
    ['Expired', data.certification.expired],
    ['Compliance Rate (%)', data.certification.complianceRate],
    [''],
    ['LEAVE REQUESTS'],
    ['Status', 'Count'],
    ['Total Requests', data.leave.total],
    ['Pending', data.leave.pending],
    ['Approved', data.leave.approved],
    ['Denied', data.leave.denied],
    [''],
    ['FLEET METRICS'],
    ['Metric', 'Value (%)'],
    ['Fleet Utilization', data.fleet.utilization],
    ['Pilot Availability', data.fleet.availability],
    ['Fleet Readiness', data.fleet.readiness],
    [''],
    ['RISK ASSESSMENT'],
    ['Overall Risk Score', data.risk.overallRiskScore],
  ]

  // Convert to CSV string
  const csvContent = pilotCSV.map(row => row.join(',')).join('\n')

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="fleet-analytics-${timestamp}.csv"`,
    },
  })
}

/**
 * Export analytics data to PDF format
 * @deprecated Use export-service.ts instead
 */
async function exportToPDF(data: any) {
  // For now, return a simple text-based PDF placeholder
  // In production, you'd use a library like jsPDF or Puppeteer

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  const pdfContent = `
Fleet Analytics Report
Generated: ${new Date().toLocaleString()}

PILOT DISTRIBUTION
Total Pilots: ${data.pilot.total}
Active Pilots: ${data.pilot.active}
Captains: ${data.pilot.captains}
First Officers: ${data.pilot.firstOfficers}

CERTIFICATION STATUS
Total: ${data.certification.total}
Current: ${data.certification.current}
Expiring: ${data.certification.expiring}
Expired: ${data.certification.expired}
Compliance Rate: ${data.certification.complianceRate}%

FLEET METRICS
Fleet Utilization: ${data.fleet.utilization}%
Pilot Availability: ${data.fleet.availability}%
Fleet Readiness: ${data.fleet.readiness}%

RISK ASSESSMENT
Overall Risk Score: ${data.risk.overallRiskScore}/100
  `.trim()

  return new NextResponse(pdfContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="fleet-analytics-${timestamp}.txt"`,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { format: exportFormat = 'csv', data } = body

    if (!data) {
      return NextResponse.json({ success: false, error: 'No data provided' }, { status: 400 })
    }

    // Validate data structure
    const analyticsData: AnalyticsExportData = data

    // Use service layer to generate export
    const exportResult = exportAnalyticsData(analyticsData, {
      format: exportFormat as ExportFormat,
      includeTimestamp: true,
      title: 'Fleet Analytics Report',
    })

    // Convert Buffer to Uint8Array for NextResponse compatibility
    let responseBody: BodyInit
    if (Buffer.isBuffer(exportResult.content)) {
      responseBody = new Uint8Array(exportResult.content)
    } else if (typeof exportResult.content === 'string') {
      responseBody = exportResult.content
    } else {
      // Handle other possible types
      responseBody = exportResult.content as BodyInit
    }

    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        'Content-Type': exportResult.mimeType,
        'Content-Disposition': `attachment; filename="${exportResult.filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'exportAnalytics',
      endpoint: '/api/analytics/export'
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
