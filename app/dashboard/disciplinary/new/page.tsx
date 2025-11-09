import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getIncidentTypes } from '@/lib/services/disciplinary-service'
import DisciplinaryMatterForm from '@/components/disciplinary/disciplinary-matter-form'
// Force dynamic rendering to prevent static generation at build time
export const dynamic = 'force-dynamic'


/**
 * New Disciplinary Matter Page (Admin)
 *
 * Page for creating new disciplinary matters.
 *
 * @spec 001-missing-core-features (US6, T097)
 */

export default async function NewDisciplinaryMatterPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Disciplinary Matter</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create a new disciplinary matter and assign it for investigation
        </p>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-4xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <DisciplinaryMatterForm pilots={pilots || []} users={users || []} incidentTypes={incidentTypes} />
      </div>
    </div>
  )
}
