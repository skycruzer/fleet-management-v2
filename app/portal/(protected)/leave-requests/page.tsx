/**
 * Leave Requests Page — Redirect to Unified Requests
 * Developer: Maurice Rondeau
 *
 * This page now redirects to the unified /portal/requests page with the leave tab active.
 * The /leave-requests/new sub-route is preserved for creating new leave requests.
 */

import { redirect } from 'next/navigation'

export default function LeaveRequestsPage() {
  redirect('/portal/requests?tab=leave')
}
