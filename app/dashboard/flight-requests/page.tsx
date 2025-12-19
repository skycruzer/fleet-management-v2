/**
 * Flight Requests Redirect
 * Author: Maurice Rondeau
 *
 * DEPRECATED: Redirects to unified requests page
 * This page is scheduled for removal after 30 days
 */

import { redirect } from 'next/navigation'

export default function FlightRequestsRedirect() {
  redirect('/dashboard/requests?tab=flight')
}
