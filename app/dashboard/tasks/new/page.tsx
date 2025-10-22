import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTaskCategories } from '@/lib/services/task-service'
import TaskForm from '@/components/tasks/TaskForm'

/**
 * New Task Page (Admin)
 *
 * Page for creating new tasks.
 *
 * @spec 001-missing-core-features (US5)
 */

export default async function NewTaskPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch users for assignment
  const { data: users } = await supabase
    .from('an_users')
    .select('id, email, full_name')
    .order('full_name', { ascending: true })

  // Fetch pilots for task relations
  const { data: pilots } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, rank')
    .order('last_name', { ascending: true })

  // Fetch categories
  const categoriesResult = await getTaskCategories()
  const categories = categoriesResult.success ? categoriesResult.data : []

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Task</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create a task and assign it to a team member
        </p>
      </div>

      {/* Task Form */}
      <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <TaskForm users={users || []} pilots={pilots || []} categories={categories} />
      </div>
    </div>
  )
}
