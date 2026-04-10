import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getCurrentPilotFlightRequests,
  getPilotFlightStats,
} from '@/lib/services/pilot-flight-service'
import FlightRequestForm from '@/components/pilot/flight-request-form'
import FlightRequestsList from '@/components/pilot/flight-requests-list'
// Force dynamic rendering to prevent static generation at build time
export const dynamic = 'force-dynamic'

/**
 * Pilot Flight Requests Page
 *
 * Allows pilots to submit and manage their flight requests.
 * Displays form for new requests and list of existing requests.
 *
 * @spec 001-missing-core-features (US3, T060)
 */
export default async function PilotFlightRequestsPage() {
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
        <div className="rounded-lg bg-[var(--color-warning-muted)] p-6 text-center shadow">
          <h1 className="text-2xl font-bold text-[var(--color-warning-400)]">
            Registration Pending Approval
          </h1>
          <p className="mt-2 text-[var(--color-warning-400)]">
            Your pilot registration is pending approval by the fleet management team. You will be
            able to submit flight requests once your registration is approved.
          </p>
        </div>
      </div>
    )
  }

  // Fetch flight requests and stats
  const flightRequestsResult = await getCurrentPilotFlightRequests()
  const flightStatsResult = await getPilotFlightStats()

  const flightRequests = flightRequestsResult.success ? flightRequestsResult.data || [] : []
  const stats =
    flightStatsResult.success && flightStatsResult.data
      ? flightStatsResult.data
      : { total: 0, submitted: 0, under_review: 0, approved: 0, denied: 0 }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-foreground text-3xl font-bold">Flight Requests</h1>
        <p className="text-muted-foreground mt-2">
          Submit and manage your flight requests for additional flights, route changes, and schedule
          swaps
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Requests" value={stats.total} color="blue" />
        <StatCard title="Submitted" value={stats.submitted} color="gray" />
        <StatCard title="Under Review" value={stats.under_review} color="yellow" />
        <StatCard title="Approved" value={stats.approved} color="green" />
        <StatCard title="Denied" value={stats.denied} color="red" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Flight Request Form */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg p-6 shadow">
            <h2 className="text-foreground mb-4 text-xl font-bold">Submit New Request</h2>
            <FlightRequestForm />
          </div>
        </div>

        {/* Flight Requests List */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg p-6 shadow">
            <h2 className="text-foreground mb-4 text-xl font-bold">Your Flight Requests</h2>
            <FlightRequestsList requests={flightRequests} />
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
  color: 'blue' | 'gray' | 'yellow' | 'green' | 'red'
}) {
  const colorClasses = {
    blue: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    gray: 'bg-muted/30 text-muted-foreground',
    yellow: 'bg-[var(--color-warning-muted)] text-[var(--color-warning-400)]',
    green: 'bg-[var(--color-success-muted)] text-[var(--color-success-400)]',
    red: 'bg-[var(--color-destructive-muted)] text-[var(--color-danger-400)]',
  }

  return (
    <div className="bg-card rounded-lg p-6 shadow">
      <p className="text-muted-foreground text-sm font-medium">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  )
}
