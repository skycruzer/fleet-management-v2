import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getMatterWithTimeline, getIncidentTypes } from '@/lib/services/disciplinary-service'
import DisciplinaryMatterForm from '@/components/disciplinary/DisciplinaryMatterForm'
import Link from 'next/link'
// Force dynamic rendering to prevent static generation at build time
export const dynamic = 'force-dynamic'


/**
 * Disciplinary Matter Detail/Edit Page (Admin)
 *
 * View and edit disciplinary matter details with timeline of actions.
 *
 * @spec 001-missing-core-features (US6, T098)
 */

interface DisciplinaryDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function DisciplinaryDetailPage({ params }: DisciplinaryDetailPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Await params in Next.js 16
  const { id } = await params

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    notFound()
  }

  // Fetch matter with timeline
  const matterResult = await getMatterWithTimeline(id)

  if (!matterResult.success || !matterResult.data) {
    notFound()
  }

  const matter = matterResult.data

  // Fetch pilots for form
  const { data: pilots } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, role, employee_id')
    .order('last_name', { ascending: true })

  // Fetch users for form
  const { data: users } = await supabase
    .from('an_users')
    .select('id, email, name')
    .order('name', { ascending: true })

  // Fetch incident types
  const incidentTypesResult = await getIncidentTypes()
  const incidentTypes = incidentTypesResult.success ? incidentTypesResult.data : []

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'SERIOUS':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'MINOR':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'UNDER_INVESTIGATION':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'ACTION_TAKEN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'APPEALED':
        return 'bg-primary/10 text-primary-foreground dark:bg-purple-900/20 dark:text-primary'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/dashboard/disciplinary"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Disciplinary Matters
        </Link>
      </div>

      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{matter.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeColor(matter.status)}`}>
              {matter.status.replace(/_/g, ' ')}
            </span>
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getSeverityBadgeColor(matter.severity)}`}>
              {matter.severity}
            </span>
            {matter.incident_date && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Incident: {new Date(matter.incident_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Matter Metadata */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Matter Information</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pilot</p>
            <p className="mt-1 text-gray-900 dark:text-white">
              {matter.pilot
                ? `${matter.pilot.role} ${matter.pilot.first_name} ${matter.pilot.last_name}`
                : 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Reported By</p>
            <p className="mt-1 text-gray-900 dark:text-white">
              {matter.reported_by_user?.name || matter.reported_by_user?.email || 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Assigned To</p>
            <p className="mt-1 text-gray-900 dark:text-white">
              {matter.assigned_to_user?.name || matter.assigned_to_user?.email || 'Unassigned'}
            </p>
          </div>
          {matter.incident_type && (
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Incident Type</p>
              <p className="mt-1 text-gray-900 dark:text-white">{matter.incident_type.name}</p>
            </div>
          )}
          {matter.flight_number && (
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Flight Number</p>
              <p className="mt-1 text-gray-900 dark:text-white">{matter.flight_number}</p>
            </div>
          )}
          {matter.aircraft_registration && (
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aircraft</p>
              <p className="mt-1 text-gray-900 dark:text-white">{matter.aircraft_registration}</p>
            </div>
          )}
          {matter.location && (
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Location</p>
              <p className="mt-1 text-gray-900 dark:text-white">{matter.location}</p>
            </div>
          )}
          {matter.due_date && (
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Due Date</p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {new Date(matter.due_date).toLocaleDateString()}
              </p>
            </div>
          )}
          {matter.resolved_date && (
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved Date</p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {new Date(matter.resolved_date).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        {matter.description && (
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</p>
            <p className="mt-2 whitespace-pre-wrap text-gray-900 dark:text-white">{matter.description}</p>
          </div>
        )}
      </div>

      {/* Actions Timeline removed - disciplinary_actions table no longer exists */}

      {/* Edit Form */}
      <div className="mx-auto max-w-4xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">Edit Matter</h2>
        <DisciplinaryMatterForm
          matter={matter}
          pilots={pilots || []}
          users={users || []}
          incidentTypes={incidentTypes}
        />
      </div>
    </div>
  )
}
