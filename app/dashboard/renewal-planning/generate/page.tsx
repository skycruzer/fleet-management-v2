'use client'

/**
 * Generate Renewal Plan Configuration Page
 * Allows users to customize renewal plan generation
 *
 * Features:
 * - Configure time horizon (months ahead)
 * - Filter by category
 * - Filter by specific pilots
 * - Preview before generating
 * - Clear existing plans option
 */

import { useState } from 'react'
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

// Focus on checks with grace periods suitable for advance planning
// - Flight Checks: 90-day grace period
// - Simulator Checks: 90-day grace period
// - Ground Courses Refresher: 60-day grace period
// This enables even distribution of renewals across roster periods throughout the year
const CATEGORIES = [
  'Flight Checks',
  'Simulator Checks',
  'Ground Courses Refresher',
]

export default function GeneratePlanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const year = searchParams.get('year') || new Date().getFullYear().toString()
  const [monthsAhead, setMonthsAhead] = useState(12)
  // Pre-select both Flight and Simulator Checks by default
  const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORIES)
  const [clearExisting, setClearExisting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  const handleGenerate = async () => {
    setIsGenerating(true)

    try {
      // Clear existing plans if requested
      if (clearExisting) {
        toast.info('Clearing existing renewal plans...')
        const deleteResponse = await fetch('/api/renewal-planning/clear', {
          method: 'DELETE',
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
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error || 'Failed to generate renewal plan')
      }

      const result = await response.json()

      toast.success(
        `Successfully generated ${result.data.totalPlans} renewal plans across ${result.data.rosterPeriodSummary.length} roster periods!`
      )

      // Redirect to main planning page with year parameter preserved
      setTimeout(() => {
        router.push(`/dashboard/renewal-planning?year=${year}`)
      }, 1500)
    } catch (error: any) {
      console.error('Error generating renewal plan:', error)
      toast.error(error.message || 'Failed to generate renewal plan')
    } finally {
      setIsGenerating(false)
    }
  }

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
            Generate renewal schedule for Flight, Simulator, and Ground Courses (60-90 day grace periods)
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

        {/* Summary Panel */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-foreground mb-4 text-xl font-semibold">Configuration Summary</h2>
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm">Time Horizon</p>
                <p className="text-foreground font-medium">{monthsAhead} months</p>
              </div>

              <div>
                <p className="text-muted-foreground text-sm">Categories</p>
                {selectedCategories.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedCategories.map((category) => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground font-medium">All categories</p>
                )}
              </div>

              <div>
                <p className="text-muted-foreground text-sm">Clear Existing</p>
                <p className="text-foreground font-medium">{clearExisting ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </Card>

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
          <Button onClick={handleGenerate} disabled={isGenerating} size="lg" className="w-full">
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate Renewal Plan
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
