import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getCurrentPilotLeaveRequests,
  getPilotLeaveStats,
} from '@/lib/services/pilot-leave-service'
import LeaveRequestForm from '@/components/pilot/LeaveRequestForm'
import LeaveRequestsList from '@/components/pilot/LeaveRequestsList'
// Force dynamic rendering to prevent static generation at build time
export const dynamic = 'force-dynamic'

/**
 * Pilot Leave Request Page
 *
 * Allows pilots to submit and manage their leave requests.
 * Displays form for new requests and list of existing requests.
 *
 * @spec 001-missing-core-features (US2, T049)
 */
export default async function PilotLeavePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect if not authenticated
  if (!user) {
    redirect('/pilot/login')
  }

  // Check if pilot user
  const { data: pilotUser } = await supabase
    .from('pilot_users')
    .select('id, registration_approved')
    .eq('id', user.id)
    .maybeSingle()

  if (!pilotUser) {
    redirect('/pilot/login')
  }

  // Show pending approval message if not approved
  if (!pilotUser.registration_approved) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg bg-amber-500/10 p-6 text-center shadow">
          <h1 className="text-2xl font-bold text-amber-400">Registration Pending Approval</h1>
          <p className="mt-2 text-amber-400">
            Your pilot registration is pending approval by the fleet management team. You will be
            able to submit leave requests once your registration is approved.
          </p>
        </div>
      </div>
    )
  }

  // Fetch leave requests and stats
  const leaveRequestsResult = await getCurrentPilotLeaveRequests()
  const leaveStatsResult = await getPilotLeaveStats()

  const leaveRequests = leaveRequestsResult.success ? leaveRequestsResult.data || [] : []
  const stats =
    leaveStatsResult.success && leaveStatsResult.data
      ? leaveStatsResult.data
      : { total: 0, submitted: 0, in_review: 0, approved: 0, denied: 0, withdrawn: 0 }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-foreground text-3xl font-bold">Leave Requests</h1>
        <p className="text-muted-foreground mt-2">Submit and manage your leave requests</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Requests" value={stats.total} color="blue" />
        <StatCard title="Submitted" value={stats.submitted} color="yellow" />
        <StatCard title="Approved" value={stats.approved} color="green" />
        <StatCard title="Denied" value={stats.denied} color="red" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Leave Request Form */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg p-6 shadow">
            <h2 className="text-foreground mb-4 text-xl font-bold">Submit New Request</h2>
            <LeaveRequestForm />
          </div>
        </div>

        {/* Leave Requests List */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg p-6 shadow">
            <h2 className="text-foreground mb-4 text-xl font-bold">Your Leave Requests</h2>
            <LeaveRequestsList requests={leaveRequests} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({
  title,
  value,
  color,
}: {
  title: string
  value: number
  color: 'blue' | 'yellow' | 'green' | 'red'
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400',
    yellow: 'bg-amber-500/10 text-amber-400',
    green: 'bg-emerald-500/10 text-emerald-400',
    red: 'bg-red-500/10 text-red-400',
  }

  return (
    <div className="bg-card rounded-lg p-6 shadow">
      <p className="text-muted-foreground text-sm font-medium">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  )
}
