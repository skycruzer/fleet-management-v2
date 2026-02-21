/**
 * Leave Bid PDF Export API Route
 *
 * Generates HTML export of a specific leave bid for pilots.
 * Includes roster periods, per-option statuses, and Air Niugini branding.
 *
 * Developer: Maurice Rondeau
 * @architecture Service Layer Pattern
 * @auth Pilot Portal Authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getLeaveBidById } from '@/lib/services/leave-bid-service'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import { getAffectedRosterPeriods } from '@/lib/utils/roster-utils'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/** Escape HTML to prevent XSS in generated export */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/** Load Air Niugini logo as base64 data URL */
function loadLogoBase64(): string {
  try {
    const logoPath = join(process.cwd(), 'public', 'images', 'air-niugini-logo.jpg')
    const logoData = readFileSync(logoPath)
    return `data:image/jpeg;base64,${logoData.toString('base64')}`
  } catch {
    return ''
  }
}

/** Get ordinal suffix for priority number */
function getOrdinal(n: number): string {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

/**
 * GET - Export Leave Bid as HTML/PDF
 *
 * Generates an HTML document for a specific leave bid with
 * roster periods, per-option statuses, and Air Niugini branding.
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

    // Verify pilot owns this bid
    if (bid.pilot_id !== pilot.pilot_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse dates from JSON
    let options: Array<{ start_date: string; end_date: string; priority?: number }> = []
    try {
      options = JSON.parse(bid.preferred_dates)
    } catch {
      options = [{ start_date: 'N/A', end_date: 'N/A' }]
    }

    // Enrich options with roster periods and per-option statuses
    const optionStatuses = bid.option_statuses || {}
    const enrichedOptions = options.map((opt, idx) => {
      let rosterPeriods: string[] = []
      if (opt.start_date && opt.end_date && opt.start_date !== 'N/A') {
        try {
          rosterPeriods = getAffectedRosterPeriods(
            new Date(opt.start_date),
            new Date(opt.end_date)
          ).map((rp) => rp.code)
        } catch {
          // fallback - no roster periods
        }
      }
      const optStatus = optionStatuses[String(idx)] || null
      return { ...opt, rosterPeriods, optStatus }
    })

    // Load logo
    const logoBase64 = loadLogoBase64()

    // Generate HTML with full branding and roster periods
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
      color: #333;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      border-bottom: 3px solid #1e40af;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .header img {
      width: 48px;
      height: 48px;
      object-fit: contain;
    }
    .header-text h1 {
      margin: 0;
      color: #1e40af;
      font-size: 22px;
    }
    .header-text p {
      margin: 2px 0 0;
      font-size: 13px;
      color: #666;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: 8px;
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
    h2 {
      color: #1e40af;
      font-size: 16px;
      margin-top: 28px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
    }
    th, td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid #ddd;
      font-size: 13px;
    }
    th {
      background: #f3f4f6;
      font-weight: bold;
      font-size: 12px;
      color: #555;
    }
    .rp-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      background: #dbeafe;
      color: #1e40af;
      margin: 1px 2px;
    }
    .opt-status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 600;
      margin-left: 4px;
    }
    .opt-approved { background: #d1fae5; color: #065f46; }
    .opt-rejected { background: #fee2e2; color: #991b1b; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" alt="Air Niugini" />` : ''}
    <div class="header-text">
      <h1>Leave Bid Summary</h1>
      <p>Air Niugini - B767 Fleet Management</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="label">Pilot Name:</div>
    <div class="value">${escapeHtml(pilot.first_name || '')} ${escapeHtml(pilot.last_name || '')}</div>

    <div class="label">Employee ID:</div>
    <div class="value">${escapeHtml(pilot.employee_id || 'N/A')}</div>

    <div class="label">Roster Period:</div>
    <div class="value">${escapeHtml(bid.roster_period_code)}</div>

    <div class="label">Overall Status:</div>
    <div class="value">
      <span class="status-badge status-${(bid.status || 'pending').toLowerCase()}">
        ${bid.status || 'PENDING'}
      </span>
    </div>

    <div class="label">Priority:</div>
    <div class="value">${escapeHtml(bid.priority)}</div>

    <div class="label">Submitted:</div>
    <div class="value">${bid.submitted_at ? new Date(bid.submitted_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not submitted'}</div>
  </div>

  <h2>Preferences, Date Ranges & Roster Periods</h2>
  <table>
    <thead>
      <tr>
        <th>Preference</th>
        <th>Date Range</th>
        <th>Duration</th>
        <th>Roster Periods</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${enrichedOptions
        .map((option, index) => {
          const start = new Date(option.start_date)
          const end = new Date(option.end_date)
          const duration =
            option.start_date !== 'N/A'
              ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
              : 0
          const ordinal = getOrdinal(option.priority || index + 1)
          const startStr =
            option.start_date !== 'N/A'
              ? start.toLocaleDateString('en-AU', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'N/A'
          const endStr =
            option.end_date !== 'N/A'
              ? end.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
              : 'N/A'
          const rpBadges =
            option.rosterPeriods.length > 0
              ? option.rosterPeriods
                  .map((rp) => `<span class="rp-badge">${escapeHtml(rp)}</span>`)
                  .join(' ')
              : '<span style="color: #999;">-</span>'
          let statusHtml = '<span style="color: #999;">Pending</span>'
          if (option.optStatus === 'APPROVED') {
            statusHtml = '<span class="opt-status opt-approved">Approved</span>'
          } else if (option.optStatus === 'REJECTED') {
            statusHtml = '<span class="opt-status opt-rejected">Rejected</span>'
          }

          return `
          <tr>
            <td><strong>${ordinal}</strong></td>
            <td>${startStr} - ${endStr}</td>
            <td>${duration > 0 ? `${duration} days` : '-'}</td>
            <td>${rpBadges}</td>
            <td>${statusHtml}</td>
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
    <p>${escapeHtml(bid.reason)}</p>
  `
      : ''
  }

  ${
    bid.notes
      ? `
    <h2>Additional Notes</h2>
    <p>${escapeHtml(bid.notes)}</p>
  `
      : ''
  }

  ${
    bid.review_comments
      ? `
    <h2>Review Comments</h2>
    <p>${escapeHtml(bid.review_comments)}</p>
    ${bid.reviewed_at ? `<p><small>Reviewed: ${new Date(bid.reviewed_at).toLocaleString()}</small></p>` : ''}
  `
      : ''
  }

  <div class="footer">
    <p>Generated: ${new Date().toLocaleString()}</p>
    <p><strong>Air Niugini</strong> - B767 Fleet Management System</p>
  </div>
</body>
</html>
    `

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
