/**
 * Pilot Info Report Form Component
 * Author: Maurice Rondeau
 * Date: February 2026
 *
 * Form for generating pilot information reports with filtering
 * by rank, status, qualifications, and licence type
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ReportPreviewDialog } from '@/components/reports/report-preview-dialog'
import { ReportEmailDialog } from '@/components/reports/report-email-dialog'
import { Eye, Download, Mail, Loader2, Filter } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useReportPreview, useReportExport, usePrefetchReport } from '@/lib/hooks/use-report-query'
import type { ReportFilters } from '@/types/reports'
import { countActiveFilters } from '@/lib/utils/filter-count'
import { Badge } from '@/components/ui/badge'

const formSchema = z.object({
  activeStatus: z.enum(['active', 'inactive', 'all']).default('all'),
  rankCaptain: z.boolean().default(false),
  rankFirstOfficer: z.boolean().default(false),
  qualLineCaptain: z.boolean().default(false),
  qualTrainingCaptain: z.boolean().default(false),
  qualExaminer: z.boolean().default(false),
  qualRHSCaptain: z.boolean().default(false),
  licenceATPL: z.boolean().default(false),
  licenceCPL: z.boolean().default(false),
})

export function PilotInfoReportForm() {
  const [currentFilters, setCurrentFilters] = useState<ReportFilters>({})
  const [shouldFetchPreview, setShouldFetchPreview] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const { toast } = useToast()
  const prefetchReport = usePrefetchReport()

  // TanStack Query hooks
  const {
    data: previewData,
    isLoading: isPreviewLoading,
    error: previewError,
    refetch: refetchPreview,
  } = useReportPreview('pilot-info', currentFilters, {
    enabled: shouldFetchPreview,
  })

  const exportMutation = useReportExport()

  const form = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activeStatus: 'all',
      rankCaptain: false,
      rankFirstOfficer: false,
      qualLineCaptain: false,
      qualTrainingCaptain: false,
      qualExaminer: false,
      qualRHSCaptain: false,
      licenceATPL: false,
      licenceCPL: false,
    },
  })

  // Build filters from form values
  const buildFilters = (values: z.input<typeof formSchema>): ReportFilters => {
    const filters: ReportFilters = {}

    // Active status
    if (values.activeStatus !== 'all') {
      filters.activeStatus = values.activeStatus
    }

    // Ranks
    const ranks: ('Captain' | 'First Officer')[] = []
    if (values.rankCaptain) ranks.push('Captain')
    if (values.rankFirstOfficer) ranks.push('First Officer')
    if (ranks.length > 0) filters.rank = ranks

    // Qualifications
    const qualifications: ('line_captain' | 'training_captain' | 'examiner' | 'rhs_captain')[] = []
    if (values.qualLineCaptain) qualifications.push('line_captain')
    if (values.qualTrainingCaptain) qualifications.push('training_captain')
    if (values.qualExaminer) qualifications.push('examiner')
    if (values.qualRHSCaptain) qualifications.push('rhs_captain')
    if (qualifications.length > 0) filters.qualifications = qualifications

    // Licence types
    const licenceTypes: ('ATPL' | 'CPL')[] = []
    if (values.licenceATPL) licenceTypes.push('ATPL')
    if (values.licenceCPL) licenceTypes.push('CPL')
    if (licenceTypes.length > 0) filters.licenceType = licenceTypes

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
      exportMutation.reset()
    }
  }, [exportMutation.isError])

  // Handle export mutation success
  useEffect(() => {
    if (exportMutation.isSuccess) {
      toast({
        title: 'Report Exported',
        description: 'PDF has been downloaded successfully',
      })
      exportMutation.reset()
    }
  }, [exportMutation.isSuccess])

  const handlePreview = async (values: z.input<typeof formSchema>) => {
    const filters = buildFilters(values)
    setCurrentFilters(filters)
    setShouldFetchPreview(true)
    refetchPreview()
  }

  const handleExport = async (values: z.input<typeof formSchema>) => {
    const filters = buildFilters(values)
    exportMutation.mutate({
      reportType: 'pilot-info',
      filters,
    })
  }

  const handleEmail = () => {
    setShowEmail(true)
  }

  // Prefetch on form change
  const handleFormChange = () => {
    const values = form.getValues()
    const filters = buildFilters(values)
    prefetchReport('pilot-info', filters)
  }

  // Separate loading states for each button
  const isPreviewButtonLoading = isPreviewLoading && !showPreview
  const isExportButtonLoading = exportMutation.isPending
  const isAnyButtonLoading = isPreviewButtonLoading || isExportButtonLoading

  // Calculate active filter count
  const activeFilterCount = countActiveFilters(buildFilters(form.watch()))

  return (
    <>
      <Form {...form}>
        <div className="space-y-6">
          {/* Active Status Filter */}
          <FormField
            control={form.control}
            name="activeStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pilot Status</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value)
                      handleFormChange()
                    }}
                    defaultValue={field.value}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="status-all" />
                      <Label htmlFor="status-all" className="cursor-pointer font-normal">
                        All Pilots
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="active" id="status-active" />
                      <Label htmlFor="status-active" className="cursor-pointer font-normal">
                        Active Only
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="inactive" id="status-inactive" />
                      <Label htmlFor="status-inactive" className="cursor-pointer font-normal">
                        Inactive Only
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />

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
                    handleFormChange()
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
                    handleFormChange()
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
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          handleFormChange()
                        }}
                      />
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
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          handleFormChange()
                        }}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">First Officer</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Qualification Filters (Captain Only) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Qualifications</Label>
                <p className="text-muted-foreground mt-1 text-xs">
                  Captain qualifications (Line Captain, Training Captain, Examiner, RHS Captain)
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.setValue('qualLineCaptain', true)
                    form.setValue('qualTrainingCaptain', true)
                    form.setValue('qualExaminer', true)
                    form.setValue('qualRHSCaptain', true)
                    handleFormChange()
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
                    form.setValue('qualLineCaptain', false)
                    form.setValue('qualTrainingCaptain', false)
                    form.setValue('qualExaminer', false)
                    form.setValue('qualRHSCaptain', false)
                    handleFormChange()
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
                name="qualLineCaptain"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0 space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          handleFormChange()
                        }}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">Line Captain</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qualTrainingCaptain"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0 space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          handleFormChange()
                        }}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">Training Captain</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qualExaminer"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0 space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          handleFormChange()
                        }}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">Examiner</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qualRHSCaptain"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0 space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          handleFormChange()
                        }}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">RHS Captain</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Licence Type Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Licence Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.setValue('licenceATPL', true)
                    form.setValue('licenceCPL', true)
                    handleFormChange()
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
                    form.setValue('licenceATPL', false)
                    form.setValue('licenceCPL', false)
                    handleFormChange()
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
                name="licenceATPL"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0 space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          handleFormChange()
                        }}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">
                      ATPL (Airline Transport Pilot)
                    </FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="licenceCPL"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0 space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          handleFormChange()
                        }}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">
                      CPL (Commercial Pilot)
                    </FormLabel>
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
        reportType="pilot-info"
      />

      <ReportEmailDialog
        open={showEmail}
        onOpenChange={setShowEmail}
        reportType="pilot-info"
        filters={buildFilters(form.getValues())}
      />
    </>
  )
}
