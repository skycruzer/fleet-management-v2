/**
 * Leave Request Approval Dashboard
 * Admin view for reviewing and approving/denying leave requests
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Leave Request Approval | Fleet Management',
  description: 'Review and approve pilot leave requests',
}

export default async function LeaveApprovalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Leave Request Approval</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage pilot leave requests
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Pending Leave Requests</h2>
        </div>

        <div className="space-y-4">
          {/* Placeholder for leave request list */}
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">
              Leave request approval interface will be displayed here.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This page shows all pending leave requests that require admin review.
            </p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium text-muted-foreground">Pending</div>
              <div className="text-2xl font-bold">0</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium text-muted-foreground">Approved</div>
              <div className="text-2xl font-bold text-green-600">0</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium text-muted-foreground">Denied</div>
              <div className="text-2xl font-bold text-red-600">0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
