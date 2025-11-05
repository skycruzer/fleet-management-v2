/**
 * Certification Report Form Component - TanStack Query Integration
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  expiryThreshold: z.string().optional(),
  checkTypes: z.array(z.string()).default([]),
  rankCaptain: z.boolean().default(false),
  rankFirstOfficer: z.boolean().default(false),
})

interface CheckType {
  id: string
  check_code: string
  check_description: string
  category: string | null
}

export function CertificationReportForm() {
  const [currentFilters, setCurrentFilters] = useState<ReportFilters>({})
  const [shouldFetchPreview, setShouldFetchPreview] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [checkTypes, setCheckTypes] = useState<CheckType[]>([])
  const [loadingCheckTypes, setLoadingCheckTypes] = useState(true)
  const { toast } = useToast()
  const prefetchReport = usePrefetchReport()

  // TanStack Query hooks
  const {
    data: previewData,
    isLoading: isPreviewLoading,
    error: previewError,
    refetch: refetchPreview,
  } = useReportPreview('certifications', currentFilters, {
    enabled: shouldFetchPreview,
  })

  const exportMutation = useReportExport()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: '',
      endDate: '',
      expiryThreshold: '',
      checkTypes: [],
      rankCaptain: false,
      rankFirstOfficer: false,
    },
  })

  // Fetch check types on mount
  useEffect(() => {
    const fetchCheckTypes = async () => {
      try {
        const response = await fetch('/api/check-types')
        if (response.ok) {
          const data = await response.json()
          setCheckTypes(data.checkTypes || [])
        }
      } catch (error) {
        console.error('Failed to fetch check types:', error)
      } finally {
        setLoadingCheckTypes(false)
      }
    }
    fetchCheckTypes()
  }, [])

  // Build filters from form values
  const buildFilters = (values: z.infer<typeof formSchema>): ReportFilters => {
    const filters: ReportFilters = {}

    if (values.startDate && values.endDate) {
      filters.dateRange = {
        startDate: values.startDate,
        endDate: values.endDate,
      }
    }

    if (values.expiryThreshold) {
      filters.expiryThreshold = parseInt(values.expiryThreshold, 10)
    }

    if (values.checkTypes && values.checkTypes.length > 0) {
      filters.checkTypes = values.checkTypes
    }

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
          exportMutation.error instanceof Error
            ? exportMutation.error.message
            : 'Failed to export PDF',
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
      reportType: 'certifications',
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
      prefetchReport('certifications', filters)
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

    // Apply expiry threshold
    if (filters.expiryThreshold !== undefined) {
      form.setValue('expiryThreshold', filters.expiryThreshold.toString())
    }

    // Apply check types
    if (filters.checkTypes) {
      form.setValue('checkTypes', filters.checkTypes)
    }

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
                  <FormLabel>Completion Date From</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        handleFormChange()
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
                  <FormLabel>Completion Date To</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        handleFormChange()
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Date Presets - Phase 2.4 */}
          <DatePresetButtons onPresetSelect={handleDatePresetSelect} />

          {/* Expiry Threshold */}
          <FormField
            control={form.control}
            name="expiryThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry Threshold (Days)</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    handleFormChange()
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select expiry threshold" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">All certifications</SelectItem>
                    <SelectItem value="30">Expiring in 30 days</SelectItem>
                    <SelectItem value="60">Expiring in 60 days</SelectItem>
                    <SelectItem value="90">Expiring in 90 days</SelectItem>
                    <SelectItem value="180">Expiring in 180 days</SelectItem>
                    <SelectItem value="365">Expiring in 1 year</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Filter certifications by days until expiry</FormDescription>
              </FormItem>
            )}
          />

          {/* Check Types Multi-Select */}
          <FormField
            control={form.control}
            name="checkTypes"
            render={() => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Check Types (Optional)</FormLabel>
                  {!loadingCheckTypes && checkTypes.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          form.setValue(
                            'checkTypes',
                            checkTypes.map((ct) => ct.id)
                          )
                        }
                        className="h-7 text-xs"
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => form.setValue('checkTypes', [])}
                        className="h-7 text-xs"
                      >
                        Clear All
                      </Button>
                    </div>
                  )}
                </div>
                <FormDescription className="text-xs">
                  Select one or more check types to filter by
                </FormDescription>
                {loadingCheckTypes ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="mt-2 grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-3">
                    {checkTypes.map((checkType) => (
                      <FormField
                        key={checkType.id}
                        control={form.control}
                        name="checkTypes"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={checkType.id}
                              className="flex flex-row items-center space-y-0 space-x-2"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(checkType.id)}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...field.value, checkType.id]
                                      : field.value?.filter((value) => value !== checkType.id)
                                    field.onChange(newValue)
                                    handleFormChange()
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="cursor-pointer text-sm font-normal">
                                {checkType.check_description || checkType.check_code}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                )}
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

          {/* Filter Preset Manager */}
          <FilterPresetManager
            reportType="certifications"
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
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              Preview
            </Button>
            <Button type="button" onClick={form.handleSubmit(handleExport)} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export PDF
            </Button>
            <Button type="button" variant="secondary" onClick={handleEmail} disabled={isLoading}>
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
        reportType="certifications"
      />

      <ReportEmailDialog
        open={showEmail}
        onOpenChange={setShowEmail}
        reportType="certifications"
        filters={buildFilters(form.getValues())}
      />
    </>
  )
}
