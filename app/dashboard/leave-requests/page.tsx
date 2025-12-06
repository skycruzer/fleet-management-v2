/**
 * Leave Requests Redirect Page
 * Author: Maurice Rondeau
 * Redirects /dashboard/leave-requests → /dashboard/leave
 */

import { redirect } from 'next/navigation'

export default function LeaveRequestsRedirect() {
  redirect('/dashboard/leave')
}
