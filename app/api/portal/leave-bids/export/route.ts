/**
 * Leave Bid PDF Export API Route
 *
 * Generates PDF export of a specific leave bid for pilots.
 *
 * Developer: Maurice Rondeau
 * @architecture Service Layer Pattern
 * @auth Pilot Portal Authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLeaveBidById } from '@/lib/services/leave-bid-service'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET - Export Leave Bid as PDF
 *
 * Generates a PDF document for a specific leave bid.
 */
export async function GET(request: NextRequest) {
  try {
    // Get current authenticated pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return NextResponse.json({ error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message }, { status: 401 })
    }

    // Get bid ID from query params
    const { searchParams } = new URL(request.url)
    const bidId = searchParams.get('bidId')

    if (!bidId) {
      return NextResponse.json({ error: 'Bid ID is required' }, { status: 400 })
    }

    // Fetch leave bid
    const bidResult = await getLeaveBidById(bidId)

    if (!bidResult.success || !bidResult.data) {
      return NextResponse.json({ error: 'Leave bid not found' }, { status: 404 })
    }

    const bid = bidResult.data

    // Parse dates from JSON
    let options: Array<{ start_date: string; end_date: string; priority?: number }> = []
    try {
      options = JSON.parse(bid.preferred_dates)
    } catch {
      options = [{ start_date: 'N/A', end_date: 'N/A' }]
    }

    // Generate simple HTML for PDF (can be enhanced with proper PDF library)
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      color: #1e40af;
      border-bottom: 3px solid #1e40af;
      padding-bottom: 10px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 10px;
      margin: 20px 0;
    }
    .label {
      font-weight: bold;
      color: #555;
    }
    .value {
      color: #333;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 12px;
    }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-processing { background: #dbeafe; color: #1e40af; }
    .status-approved { background: #d1fae5; color: #065f46; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #f3f4f6;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <h1>Leave Bid Summary</h1>

  <div class="info-grid">
    <div class="label">Pilot Name:</div>
    <div class="value">${pilot.first_name} ${pilot.last_name}</div>

    <div class="label">Employee ID:</div>
    <div class="value">${pilot.employee_id || 'N/A'}</div>

    <div class="label">Roster Period:</div>
    <div class="value">${bid.roster_period_code}</div>

    <div class="label">Status:</div>
    <div class="value">
      <span class="status-badge status-${(bid.status || 'pending').toLowerCase()}">
        ${bid.status || 'PENDING'}
      </span>
    </div>

    <div class="label">Priority:</div>
    <div class="value">${bid.priority}</div>

    <div class="label">Submitted:</div>
    <div class="value">${bid.submitted_at ? new Date(bid.submitted_at).toLocaleDateString() : 'Not submitted'}</div>
  </div>

  <h2>Preferred Leave Dates</h2>
  <table>
    <thead>
      <tr>
        <th>Priority</th>
        <th>Start Date</th>
        <th>End Date</th>
        <th>Duration</th>
      </tr>
    </thead>
    <tbody>
      ${options
        .map((option, index) => {
          const start = new Date(option.start_date)
          const end = new Date(option.end_date)
          const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

          return `
          <tr>
            <td>${option.priority || index + 1}</td>
            <td>${start.toLocaleDateString()}</td>
            <td>${end.toLocaleDateString()}</td>
            <td>${duration} days</td>
          </tr>
        `
        })
        .join('')}
    </tbody>
  </table>

  ${
    bid.reason
      ? `
    <h2>Reason</h2>
    <p>${bid.reason}</p>
  `
      : ''
  }

  ${
    bid.notes
      ? `
    <h2>Additional Notes</h2>
    <p>${bid.notes}</p>
  `
      : ''
  }

  ${
    bid.review_comments
      ? `
    <h2>Review Comments</h2>
    <p>${bid.review_comments}</p>
    ${bid.reviewed_at ? `<p><small>Reviewed: ${new Date(bid.reviewed_at).toLocaleString()}</small></p>` : ''}
  `
      : ''
  }

  <div class="footer">
    <p>Generated: ${new Date().toLocaleString()}</p>
    <p>Fleet Management System - Pilot Portal</p>
  </div>
</body>
</html>
    `

    // Return HTML as PDF (browser's print to PDF will handle conversion)
    // For production, consider using a library like puppeteer or pdf-lib
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="leave-bid-${bid.roster_period_code}.html"`,
      },
    })
  } catch (error: any) {
    console.error('Leave bid export error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'exportLeaveBid',
      endpoint: '/api/portal/leave-bids/export',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
