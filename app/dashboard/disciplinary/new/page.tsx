import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getIncidentTypes, getPilotsForSelection } from '@/lib/services/disciplinary-service'
import { getAssignableUsers } from '@/lib/services/user-service'
import DisciplinaryMatterForm from '@/components/disciplinary/disciplinary-matter-form'
// Force dynamic rendering to prevent static generation at build time
/**
 * New Disciplinary Matter Page (Admin)
 *
 * Page for creating new disciplinary matters.
 *
 * @spec 001-missing-core-features (US6, T097)
 */

export default async function NewDisciplinaryMatterPage() {
  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  // Fetch pilots, users, and incident types via service layer
  const [pilotsResult, usersResult, incidentTypesResult] = await Promise.all([
    getPilotsForSelection(),
    getAssignableUsers(),
    getIncidentTypes(),
  ])
  const pilots = pilotsResult.data ?? []
  const users = usersResult.data ?? []
  const incidentTypes = incidentTypesResult.success ? incidentTypesResult.data : []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-foreground text-xl font-semibold">Create Disciplinary Matter</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Create a new disciplinary matter and assign it for investigation
        </p>
      </div>

      {/* Form */}
      <div className="bg-card border-border mx-auto max-w-4xl rounded-lg border p-6 shadow-sm">
        <DisciplinaryMatterForm pilots={pilots} users={users} incidentTypes={incidentTypes} />
      </div>
    </div>
  )
}
