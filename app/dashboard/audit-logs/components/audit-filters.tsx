'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface AuditFiltersProps {
  currentUserEmail?: string
  currentTableName?: string
  currentAction?: string
  tables: string[]
  users: { email: string; role: string }[]
}

export function AuditFilters({
  currentUserEmail,
  currentTableName,
  currentAction,
  tables,
  users,
}: AuditFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset to page 1 when changing filters
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="mb-6 flex flex-wrap gap-4">
      {/* User Email Filter */}
      <div>
        <label htmlFor="user-filter" className="sr-only">
          Filter by user
        </label>
        <select
          id="user-filter"
          value={currentUserEmail || ''}
          onChange={(e) => handleFilterChange('userEmail', e.target.value)}
          className="border-border rounded-md border px-3 py-2 text-sm focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] focus:outline-none"
        >
          <option value="">All Users</option>
          {users.map((user) => (
            <option key={user.email} value={user.email}>
              {user.email} ({user.role})
            </option>
          ))}
        </select>
      </div>

      {/* Table Name Filter */}
      <div>
        <label htmlFor="table-filter" className="sr-only">
          Filter by table
        </label>
        <select
          id="table-filter"
          value={currentTableName || ''}
          onChange={(e) => handleFilterChange('tableName', e.target.value)}
          className="border-border rounded-md border px-3 py-2 text-sm focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] focus:outline-none"
        >
          <option value="">All Tables</option>
          {tables.map((table) => (
            <option key={table} value={table}>
              {table}
            </option>
          ))}
        </select>
      </div>

      {/* Action Filter */}
      <div>
        <label htmlFor="action-filter" className="sr-only">
          Filter by action
        </label>
        <select
          id="action-filter"
          value={currentAction || ''}
          onChange={(e) => handleFilterChange('action', e.target.value)}
          className="border-border rounded-md border px-3 py-2 text-sm focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] focus:outline-none"
        >
          <option value="">All Actions</option>
          <option value="INSERT">Insert</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="RESTORE">Restore</option>
          <option value="SOFT_DELETE">Soft Delete</option>
        </select>
      </div>
    </div>
  )
}
