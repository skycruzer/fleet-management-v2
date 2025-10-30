/**
 * Analytics Export API Route
 * Exports analytics data to PDF or CSV formats
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

/**
 * Export analytics data to CSV format
 */
async function exportToCSV(data: any) {
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss')

  // Pilot Distribution CSV
  const pilotCSV = [
    ['Fleet Analytics Report'],
    [`Generated: ${format(new Date(), 'PPpp')}`],
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
 */
async function exportToPDF(data: any) {
  // For now, return a simple text-based PDF placeholder
  // In production, you'd use a library like jsPDF or Puppeteer

  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss')

  const pdfContent = `
Fleet Analytics Report
Generated: ${format(new Date(), 'PPpp')}

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

    // Export based on format
    if (exportFormat === 'csv') {
      return await exportToCSV(data)
    } else if (exportFormat === 'pdf') {
      return await exportToPDF(data)
    } else {
      return NextResponse.json({ success: false, error: 'Invalid format' }, { status: 400 })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export analytics data' },
      { status: 500 }
    )
  }
}
