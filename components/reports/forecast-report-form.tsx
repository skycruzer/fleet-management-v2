/**
 * Forecast Report Form Component
 * Author: Maurice Rondeau
 * Date: February 2026
 *
 * Form for generating workforce forecast reports including
 * retirement forecasts, succession planning, and crew shortage predictions
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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ReportPreviewDialog } from '@/components/reports/report-preview-dialog'
import { ReportEmailDialog } from '@/components/reports/report-email-dialog'
import {
  Eye,
  Download,
  Mail,
  Loader2,
  Filter,
  TrendingUp,
  Users,
  AlertTriangle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useReportPreview, useReportExport, usePrefetchReport } from '@/lib/hooks/use-report-query'
import type { ReportFilters } from '@/types/reports'
import { countActiveFilters } from '@/lib/utils/filter-count'
import { Badge } from '@/components/ui/badge'

const formSchema = z.object({
  timeHorizon: z.enum(['2yr', '5yr', '10yr']).default('5yr'),
  sectionRetirement: z.boolean().default(true),
  sectionSuccession: z.boolean().default(true),
  sectionShortage: z.boolean().default(true),
  rankCaptain: z.boolean().default(false),
  rankFirstOfficer: z.boolean().default(false),
})

export function ForecastReportForm() {
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
  } = useReportPreview('forecast', currentFilters, {
    enabled: shouldFetchPreview,
  })

  const exportMutation = useReportExport()

  const form = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timeHorizon: '5yr',
      sectionRetirement: true,
      sectionSuccession: true,
      sectionShortage: true,
      rankCaptain: false,
      rankFirstOfficer: false,
    },
  })

  // Build filters from form values
  const buildFilters = (values: z.input<typeof formSchema>): ReportFilters => {
    const filters: ReportFilters = {}

    // Time horizon
    filters.timeHorizon = values.timeHorizon

    // Sections to include
    const sections: ('retirement' | 'succession' | 'shortage')[] = []
    if (values.sectionRetirement) sections.push('retirement')
    if (values.sectionSuccession) sections.push('succession')
    if (values.sectionShortage) sections.push('shortage')
    if (sections.length > 0) filters.forecastSections = sections

    // Rank filter (optional)
    const ranks: ('Captain' | 'First Officer')[] = []
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
      reportType: 'forecast',
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
    prefetchReport('forecast', filters)
  }

  // Separate loading states for each button
  const isPreviewButtonLoading = isPreviewLoading && !showPreview
  const isExportButtonLoading = exportMutation.isPending
  const isAnyButtonLoading = isPreviewButtonLoading || isExportButtonLoading

  // Calculate active filter count
  const activeFilterCount = countActiveFilters(buildFilters(form.watch()))

  // Check if at least one section is selected
  const formValues = form.watch()
  const hasSectionSelected =
    formValues.sectionRetirement || formValues.sectionSuccession || formValues.sectionShortage

  return (
    <>
      <Form {...form}>
        <div className="space-y-6">
          {/* Time Horizon */}
          <FormField
            control={form.control}
            name="timeHorizon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forecast Time Horizon</FormLabel>
                <FormDescription className="text-muted-foreground text-xs">
                  Select how far into the future to forecast
                </FormDescription>
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
                      <RadioGroupItem value="2yr" id="horizon-2yr" />
                      <Label htmlFor="horizon-2yr" className="cursor-pointer font-normal">
                        2 Years
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="5yr" id="horizon-5yr" />
                      <Label htmlFor="horizon-5yr" className="cursor-pointer font-normal">
                        5 Years (Recommended)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="10yr" id="horizon-10yr" />
                      <Label htmlFor="horizon-10yr" className="cursor-pointer font-normal">
                        10 Years
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />

          {/* Report Sections */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Report Sections</Label>
                <p className="text-muted-foreground mt-1 text-xs">
                  Select which sections to include in the forecast report
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.setValue('sectionRetirement', true)
                    form.setValue('sectionSuccession', true)
                    form.setValue('sectionShortage', true)
                    handleFormChange()
                  }}
                  className="h-7 text-xs"
                >
                  Select All
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="sectionRetirement"
                render={({ field }) => (
                  <FormItem className="flex items-start space-y-0 space-x-3 rounded-lg border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          handleFormChange()
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex cursor-pointer items-center gap-2 font-normal">
                        <TrendingUp className="h-4 w-4 text-[var(--color-danger-500)]" />
                        Retirement Forecast
                      </FormLabel>
                      <FormDescription className="text-muted-foreground text-xs">
                        Pilots retiring by rank and timeline
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sectionSuccession"
                render={({ field }) => (
                  <FormItem className="flex items-start space-y-0 space-x-3 rounded-lg border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          handleFormChange()
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex cursor-pointer items-center gap-2 font-normal">
                        <Users className="h-4 w-4 text-[var(--color-success-500)]" />
                        Succession Planning
                      </FormLabel>
                      <FormDescription className="text-muted-foreground text-xs">
                        Promotion readiness and candidates
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sectionShortage"
                render={({ field }) => (
                  <FormItem className="flex items-start space-y-0 space-x-3 rounded-lg border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          handleFormChange()
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex cursor-pointer items-center gap-2 font-normal">
                        <AlertTriangle className="h-4 w-4 text-[var(--color-warning-500)]" />
                        Crew Shortages
                      </FormLabel>
                      <FormDescription className="text-muted-foreground text-xs">
                        Critical periods and utilization warnings
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            {!hasSectionSelected && (
              <p className="text-destructive text-sm">Please select at least one section</p>
            )}
          </div>

          {/* Rank Filter (Optional) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Filter by Rank (Optional)</Label>
                <p className="text-muted-foreground mt-1 text-xs">
                  Leave empty to include all ranks
                </p>
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
              disabled={isAnyButtonLoading || !hasSectionSelected}
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
              disabled={isAnyButtonLoading || !hasSectionSelected}
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
              disabled={isAnyButtonLoading || !hasSectionSelected}
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
        reportType="forecast"
      />

      <ReportEmailDialog
        open={showEmail}
        onOpenChange={setShowEmail}
        reportType="forecast"
        filters={buildFilters(form.getValues())}
      />
    </>
  )
}
