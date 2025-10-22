import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentPilotFlightRequests, getPilotFlightStats } from '@/lib/services/pilot-flight-service'
import FlightRequestForm from '@/components/pilot/FlightRequestForm'
import FlightRequestsList from '@/components/pilot/FlightRequestsList'

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
        <div className="rounded-lg bg-yellow-50 p-6 text-center shadow dark:bg-yellow-900/20">
          <h1 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
            Registration Pending Approval
          </h1>
          <p className="mt-2 text-yellow-700 dark:text-yellow-300">
            Your pilot registration is pending approval by the fleet management team.
            You will be able to submit flight requests once your registration is approved.
          </p>
        </div>
      </div>
    )
  }

  // Fetch flight requests and stats
  const flightRequestsResult = await getCurrentPilotFlightRequests()
  const flightStatsResult = await getPilotFlightStats()

  const flightRequests = flightRequestsResult.success ? flightRequestsResult.data || [] : []
  const stats = flightStatsResult.success
    ? flightStatsResult.data
    : { total: 0, pending: 0, under_review: 0, approved: 0, denied: 0 }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Flight Requests</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Submit and manage your flight requests for additional flights, route changes, and schedule swaps
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Requests" value={stats.total} color="blue" />
        <StatCard title="Pending" value={stats.pending} color="gray" />
        <StatCard title="Under Review" value={stats.under_review} color="yellow" />
        <StatCard title="Approved" value={stats.approved} color="green" />
        <StatCard title="Denied" value={stats.denied} color="red" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Flight Request Form */}
        <div className="lg:col-span-1">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              Submit New Request
            </h2>
            <FlightRequestForm />
          </div>
        </div>

        {/* Flight Requests List */}
        <div className="lg:col-span-2">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              Your Flight Requests
            </h2>
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
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    gray: 'bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  )
}
