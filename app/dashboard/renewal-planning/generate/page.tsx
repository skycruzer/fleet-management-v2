'use client'

/**
 * Generate Renewal Plan Configuration Page
 * Author: Maurice Rondeau
 *
 * Allows users to customize renewal plan generation with:
 * - Live preview as configuration changes
 * - Post-generation results view
 * - User-controlled navigation
 *
 * Features:
 * - Configure time horizon (months ahead)
 * - Filter by category
 * - Preview before generating (uses GenerationPreview component)
 * - Clear existing plans option
 * - Detailed results view after generation
 */

import { useState } from 'react'
import {
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  ArrowRight,
  RotateCcw,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { GenerationPreview } from '@/components/renewal-planning/generation-preview'

// Focus on checks with grace periods suitable for advance planning
// - Flight Checks: 90-day grace period
// - Simulator Checks: 90-day grace period
// - Ground Courses Refresher: 60-day grace period
const CATEGORIES = ['Flight Checks', 'Simulator Checks', 'Ground Courses Refresher']

// Page state machine
type PageState = 'configure' | 'generating' | 'results'

// Generation result data structure
interface GenerationResult {
  totalPlans: number
  byCategory: Record<string, number>
  rosterPeriodSummary: Array<{
    rosterPeriod: string
    totalRenewals: number
  }>
}

export default function GeneratePlanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const year = searchParams.get('year') || new Date().getFullYear().toString()

  // Configuration state
  const [monthsAhead, setMonthsAhead] = useState(12)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORIES)
  const [clearExisting, setClearExisting] = useState(false)

  // Page state machine
  const [pageState, setPageState] = useState<PageState>('configure')
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  const handleGenerate = async () => {
    setPageState('generating')

    try {
      // Clear existing plans if requested
      if (clearExisting) {
        toast.info('Clearing existing renewal plans...')
        const deleteResponse = await fetch('/api/renewal-planning/clear', {
          method: 'DELETE',
          credentials: 'include',
        })

        if (!deleteResponse.ok) {
          throw new Error('Failed to clear existing plans')
        }
      }

      // Generate new plans
      toast.info('Generating renewal plans...')
      const response = await fetch('/api/renewal-planning/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monthsAhead,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
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
      setPageState('results')
      toast.success(`Successfully generated ${result.data.totalPlans} renewal plans!`)
    } catch (error: unknown) {
      console.error('Error generating renewal plan:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to generate renewal plan'
      toast.error(errorMessage)
      setPageState('configure') // Go back to configure on error
    }
  }

  const handleGenerateAnother = () => {
    setGenerationResult(null)
    setPageState('configure')
  }

  const handleViewDashboard = () => {
    router.push(`/dashboard/renewal-planning?year=${year}`)
  }

  // Results View Component
  if (pageState === 'results' && generationResult) {
    return (
      <div className="space-y-6 p-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-foreground text-3xl font-bold">Generation Complete</h1>
            <p className="text-muted-foreground mt-1">
              Successfully generated {generationResult.totalPlans} renewal plans
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <Card className="border-green-200 bg-green-50 p-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-4xl font-bold text-green-700">{generationResult.totalPlans}</p>
              <p className="text-sm text-green-600">Total Plans Generated</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-green-700">
                {Object.keys(generationResult.byCategory).length}
              </p>
              <p className="text-sm text-green-600">Categories Covered</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-green-700">
                {generationResult.rosterPeriodSummary.length}
              </p>
              <p className="text-sm text-green-600">Roster Periods</p>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Category Breakdown */}
          <Card className="p-6">
            <h2 className="text-foreground mb-4 flex items-center text-xl font-semibold">
              <BarChart3 className="mr-2 h-5 w-5" />
              By Category
            </h2>
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
            <h2 className="text-foreground mb-4 flex items-center text-xl font-semibold">
              <BarChart3 className="mr-2 h-5 w-5" />
              By Roster Period
            </h2>
            <div className="space-y-3">
              {generationResult.rosterPeriodSummary.slice(0, 8).map((period) => {
                const maxCount = Math.max(
                  ...generationResult.rosterPeriodSummary.map((p) => p.totalRenewals)
                )
                const percentage = Math.round((period.totalRenewals / maxCount) * 100)
                return (
                  <div key={period.rosterPeriod} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground font-medium">{period.rosterPeriod}</span>
                      <Badge variant="secondary">{period.totalRenewals} renewals</Badge>
                    </div>
                    <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
                      <div
                        className="h-full bg-blue-500 transition-all"
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

        {/* Action Buttons */}
        <Card className="p-6">
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={handleViewDashboard} size="lg">
              <ArrowRight className="mr-2 h-4 w-4" />
              View Dashboard
            </Button>
            <Button onClick={handleGenerateAnother} variant="outline" size="lg">
              <RotateCcw className="mr-2 h-4 w-4" />
              Generate Another Plan
            </Button>
            <Link href={`/dashboard/renewal-planning?year=${year}`}>
              <Button variant="ghost" size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Planning
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  // Generating State
  if (pageState === 'generating') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Card className="p-12 text-center">
          <RefreshCw className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
          <h2 className="text-foreground mb-2 text-2xl font-semibold">Generating Renewal Plans</h2>
          <p className="text-muted-foreground">
            {clearExisting
              ? 'Clearing existing plans and generating new ones...'
              : 'Calculating optimal renewal schedule...'}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">This may take a few moments</p>
        </Card>
      </div>
    )
  }

  // Configure State (default)
  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href={`/dashboard/renewal-planning?year=${year}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Planning
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-3xl font-bold">Generate Renewal Plan</h1>
          <p className="text-muted-foreground mt-1">
            Generate renewal schedule for Flight, Simulator, and Ground Courses (60-90 day grace
            periods)
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration Panel */}
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
                  className="mt-2"
                />
                <p className="text-muted-foreground mt-2 text-sm">
                  Plan renewals for certifications expiring in the next {monthsAhead} months
                </p>
              </div>
            </div>
          </Card>

          {/* Category Filter */}
          <Card className="p-6">
            <h2 className="text-foreground mb-4 text-xl font-semibold">Category Filter</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              All three categories selected by default. These certifications have grace periods
              (60-90 days) suitable for advance planning, allowing renewals to be evenly distributed
              across roster periods throughout the year.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {CATEGORIES.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  />
                  <Label htmlFor={category} className="cursor-pointer">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
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
            <Card className="border-red-200 bg-red-50 p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="mt-1 h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Warning: Destructive Action</h3>
                  <p className="mt-1 text-sm text-red-700">
                    This will permanently delete all existing renewal plans. Make sure you have a
                    backup if needed. This action cannot be undone.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Panel - Preview & Summary */}
        <div className="space-y-6">
          {/* Live Preview */}
          <GenerationPreview
            monthsAhead={monthsAhead}
            categories={selectedCategories}
            enabled={selectedCategories.length > 0}
          />

          {/* How It Works */}
          <Card className="bg-blue-50 p-6">
            <h3 className="mb-2 font-semibold text-blue-900">How It Works</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• Fetches checks expiring in time horizon (Flight, Simulator, Ground Courses)</li>
              <li>• Grace periods: 90 days (Flight/Simulator), 60 days (Ground Courses)</li>
              <li>• Assigns to roster periods with lowest load</li>
              <li>• Respects capacity: Flight (4), Simulator (6), Ground (8) pilots per period</li>
              <li>• Distributes renewals evenly throughout the year</li>
            </ul>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={selectedCategories.length === 0}
            size="lg"
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate Renewal Plan
          </Button>

          {selectedCategories.length === 0 && (
            <p className="text-muted-foreground text-center text-sm">
              Select at least one category to generate
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
