import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getTaskCategories } from '@/lib/services/task-service'
import TaskForm from '@/components/tasks/task-form'
// Force dynamic rendering to prevent static generation at build time
/**
 * New Task Page (Admin)
 *
 * Page for creating new tasks.
 *
 * @spec 001-missing-core-features (US5)
 */

export default async function NewTaskPage() {
  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  const supabase = await createClient()

  // Fetch users for assignment
  const { data: users } = await supabase
    .from('an_users')
    .select('id, email, name')
    .order('name', { ascending: true })

  // Fetch pilots for task relations
  const { data: pilots } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, role')
    .order('last_name', { ascending: true })

  // Fetch categories
  const categoriesResult = await getTaskCategories()
  const categories = categoriesResult.success ? categoriesResult.data : []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
          Create New Task
        </h1>
        <p className="text-muted-foreground mt-2">Create a task and assign it to a team member</p>
      </div>

      {/* Task Form */}
      <div className="bg-card border-border mx-auto max-w-3xl rounded-lg border p-6 shadow-sm">
        <TaskForm users={users || []} pilots={pilots || []} categories={categories} />
      </div>
    </div>
  )
}
