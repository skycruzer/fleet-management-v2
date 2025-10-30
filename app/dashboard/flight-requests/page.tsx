import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllFlightRequests, getFlightRequestStats } from '@/lib/services/flight-request-service'
import { getAllLeaveRequests } from '@/lib/services/leave-service'
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

  // Fetch RDO/SDO requests from leave_requests table
  const allLeaveRequests = await getAllLeaveRequests()
  const rdoSdoRequests = allLeaveRequests.filter(
    req => req.request_type === 'RDO' || req.request_type === 'SDO'
  )

  // Convert RDO/SDO leave requests to flight request format for display
  const convertedRdoSdo = rdoSdoRequests.map(req => ({
    id: req.id,
    pilot_id: req.pilot_id,
    request_type: req.request_type as 'RDO' | 'SDO',
    flight_date: req.start_date,
    description: `${req.request_type} Request: ${req.start_date} to ${req.end_date}`,
    reason: req.reason || null,
    status: req.status,
    review_comments: req.review_comments || null,
    reviewed_by: req.reviewed_by || null,
    reviewed_at: req.reviewed_at || null,
    created_at: req.created_at,
    updated_at: req.created_at, // Use created_at as fallback for updated_at
    pilots: req.pilots,
    // Extract pilot information for table display
    pilot_name: req.pilots ? `${req.pilots.first_name} ${req.pilots.last_name}` : 'Unknown',
    pilot_rank: req.pilots?.role || null, // Fixed: use role instead of rank
    reviewer_name: null // Will be populated when reviewed
  }))

  const flightRequests = flightRequestsResult.success ? flightRequestsResult.data || [] : []

  // Combine flight requests with RDO/SDO requests
  // Type cast to FlightRequest[] for table compatibility
  const allRequests = [...flightRequests, ...convertedRdoSdo] as any[]

  // Calculate combined stats
  const combinedStats = {
    total: allRequests.length,
    pending: allRequests.filter(r => r.status === 'PENDING').length,
    under_review: allRequests.filter(r => r.status === 'UNDER_REVIEW').length,
    approved: allRequests.filter(r => r.status === 'APPROVED').length,
    denied: allRequests.filter(r => r.status === 'DENIED').length,
    by_type: {
      additional_flight: allRequests.filter(r => r.request_type === 'ADDITIONAL_FLIGHT').length,
      route_change: allRequests.filter(r => r.request_type === 'ROUTE_CHANGE').length,
      schedule_swap: allRequests.filter(r => r.request_type === 'SCHEDULE_SWAP').length,
      rdo: allRequests.filter(r => r.request_type === 'RDO').length,
      sdo: allRequests.filter(r => r.request_type === 'SDO').length,
      other: allRequests.filter(r => r.request_type === 'OTHER').length,
    },
  }

  const stats = combinedStats

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Flight & Off-Duty Requests Management
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Review and manage pilot flight requests, RDO, SDO, and schedule changes
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
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
        <TypeCard title="Additional Flights" value={stats.by_type.additional_flight} />
        <TypeCard title="Route Changes" value={stats.by_type.route_change} />
        <TypeCard title="Schedule Swaps" value={stats.by_type.schedule_swap} />
        <TypeCard title="RDO Requests" value={stats.by_type.rdo} />
        <TypeCard title="SDO Requests" value={stats.by_type.sdo} />
        <TypeCard title="Other Requests" value={stats.by_type.other} />
      </div>

      {/* Flight Requests Table */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          All Flight & Off-Duty Requests
        </h2>
        <FlightRequestsTable requests={allRequests} />
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
