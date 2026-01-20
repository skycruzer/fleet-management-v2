/**
 * Leave Report Form Component - TanStack Query Integration
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Phase 2.2: Refactored to use TanStack Query for:
 * - Automatic caching and request deduplication
 * - Built-in loading and error states
 * - Optimistic updates and cache invalidation
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ReportPreviewDialog } from '@/components/reports/report-preview-dialog'
import { ReportEmailDialog } from '@/components/reports/report-email-dialog'
import { RosterPeriodMultiSelect } from '@/components/reports/roster-period-multi-select'
import { DatePresetButtons } from '@/components/reports/date-preset-buttons'
import { FilterPresetManager } from '@/components/reports/filter-preset-manager'
import { DateFilterToggle, type DateFilterMode } from '@/components/reports/date-filter-toggle'
import { Eye, Download, Mail, Loader2, Filter } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useReportPreview, useReportExport, usePrefetchReport } from '@/lib/hooks/use-report-query'
import type { ReportFilters } from '@/types/reports'
import type { DateRange } from '@/lib/utils/date-presets'
import { countActiveFilters } from '@/lib/utils/filter-count'
import { Badge } from '@/components/ui/badge'
import { generateRosterPeriods, rosterPeriodsToDateRange } from '@/lib/utils/roster-periods'

const formSchema = z.object({
  filterMode: z.enum(['roster', 'dateRange']).default('dateRange'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  rosterPeriods: z.array(z.string()).default([]),
  statusPending: z.boolean().default(false),
  statusSubmitted: z.boolean().default(false),
  statusInReview: z.boolean().default(false),
  statusApproved: z.boolean().default(false),
  statusRejected: z.boolean().default(false),
  rankCaptain: z.boolean().default(false),
  rankFirstOfficer: z.boolean().default(false),
})

export function LeaveReportForm() {
  const [currentFilters, setCurrentFilters] = useState<ReportFilters>({})
  const [shouldFetchPreview, setShouldFetchPreview] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const { toast } = useToast()
  const rosterPeriods = generateRosterPeriods()
  const prefetchReport = usePrefetchReport()

  // TanStack Query hooks
  const {
    data: previewData,
    isLoading: isPreviewLoading,
    error: previewError,
    refetch: refetchPreview,
  } = useReportPreview('leave', currentFilters, {
    enabled: shouldFetchPreview,
  })

  const exportMutation = useReportExport()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      filterMode: 'dateRange',
      startDate: '',
      endDate: '',
      rosterPeriods: [],
      statusPending: false,
      statusSubmitted: false,
      statusInReview: false,
      statusApproved: false,
      statusRejected: false,
      rankCaptain: false,
      rankFirstOfficer: false,
    },
  })

  // Watch filter mode to conditionally show fields
  const filterMode = form.watch('filterMode')

  // Build filters from form values
  const buildFilters = (values: z.infer<typeof formSchema>): ReportFilters => {
    const filters: ReportFilters = {}

    // Only include date filters based on selected mode
    if (values.filterMode === 'dateRange') {
      if (values.startDate && values.endDate) {
        filters.dateRange = {
          startDate: values.startDate,
          endDate: values.endDate,
        }
      }
    } else if (values.filterMode === 'roster') {
      if (values.rosterPeriods && values.rosterPeriods.length > 0) {
        filters.rosterPeriods = values.rosterPeriods
      }
    }

    const statuses = []
    if (values.statusPending) statuses.push('PENDING')
    if (values.statusApproved) statuses.push('APPROVED')
    if (values.statusRejected) statuses.push('REJECTED')
    if (values.statusSubmitted) statuses.push('SUBMITTED')
    if (values.statusInReview) statuses.push('IN_REVIEW')
    if (statuses.length > 0) filters.status = statuses

    const ranks = []
    if (values.rankCaptain) ranks.push('Captain')
    if (values.rankFirstOfficer) ranks.push('First Officer')
    if (ranks.length > 0) filters.rank = ranks

    return filters
  }

  // Handle preview errors
  useEffect(() => {
    if (previewError) {
      toast({
        title: 'Preview Failed',
        description:
          previewError instanceof Error ? previewError.message : 'Failed to generate preview',
        variant: 'destructive',
      })
      setShouldFetchPreview(false)
    }
  }, [previewError])

  // Handle preview success
  useEffect(() => {
    if (previewData && shouldFetchPreview) {
      setShowPreview(true)
      setShouldFetchPreview(false)
    }
  }, [previewData, shouldFetchPreview])

  // Handle export mutation errors
  useEffect(() => {
    if (exportMutation.isError) {
      toast({
        title: 'Export Failed',
        description:
          exportMutation.error instanceof Error
            ? exportMutation.error.message
            : 'Failed to export PDF',
        variant: 'destructive',
      })
    }
  }, [exportMutation.isError, exportMutation.error])

  // Handle export mutation success
  useEffect(() => {
    if (exportMutation.isSuccess) {
      toast({
        title: 'Report Exported',
        description: 'PDF has been downloaded successfully',
      })
    }
  }, [exportMutation.isSuccess])

  const handlePreview = async (values: z.infer<typeof formSchema>) => {
    const filters = buildFilters(values)
    setCurrentFilters(filters)
    setShouldFetchPreview(true)
    refetchPreview()
  }

  const handleExport = async (values: z.infer<typeof formSchema>) => {
    const filters = buildFilters(values)
    exportMutation.mutate({
      reportType: 'leave',
      filters,
    })
  }

  const handleEmail = () => {
    setShowEmail(true)
  }

  // Prefetch on form change (debounced via staleTime)
  const handleFormChange = () => {
    const values = form.getValues()
    const filters = buildFilters(values)
    if (Object.keys(filters).length > 0) {
      prefetchReport('leave', filters)
    }
  }

  // Handle date preset selection
  const handleDatePresetSelect = (dateRange: DateRange) => {
    // Clear roster periods when date preset is selected
    form.setValue('rosterPeriods', [])
    form.setValue('startDate', dateRange.startDate)
    form.setValue('endDate', dateRange.endDate)
    handleFormChange()
  }

  // Separate loading states for each button
  const isPreviewButtonLoading = isPreviewLoading && !showPreview // Only show loading before modal opens
  const isExportButtonLoading = exportMutation.isPending
  const isAnyButtonLoading = isPreviewButtonLoading || isExportButtonLoading

  // Calculate active filter count
  const activeFilterCount = countActiveFilters(buildFilters(form.watch()))

  // Handle loading a saved preset
  const handleLoadPreset = (filters: ReportFilters) => {
    // Apply date range
    if (filters.dateRange) {
      form.setValue('startDate', filters.dateRange.startDate || '')
      form.setValue('endDate', filters.dateRange.endDate || '')
    }

    // Apply roster periods
    if (filters.rosterPeriods) {
      form.setValue('rosterPeriods', filters.rosterPeriods)
    }

    // Apply status filters
    form.setValue('statusPending', filters.status?.includes('pending') || false)
    form.setValue('statusApproved', filters.status?.includes('approved') || false)
    form.setValue('statusRejected', filters.status?.includes('rejected') || false)

    // Apply rank filters
    form.setValue('rankCaptain', filters.rank?.includes('Captain') || false)
    form.setValue('rankFirstOfficer', filters.rank?.includes('First Officer') || false)

    // Trigger form change to prefetch data
    handleFormChange()
  }

  return (
    <>
      <Form {...form}>
        <div className="space-y-6">
          {/* Filter Mode Toggle */}
          <DateFilterToggle
            value={filterMode}
            onValueChange={(mode) => {
              form.setValue('filterMode', mode)
              // Clear opposite filter when switching modes
              if (mode === 'roster') {
                form.setValue('startDate', '')
                form.setValue('endDate', '')
              } else {
                form.setValue('rosterPeriods', [])
              }
            }}
          />

          {/* Date Range - Only show when filterMode is 'dateRange' */}
          {filterMode === 'dateRange' && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          // Clear roster periods when date is selected
                          if (e.target.value) {
                            form.setValue('rosterPeriods', [])
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          // Clear roster periods when date is selected
                          if (e.target.value) {
                            form.setValue('rosterPeriods', [])
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Date Presets removed per user request */}

          {/* Roster Period Selection - Only show if roster mode */}
          {filterMode === 'roster' && (
            <FormField
              control={form.control}
              name="rosterPeriods"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roster Periods (Optional)</FormLabel>
                  <FormDescription className="text-muted-foreground text-xs">
                    Select one or more roster periods to filter by
                  </FormDescription>
                  <FormControl>
                    <RosterPeriodMultiSelect
                      periods={rosterPeriods}
                      selectedPeriods={field.value || []}
                      onChange={(selected) => {
                        field.onChange(selected)
                        handleFormChange()
                      }}
                      placeholder="Select roster periods..."
                    />
                  </FormControl>
                  {field.value?.length > 0 &&
                    (() => {
                      const dateRange = rosterPeriodsToDateRange(field.value)
                      if (dateRange) {
                        return (
                          <div className="mt-2 rounded-md border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3">
                            <p className="text-foreground text-sm font-medium">
                              Selected: {field.value.join(', ')}
                            </p>
                            <p className="mt-1 text-xs text-[var(--color-info)]">
                              Date Range: {new Date(dateRange.startDate).toLocaleDateString()} -{' '}
                              {new Date(dateRange.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        )
                      }
                      return null
                    })()}
                </FormItem>
              )}
            />
          )}

          {/* Status Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Status</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.reset({
                      ...form.getValues(),
                      statusPending: true,
                      statusSubmitted: true,
                      statusInReview: true,
                      statusApproved: true,
                      statusRejected: true,
                    })
                  }}
                  className="h-7 text-xs"
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.reset({
                      ...form.getValues(),
                      statusPending: false,
                      statusSubmitted: false,
                      statusInReview: false,
                      statusApproved: false,
                      statusRejected: false,
                    })
                  }}
                  className="h-7 text-xs"
                >
                  Clear All
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <FormField
                control={form.control}
                name="statusPending"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0 space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">Pending</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="statusSubmitted"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0 space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">Submitted</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="statusInReview"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0 space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">In Review</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="statusApproved"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0 space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">Approved</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="statusRejected"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0 space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">Rejected</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Rank Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Rank</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.reset({
                      ...form.getValues(),
                      rankCaptain: true,
                      rankFirstOfficer: true,
                    })
                  }}
                  className="h-7 text-xs"
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.reset({
                      ...form.getValues(),
                      rankCaptain: false,
                      rankFirstOfficer: false,
                    })
                  }}
                  className="h-7 text-xs"
                >
                  Clear All
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <FormField
                control={form.control}
                name="rankCaptain"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0 space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">Captain</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rankFirstOfficer"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0 space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">First Officer</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Active Filters Badge */}
          {activeFilterCount > 0 && (
            <div className="bg-muted/50 flex items-center gap-2 rounded-md p-3">
              <Filter className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-sm">Active filters:</span>
              <Badge variant="secondary" className="font-normal">
                {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'}
              </Badge>
            </div>
          )}

          {/* Filter Preset Manager */}
          <FilterPresetManager
            reportType="leave"
            currentFilters={buildFilters(form.getValues())}
            onLoadPreset={handleLoadPreset}
          />

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={form.handleSubmit(handlePreview)}
              disabled={isAnyButtonLoading}
            >
              {isPreviewButtonLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              Preview
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(handleExport)}
              disabled={isAnyButtonLoading}
            >
              {isExportButtonLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export PDF
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleEmail}
              disabled={isAnyButtonLoading}
            >
              <Mail className="mr-2 h-4 w-4" />
              Email Report
            </Button>
          </div>
        </div>
      </Form>

      <ReportPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        reportData={previewData ?? null}
        reportType="leave"
      />

      <ReportEmailDialog
        open={showEmail}
        onOpenChange={setShowEmail}
        reportType="leave"
        filters={buildFilters(form.getValues())}
      />
    </>
  )
}
