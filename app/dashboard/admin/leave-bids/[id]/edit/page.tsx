/**
 * Leave Bid Edit Page
 * Allows administrators to edit leave bid details and status
 */

import { redirect, notFound } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { LeaveBidEditForm } from '@/components/admin/leave-bid-edit-form'
import { getLeaveBidByIdForAdmin } from '@/lib/services/leave-bid-service'
import type { AdminLeaveBid } from '@/lib/types/admin-leave-bid'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LeaveBidEditPage({ params }: PageProps) {
  const { id } = await params

  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  // Fetch leave bid (related data joined, options normalized) via service layer
  const result = await getLeaveBidByIdForAdmin(id)
  if (!result.success || !result.data) {
    notFound()
  }

  const bid = result.data

  if (!bid.pilots) {
    notFound()
  }

  const typedBid: AdminLeaveBid & { pilots: NonNullable<typeof bid.pilots> } = {
    ...bid,
    pilots: bid.pilots,
  }

  return (
    <div className="space-y-6">
      <LeaveBidEditForm bid={typedBid} userId={auth.userId!} />
    </div>
  )
}
