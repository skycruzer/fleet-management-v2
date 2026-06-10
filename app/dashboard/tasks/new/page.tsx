import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getAssignableUsers } from '@/lib/services/user-service'
import TaskForm from '@/components/tasks/task-form'

export const dynamic = 'force-dynamic'

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

  // Fetch users for assignment via service layer
  const usersResult = await getAssignableUsers()
  const users = usersResult.data ?? []

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
        <TaskForm users={users} />
      </div>
    </div>
  )
}
