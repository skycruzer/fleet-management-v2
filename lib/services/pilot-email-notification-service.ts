/**
 * Pilot Email Notification Service
 *
 * Sends email notifications to pilots for leave/flight request approvals and denials
 * Uses Resend for email delivery with professional HTML templates
 *
 * @created 2025-10-29
 * @priority Priority 2
 */

import { Resend } from 'resend'
import { DEFAULT_FROM_EMAIL } from '@/lib/constants/email'

let _resend: Resend | null = null
function getResendClient(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not configured')
    }
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

interface PilotInfo {
  email: string
  firstName: string
  lastName: string
  rank: 'Captain' | 'First Officer'
  employeeNumber: string
}

interface LeaveRequestInfo {
  id: string
  leaveType: string
  startDate: string
  endDate: string
  comments?: string
}

interface FlightRequestInfo {
  id: string
  requestedDate: string
  flightType: string
  departureAirport: string
  arrivalAirport: string
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Leave Request Approved Email Template
 */
function getLeaveApprovedEmailHTML(pilot: PilotInfo, request: LeaveRequestInfo): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Leave Request Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0891b2 0%, #0369a1 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">✅ Leave Request Approved</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #374151;">
                Dear ${pilot.rank} ${pilot.lastName},
              </p>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.5; color: #374151;">
                Great news! Your leave request has been <strong style="color: #059669;">approved</strong>.
              </p>

              <!-- Request Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 6px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 15px; font-size: 18px; color: #065f46;">Request Details</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Leave Type:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #111827; text-align: right;">${request.leaveType}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Start Date:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #111827; text-align: right;">${new Date(request.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">End Date:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #111827; text-align: right;">${new Date(request.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      </tr>
                      ${
                        request.comments
                          ? `
                      <tr>
                        <td colspan="2" style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Comments:</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 8px 0; font-size: 14px; color: #111827;">${request.comments}</td>
                      </tr>
                      `
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.5; color: #374151;">
                You can view your approved request and other details in the pilot portal.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/dashboard" style="display: inline-block; padding: 16px 40px; background-color: #0891b2; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      View Portal Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                Fleet Management System - Pilot Portal
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * Leave Request Denied Email Template
 */
function getLeaveDeniedemailHTML(
  pilot: PilotInfo,
  request: LeaveRequestInfo,
  reason?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Leave Request Denied</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">❌ Leave Request Denied</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #374151;">
                Dear ${pilot.rank} ${pilot.lastName},
              </p>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.5; color: #374151;">
                We regret to inform you that your leave request has been <strong style="color: #dc2626;">denied</strong>.
              </p>

              <!-- Request Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border: 2px solid #fecaca; border-radius: 6px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 15px; font-size: 18px; color: #991b1b;">Request Details</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Leave Type:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #111827; text-align: right;">${request.leaveType}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Start Date:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #111827; text-align: right;">${new Date(request.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">End Date:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #111827; text-align: right;">${new Date(request.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      </tr>
                      ${
                        reason
                          ? `
                      <tr>
                        <td colspan="2" style="padding: 16px 0 8px; font-size: 14px; color: #6b7280; font-weight: 600;">Reason for Denial:</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 0 0 8px; font-size: 14px; color: #dc2626; font-weight: 600;">${reason}</td>
                      </tr>
                      `
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.5; color: #374151;">
                If you have questions about this decision, please contact your supervisor or visit the pilot portal for more information.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/dashboard" style="display: inline-block; padding: 16px 40px; background-color: #0891b2; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      View Portal Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                Fleet Management System - Pilot Portal
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * Flight Request Approved Email Template
 */
function getFlightApprovedEmailHTML(pilot: PilotInfo, request: FlightRequestInfo): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flight Request Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0891b2 0%, #0369a1 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">✈️ Flight Request Approved</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #374151;">
                Dear ${pilot.rank} ${pilot.lastName},
              </p>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.5; color: #374151;">
                Great news! Your flight request has been <strong style="color: #059669;">approved</strong>.
              </p>

              <!-- Request Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 6px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 15px; font-size: 18px; color: #065f46;">Flight Details</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Flight Type:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #111827; text-align: right;">${request.flightType}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Date:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #111827; text-align: right;">${new Date(request.requestedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Route:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #111827; text-align: right;">${request.departureAirport} → ${request.arrivalAirport}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.5; color: #374151;">
                You can view your approved request and other details in the pilot portal.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/dashboard" style="display: inline-block; padding: 16px 40px; background-color: #0891b2; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      View Portal Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                Fleet Management System - Pilot Portal
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Send leave request approved email
 */
export async function sendLeaveApprovedEmail(
  pilot: PilotInfo,
  request: LeaveRequestInfo
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL,
      to: pilot.email,
      subject: `✅ Leave Request Approved - ${request.leaveType}`,
      html: getLeaveApprovedEmailHTML(pilot, request),
    })

    if (error) {
      console.error('Error sending leave approved email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected error sending leave approved email:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Send leave request denied email
 */
export async function sendLeaveDeniedEmail(
  pilot: PilotInfo,
  request: LeaveRequestInfo,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL,
      to: pilot.email,
      subject: `❌ Leave Request Denied - ${request.leaveType}`,
      html: getLeaveDeniedemailHTML(pilot, request, reason),
    })

    if (error) {
      console.error('Error sending leave denied email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected error sending leave denied email:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Send flight request approved email
 */
export async function sendFlightApprovedEmail(
  pilot: PilotInfo,
  request: FlightRequestInfo
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL,
      to: pilot.email,
      subject: `✈️ Flight Request Approved - ${request.flightType}`,
      html: getFlightApprovedEmailHTML(pilot, request),
    })

    if (error) {
      console.error('Error sending flight approved email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected error sending flight approved email:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
