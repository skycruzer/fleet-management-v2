import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getMatterWithTimeline, getIncidentTypes } from '@/lib/services/disciplinary-service'
import DisciplinaryMatterForm from '@/components/disciplinary/DisciplinaryMatterForm'
import Link from 'next/link'
// Force dynamic rendering to prevent static generation at build time
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
  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  const supabase = await createClient()

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
        return 'bg-red-500/10 text-red-400'
      case 'SERIOUS':
        return 'bg-orange-500/10 text-orange-400'
      case 'MODERATE':
        return 'bg-amber-500/10 text-amber-400'
      case 'MINOR':
        return 'bg-blue-500/10 text-blue-400'
      default:
        return 'bg-white/[0.03] text-foreground'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-emerald-500/10 text-emerald-400'
      case 'UNDER_INVESTIGATION':
        return 'bg-amber-500/10 text-amber-400'
      case 'ACTION_TAKEN':
        return 'bg-blue-500/10 text-blue-400'
      case 'APPEALED':
        return 'bg-primary/10 text-primary-foreground'
      default:
        return 'bg-white/[0.03] text-foreground'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/dashboard/disciplinary"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Disciplinary Matters
        </Link>
      </div>

      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold">{matter.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeColor(matter.status)}`}
            >
              {matter.status.replace(/_/g, ' ')}
            </span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getSeverityBadgeColor(matter.severity)}`}
            >
              {matter.severity}
            </span>
            {matter.incident_date && (
              <span className="text-muted-foreground text-sm">
                Incident: {new Date(matter.incident_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Matter Metadata */}
      <div className="bg-card mb-8 rounded-lg border border-white/[0.08] p-6 shadow-sm">
        <h2 className="text-foreground mb-4 text-lg font-semibold">Matter Information</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-sm font-medium">Pilot</p>
            <p className="text-foreground mt-1">
              {matter.pilot
                ? `${matter.pilot.role} ${matter.pilot.first_name} ${matter.pilot.last_name}`
                : 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Reported By</p>
            <p className="text-foreground mt-1">
              {matter.reported_by_user?.name || matter.reported_by_user?.email || 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Assigned To</p>
            <p className="text-foreground mt-1">
              {matter.assigned_to_user?.name || matter.assigned_to_user?.email || 'Unassigned'}
            </p>
          </div>
          {matter.incident_type && (
            <div>
              <p className="text-muted-foreground text-sm font-medium">Incident Type</p>
              <p className="text-foreground mt-1">{matter.incident_type.name}</p>
            </div>
          )}
          {matter.flight_number && (
            <div>
              <p className="text-muted-foreground text-sm font-medium">Flight Number</p>
              <p className="text-foreground mt-1">{matter.flight_number}</p>
            </div>
          )}
          {matter.aircraft_registration && (
            <div>
              <p className="text-muted-foreground text-sm font-medium">Aircraft</p>
              <p className="text-foreground mt-1">{matter.aircraft_registration}</p>
            </div>
          )}
          {matter.location && (
            <div>
              <p className="text-muted-foreground text-sm font-medium">Location</p>
              <p className="text-foreground mt-1">{matter.location}</p>
            </div>
          )}
          {matter.due_date && (
            <div>
              <p className="text-muted-foreground text-sm font-medium">Due Date</p>
              <p className="text-foreground mt-1">
                {new Date(matter.due_date).toLocaleDateString()}
              </p>
            </div>
          )}
          {matter.resolved_date && (
            <div>
              <p className="text-muted-foreground text-sm font-medium">Resolved Date</p>
              <p className="text-foreground mt-1">
                {new Date(matter.resolved_date).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        {matter.description && (
          <div className="mt-6">
            <p className="text-muted-foreground text-sm font-medium">Description</p>
            <p className="text-foreground mt-2 whitespace-pre-wrap">{matter.description}</p>
          </div>
        )}
      </div>

      {/* Actions Timeline removed - disciplinary_actions table no longer exists */}

      {/* Edit Form */}
      <div className="bg-card mx-auto max-w-4xl rounded-lg border border-white/[0.08] p-6 shadow-sm">
        <h2 className="text-foreground mb-6 text-lg font-semibold">Edit Matter</h2>
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
