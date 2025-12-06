import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllFlightRequests, getFlightRequestStats } from '@/lib/services/flight-request-service'
import FlightRequestsTable from '@/components/admin/FlightRequestsTable'

// Force dynamic rendering to prevent static generation at build time
export const dynamic = 'force-dynamic'

/**
 * Admin Flight Requests Page
 *
 * Allows admins to review and manage pilot flight requests.
 * Displays stats and table with filtering capabilities.
 *
 * @spec 001-missing-core-features (US3, T061)
 */
export default async function AdminFlightRequestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect if not authenticated
  if (!user) {
    redirect('/auth/login')
  }

  // Check if admin/manager user
  const { data: adminUser } = await supabase
    .from('an_users')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!adminUser) {
    redirect('/auth/login')
  }

  // Fetch flight requests and stats
  const flightRequestsResult = await getAllFlightRequests()
  const flightStatsResult = await getFlightRequestStats()

  const flightRequests = flightRequestsResult.success ? flightRequestsResult.data || [] : []
  const stats =
    flightStatsResult.success && flightStatsResult.data
      ? flightStatsResult.data
      : {
          total: 0,
          pending: 0,
          under_review: 0,
          approved: 0,
          denied: 0,
          by_type: {
            additional_flight: 0,
            route_change: 0,
            schedule_swap: 0,
            other: 0,
          },
        }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Flight Requests Management
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Review and manage pilot flight requests and schedule changes
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
          Note: RDO and SDO requests are managed through the{' '}
          <a href="/dashboard/leave" className="text-blue-600 hover:underline dark:text-blue-400">
            Leave Requests
          </a>{' '}
          page
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

      {/* Request Type Breakdown */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <TypeCard title="Additional Flights" value={stats.by_type.additional_flight} />
        <TypeCard title="Route Changes" value={stats.by_type.route_change} />
        <TypeCard title="Schedule Swaps" value={stats.by_type.schedule_swap} />
        <TypeCard title="Other Requests" value={stats.by_type.other} />
      </div>

      {/* Flight Requests Table */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          All Flight Requests
        </h2>
        <FlightRequestsTable requests={flightRequests} />
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

// Type Card Component
function TypeCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}
