'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface DisciplinaryFiltersProps {
  currentStatus?: string
  currentSeverity?: string
}

export function DisciplinaryFilters({ currentStatus, currentSeverity }: DisciplinaryFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('status', value)
    } else {
      params.delete('status')
    }
    router.push(`?${params.toString()}`)
  }

  const handleSeverityChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('severity', value)
    } else {
      params.delete('severity')
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="mb-6 flex flex-wrap gap-4">
      <div>
        <label htmlFor="status-filter" className="sr-only">
          Filter by status
        </label>
        <select
          id="status-filter"
          value={currentStatus || ''}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="rounded-md border border-white/[0.1] px-3 py-2 text-sm focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="REPORTED">Reported</option>
          <option value="UNDER_INVESTIGATION">Under Investigation</option>
          <option value="PENDING_DECISION">Pending Decision</option>
          <option value="ACTION_TAKEN">Action Taken</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="APPEALED">Appealed</option>
        </select>
      </div>

      <div>
        <label htmlFor="severity-filter" className="sr-only">
          Filter by severity
        </label>
        <select
          id="severity-filter"
          value={currentSeverity || ''}
          onChange={(e) => handleSeverityChange(e.target.value)}
          className="rounded-md border border-white/[0.1] px-3 py-2 text-sm focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] focus:outline-none"
        >
          <option value="">All Severities</option>
          <option value="MINOR">Minor</option>
          <option value="MODERATE">Moderate</option>
          <option value="SERIOUS">Serious</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>
    </div>
  )
}
