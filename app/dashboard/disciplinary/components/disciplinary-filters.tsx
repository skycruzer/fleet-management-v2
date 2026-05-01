'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface DisciplinaryFiltersProps {
  currentStatus?: string
  currentSeverity?: string
}

const ALL_VALUE = '__all__'

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

export function DisciplinaryFilters({ currentStatus, currentSeverity }: DisciplinaryFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== ALL_VALUE) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="mb-6 flex flex-wrap gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status-filter" className="sr-only">
          Filter by status
        </Label>
        <Select
          value={currentStatus || ALL_VALUE}
          onValueChange={(value) => updateParam('status', value)}
        >
          <SelectTrigger id="status-filter" aria-label="Filter by status" className="w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All Statuses</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="severity-filter" className="sr-only">
          Filter by severity
        </Label>
        <Select
          value={currentSeverity || ALL_VALUE}
          onValueChange={(value) => updateParam('severity', value)}
        >
          <SelectTrigger id="severity-filter" aria-label="Filter by severity" className="w-48">
            <SelectValue placeholder="All Severities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All Severities</SelectItem>
            {SEVERITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
