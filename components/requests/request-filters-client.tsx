/**
 * Request Filters Component
 *
 * Provides comprehensive filtering UI for pilot requests.
 * Supports filtering by roster period, status, category, channel, dates, and flags.
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Filter, X, Calendar, AlertTriangle, Clock } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

// ============================================================================
// Type Definitions
// ============================================================================

export interface RequestFilters {
  roster_period?: string | string[] // Support both single and multiple
  status?: string[]
  category?: string[]
  channel?: string[]
  start_date_from?: string
  start_date_to?: string
  is_late?: boolean
  is_past_deadline?: boolean
}

export interface RequestFiltersProps {
  /**
   * Current filter values
   */
  filters: RequestFilters

  /**
   * Callback when filters change
   */
  onFiltersChange: (filters: RequestFilters) => void

  /**
   * Available roster periods for selection
   */
  rosterPeriods?: Array<{
    code: string
    startDate: string
    endDate: string
    status: string
  }>

  /**
   * Show compact view (fewer options)
   */
  compact?: boolean

  /**
   * Custom className
   */
  className?: string
}

// ============================================================================
// Constants
// ============================================================================

const WORKFLOW_STATUSES = [
  { value: 'DRAFT', label: 'Draft', color: 'bg-muted text-muted-foreground' },
  {
    value: 'SUBMITTED',
    label: 'Submitted',
    color: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
  },
  {
    value: 'IN_REVIEW',
    label: 'In Review',
    color: 'bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)]',
  },
  {
    value: 'APPROVED',
    label: 'Approved',
    color: 'bg-[var(--color-status-low-bg)] text-[var(--color-status-low)]',
  },
  {
    value: 'DENIED',
    label: 'Denied',
    color: 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]',
  },
  { value: 'WITHDRAWN', label: 'Withdrawn', color: 'bg-muted text-muted-foreground' },
]

const SUBMISSION_CHANNELS = [
  { value: 'PILOT_PORTAL', label: 'Pilot Portal' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'ORACLE', label: 'Oracle System' },
  { value: 'ADMIN_PORTAL', label: 'Admin Portal' },
]

// ============================================================================
// Component
// ============================================================================

export function RequestFiltersClient({
  filters,
  onFiltersChange,
  rosterPeriods = [],
  compact = false,
  className = '',
}: RequestFiltersProps) {
  const [localFilters, setLocalFilters] = useState<RequestFilters>(filters)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Sync local filters with prop changes
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleRosterPeriodToggle = (period: string) => {
    const currentPeriods = Array.isArray(localFilters.roster_period)
      ? localFilters.roster_period
      : localFilters.roster_period
        ? [localFilters.roster_period]
        : []

    const newPeriods = currentPeriods.includes(period)
      ? currentPeriods.filter((p) => p !== period)
      : [...currentPeriods, period]

    const newFilters = { ...localFilters }
    if (newPeriods.length === 0) {
      delete newFilters.roster_period
    } else {
      newFilters.roster_period = newPeriods
    }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleStatusToggle = (status: string) => {
    const currentStatuses = localFilters.status || []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status]

    const newFilters = { ...localFilters }
    if (newStatuses.length === 0) {
      delete newFilters.status
    } else {
      newFilters.status = newStatuses
    }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleChannelToggle = (channel: string) => {
    const currentChannels = localFilters.channel || []
    const newChannels = currentChannels.includes(channel)
      ? currentChannels.filter((c) => c !== channel)
      : [...currentChannels, channel]

    const newFilters = { ...localFilters }
    if (newChannels.length === 0) {
      delete newFilters.channel
    } else {
      newFilters.channel = newChannels
    }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleDateChange = (field: 'start_date_from' | 'start_date_to', value: string) => {
    const newFilters = { ...localFilters }
    if (value) {
      newFilters[field] = value
    } else {
      delete newFilters[field]
    }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleFlagToggle = (flag: 'is_late' | 'is_past_deadline') => {
    const newFilters = { ...localFilters }
    if (newFilters[flag]) {
      delete newFilters[flag]
    } else {
      newFilters[flag] = true
    }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleClearFilters = () => {
    const emptyFilters: RequestFilters = {}
    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const getActiveFilterCount = () => {
    let count = 0
    if (localFilters.roster_period) count++
    if (localFilters.status && localFilters.status.length > 0) count++
    if (localFilters.category && localFilters.category.length > 0) count++
    if (localFilters.channel && localFilters.channel.length > 0) count++
    if (localFilters.start_date_from) count++
    if (localFilters.start_date_to) count++
    if (localFilters.is_late) count++
    if (localFilters.is_past_deadline) count++
    return count
  }

  const activeFilterCount = getActiveFilterCount()

  // ============================================================================
  // Render: Compact View
  // ============================================================================

  if (compact) {
    const selectedPeriods = Array.isArray(localFilters.roster_period)
      ? localFilters.roster_period
      : localFilters.roster_period
        ? [localFilters.roster_period]
        : []

    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Roster Period Filter */}
        <div className="flex flex-wrap gap-2">
          {rosterPeriods.slice(0, 3).map((period) => (
            <Button
              key={period.code}
              variant={selectedPeriods.includes(period.code) ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRosterPeriodToggle(period.code)}
            >
              {period.code}
              {selectedPeriods.includes(period.code) && <X className="ml-1 h-3 w-3" />}
            </Button>
          ))}
        </div>

        {/* Quick Status Filters */}
        <div className="flex gap-2">
          <Button
            variant={localFilters.status?.includes('SUBMITTED') ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusToggle('SUBMITTED')}
          >
            Submitted
          </Button>
          <Button
            variant={localFilters.status?.includes('IN_REVIEW') ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusToggle('IN_REVIEW')}
          >
            In Review
          </Button>
        </div>

        {/* Active Filters Badge */}
        {activeFilterCount > 0 && (
          <Badge variant="secondary">
            {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
          </Badge>
        )}

        {/* Clear All */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    )
  }

  // ============================================================================
  // Render: Full View
  // ============================================================================

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Filters</CardTitle>
            {activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount} active</Badge>}
          </div>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="mr-1 h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Roster Period Filter */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Roster Period
          </Label>
          <div className="flex flex-wrap gap-2">
            {rosterPeriods.map((period) => {
              const selectedPeriods = Array.isArray(localFilters.roster_period)
                ? localFilters.roster_period
                : localFilters.roster_period
                  ? [localFilters.roster_period]
                  : []

              return (
                <Button
                  key={period.code}
                  variant={selectedPeriods.includes(period.code) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRosterPeriodToggle(period.code)}
                  className="text-sm"
                >
                  {period.code}
                  {selectedPeriods.includes(period.code) && <X className="ml-1 h-3 w-3" />}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Workflow Status Filter */}
        <div className="space-y-2">
          <Label>Workflow Status</Label>
          <div className="flex flex-wrap gap-2">
            {WORKFLOW_STATUSES.map((status) => (
              <Button
                key={status.value}
                variant={localFilters.status?.includes(status.value) ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusToggle(status.value)}
                className="text-sm"
              >
                {status.label}
                {localFilters.status?.includes(status.value) && <X className="ml-1 h-3 w-3" />}
              </Button>
            ))}
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
        </Button>

        {/* Advanced Filters */}
        {showAdvanced && (
          <>
            {/* Submission Channel Filter */}
            <div className="space-y-2">
              <Label>Submission Channel</Label>
              <div className="flex flex-wrap gap-2">
                {SUBMISSION_CHANNELS.map((channel) => (
                  <Button
                    key={channel.value}
                    variant={localFilters.channel?.includes(channel.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChannelToggle(channel.value)}
                    className="text-sm"
                  >
                    {channel.label}
                    {localFilters.channel?.includes(channel.value) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="start-date-from" className="text-muted-foreground text-xs">
                    From
                  </Label>
                  <Input
                    id="start-date-from"
                    type="date"
                    value={localFilters.start_date_from || ''}
                    onChange={(e) => handleDateChange('start_date_from', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="start-date-to" className="text-muted-foreground text-xs">
                    To
                  </Label>
                  <Input
                    id="start-date-to"
                    type="date"
                    value={localFilters.start_date_to || ''}
                    onChange={(e) => handleDateChange('start_date_to', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Flag Filters */}
            <div className="space-y-3">
              <Label>Request Flags</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-late"
                    checked={localFilters.is_late || false}
                    onCheckedChange={() => handleFlagToggle('is_late')}
                  />
                  <label
                    htmlFor="is-late"
                    className="flex items-center gap-2 text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    <Clock className="h-4 w-4 text-[var(--color-status-medium)]" />
                    Late Requests (submitted &lt; 21 days before)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-past-deadline"
                    checked={localFilters.is_past_deadline || false}
                    onCheckedChange={() => handleFlagToggle('is_past_deadline')}
                  />
                  <label
                    htmlFor="is-past-deadline"
                    className="flex items-center gap-2 text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    <AlertTriangle className="h-4 w-4 text-[var(--color-status-high)]" />
                    Past Deadline
                  </label>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
