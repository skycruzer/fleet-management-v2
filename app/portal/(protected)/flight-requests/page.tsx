/**
 * Flight Requests Page — Redirect to Unified Requests
 * Developer: Maurice Rondeau
 *
 * This page now redirects to the unified /portal/requests page with the RDO/SDO tab active.
 * The /flight-requests/new sub-route is preserved for creating new flight requests.
 */

import { redirect } from 'next/navigation'

export default function FlightRequestsPage() {
  redirect('/portal/requests?tab=rdo-sdo')
}
