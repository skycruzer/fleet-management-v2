/**
 * Leave Bids Report Form Component
 * Author: Maurice Rondeau
 * Date: November 19, 2025
 *
 * Report generation form for annual leave preference bids
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ReportPreviewDialog } from '@/components/reports/report-preview-dialog'
import { ReportEmailDialog } from '@/components/reports/report-email-dialog'
import { RosterPeriodMultiSelect } from '@/components/reports/roster-period-multi-select'
import { FilterPresetManager } from '@/components/reports/filter-preset-manager'
import { Eye, Download, Mail, Loader2, Filter } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useReportPreview, useReportExport, usePrefetchReport } from '@/lib/hooks/use-report-query'
import type { ReportFilters } from '@/types/reports'
import { countActiveFilters } from '@/lib/utils/filter-count'
import { Badge } from '@/components/ui/badge'
import { generateRosterPeriods } from '@/lib/utils/roster-periods'

const formSchema = z.object({
  rosterPeriods: z.array(z.string()).default([]),
  statusPending: z.boolean().default(false),
  statusProcessing: z.boolean().default(false),
  statusApproved: z.boolean().default(false),
  statusRejected: z.boolean().default(false),
  rankCaptain: z.boolean().default(false),
  rankFirstOfficer: z.boolean().default(false),
})

export function LeaveBidsReportForm() {
  const [currentFilters, setCurrentFilters] = useState<ReportFilters>({})
  const [shouldFetchPreview, setShouldFetchPreview] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const { toast } = useToast()
  const rosterPeriods = generateRosterPeriods([2025, 2026], { currentAndFutureOnly: true })
  const prefetchReport = usePrefetchReport()

  // TanStack Query hooks
  const {
    data: previewData,
    isLoading: isPreviewLoading,
    error: previewError,
    refetch: refetchPreview,
  } = useReportPreview('leave-bids', currentFilters, {
    enabled: shouldFetchPreview,
  })

  const exportMutation = useReportExport()

  const form = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rosterPeriods: [],
      statusPending: false,
      statusProcessing: false,
      statusApproved: false,
      statusRejected: false,
      rankCaptain: false,
      rankFirstOfficer: false,
    },
  })

  // Build filters from form values
  const buildFilters = (values: z.input<typeof formSchema>): ReportFilters => {
    const filters: ReportFilters = {}

    // Roster periods
    if (values.rosterPeriods && values.rosterPeriods.length > 0) {
      filters.rosterPeriods = values.rosterPeriods
    }

    // Status filters
    const statusFilters = []
    if (values.statusPending) statusFilters.push('PENDING')
    if (values.statusProcessing) statusFilters.push('PROCESSING')
    if (values.statusApproved) statusFilters.push('APPROVED')
    if (values.statusRejected) statusFilters.push('REJECTED')
    if (statusFilters.length > 0) {
      filters.status = statusFilters
    }

    // Rank filters
    const rankFilters = []
    if (values.rankCaptain) rankFilters.push('Captain')
    if (values.rankFirstOfficer) rankFilters.push('First Officer')
    if (rankFilters.length > 0) {
      filters.rank = rankFilters
    }

    return filters
  }

  // Handle preview
  const handlePreview = form.handleSubmit(async (values) => {
    const filters = buildFilters(values)
    setCurrentFilters(filters)
    setShouldFetchPreview(true)

    // Wait for query to be enabled and fetch
    await new Promise((resolve) => setTimeout(resolve, 100))
    await refetchPreview()
    setShowPreview(true)
  })

  // Handle export
  const handleExport = form.handleSubmit(async (values) => {
    const filters = buildFilters(values)

    exportMutation.mutate(
      { reportType: 'leave-bids', filters },
      {
        onSuccess: () => {
          toast({
            title: 'Export Started',
            description: 'Your leave bids report PDF is being generated...',
          })
        },
        onError: (error) => {
          toast({
            title: 'Export Failed',
            description: error instanceof Error ? error.message : 'Failed to export report',
            variant: 'destructive',
          })
        },
      }
    )
  })

  // Handle email
  const handleEmail = form.handleSubmit(async (values) => {
    const filters = buildFilters(values)
    setCurrentFilters(filters)
    setShowEmail(true)
  })

  // Apply filter preset
  const handlePresetApply = (preset: any) => {
    const statusMap: any = {
      PENDING: 'statusPending',
      PROCESSING: 'statusProcessing',
      APPROVED: 'statusApproved',
      REJECTED: 'statusRejected',
    }

    // Reset all fields first
    form.reset()

    // Apply roster periods
    if (preset.filters.rosterPeriods) {
      form.setValue('rosterPeriods', preset.filters.rosterPeriods)
    }

    // Apply status filters
    if (preset.filters.status) {
      preset.filters.status.forEach((status: string) => {
        const fieldName = statusMap[status]
        if (fieldName) {
          form.setValue(fieldName, true)
        }
      })
    }

    // Apply rank filters
    if (preset.filters.rank) {
      if (preset.filters.rank.includes('Captain')) {
        form.setValue('rankCaptain', true)
      }
      if (preset.filters.rank.includes('First Officer')) {
        form.setValue('rankFirstOfficer', true)
      }
    }

    toast({
      title: 'Preset Applied',
      description: `Filter preset "${preset.name}" has been applied.`,
    })
  }

  // Count active filters
  const values = form.watch()
  const activeFilterCount = countActiveFilters(buildFilters(values))

  return (
    <div className="space-y-6">
      {/* Filter Preset Manager */}
      <FilterPresetManager
        reportType="leave-bids"
        currentFilters={currentFilters}
        onLoadPreset={handlePresetApply}
      />

      <Form {...form}>
        <form className="space-y-6">
          {/* Roster Periods */}
          <div className="space-y-2">
            <Label htmlFor="rosterPeriods">Roster Periods</Label>
            <RosterPeriodMultiSelect
              periods={rosterPeriods}
              selectedPeriods={values.rosterPeriods ?? []}
              onChange={(periods) => form.setValue('rosterPeriods', periods)}
            />
          </div>

          {/* Status Filters */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="statusPending"
                  checked={values.statusPending}
                  onCheckedChange={(checked) => form.setValue('statusPending', Boolean(checked))}
                />
                <label htmlFor="statusPending" className="cursor-pointer text-sm">
                  Pending
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="statusProcessing"
                  checked={values.statusProcessing}
                  onCheckedChange={(checked) => form.setValue('statusProcessing', Boolean(checked))}
                />
                <label htmlFor="statusProcessing" className="cursor-pointer text-sm">
                  Processing
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="statusApproved"
                  checked={values.statusApproved}
                  onCheckedChange={(checked) => form.setValue('statusApproved', Boolean(checked))}
                />
                <label htmlFor="statusApproved" className="cursor-pointer text-sm">
                  Approved
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="statusRejected"
                  checked={values.statusRejected}
                  onCheckedChange={(checked) => form.setValue('statusRejected', Boolean(checked))}
                />
                <label htmlFor="statusRejected" className="cursor-pointer text-sm">
                  Rejected
                </label>
              </div>
            </div>
          </div>

          {/* Rank Filters */}
          <div className="space-y-2">
            <Label>Rank</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rankCaptain"
                  checked={values.rankCaptain}
                  onCheckedChange={(checked) => form.setValue('rankCaptain', Boolean(checked))}
                />
                <label htmlFor="rankCaptain" className="cursor-pointer text-sm">
                  Captain
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rankFirstOfficer"
                  checked={values.rankFirstOfficer}
                  onCheckedChange={(checked) => form.setValue('rankFirstOfficer', Boolean(checked))}
                />
                <label htmlFor="rankFirstOfficer" className="cursor-pointer text-sm">
                  First Officer
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={handlePreview} disabled={isPreviewLoading}>
              {isPreviewLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFilterCount}
                    </Badge>
                  )}
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleExport}
              disabled={exportMutation.isPending}
            >
              {exportMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </>
              )}
            </Button>

            <Button type="button" variant="outline" onClick={handleEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Email Report
            </Button>
          </div>
        </form>
      </Form>

      {/* Preview Dialog */}
      {showPreview && previewData && (
        <ReportPreviewDialog
          open={showPreview}
          onOpenChange={setShowPreview}
          reportData={previewData}
          reportType="leave-bids"
        />
      )}

      {/* Email Dialog */}
      {showEmail && (
        <ReportEmailDialog
          open={showEmail}
          onOpenChange={setShowEmail}
          reportType="leave-bids"
          filters={currentFilters}
        />
      )}
    </div>
  )
}
