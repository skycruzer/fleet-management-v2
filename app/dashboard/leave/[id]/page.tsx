/**
 * Leave Request Detail Redirect
 * Author: Maurice Rondeau
 *
 * DEPRECATED: Redirects to unified request detail page
 * This page is scheduled for removal after 30 days
 */

import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LeaveRequestDetailRedirect({ params }: PageProps) {
  const { id } = await params
  redirect(`/dashboard/requests/${id}`)
}
