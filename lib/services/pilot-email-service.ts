/**
 * Pilot Portal Email Service
 *
 * Handles email notifications for pilot registration approvals and denials.
 * Uses Resend API for reliable email delivery.
 *
 * @version 1.0.0
 * @since 2025-10-26
 */

import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_FROM_EMAIL, DEFAULT_SUPPORT_EMAIL } from '@/lib/constants/email'
import { getSystemSetting } from '@/lib/services/admin-service'

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

/**
 * Email configuration
 */
const EMAIL_CONFIG = {
  from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Fleet Management V2',
}

/**
 * Pilot registration data for email templates
 */
interface PilotRegistrationData {
  firstName: string
  lastName: string
  email: string
  rank: string
  employeeId?: string
}

/**
 * Leave request data for email templates
 */
interface LeaveRequestEmailData {
  firstName: string
  lastName: string
  email: string
  rank: string
  requestType: string
  startDate: string
  endDate: string
  daysCount: number
  denialReason?: string
  reviewerComments?: string
}

/**
 * Flight request data for email templates
 */
interface FlightRequestEmailData {
  firstName: string
  lastName: string
  email: string
  rank: string
  requestType: string
  flightDate: string
  description: string
  denialReason?: string
  reviewerComments?: string
}

/**
 * Certification expiry data for email templates
 */
interface CertificationExpiryData {
  firstName: string
  lastName: string
  email: string
  rank: string
  certifications: Array<{
    checkCode: string
    checkDescription: string
    expiryDate: string
    daysUntilExpiry: number
  }>
  urgencyLevel: 'critical' | 'warning' | 'notice'
}

/**
 * Password reset data for email templates
 */
interface PasswordResetData {
  firstName: string
  lastName: string
  email: string
  resetLink: string
  expiresIn: string // e.g., "15 minutes"
}

/**
 * Send registration approval email to pilot
 *
 * @param pilotData - Pilot registration information
 * @returns Promise resolving to email send result
 */
export async function sendRegistrationApprovalEmail(
  pilotData: PilotRegistrationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const loginUrl = `${EMAIL_CONFIG.appUrl}/portal/login`

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Approved</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header with aviation theme -->
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #0066cc;">
      <h1 style="color: #0066cc; margin: 0; font-size: 28px;">✈️ ${EMAIL_CONFIG.appName}</h1>
      <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Pilot Portal Access</p>
    </div>

    <!-- Main content -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: #0066cc; margin: 0 0 20px 0; font-size: 24px;">Welcome Aboard, ${pilotData.rank} ${pilotData.lastName}!</h2>

      <p style="margin: 0 0 15px 0; font-size: 16px;">
        Great news! Your pilot portal registration has been <strong style="color: #00aa00;">approved</strong> by our admin team.
      </p>

      <p style="margin: 0 0 15px 0; font-size: 16px;">
        You now have full access to the Pilot Portal, where you can:
      </p>

      <ul style="margin: 0 0 20px 0; padding-left: 20px; font-size: 16px;">
        <li style="margin-bottom: 10px;">📊 View your personal dashboard and flight statistics</li>
        <li style="margin-bottom: 10px;">📅 Submit leave requests (RDO, SDO, Annual Leave)</li>
        <li style="margin-bottom: 10px;">✈️ Submit flight requests</li>
        <li style="margin-bottom: 10px;">📜 View your certifications and upcoming renewals</li>
        <li style="margin-bottom: 10px;">🔔 Receive important notifications</li>
      </ul>

      <!-- Call to action button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="display: inline-block; background-color: #0066cc; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,102,204,0.3);">
          Log in to Pilot Portal →
        </a>
      </div>

      <div style="background-color: #f8f9fa; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #555;">
          <strong>Login URL:</strong> <a href="${loginUrl}" style="color: #0066cc; text-decoration: none;">${loginUrl}</a>
        </p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #555;">
          <strong>Your Email:</strong> ${pilotData.email}
        </p>
        ${pilotData.employeeId ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #555;"><strong>Employee ID:</strong> ${pilotData.employeeId}</p>` : ''}
      </div>

      <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">
        If you have any questions or need assistance, please don't hesitate to contact our support team.
      </p>
    </div>

    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        This is an automated message from ${EMAIL_CONFIG.appName}.<br>
        Please do not reply to this email.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} ${EMAIL_CONFIG.appName}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim()

    const textContent = `
Welcome Aboard, ${pilotData.rank} ${pilotData.lastName}!

Great news! Your pilot portal registration has been approved by our admin team.

You now have full access to the Pilot Portal, where you can:
- View your personal dashboard and flight statistics
- Submit leave requests (RDO, SDO, Annual Leave)
- Submit flight requests
- View your certifications and upcoming renewals
- Receive important notifications

Log in to Pilot Portal: ${loginUrl}

Your Email: ${pilotData.email}
${pilotData.employeeId ? `Employee ID: ${pilotData.employeeId}` : ''}

If you have any questions or need assistance, please don't hesitate to contact our support team.

---
This is an automated message from ${EMAIL_CONFIG.appName}.
Please do not reply to this email.
    `.trim()

    const { error } = await getResendClient().emails.send({
      from: EMAIL_CONFIG.from,
      to: pilotData.email,
      subject: `✅ Your Pilot Portal Registration Has Been Approved`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('Failed to send approval email:', error)
      return {
        success: false,
        error: error.message || 'Failed to send approval email',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending approval email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send registration denial email to pilot
 *
 * @param pilotData - Pilot registration information
 * @param denialReason - Reason for denial (optional)
 * @returns Promise resolving to email send result
 */
export async function sendRegistrationDenialEmail(
  pilotData: PilotRegistrationData,
  denialReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supportEmail = process.env.SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Update</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #dc3545;">
      <h1 style="color: #dc3545; margin: 0; font-size: 28px;">✈️ ${EMAIL_CONFIG.appName}</h1>
      <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Pilot Portal Registration</p>
    </div>

    <!-- Main content -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: #dc3545; margin: 0 0 20px 0; font-size: 24px;">Registration Status Update</h2>

      <p style="margin: 0 0 15px 0; font-size: 16px;">
        Dear ${pilotData.rank} ${pilotData.lastName},
      </p>

      <p style="margin: 0 0 15px 0; font-size: 16px;">
        Thank you for your interest in registering for the Pilot Portal. After reviewing your application, we regret to inform you that your registration has <strong style="color: #dc3545;">not been approved</strong> at this time.
      </p>

      ${
        denialReason
          ? `
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #856404;">
          <strong>Reason:</strong> ${denialReason}
        </p>
      </div>
      `
          : ''
      }

      <div style="background-color: #e7f3ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #004085;">
          <strong>What's Next?</strong>
        </p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #004085;">
          If you believe this decision was made in error or if you have questions about your registration, please contact our support team at <a href="mailto:${supportEmail}" style="color: #0066cc; text-decoration: none;">${supportEmail}</a>.
        </p>
      </div>

      <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">
        We appreciate your understanding and wish you all the best.
      </p>
    </div>

    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        This is an automated message from ${EMAIL_CONFIG.appName}.<br>
        If you have questions, please contact <a href="mailto:${supportEmail}" style="color: #0066cc; text-decoration: none;">${supportEmail}</a>
      </p>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} ${EMAIL_CONFIG.appName}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim()

    const textContent = `
Registration Status Update

Dear ${pilotData.rank} ${pilotData.lastName},

Thank you for your interest in registering for the Pilot Portal. After reviewing your application, we regret to inform you that your registration has not been approved at this time.

${denialReason ? `Reason: ${denialReason}\n` : ''}
What's Next?

If you believe this decision was made in error or if you have questions about your registration, please contact our support team at ${supportEmail}.

We appreciate your understanding and wish you all the best.

---
This is an automated message from ${EMAIL_CONFIG.appName}.
If you have questions, please contact ${supportEmail}
    `.trim()

    const { error } = await getResendClient().emails.send({
      from: EMAIL_CONFIG.from,
      to: pilotData.email,
      subject: `Pilot Portal Registration Update`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('Failed to send denial email:', error)
      return {
        success: false,
        error: error.message || 'Failed to send denial email',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending denial email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send leave request approval email to pilot
 *
 * @param requestData - Leave request information
 * @returns Promise resolving to email send result
 */
export async function sendLeaveRequestApprovalEmail(
  requestData: LeaveRequestEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const portalUrl = `${EMAIL_CONFIG.appUrl}/portal/leave-requests`

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Leave Request Approved</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #00aa00;">
      <h1 style="color: #00aa00; margin: 0; font-size: 28px;">✅ ${EMAIL_CONFIG.appName}</h1>
      <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Leave Request Approved</p>
    </div>

    <!-- Main content -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: #00aa00; margin: 0 0 20px 0; font-size: 24px;">Great News, ${requestData.rank} ${requestData.lastName}!</h2>

      <p style="margin: 0 0 15px 0; font-size: 16px;">
        Your <strong>${requestData.requestType}</strong> leave request has been <strong style="color: #00aa00;">approved</strong>.
      </p>

      <div style="background-color: #f0f9ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #555;"><strong>Leave Type:</strong> ${requestData.requestType}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #555;"><strong>Start Date:</strong> ${requestData.startDate}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #555;"><strong>End Date:</strong> ${requestData.endDate}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #555;"><strong>Days:</strong> ${requestData.daysCount}</p>
        ${requestData.reviewerComments ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #555;"><strong>Comments:</strong> ${requestData.reviewerComments}</p>` : ''}
      </div>

      <!-- Call to action button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${portalUrl}" style="display: inline-block; background-color: #0066cc; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,102,204,0.3);">
          View My Leave Requests →
        </a>
      </div>

      <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">
        If you have any questions, please contact your supervisor or the flight operations team.
      </p>
    </div>

    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        This is an automated message from ${EMAIL_CONFIG.appName}.<br>
        Please do not reply to this email.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} ${EMAIL_CONFIG.appName}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim()

    const textContent = `
Leave Request Approved

Great News, ${requestData.rank} ${requestData.lastName}!

Your ${requestData.requestType} leave request has been approved.

Leave Details:
- Leave Type: ${requestData.requestType}
- Start Date: ${requestData.startDate}
- End Date: ${requestData.endDate}
- Days: ${requestData.daysCount}
${requestData.reviewerComments ? `- Comments: ${requestData.reviewerComments}` : ''}

View your leave requests: ${portalUrl}

If you have any questions, please contact your supervisor or the flight operations team.

---
This is an automated message from ${EMAIL_CONFIG.appName}.
Please do not reply to this email.
    `.trim()

    const { error } = await getResendClient().emails.send({
      from: EMAIL_CONFIG.from,
      to: requestData.email,
      subject: `✅ Your ${requestData.requestType} Leave Request Has Been Approved`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('Failed to send leave approval email:', error)
      return {
        success: false,
        error: error.message || 'Failed to send leave approval email',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending leave approval email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send leave request denial email to pilot
 *
 * @param requestData - Leave request information
 * @returns Promise resolving to email send result
 */
export async function sendLeaveRequestDenialEmail(
  requestData: LeaveRequestEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const portalUrl = `${EMAIL_CONFIG.appUrl}/portal/leave-requests`

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Leave Request Update</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #dc3545;">
      <h1 style="color: #dc3545; margin: 0; font-size: 28px;">✈️ ${EMAIL_CONFIG.appName}</h1>
      <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Leave Request Update</p>
    </div>

    <!-- Main content -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: #dc3545; margin: 0 0 20px 0; font-size: 24px;">Leave Request Status Update</h2>

      <p style="margin: 0 0 15px 0; font-size: 16px;">
        Dear ${requestData.rank} ${requestData.lastName},
      </p>

      <p style="margin: 0 0 15px 0; font-size: 16px;">
        We regret to inform you that your <strong>${requestData.requestType}</strong> leave request has been <strong style="color: #dc3545;">denied</strong>.
      </p>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #856404;"><strong>Leave Type:</strong> ${requestData.requestType}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #856404;"><strong>Requested Dates:</strong> ${requestData.startDate} to ${requestData.endDate}</p>
        ${
          requestData.denialReason || requestData.reviewerComments
            ? `
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #856404;">
          <strong>Reason:</strong> ${requestData.denialReason || requestData.reviewerComments}
        </p>
        `
            : ''
        }
      </div>

      <div style="background-color: #e7f3ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #004085;">
          <strong>What's Next?</strong>
        </p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #004085;">
          If you have questions about this decision or would like to discuss alternative dates, please contact your supervisor or the flight operations team.
        </p>
      </div>

      <!-- Call to action button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${portalUrl}" style="display: inline-block; background-color: #0066cc; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,102,204,0.3);">
          View My Leave Requests →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        This is an automated message from ${EMAIL_CONFIG.appName}.<br>
        Please do not reply to this email.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} ${EMAIL_CONFIG.appName}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim()

    const textContent = `
Leave Request Update

Dear ${requestData.rank} ${requestData.lastName},

We regret to inform you that your ${requestData.requestType} leave request has been denied.

Leave Details:
- Leave Type: ${requestData.requestType}
- Requested Dates: ${requestData.startDate} to ${requestData.endDate}
${requestData.denialReason || requestData.reviewerComments ? `- Reason: ${requestData.denialReason || requestData.reviewerComments}` : ''}

What's Next?
If you have questions about this decision or would like to discuss alternative dates, please contact your supervisor or the flight operations team.

View your leave requests: ${portalUrl}

---
This is an automated message from ${EMAIL_CONFIG.appName}.
Please do not reply to this email.
    `.trim()

    const { error } = await getResendClient().emails.send({
      from: EMAIL_CONFIG.from,
      to: requestData.email,
      subject: `Leave Request Update - ${requestData.requestType}`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('Failed to send leave denial email:', error)
      return {
        success: false,
        error: error.message || 'Failed to send leave denial email',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending leave denial email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send flight request approval email to pilot
 *
 * @param requestData - Flight request information
 * @returns Promise resolving to email send result
 */
export async function sendFlightRequestApprovalEmail(
  requestData: FlightRequestEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const portalUrl = `${EMAIL_CONFIG.appUrl}/portal/flight-requests`

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flight Request Approved</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #00aa00;">
      <h1 style="color: #00aa00; margin: 0; font-size: 28px;">✅ ${EMAIL_CONFIG.appName}</h1>
      <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Flight Request Approved</p>
    </div>

    <!-- Main content -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: #00aa00; margin: 0 0 20px 0; font-size: 24px;">Great News, ${requestData.rank} ${requestData.lastName}!</h2>

      <p style="margin: 0 0 15px 0; font-size: 16px;">
        Your <strong>${requestData.requestType}</strong> flight request has been <strong style="color: #00aa00;">approved</strong>.
      </p>

      <div style="background-color: #f0f9ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #555;"><strong>Request Type:</strong> ${requestData.requestType}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #555;"><strong>Flight Date:</strong> ${requestData.flightDate}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #555;"><strong>Description:</strong> ${requestData.description}</p>
        ${requestData.reviewerComments ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #555;"><strong>Comments:</strong> ${requestData.reviewerComments}</p>` : ''}
      </div>

      <!-- Call to action button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${portalUrl}" style="display: inline-block; background-color: #0066cc; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,102,204,0.3);">
          View My Flight Requests →
        </a>
      </div>

      <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">
        If you have any questions, please contact your supervisor or the flight operations team.
      </p>
    </div>

    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        This is an automated message from ${EMAIL_CONFIG.appName}.<br>
        Please do not reply to this email.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} ${EMAIL_CONFIG.appName}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim()

    const textContent = `
Flight Request Approved

Great News, ${requestData.rank} ${requestData.lastName}!

Your ${requestData.requestType} flight request has been approved.

Request Details:
- Request Type: ${requestData.requestType}
- Flight Date: ${requestData.flightDate}
- Description: ${requestData.description}
${requestData.reviewerComments ? `- Comments: ${requestData.reviewerComments}` : ''}

View your flight requests: ${portalUrl}

If you have any questions, please contact your supervisor or the flight operations team.

---
This is an automated message from ${EMAIL_CONFIG.appName}.
Please do not reply to this email.
    `.trim()

    const { error } = await getResendClient().emails.send({
      from: EMAIL_CONFIG.from,
      to: requestData.email,
      subject: `✅ Your ${requestData.requestType} Flight Request Has Been Approved`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('Failed to send flight approval email:', error)
      return {
        success: false,
        error: error.message || 'Failed to send flight approval email',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending flight approval email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send flight request denial email to pilot
 *
 * @param requestData - Flight request information
 * @returns Promise resolving to email send result
 */
export async function sendFlightRequestDenialEmail(
  requestData: FlightRequestEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const portalUrl = `${EMAIL_CONFIG.appUrl}/portal/flight-requests`

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flight Request Update</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #dc3545;">
      <h1 style="color: #dc3545; margin: 0; font-size: 28px;">✈️ ${EMAIL_CONFIG.appName}</h1>
      <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Flight Request Update</p>
    </div>

    <!-- Main content -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: #dc3545; margin: 0 0 20px 0; font-size: 24px;">Flight Request Status Update</h2>

      <p style="margin: 0 0 15px 0; font-size: 16px;">
        Dear ${requestData.rank} ${requestData.lastName},
      </p>

      <p style="margin: 0 0 15px 0; font-size: 16px;">
        We regret to inform you that your <strong>${requestData.requestType}</strong> flight request has been <strong style="color: #dc3545;">denied</strong>.
      </p>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #856404;"><strong>Request Type:</strong> ${requestData.requestType}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #856404;"><strong>Flight Date:</strong> ${requestData.flightDate}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #856404;"><strong>Description:</strong> ${requestData.description}</p>
        ${
          requestData.denialReason || requestData.reviewerComments
            ? `
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #856404;">
          <strong>Reason:</strong> ${requestData.denialReason || requestData.reviewerComments}
        </p>
        `
            : ''
        }
      </div>

      <div style="background-color: #e7f3ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #004085;">
          <strong>What's Next?</strong>
        </p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #004085;">
          If you have questions about this decision or would like to discuss alternative options, please contact your supervisor or the flight operations team.
        </p>
      </div>

      <!-- Call to action button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${portalUrl}" style="display: inline-block; background-color: #0066cc; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,102,204,0.3);">
          View My Flight Requests →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        This is an automated message from ${EMAIL_CONFIG.appName}.<br>
        Please do not reply to this email.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} ${EMAIL_CONFIG.appName}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim()

    const textContent = `
Flight Request Update

Dear ${requestData.rank} ${requestData.lastName},

We regret to inform you that your ${requestData.requestType} flight request has been denied.

Request Details:
- Request Type: ${requestData.requestType}
- Flight Date: ${requestData.flightDate}
- Description: ${requestData.description}
${requestData.denialReason || requestData.reviewerComments ? `- Reason: ${requestData.denialReason || requestData.reviewerComments}` : ''}

What's Next?
If you have questions about this decision or would like to discuss alternative options, please contact your supervisor or the flight operations team.

View your flight requests: ${portalUrl}

---
This is an automated message from ${EMAIL_CONFIG.appName}.
Please do not reply to this email.
    `.trim()

    const { error } = await getResendClient().emails.send({
      from: EMAIL_CONFIG.from,
      to: requestData.email,
      subject: `Flight Request Update - ${requestData.requestType}`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('Failed to send flight denial email:', error)
      return {
        success: false,
        error: error.message || 'Failed to send flight denial email',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending flight denial email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send certification expiry alert email to pilot
 *
 * @param data - Certification expiry information
 * @returns Promise resolving to email send result
 */
export async function sendCertificationExpiryAlert(
  data: CertificationExpiryData
): Promise<{ success: boolean; error?: string }> {
  try {
    const portalUrl = `${EMAIL_CONFIG.appUrl}/portal/certifications`

    // Determine urgency styling
    const urgencyConfig = {
      critical: {
        color: '#dc3545',
        icon: '🔴',
        label: 'CRITICAL',
        message: 'requires immediate action',
      },
      warning: {
        color: '#ffc107',
        icon: '🟡',
        label: 'WARNING',
        message: 'expiring soon',
      },
      notice: {
        color: '#0066cc',
        icon: '🔵',
        label: 'NOTICE',
        message: 'plan ahead',
      },
    }

    const config = urgencyConfig[data.urgencyLevel]

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certification Expiry Alert</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid ${config.color};">
      <h1 style="color: ${config.color}; margin: 0; font-size: 28px;">${config.icon} ${EMAIL_CONFIG.appName}</h1>
      <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Certification Expiry Alert - ${config.label}</p>
    </div>

    <!-- Main content -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: ${config.color}; margin: 0 0 20px 0; font-size: 24px;">Attention ${data.rank} ${data.lastName}!</h2>

      <p style="margin: 0 0 15px 0; font-size: 16px;">
        You have <strong>${data.certifications.length}</strong> certification${data.certifications.length > 1 ? 's' : ''} that ${config.message}.
      </p>

      ${data.certifications
        .map(
          (cert) => `
      <div style="background-color: ${data.urgencyLevel === 'critical' ? '#fff5f5' : data.urgencyLevel === 'warning' ? '#fff3cd' : '#e7f3ff'}; border-left: 4px solid ${config.color}; padding: 15px; margin: 15px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 16px; color: #333;"><strong>${cert.checkCode}</strong> - ${cert.checkDescription}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #555;">
          <strong>Expiry Date:</strong> ${cert.expiryDate}
        </p>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: ${config.color}; font-weight: bold;">
          ${
            cert.daysUntilExpiry < 0
              ? `EXPIRED ${Math.abs(cert.daysUntilExpiry)} days ago`
              : `${cert.daysUntilExpiry} days remaining`
          }
        </p>
      </div>
      `
        )
        .join('')}

      <div style="background-color: #f8f9fa; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #333;"><strong>Action Required:</strong></p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px; color: #555;">
          ${
            data.urgencyLevel === 'critical'
              ? '<li><strong>DO NOT FLY</strong> with expired certifications</li><li>Please notify the B767 Office if this certification has been completed</li><li>Advise if APM has been updated and provide the new expiry date</li>'
              : data.urgencyLevel === 'warning'
                ? '<li>Schedule renewal as soon as possible</li><li>Contact training to book your renewal</li><li>Review renewal requirements</li>'
                : '<li>Plan your renewal well in advance</li><li>Check training calendar availability</li><li>Prepare required documentation</li>'
          }
        </ul>
      </div>

      <!-- Call to action button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${portalUrl}" style="display: inline-block; background-color: ${config.color}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
          View My Certifications →
        </a>
      </div>

      <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">
        If you have questions, please contact the training department immediately.
      </p>
    </div>

    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        This is an automated safety alert from ${EMAIL_CONFIG.appName}.<br>
        Please do not reply to this email.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} ${EMAIL_CONFIG.appName}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim()

    const textContent = `
Certification Expiry Alert - ${config.label}

Attention ${data.rank} ${data.lastName}!

You have ${data.certifications.length} certification${data.certifications.length > 1 ? 's' : ''} that ${config.message}.

${data.certifications
  .map(
    (cert) => `
${cert.checkCode} - ${cert.checkDescription}
Expiry Date: ${cert.expiryDate}
${
  cert.daysUntilExpiry < 0
    ? `EXPIRED ${Math.abs(cert.daysUntilExpiry)} days ago`
    : `${cert.daysUntilExpiry} days remaining`
}
`
  )
  .join('\n')}

Action Required:
${
  data.urgencyLevel === 'critical'
    ? '- DO NOT FLY with expired certifications\n- Contact training immediately to schedule renewal\n- Update your status in the system'
    : data.urgencyLevel === 'warning'
      ? '- Schedule renewal as soon as possible\n- Contact training to book your renewal\n- Review renewal requirements'
      : '- Plan your renewal well in advance\n- Check training calendar availability\n- Prepare required documentation'
}

View your certifications: ${portalUrl}

If you have questions, please contact the training department immediately.

---
This is an automated safety alert from ${EMAIL_CONFIG.appName}.
Please do not reply to this email.
    `.trim()

    const { error } = await getResendClient().emails.send({
      from: EMAIL_CONFIG.from,
      to: data.email,
      subject: `${config.icon} Certification Expiry Alert - ${config.label}`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('Failed to send certification expiry alert:', error)
      return {
        success: false,
        error: error.message || 'Failed to send certification expiry alert',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending certification expiry alert:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send password reset email to pilot
 *
 * @param data - Password reset information
 * @returns Promise resolving to email send result
 */
export async function sendPasswordResetEmail(
  data: PasswordResetData
): Promise<{ success: boolean; error?: string }> {
  try {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Request</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #0066cc;">
      <h1 style="color: #0066cc; margin: 0; font-size: 28px;">🔐 ${EMAIL_CONFIG.appName}</h1>
      <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Password Reset Request</p>
    </div>

    <!-- Main content -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: #0066cc; margin: 0 0 20px 0; font-size: 24px;">Hello ${data.firstName}!</h2>

      <p style="margin: 0 0 15px 0; font-size: 16px;">
        We received a request to reset your password for your ${EMAIL_CONFIG.appName} account.
      </p>

      <p style="margin: 0 0 15px 0; font-size: 16px;">
        Click the button below to reset your password. This link will expire in <strong>${data.expiresIn}</strong>.
      </p>

      <!-- Call to action button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetLink}" style="display: inline-block; background-color: #0066cc; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,102,204,0.3);">
          Reset My Password →
        </a>
      </div>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #856404;">
          <strong>Security Notice:</strong>
        </p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #856404;">
          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>

      <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #0066cc; word-break: break-all;">
        ${data.resetLink}
      </p>
    </div>

    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        This is an automated message from ${EMAIL_CONFIG.appName}.<br>
        Please do not reply to this email.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} ${EMAIL_CONFIG.appName}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim()

    const textContent = `
Password Reset Request

Hello ${data.firstName}!

We received a request to reset your password for your ${EMAIL_CONFIG.appName} account.

Click the link below to reset your password. This link will expire in ${data.expiresIn}.

Reset link: ${data.resetLink}

Security Notice:
If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

---
This is an automated message from ${EMAIL_CONFIG.appName}.
Please do not reply to this email.
    `.trim()

    const { error } = await getResendClient().emails.send({
      from: EMAIL_CONFIG.from,
      to: data.email,
      subject: `🔐 Password Reset Request - ${EMAIL_CONFIG.appName}`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('Failed to send password reset email:', error)
      return {
        success: false,
        error: error.message || 'Failed to send password reset email',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Retirement notification data for email templates
 */
interface RetirementNotificationData {
  firstName: string
  lastName: string
  email: string
  rank: string
  employeeId: string
  retirementAge: number
  currentAge: number
  effectiveDate: string
}

/**
 * Send retirement notification email to pilot
 *
 * Notifies pilots when their status has been automatically changed to inactive
 * due to reaching the mandatory retirement age.
 *
 * @param data - Retirement notification information
 * @returns Promise resolving to email send result
 */
export async function sendRetirementNotificationEmail(
  data: RetirementNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supportEmail = process.env.SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Retirement Status Update</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #0066cc;">
      <h1 style="color: #0066cc; margin: 0; font-size: 28px;">${EMAIL_CONFIG.appName}</h1>
      <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Retirement Status Notification</p>
    </div>

    <!-- Main content -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: #0066cc; margin: 0 0 20px 0; font-size: 24px;">Dear ${data.rank} ${data.lastName},</h2>

      <p style="margin: 0 0 15px 0; font-size: 16px;">
        We are writing to inform you that your pilot status in ${EMAIL_CONFIG.appName} has been updated to <strong>inactive</strong> as you have reached the mandatory retirement age of <strong>${data.retirementAge}</strong>.
      </p>

      <div style="background-color: #f0f9ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #555;"><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #555;"><strong>Employee ID:</strong> ${data.employeeId}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #555;"><strong>Rank:</strong> ${data.rank}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #555;"><strong>Current Age:</strong> ${data.currentAge}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #555;"><strong>Retirement Age:</strong> ${data.retirementAge}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #555;"><strong>Effective Date:</strong> ${data.effectiveDate}</p>
      </div>

      <div style="background-color: #e7f3ff; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #0c5460;">
          <strong>Thank You for Your Service</strong>
        </p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #0c5460;">
          We deeply appreciate your dedication and contributions to our flight operations over the years. Your professionalism and commitment to safety have been invaluable.
        </p>
      </div>

      <div style="background-color: #f8f9fa; border-left: 4px solid #6c757d; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #333;">
          <strong>Next Steps:</strong>
        </p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px; color: #555;">
          <li style="margin-bottom: 8px;">Your certifications and records will be maintained in the system for reference</li>
          <li style="margin-bottom: 8px;">Please contact HR for information about retirement benefits</li>
          <li style="margin-bottom: 8px;">Return any company equipment and badges as per company policy</li>
        </ul>
      </div>

      <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">
        If you have any questions or believe this status change was made in error, please contact us at <a href="mailto:${supportEmail}" style="color: #0066cc; text-decoration: none;">${supportEmail}</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        This is an automated message from ${EMAIL_CONFIG.appName}.<br>
        Please do not reply to this email.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} ${EMAIL_CONFIG.appName}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim()

    const textContent = `
Retirement Status Notification

Dear ${data.rank} ${data.lastName},

We are writing to inform you that your pilot status in ${EMAIL_CONFIG.appName} has been updated to inactive as you have reached the mandatory retirement age of ${data.retirementAge}.

Details:
- Name: ${data.firstName} ${data.lastName}
- Employee ID: ${data.employeeId}
- Rank: ${data.rank}
- Current Age: ${data.currentAge}
- Retirement Age: ${data.retirementAge}
- Effective Date: ${data.effectiveDate}

Thank You for Your Service
We deeply appreciate your dedication and contributions to our flight operations over the years. Your professionalism and commitment to safety have been invaluable.

Next Steps:
- Your certifications and records will be maintained in the system for reference
- Please contact HR for information about retirement benefits
- Return any company equipment and badges as per company policy

If you have any questions or believe this status change was made in error, please contact us at ${supportEmail}.

---
This is an automated message from ${EMAIL_CONFIG.appName}.
Please do not reply to this email.
    `.trim()

    const { error } = await getResendClient().emails.send({
      from: EMAIL_CONFIG.from,
      to: data.email,
      subject: `Retirement Status Update - ${EMAIL_CONFIG.appName}`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('Failed to send retirement notification email:', error)
      return {
        success: false,
        error: error.message || 'Failed to send retirement notification email',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending retirement notification email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ---------------------------------------------------------------------------
// Request Lifecycle Emails (submitted, edited, withdrawn + dispatch helper)
// ---------------------------------------------------------------------------

/**
 * Request lifecycle email data — covers all request events
 */
export interface RequestLifecycleEmailData {
  requestCategory: 'LEAVE' | 'FLIGHT'
  requestType: string
  startDate: string
  endDate?: string | null
  daysCount?: number | null
  flightDate?: string | null
  description?: string | null
  reason?: string | null
  denialReason?: string | null
  reviewerComments?: string | null
}

/**
 * Internal data shape passed to submitted/edited/withdrawn templates
 */
interface RequestEmailTemplateData extends RequestLifecycleEmailData {
  firstName: string
  lastName: string
  email: string
  rank: string
}

/**
 * Shared HTML email footer used across request lifecycle templates
 */
function emailFooter(): string {
  return `
    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        This is an automated message from ${EMAIL_CONFIG.appName}.<br>
        Please do not reply to this email.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
        &copy; ${new Date().getFullYear()} ${EMAIL_CONFIG.appName}. All rights reserved.
      </p>
    </div>`
}

/**
 * Build the request-details block shared by submitted/edited templates
 */
function requestDetailsBlock(data: RequestEmailTemplateData): string {
  const lines: string[] = [
    `<p style="margin: 0; font-size: 14px; color: #555;"><strong>Request Type:</strong> ${data.requestType}</p>`,
  ]

  if (data.requestCategory === 'LEAVE') {
    lines.push(
      `<p style="margin: 10px 0 0 0; font-size: 14px; color: #555;"><strong>Start Date:</strong> ${data.startDate}</p>`
    )
    if (data.endDate) {
      lines.push(
        `<p style="margin: 10px 0 0 0; font-size: 14px; color: #555;"><strong>End Date:</strong> ${data.endDate}</p>`
      )
    }
    if (data.daysCount != null) {
      lines.push(
        `<p style="margin: 10px 0 0 0; font-size: 14px; color: #555;"><strong>Days:</strong> ${data.daysCount}</p>`
      )
    }
  } else {
    if (data.flightDate) {
      lines.push(
        `<p style="margin: 10px 0 0 0; font-size: 14px; color: #555;"><strong>Flight Date:</strong> ${data.flightDate}</p>`
      )
    }
    if (data.description) {
      lines.push(
        `<p style="margin: 10px 0 0 0; font-size: 14px; color: #555;"><strong>Description:</strong> ${data.description}</p>`
      )
    }
  }

  if (data.reason) {
    lines.push(
      `<p style="margin: 10px 0 0 0; font-size: 14px; color: #555;"><strong>Reason:</strong> ${data.reason}</p>`
    )
  }

  return lines.join('\n        ')
}

/**
 * Send request submitted confirmation email
 */
export async function sendRequestSubmittedEmail(
  data: RequestEmailTemplateData
): Promise<{ success: boolean; error?: string }> {
  try {
    const portalUrl = `${EMAIL_CONFIG.appUrl}/portal/requests`
    const accentColor = '#0066cc'

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Request Submitted</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid ${accentColor};">
      <h1 style="color: ${accentColor}; margin: 0; font-size: 28px;">✈️ ${EMAIL_CONFIG.appName}</h1>
      <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Request Submitted</p>
    </div>

    <!-- Main content -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: ${accentColor}; margin: 0 0 20px 0; font-size: 24px;">Request Received, ${data.rank} ${data.lastName}!</h2>

      <p style="margin: 0 0 15px 0; font-size: 16px;">
        Your <strong>${data.requestType}</strong> request has been <strong style="color: ${accentColor};">submitted</strong> and is pending review.
      </p>

      <div style="background-color: #f0f9ff; border-left: 4px solid ${accentColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
        ${requestDetailsBlock(data)}
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${portalUrl}" style="display: inline-block; background-color: ${accentColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,102,204,0.3);">
          View My Requests →
        </a>
      </div>

      <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">
        You will receive an email once your request has been reviewed.
      </p>
    </div>

    ${emailFooter()}
  </div>
</body>
</html>
    `.trim()

    const textContent = `
Request Submitted

Request Received, ${data.rank} ${data.lastName}!

Your ${data.requestType} request has been submitted and is pending review.

Request Type: ${data.requestType}
${data.requestCategory === 'LEAVE' ? `Start Date: ${data.startDate}${data.endDate ? `\nEnd Date: ${data.endDate}` : ''}${data.daysCount != null ? `\nDays: ${data.daysCount}` : ''}` : `${data.flightDate ? `Flight Date: ${data.flightDate}` : ''}${data.description ? `\nDescription: ${data.description}` : ''}`}
${data.reason ? `Reason: ${data.reason}` : ''}

View your requests: ${portalUrl}

You will receive an email once your request has been reviewed.

---
This is an automated message from ${EMAIL_CONFIG.appName}.
Please do not reply to this email.
    `.trim()

    const { error } = await getResendClient().emails.send({
      from: EMAIL_CONFIG.from,
      to: data.email,
      subject: `Your ${data.requestType} Request Has Been Submitted`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('Failed to send request submitted email:', error)
      return { success: false, error: error.message || 'Failed to send request submitted email' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending request submitted email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send request edited/updated confirmation email
 */
export async function sendRequestEditedEmail(
  data: RequestEmailTemplateData
): Promise<{ success: boolean; error?: string }> {
  try {
    const portalUrl = `${EMAIL_CONFIG.appUrl}/portal/requests`
    const accentColor = '#f59e0b'

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Request Updated</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid ${accentColor};">
      <h1 style="color: ${accentColor}; margin: 0; font-size: 28px;">✏️ ${EMAIL_CONFIG.appName}</h1>
      <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Request Updated</p>
    </div>

    <!-- Main content -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: ${accentColor}; margin: 0 0 20px 0; font-size: 24px;">Request Updated, ${data.rank} ${data.lastName}</h2>

      <p style="margin: 0 0 15px 0; font-size: 16px;">
        Your <strong>${data.requestType}</strong> request has been <strong style="color: ${accentColor};">updated</strong> and is pending review.
      </p>

      <div style="background-color: #fffbeb; border-left: 4px solid ${accentColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
        ${requestDetailsBlock(data)}
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${portalUrl}" style="display: inline-block; background-color: ${accentColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(245,158,11,0.3);">
          View My Requests →
        </a>
      </div>

      <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">
        You will receive an email once the updated request has been reviewed.
      </p>
    </div>

    ${emailFooter()}
  </div>
</body>
</html>
    `.trim()

    const textContent = `
Request Updated

Request Updated, ${data.rank} ${data.lastName}

Your ${data.requestType} request has been updated and is pending review.

Request Type: ${data.requestType}
${data.requestCategory === 'LEAVE' ? `Start Date: ${data.startDate}${data.endDate ? `\nEnd Date: ${data.endDate}` : ''}${data.daysCount != null ? `\nDays: ${data.daysCount}` : ''}` : `${data.flightDate ? `Flight Date: ${data.flightDate}` : ''}${data.description ? `\nDescription: ${data.description}` : ''}`}
${data.reason ? `Reason: ${data.reason}` : ''}

View your requests: ${portalUrl}

You will receive an email once the updated request has been reviewed.

---
This is an automated message from ${EMAIL_CONFIG.appName}.
Please do not reply to this email.
    `.trim()

    const { error } = await getResendClient().emails.send({
      from: EMAIL_CONFIG.from,
      to: data.email,
      subject: `Your ${data.requestType} Request Has Been Updated`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('Failed to send request edited email:', error)
      return { success: false, error: error.message || 'Failed to send request edited email' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending request edited email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send request in-review notification email
 */
export async function sendRequestInReviewEmail(
  data: RequestEmailTemplateData
): Promise<{ success: boolean; error?: string }> {
  try {
    const portalUrl = `${EMAIL_CONFIG.appUrl}/portal/requests`
    const accentColor = '#0ea5e9'

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Request Under Review</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid ${accentColor};">
      <h1 style="color: ${accentColor}; margin: 0; font-size: 28px;">✈️ ${EMAIL_CONFIG.appName}</h1>
      <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Request Under Review</p>
    </div>

    <!-- Main content -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: ${accentColor}; margin: 0 0 20px 0; font-size: 24px;">Request Under Review</h2>

      <p style="margin: 0 0 15px 0; font-size: 16px;">
        Dear ${data.rank} ${data.lastName}, your <strong>${data.requestType}</strong> request is now <strong>under review</strong> by the operations team.
      </p>

      <div style="background-color: #f8f9fa; border-left: 4px solid ${accentColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
        ${requestDetailsBlock(data)}
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${portalUrl}" style="display: inline-block; background-color: #0066cc; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,102,204,0.3);">
          View My Requests →
        </a>
      </div>

      <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">
        You will receive another notification once a decision has been made.
      </p>
    </div>

    ${emailFooter()}
  </div>
</body>
</html>
    `.trim()

    const textContent = `
Request Under Review

Dear ${data.rank} ${data.lastName}, your ${data.requestType} request is now under review by the operations team.

Request Type: ${data.requestType}
${data.requestCategory === 'LEAVE' ? `Start Date: ${data.startDate}${data.endDate ? `\nEnd Date: ${data.endDate}` : ''}` : `${data.flightDate ? `Flight Date: ${data.flightDate}` : ''}`}

View your requests: ${portalUrl}

You will receive another notification once a decision has been made.

---
This is an automated message from ${EMAIL_CONFIG.appName}.
Please do not reply to this email.
    `.trim()

    const { error } = await getResendClient().emails.send({
      from: EMAIL_CONFIG.from,
      to: data.email,
      subject: `Your ${data.requestType} Request Is Under Review`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('Failed to send request in-review email:', error)
      return { success: false, error: error.message || 'Failed to send request in-review email' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending request in-review email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send request withdrawn confirmation email
 */
export async function sendRequestWithdrawnEmail(
  data: RequestEmailTemplateData
): Promise<{ success: boolean; error?: string }> {
  try {
    const portalUrl = `${EMAIL_CONFIG.appUrl}/portal/requests`
    const accentColor = '#6c757d'

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Request Withdrawn</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid ${accentColor};">
      <h1 style="color: ${accentColor}; margin: 0; font-size: 28px;">✈️ ${EMAIL_CONFIG.appName}</h1>
      <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Request Withdrawn</p>
    </div>

    <!-- Main content -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: ${accentColor}; margin: 0 0 20px 0; font-size: 24px;">Request Withdrawn</h2>

      <p style="margin: 0 0 15px 0; font-size: 16px;">
        Dear ${data.rank} ${data.lastName}, your <strong>${data.requestType}</strong> request has been <strong>withdrawn</strong>.
      </p>

      <div style="background-color: #f8f9fa; border-left: 4px solid ${accentColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
        ${requestDetailsBlock(data)}
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${portalUrl}" style="display: inline-block; background-color: #0066cc; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,102,204,0.3);">
          View My Requests →
        </a>
      </div>

      <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">
        If you need to submit a new request, you can do so from the portal at any time.
      </p>
    </div>

    ${emailFooter()}
  </div>
</body>
</html>
    `.trim()

    const textContent = `
Request Withdrawn

Dear ${data.rank} ${data.lastName}, your ${data.requestType} request has been withdrawn.

Request Type: ${data.requestType}
${data.requestCategory === 'LEAVE' ? `Start Date: ${data.startDate}${data.endDate ? `\nEnd Date: ${data.endDate}` : ''}` : `${data.flightDate ? `Flight Date: ${data.flightDate}` : ''}`}

View your requests: ${portalUrl}

If you need to submit a new request, you can do so from the portal at any time.

---
This is an automated message from ${EMAIL_CONFIG.appName}.
Please do not reply to this email.
    `.trim()

    const { error } = await getResendClient().emails.send({
      from: EMAIL_CONFIG.from,
      to: data.email,
      subject: `Your ${data.requestType} Request Has Been Withdrawn`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('Failed to send request withdrawn email:', error)
      return { success: false, error: error.message || 'Failed to send request withdrawn email' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending request withdrawn email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Dispatch helper — sends the correct email for any request lifecycle event.
 *
 * Fire-and-forget: never throws. Callers can use without try/catch.
 *
 * @param pilotId - UUID of the pilot from the `pilots` table
 * @param event   - Lifecycle event type
 * @param requestData - Request details (fields used vary by event)
 */
export async function sendRequestLifecycleEmail(
  pilotId: string,
  event: 'submitted' | 'edited' | 'approved' | 'denied' | 'withdrawn' | 'in_review',
  requestData: RequestLifecycleEmailData
): Promise<void> {
  try {
    // Fetch pilot contact info
    const supabase = createAdminClient()
    const { data: pilot, error: fetchError } = await supabase
      .from('pilots')
      .select('email, first_name, last_name, role')
      .eq('id', pilotId)
      .single()

    if (fetchError || !pilot) {
      console.warn(
        `[sendRequestLifecycleEmail] Could not fetch pilot ${pilotId}:`,
        fetchError?.message || 'not found'
      )
      return
    }

    if (!pilot.email) {
      console.warn(
        `[sendRequestLifecycleEmail] Pilot ${pilotId} (${pilot.first_name} ${pilot.last_name}) has no email — skipping`
      )
      return
    }

    const baseData = {
      firstName: pilot.first_name,
      lastName: pilot.last_name,
      email: pilot.email,
      rank: pilot.role || 'Pilot',
    }

    switch (event) {
      case 'submitted':
        await sendRequestSubmittedEmail({ ...baseData, ...requestData })
        break

      case 'edited':
        await sendRequestEditedEmail({ ...baseData, ...requestData })
        break

      case 'withdrawn':
        await sendRequestWithdrawnEmail({ ...baseData, ...requestData })
        break

      case 'in_review':
        await sendRequestInReviewEmail({ ...baseData, ...requestData })
        break

      case 'approved':
        if (requestData.requestCategory === 'LEAVE') {
          await sendLeaveRequestApprovalEmail({
            ...baseData,
            requestType: requestData.requestType,
            startDate: requestData.startDate,
            endDate: requestData.endDate || requestData.startDate,
            daysCount: requestData.daysCount || 1,
            reviewerComments: requestData.reviewerComments || undefined,
          })
        } else {
          await sendFlightRequestApprovalEmail({
            ...baseData,
            requestType: requestData.requestType,
            flightDate: requestData.flightDate || requestData.startDate,
            description: requestData.description || requestData.requestType,
            reviewerComments: requestData.reviewerComments || undefined,
          })
        }
        break

      case 'denied':
        if (requestData.requestCategory === 'LEAVE') {
          await sendLeaveRequestDenialEmail({
            ...baseData,
            requestType: requestData.requestType,
            startDate: requestData.startDate,
            endDate: requestData.endDate || requestData.startDate,
            daysCount: requestData.daysCount || 1,
            denialReason: requestData.denialReason || undefined,
            reviewerComments: requestData.reviewerComments || undefined,
          })
        } else {
          await sendFlightRequestDenialEmail({
            ...baseData,
            requestType: requestData.requestType,
            flightDate: requestData.flightDate || requestData.startDate,
            description: requestData.description || requestData.requestType,
            denialReason: requestData.denialReason || undefined,
            reviewerComments: requestData.reviewerComments || undefined,
          })
        }
        break
    }

    console.log(
      `[sendRequestLifecycleEmail] Sent '${event}' email to ${pilot.email} for ${requestData.requestCategory} request`
    )
  } catch (error) {
    console.error(
      `[sendRequestLifecycleEmail] Failed to send '${event}' email for pilot ${pilotId}:`,
      error instanceof Error ? error.message : error
    )
  }
}

/**
 * Send email notification to configured admin addresses when a pilot submits a request.
 *
 * Reads the `admin_notification_emails` setting (JSON array of up to 2 email addresses).
 * If no emails are configured, exits silently. Fire-and-forget — never throws.
 */
export async function sendAdminRequestNotificationEmail(params: {
  pilotName: string
  requestCategory: 'LEAVE' | 'FLIGHT'
  requestType: string
  startDate: string
  endDate: string | null
  requestId: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const setting = await getSystemSetting('admin_notification_emails')
    if (!setting?.value) {
      return { success: true } // No setting configured — no-op
    }

    const emails: unknown = typeof setting.value === 'string'
      ? JSON.parse(setting.value)
      : setting.value

    if (!Array.isArray(emails) || emails.length === 0) {
      return { success: true } // Empty list — no-op
    }

    // Validate and cap at 2 addresses
    const validEmails = emails
      .filter((e): e is string => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      .slice(0, 2)

    if (validEmails.length === 0) {
      return { success: true }
    }

    const resend = getResendClient()
    const categoryLabel = params.requestCategory === 'LEAVE' ? 'Leave' : 'RDO/SDO'
    const dateRange = params.endDate && params.endDate !== params.startDate
      ? `${params.startDate} to ${params.endDate}`
      : params.startDate
    const dashboardLink = `${EMAIL_CONFIG.appUrl}/dashboard/requests/${params.requestId}`

    const subject = `New ${categoryLabel} Request — ${params.pilotName}`
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="margin-bottom: 16px;">New ${categoryLabel} Request Submitted</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 8px 0; color: #666;">Pilot</td><td style="padding: 8px 0; font-weight: 600;">${params.pilotName}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Type</td><td style="padding: 8px 0;">${params.requestType}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Date(s)</td><td style="padding: 8px 0;">${dateRange}</td></tr>
        </table>
        <a href="${dashboardLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
          View Request
        </a>
        <p style="margin-top: 24px; font-size: 13px; color: #888;">
          This is an automated notification from ${EMAIL_CONFIG.appName}.
        </p>
      </div>
    `

    await Promise.all(
      validEmails.map((email) =>
        resend.emails.send({
          from: EMAIL_CONFIG.from,
          to: email,
          subject,
          html,
        })
      )
    )

    console.log(
      `[sendAdminRequestNotificationEmail] Sent admin notification to ${validEmails.join(', ')} for ${params.requestCategory} request ${params.requestId}`
    )
    return { success: true }
  } catch (error) {
    console.error('[sendAdminRequestNotificationEmail] Failed:', error instanceof Error ? error.message : error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
