import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getIncidentTypes } from '@/lib/services/disciplinary-service'
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

  const supabase = await createClient()

  // Fetch pilots for selection
  const { data: pilots } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, role, employee_id')
    .order('last_name', { ascending: true })

  // Fetch users for assignment
  const { data: users } = await supabase
    .from('an_users')
    .select('id, email, name')
    .order('name', { ascending: true })

  // Fetch incident types
  const incidentTypesResult = await getIncidentTypes()
  const incidentTypes = incidentTypesResult.success ? incidentTypesResult.data : []

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-foreground text-3xl font-bold">Create Disciplinary Matter</h1>
        <p className="text-muted-foreground mt-2">
          Create a new disciplinary matter and assign it for investigation
        </p>
      </div>

      {/* Form */}
      <div className="bg-card border-border mx-auto max-w-4xl rounded-lg border p-6 shadow-sm">
        <DisciplinaryMatterForm
          pilots={pilots || []}
          users={users || []}
          incidentTypes={incidentTypes}
        />
      </div>
    </div>
  )
}
