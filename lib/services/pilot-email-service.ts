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

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Email configuration
 */
const EMAIL_CONFIG = {
  from: process.env.RESEND_FROM_EMAIL || 'Fleet Management <noreply@yourdomain.com>',
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

    const { error } = await resend.emails.send({
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

    console.log(`✅ Approval email sent to ${pilotData.email}`)
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
    const supportEmail = 'support@yourdomain.com' // TODO: Update with actual support email

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

      ${denialReason ? `
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #856404;">
          <strong>Reason:</strong> ${denialReason}
        </p>
      </div>
      ` : ''}

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

    const { error } = await resend.emails.send({
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

    console.log(`📧 Denial email sent to ${pilotData.email}`)
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

    const { error } = await resend.emails.send({
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

    console.log(`✅ Leave approval email sent to ${requestData.email}`)
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
        ${requestData.denialReason || requestData.reviewerComments ? `
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #856404;">
          <strong>Reason:</strong> ${requestData.denialReason || requestData.reviewerComments}
        </p>
        ` : ''}
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

    const { error } = await resend.emails.send({
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

    console.log(`📧 Leave denial email sent to ${requestData.email}`)
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

    const { error } = await resend.emails.send({
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

    console.log(`✅ Flight approval email sent to ${requestData.email}`)
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
        ${requestData.denialReason || requestData.reviewerComments ? `
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #856404;">
          <strong>Reason:</strong> ${requestData.denialReason || requestData.reviewerComments}
        </p>
        ` : ''}
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

    const { error } = await resend.emails.send({
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

    console.log(`📧 Flight denial email sent to ${requestData.email}`)
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
        message: 'requires immediate action'
      },
      warning: {
        color: '#ffc107',
        icon: '🟡',
        label: 'WARNING',
        message: 'expiring soon'
      },
      notice: {
        color: '#0066cc',
        icon: '🔵',
        label: 'NOTICE',
        message: 'plan ahead'
      }
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

      ${data.certifications.map(cert => `
      <div style="background-color: ${data.urgencyLevel === 'critical' ? '#fff5f5' : data.urgencyLevel === 'warning' ? '#fff3cd' : '#e7f3ff'}; border-left: 4px solid ${config.color}; padding: 15px; margin: 15px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 16px; color: #333;"><strong>${cert.checkCode}</strong> - ${cert.checkDescription}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #555;">
          <strong>Expiry Date:</strong> ${cert.expiryDate}
        </p>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: ${config.color}; font-weight: bold;">
          ${cert.daysUntilExpiry < 0
            ? `EXPIRED ${Math.abs(cert.daysUntilExpiry)} days ago`
            : `${cert.daysUntilExpiry} days remaining`}
        </p>
      </div>
      `).join('')}

      <div style="background-color: #f8f9fa; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #333;"><strong>Action Required:</strong></p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px; color: #555;">
          ${data.urgencyLevel === 'critical'
            ? '<li><strong>DO NOT FLY</strong> with expired certifications</li><li>Contact training immediately to schedule renewal</li><li>Update your status in the system</li>'
            : data.urgencyLevel === 'warning'
            ? '<li>Schedule renewal as soon as possible</li><li>Contact training to book your renewal</li><li>Review renewal requirements</li>'
            : '<li>Plan your renewal well in advance</li><li>Check training calendar availability</li><li>Prepare required documentation</li>'}
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

${data.certifications.map(cert => `
${cert.checkCode} - ${cert.checkDescription}
Expiry Date: ${cert.expiryDate}
${cert.daysUntilExpiry < 0
  ? `EXPIRED ${Math.abs(cert.daysUntilExpiry)} days ago`
  : `${cert.daysUntilExpiry} days remaining`}
`).join('\n')}

Action Required:
${data.urgencyLevel === 'critical'
  ? '- DO NOT FLY with expired certifications\n- Contact training immediately to schedule renewal\n- Update your status in the system'
  : data.urgencyLevel === 'warning'
  ? '- Schedule renewal as soon as possible\n- Contact training to book your renewal\n- Review renewal requirements'
  : '- Plan your renewal well in advance\n- Check training calendar availability\n- Prepare required documentation'}

View your certifications: ${portalUrl}

If you have questions, please contact the training department immediately.

---
This is an automated safety alert from ${EMAIL_CONFIG.appName}.
Please do not reply to this email.
    `.trim()

    const { error } = await resend.emails.send({
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

    console.log(`🔔 Certification expiry alert sent to ${data.email}`)
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

    const { error } = await resend.emails.send({
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

    console.log(`🔑 Password reset email sent to ${data.email}`)
    return { success: true }
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
