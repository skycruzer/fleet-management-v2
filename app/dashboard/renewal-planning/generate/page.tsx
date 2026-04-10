'use client'

/**
 * Generate Renewal Plan - 3-Step Wizard
 *
 * Complete overhaul with:
 * - Step 1: Configure - Set planning parameters
 * - Step 2: Preview - Review pairing assignments per roster period
 * - Step 3: Results - View generation summary
 *
 * Features:
 * - Captain/FO pairing preview with roster assignments
 * - All 13 roster periods (no Dec/Jan exclusion)
 * - Category-specific capacity utilization
 * - Medical excluded (28-day window too short)
 */

import { useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Users,
  UserX,
  RotateCcw,
  Download,
  FileText,
  ChevronDown,
  ChevronRight,
  Plane,
  Monitor,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { csrfHeaders } from '@/lib/hooks/use-csrf-token'

// Components
import {
  GenerationStepIndicator,
  type WizardStep,
} from '@/components/renewal-planning/generation-step-indicator'
import { PreviewPairingPanel } from '@/components/renewal-planning/preview-pairing-panel'
import { RosterPeriodTimeline } from '@/components/renewal-planning/roster-period-timeline'

// Check type configuration
import {
  CHECK_TYPE_CONFIG,
  CATEGORIES_WITH_CHECK_TYPES,
  getCheckTypesForCategory,
  getDefaultSelectedCheckCodes,
} from '@/lib/config/renewal-check-types'

// Categories with grace periods suitable for advance planning (60-90 days)
// Medical EXCLUDED - 28-day window too short for advance scheduling
const CATEGORIES = ['Flight Checks', 'Simulator Checks', 'Ground Courses Refresher']

// Generation result data structure
interface GenerationResult {
  totalPlans: number
  byCategory: Record<string, number>
  rosterPeriodSummary: Array<{
    rosterPeriod: string
    totalRenewals: number
  }>
  pairingStats?: {
    totalPairs: number
    totalUnpaired: number
    pairingRate: number
  }
}

// Preview data types
interface PreviewData {
  totalPlans: number
  periodsAffected: number
  avgUtilization: number
  categoryBreakdown: Record<string, number>
  pairingStats: {
    totalPairs: number
    totalUnpaired: number
    pairingRate: number
    urgentUnpaired: number
  }
  distribution: Array<{
    rosterPeriod: string
    periodStart: string
    periodEnd: string
    plannedCount: number
    totalCapacity: number
    utilization: number
    byCategory: Record<string, number>
    pairs: any[]
    unpaired: any[]
    individual: any[]
    categoryUtilization: any
  }>
  warnings: Array<{
    rosterPeriod: string
    message: string
    severity: 'warning' | 'critical'
  }>
}

export default function GeneratePlanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const year = searchParams.get('year') || new Date().getFullYear().toString()

  // Configuration state
  const [monthsAhead, setMonthsAhead] = useState(12)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORIES)
  const [selectedCheckCodes, setSelectedCheckCodes] = useState<string[]>(
    getDefaultSelectedCheckCodes()
  )
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    'Simulator Checks',
    'Flight Checks',
  ])
  const [clearExisting, setClearExisting] = useState(false)

  // Captain role pairing configuration
  const CAPTAIN_ROLE_OPTIONS = [
    { id: 'line_captain', label: 'Line Captain', description: 'Standard line captains' },
    {
      id: 'training_captain',
      label: 'Training Captain (TRI)',
      description: 'Type Rating Instructors — right-hand seat for sim checks',
    },
    {
      id: 'examiner',
      label: 'Examiner Captain (TRE)',
      description: 'Type Rating Examiners — right-hand seat for sim checks',
    },
    { id: 'rhs_captain', label: 'RHS Captain', description: 'Right-hand seat qualified captains' },
  ] as const
  const [selectedCaptainRoles, setSelectedCaptainRoles] = useState<string[]>(
    CAPTAIN_ROLE_OPTIONS.map((r) => r.id)
  )

  const handleCaptainRoleToggle = (roleId: string) => {
    setSelectedCaptainRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    )
  }

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('configure')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)

  // Preview query - only runs when on preview step
  const previewQuery = useQuery<PreviewData>({
    queryKey: [
      'renewal-preview',
      monthsAhead,
      selectedCategories,
      selectedCheckCodes,
      selectedCaptainRoles,
    ],
    queryFn: async () => {
      const response = await fetch('/api/renewal-planning/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify({
          monthsAhead,
          categories: selectedCategories,
          checkCodes: selectedCheckCodes.length > 0 ? selectedCheckCodes : undefined,
          captainRoles: selectedCaptainRoles.length > 0 ? selectedCaptainRoles : undefined,
        }),
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch preview')
      }
      const result = await response.json()
      return result.data
    },
    enabled: currentStep === 'preview' && selectedCategories.length > 0,
    staleTime: 30000, // Cache for 30 seconds
  })

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) => {
      const isSelected = prev.includes(category)
      if (isSelected) {
        // When deselecting a category, also remove its check codes
        if (CATEGORIES_WITH_CHECK_TYPES.includes(category)) {
          const checkTypesForCategory = getCheckTypesForCategory(category)
          const codesToRemove = checkTypesForCategory.map((c) => c.checkCode)
          setSelectedCheckCodes((codes) => codes.filter((c) => !codesToRemove.includes(c)))
        }
        return prev.filter((c) => c !== category)
      } else {
        // When selecting a category, also add its default check codes
        if (CATEGORIES_WITH_CHECK_TYPES.includes(category)) {
          const checkTypesForCategory = getCheckTypesForCategory(category)
          const defaultCodes = checkTypesForCategory
            .filter((c) => c.includedByDefault)
            .map((c) => c.checkCode)
          setSelectedCheckCodes((codes) => [...new Set([...codes, ...defaultCodes])])
        }
        return [...prev, category]
      }
    })
  }

  const handleCheckCodeToggle = (checkCode: string) => {
    setSelectedCheckCodes((prev) =>
      prev.includes(checkCode) ? prev.filter((c) => c !== checkCode) : [...prev, checkCode]
    )
  }

  const handleExpandCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  const handleNextStep = () => {
    if (currentStep === 'configure') {
      setCurrentStep('preview')
    }
  }

  const handlePreviousStep = () => {
    if (currentStep === 'preview') {
      setCurrentStep('configure')
    } else if (currentStep === 'results') {
      // Go back to configure to start fresh
      setGenerationResult(null)
      setCurrentStep('configure')
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)

    try {
      // Clear existing plans if requested
      if (clearExisting) {
        toast.info('Clearing existing renewal plans...')
        const deleteResponse = await fetch('/api/renewal-planning/clear', {
          method: 'DELETE',
          headers: { ...csrfHeaders() },
          credentials: 'include',
        })

        if (!deleteResponse.ok) {
          throw new Error('Failed to clear existing plans')
        }
      }

      // Generate new plans
      toast.info('Generating renewal plans with Captain/FO pairing...')
      const response = await fetch('/api/renewal-planning/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify({
          monthsAhead,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
          checkCodes: selectedCheckCodes.length > 0 ? selectedCheckCodes : undefined,
          captainRoles: selectedCaptainRoles.length > 0 ? selectedCaptainRoles : undefined,
        }),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error || 'Failed to generate renewal plan')
      }

      const result = await response.json()

      // Store results and transition to results view
      setGenerationResult(result.data)
      setCurrentStep('results')
      toast.success(`Successfully generated ${result.data.totalPlans} renewal plans!`)
    } catch (error: unknown) {
      console.error('Error generating renewal plan:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to generate renewal plan'
      toast.error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportCSV = () => {
    const checkCodesParam =
      selectedCheckCodes.length > 0 ? `&checkCodes=${selectedCheckCodes.join(',')}` : ''
    window.open(`/api/renewal-planning/export-csv?year=${year}${checkCodesParam}`, '_blank')
  }

  const handleExportPDF = () => {
    const checkCodesParam =
      selectedCheckCodes.length > 0 ? `&checkCodes=${selectedCheckCodes.join(',')}` : ''
    window.open(`/api/renewal-planning/export-pdf?year=${year}${checkCodesParam}`, '_blank')
  }

  // ============================================================
  // Step 1: Configure
  // ============================================================
  const renderConfigureStep = () => (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* Time Horizon */}
        <Card className="p-6">
          <h2 className="text-foreground mb-4 text-xl font-semibold">Time Horizon</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="monthsAhead">Months Ahead</Label>
              <Input
                id="monthsAhead"
                type="number"
                min={1}
                max={24}
                value={monthsAhead}
                onChange={(e) => setMonthsAhead(Number(e.target.value))}
                className="mt-2 max-w-[200px]"
              />
              <p className="text-muted-foreground mt-2 text-sm">
                Plan renewals for certifications expiring in the next {monthsAhead} months
              </p>
            </div>
          </div>
        </Card>

        {/* Category Selection with Check Types */}
        <Card className="p-6">
          <h2 className="text-foreground mb-4 text-xl font-semibold">
            Categories &amp; Check Types
          </h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Select certification categories and specific check types to include. Medical is excluded
            from planning (28-day window too short for advance scheduling).
          </p>
          <div className="space-y-3">
            {CATEGORIES.map((category) => {
              const hasCheckTypes = CATEGORIES_WITH_CHECK_TYPES.includes(category)
              const isExpanded = expandedCategories.includes(category)
              const checkTypesForCategory = hasCheckTypes ? getCheckTypesForCategory(category) : []
              const selectedCheckTypesCount = hasCheckTypes
                ? checkTypesForCategory.filter((ct) => selectedCheckCodes.includes(ct.checkCode))
                    .length
                : 0
              const CategoryIcon =
                category === 'Flight Checks'
                  ? Plane
                  : category === 'Simulator Checks'
                    ? Monitor
                    : null

              return (
                <div key={category} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryToggle(category)}
                      />
                      {CategoryIcon && <CategoryIcon className="text-muted-foreground h-4 w-4" />}
                      <Label htmlFor={category} className="cursor-pointer font-medium">
                        {category}
                      </Label>
                      {hasCheckTypes && selectedCheckTypesCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {selectedCheckTypesCount} selected
                        </Badge>
                      )}
                    </div>
                    {hasCheckTypes && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExpandCategory(category)}
                        className="h-8 px-2"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Check Types Submenu */}
                  {hasCheckTypes && isExpanded && (
                    <div className="border-muted mt-3 ml-6 space-y-2 border-l-2 pl-4">
                      <p className="text-muted-foreground mb-2 text-xs">
                        Select specific check types to include:
                      </p>
                      {checkTypesForCategory.map((checkType) => (
                        <div key={checkType.checkCode} className="flex items-center space-x-2">
                          <Checkbox
                            id={checkType.checkCode}
                            checked={selectedCheckCodes.includes(checkType.checkCode)}
                            onCheckedChange={() => handleCheckCodeToggle(checkType.checkCode)}
                            disabled={!selectedCategories.includes(category)}
                          />
                          <Label
                            htmlFor={checkType.checkCode}
                            className={`cursor-pointer text-sm ${
                              !selectedCategories.includes(category) ? 'text-muted-foreground' : ''
                            }`}
                          >
                            {checkType.label}
                            <span className="text-muted-foreground ml-1 text-xs">
                              ({checkType.checkCode})
                            </span>
                            {checkType.includedByDefault && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Default
                              </Badge>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <Separator className="my-4" />
          <div className="rounded-md border border-[var(--color-warning-500)]/20 bg-[var(--color-warning-muted)] p-3">
            <p className="text-sm text-[var(--color-warning-400)]">
              <strong>Note:</strong> Pilot Medical certifications have a 28-day grace period, which
              is too short for advance planning. Medical renewals should be scheduled through urgent
              scheduling.
            </p>
          </div>
        </Card>

        {/* Captain Role Pairing Configuration */}
        <Card className="p-6">
          <h2 className="text-foreground mb-4 text-xl font-semibold">Captain Role Pairing</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Select which captain qualification types to include when pairing Captains with First
            Officers. RHS/Training/Examiner captains perform simulator checks from the right-hand
            seat.
          </p>
          <div className="space-y-3">
            {CAPTAIN_ROLE_OPTIONS.map((role) => (
              <div key={role.id} className="flex items-start space-x-2">
                <Checkbox
                  id={`role-${role.id}`}
                  checked={selectedCaptainRoles.includes(role.id)}
                  onCheckedChange={() => handleCaptainRoleToggle(role.id)}
                />
                <div className="space-y-0.5">
                  <Label htmlFor={`role-${role.id}`} className="cursor-pointer font-medium">
                    {role.label}
                  </Label>
                  <p className="text-muted-foreground text-xs">{role.description}</p>
                </div>
              </div>
            ))}
          </div>
          {selectedCaptainRoles.length === 0 && (
            <p className="mt-3 text-sm text-[var(--color-danger-400)]">
              At least one captain role must be selected for pairing to work.
            </p>
          )}
        </Card>

        {/* Options */}
        <Card className="p-6">
          <h2 className="text-foreground mb-4 text-xl font-semibold">Options</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="clearExisting"
                checked={clearExisting}
                onCheckedChange={(checked) => setClearExisting(checked as boolean)}
              />
              <div className="space-y-1">
                <Label htmlFor="clearExisting" className="cursor-pointer font-medium">
                  Clear existing renewal plans
                </Label>
                <p className="text-muted-foreground text-sm">
                  Remove all existing renewal plans before generating new ones
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Warning */}
        {clearExisting && (
          <Card className="border-[var(--color-danger-500)]/20 bg-[var(--color-destructive-muted)] p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="mt-1 h-6 w-6 text-[var(--color-danger-400)]" />
              <div>
                <h3 className="font-semibold text-[var(--color-danger-400)]">
                  Warning: Destructive Action
                </h3>
                <p className="mt-1 text-sm text-[var(--color-danger-400)]">
                  This will permanently delete all existing renewal plans. This action cannot be
                  undone.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Right sidebar */}
      <div className="space-y-6">
        {/* Quick Stats */}
        <Card className="bg-[var(--color-info-bg)] p-6">
          <h3 className="mb-3 font-semibold text-[var(--color-info)]">How It Works</h3>
          <ul className="space-y-2 text-sm text-[var(--color-info)]">
            <li>• Fetches expiring checks for selected categories</li>
            <li>• Pairs Captains with First Officers (Flight/Simulator)</li>
            <li>• TRI/TRE/RHS captains get right-hand seat for sim checks</li>
            <li>• Assigns to all 13 roster periods (RP1-RP13)</li>
            <li>• Distributes evenly based on capacity limits</li>
            <li>• Grace periods: 90 days (Flight/Sim), 60 days (Ground)</li>
          </ul>
        </Card>

        {/* Navigation */}
        <Button
          onClick={handleNextStep}
          disabled={selectedCategories.length === 0}
          size="lg"
          className="w-full"
        >
          Next: Preview
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        {selectedCategories.length === 0 && (
          <p className="text-muted-foreground text-center text-sm">
            Select at least one category to continue
          </p>
        )}
      </div>
    </div>
  )

  // ============================================================
  // Step 2: Preview
  // ============================================================
  const renderPreviewStep = () => {
    const preview = previewQuery.data

    return (
      <div className="space-y-6">
        {/* Summary Stats */}
        {preview && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4 text-center">
              <p className="text-primary text-3xl font-bold">{preview.totalPlans}</p>
              <p className="text-muted-foreground text-sm">Total Renewals</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-[var(--color-success-600)]">
                {preview.pairingStats.totalPairs}
              </p>
              <p className="text-muted-foreground text-sm">Paired Crews</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-[var(--color-badge-orange)]">
                {preview.pairingStats.totalUnpaired}
              </p>
              <p className="text-muted-foreground text-sm">Unpaired Pilots</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold">{preview.avgUtilization}%</p>
              <p className="text-muted-foreground text-sm">Avg Utilization</p>
            </Card>
          </div>
        )}

        {/* Timeline visualization */}
        {preview && preview.distribution.length > 0 && (
          <Card className="p-6">
            <h3 className="text-foreground mb-4 font-semibold">Roster Period Utilization</h3>
            <RosterPeriodTimeline
              periods={preview.distribution.map((d) => ({
                code: d.rosterPeriod,
                utilization: d.utilization,
                plannedCount: d.plannedCount,
                totalCapacity: d.totalCapacity,
              }))}
            />
          </Card>
        )}

        {/* Warnings */}
        {preview && preview.warnings.length > 0 && (
          <Card className="border-[var(--color-badge-orange)]/20 bg-[var(--color-badge-orange-bg)] p-4">
            <h3 className="mb-2 flex items-center font-semibold text-[var(--color-badge-orange)]">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Warnings ({preview.warnings.length})
            </h3>
            <ul className="space-y-1">
              {preview.warnings.map((w, idx) => (
                <li key={idx} className="text-sm text-[var(--color-badge-orange)]">
                  <Badge
                    variant={w.severity === 'critical' ? 'destructive' : 'outline'}
                    className="mr-2"
                  >
                    {w.rosterPeriod}
                  </Badge>
                  {w.message}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Pairing Details */}
        {previewQuery.isLoading ? (
          <Card className="p-8 text-center">
            <RefreshCw className="text-primary mx-auto mb-4 h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Loading preview with pairing information...</p>
          </Card>
        ) : previewQuery.isError ? (
          <Card className="border-[var(--color-danger-500)]/20 bg-[var(--color-destructive-muted)] p-6 text-center">
            <p className="text-[var(--color-danger-400)]">
              Failed to load preview. Please try again.
            </p>
            <Button
              onClick={() => previewQuery.refetch()}
              variant="outline"
              className="mt-4"
              size="sm"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </Card>
        ) : preview ? (
          <PreviewPairingPanel distribution={preview.distribution} />
        ) : null}

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <Button onClick={handlePreviousStep} variant="outline" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Configure
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            size="lg"
            className="min-w-[200px]"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Generate Plan
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // ============================================================
  // Step 3: Results
  // ============================================================
  const renderResultsStep = () => {
    if (!generationResult) return null

    return (
      <div className="space-y-6">
        {/* Success Header */}
        <div className="flex items-center space-x-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${generationResult.totalPlans > 0 ? 'bg-[var(--color-success-muted)]' : 'bg-[var(--color-warning-muted)]'}`}
          >
            {generationResult.totalPlans > 0 ? (
              <CheckCircle2 className="h-6 w-6 text-[var(--color-success-400)]" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-[var(--color-warning-400)]" />
            )}
          </div>
          <div>
            <h2 className="text-foreground text-2xl font-bold">
              {generationResult.totalPlans > 0 ? 'Generation Complete!' : 'No Renewals Found'}
            </h2>
            <p className="text-muted-foreground">
              {generationResult.totalPlans > 0
                ? `Successfully generated ${generationResult.totalPlans} renewal plans`
                : 'No certifications matched the selected criteria. Try adjusting the time horizon or categories.'}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-[var(--color-success-500)]/20 bg-[var(--color-success-muted)] p-6 text-center">
            <p className="text-4xl font-bold text-[var(--color-success-400)]">
              {generationResult.totalPlans}
            </p>
            <p className="text-sm text-[var(--color-success-400)]">Total Plans Generated</p>
          </Card>
          <Card className="p-6 text-center">
            <p className="text-foreground text-4xl font-bold">
              {Object.keys(generationResult.byCategory).length}
            </p>
            <p className="text-muted-foreground text-sm">Categories Covered</p>
          </Card>
          <Card className="p-6 text-center">
            <p className="text-foreground text-4xl font-bold">
              {generationResult.rosterPeriodSummary.length}
            </p>
            <p className="text-muted-foreground text-sm">Roster Periods</p>
          </Card>
          {generationResult.pairingStats && (
            <Card className="p-6 text-center">
              <p className="text-foreground text-4xl font-bold">
                {generationResult.pairingStats.pairingRate}%
              </p>
              <p className="text-muted-foreground text-sm">Pairing Rate</p>
            </Card>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Category Breakdown */}
          <Card className="p-6">
            <h3 className="text-foreground mb-4 flex items-center text-lg font-semibold">
              <BarChart3 className="mr-2 h-5 w-5" />
              By Category
            </h3>
            <div className="space-y-3">
              {Object.entries(generationResult.byCategory).map(([category, count]) => {
                const percentage = Math.round((count / generationResult.totalPlans) * 100)
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground font-medium">{category}</span>
                      <span className="text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Roster Period Breakdown */}
          <Card className="p-6">
            <h3 className="text-foreground mb-4 flex items-center text-lg font-semibold">
              <BarChart3 className="mr-2 h-5 w-5" />
              By Roster Period
            </h3>
            <div className="space-y-3">
              {generationResult.rosterPeriodSummary.slice(0, 8).map((period) => {
                const maxCount = Math.max(
                  ...generationResult.rosterPeriodSummary.map((p) => p.totalRenewals)
                )
                const percentage =
                  maxCount > 0 ? Math.round((period.totalRenewals / maxCount) * 100) : 0
                return (
                  <div key={period.rosterPeriod} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground font-medium">{period.rosterPeriod}</span>
                      <Badge variant="secondary">{period.totalRenewals} renewals</Badge>
                    </div>
                    <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
                      <div
                        className="h-full bg-[var(--color-primary-500)] transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              {generationResult.rosterPeriodSummary.length > 8 && (
                <p className="text-muted-foreground text-center text-sm">
                  +{generationResult.rosterPeriodSummary.length - 8} more periods
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Actions */}
        <Card className="p-6">
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => {
                router.refresh()
                router.push(`/dashboard/renewal-planning?year=${year}`)
              }}
              size="lg"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              View Dashboard
            </Button>
            <Button onClick={handleExportCSV} variant="outline" size="lg">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={handleExportPDF} variant="outline" size="lg">
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button onClick={handlePreviousStep} variant="ghost" size="lg">
              <RotateCcw className="mr-2 h-4 w-4" />
              Generate Another
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // ============================================================
  // Main Render
  // ============================================================
  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/renewal-planning?year=${year}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-foreground text-3xl font-bold">Generate Renewal Plan</h1>
            <p className="text-muted-foreground mt-1">
              Plan renewals for Flight, Simulator, and Ground Courses with Captain/FO pairing
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <Card className="p-6">
        <GenerationStepIndicator currentStep={currentStep} />
      </Card>

      {/* Step Content */}
      {currentStep === 'configure' && renderConfigureStep()}
      {currentStep === 'preview' && renderPreviewStep()}
      {currentStep === 'results' && renderResultsStep()}
    </div>
  )
}
