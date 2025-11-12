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
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ReportPreviewDialog } from '@/components/reports/report-preview-dialog'
import { ReportEmailDialog } from '@/components/reports/report-email-dialog'
import { DatePresetButtons } from '@/components/reports/date-preset-buttons'
import { FilterPresetManager } from '@/components/reports/filter-preset-manager'
import { Eye, Download, Mail, Loader2, Filter } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useReportPreview, useReportExport, usePrefetchReport } from '@/lib/hooks/use-report-query'
import type { ReportFilters } from '@/types/reports'
import type { DateRange } from '@/lib/utils/date-presets'
import { countActiveFilters } from '@/lib/utils/filter-count'
import { Badge } from '@/components/ui/badge'

const formSchema = z.object({
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

// Generate roster periods for 2025 and 2026
const generateRosterPeriods = () => {
  const periods: string[] = []
  for (let year of [2025, 2026]) {
    for (let rp = 1; rp <= 13; rp++) {
      periods.push(`RP${rp}/${year}`)
    }
  }
  return periods
}

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

  // Build filters from form values
  const buildFilters = (values: z.infer<typeof formSchema>): ReportFilters => {
    const filters: ReportFilters = {}

    if (values.startDate && values.endDate) {
      filters.dateRange = {
        startDate: values.startDate,
        endDate: values.endDate,
      }
    }

    if (values.rosterPeriods && values.rosterPeriods.length > 0) {
      filters.rosterPeriods = values.rosterPeriods
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
        description: previewError instanceof Error ? previewError.message : 'Failed to generate preview',
        variant: 'destructive',
      })
      setShouldFetchPreview(false)
    }
  }, [previewError, toast])

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
          exportMutation.error instanceof Error ? exportMutation.error.message : 'Failed to export PDF',
        variant: 'destructive',
      })
    }
  }, [exportMutation.isError, exportMutation.error, toast])

  // Handle export mutation success
  useEffect(() => {
    if (exportMutation.isSuccess) {
      toast({
        title: 'Report Exported',
        description: 'PDF has been downloaded successfully',
      })
    }
  }, [exportMutation.isSuccess, toast])

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
    form.setValue('startDate', dateRange.startDate)
    form.setValue('endDate', dateRange.endDate)
    handleFormChange()
  }

  const isLoading = isPreviewLoading || exportMutation.isPending

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
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Date Presets - Phase 2.4 */}
          <DatePresetButtons onPresetSelect={handleDatePresetSelect} />

          {/* Roster Periods Multi-Select */}
          <FormField
            control={form.control}
            name="rosterPeriods"
            render={() => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Roster Periods (Optional)</FormLabel>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => form.setValue('rosterPeriods', rosterPeriods)}
                      className="h-7 text-xs"
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => form.setValue('rosterPeriods', [])}
                      className="h-7 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
                <FormDescription className="text-xs">
                  Select one or more roster periods to filter by
                </FormDescription>
                <div className="grid grid-cols-6 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {rosterPeriods.map((period) => (
                    <FormField
                      key={period}
                      control={form.control}
                      name="rosterPeriods"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={period}
                            className="flex flex-row items-center space-x-2 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(period)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, period])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== period)
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {period}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
              </FormItem>
            )}
          />

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
                    form.setValue('statusPending', true)
                    form.setValue('statusSubmitted', true)
                    form.setValue('statusInReview', true)
                    form.setValue('statusApproved', true)
                    form.setValue('statusRejected', true)
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
                    form.setValue('statusPending', false)
                    form.setValue('statusSubmitted', false)
                    form.setValue('statusInReview', false)
                    form.setValue('statusApproved', false)
                    form.setValue('statusRejected', false)
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
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Pending</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="statusSubmitted"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Submitted</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="statusInReview"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">In Review</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="statusApproved"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Approved</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="statusRejected"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Rejected</FormLabel>
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
                    form.setValue('rankCaptain', true)
                    form.setValue('rankFirstOfficer', true)
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
                    form.setValue('rankCaptain', false)
                    form.setValue('rankFirstOfficer', false)
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
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Captain</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rankFirstOfficer"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">First Officer</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Active Filters Badge */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Active filters:</span>
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
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              Preview
            </Button>
            <Button type="button" onClick={form.handleSubmit(handleExport)} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Export PDF
            </Button>
            <Button type="button" variant="secondary" onClick={handleEmail} disabled={isLoading}>
              <Mail className="h-4 w-4 mr-2" />
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
