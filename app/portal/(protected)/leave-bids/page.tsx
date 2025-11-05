/**
 * Pilot Leave Bids View Page
 *
 * Allows pilots to view their submitted leave bids and their status.
 * Displays all leave bids with ability to cancel pending bids.
 *
 * @spec Leave bid view functionality
 * @developer Maurice Rondeau
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import { getCurrentPilotLeaveBids } from '@/lib/services/leave-bid-service'
import { LeaveBidsClient } from '@/components/portal/leave-bids-client'

export const metadata: Metadata = {
  title: 'My Leave Bids | Pilot Portal',
  description: 'View your submitted leave bids and their status',
}

export default async function LeaveBidsPage() {
  // Verify pilot authentication
  const pilot = await getCurrentPilot()
  if (!pilot) {
    redirect('/portal/login')
  }

  // Fetch pilot's leave bids
  const bidsResult = await getCurrentPilotLeaveBids()

  const leaveBids = bidsResult.success ? bidsResult.data || [] : []

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">My Leave Bids</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          View your submitted leave bids and their approval status
        </p>
      </div>

      <LeaveBidsClient initialBids={leaveBids} />
    </div>
  )
}
