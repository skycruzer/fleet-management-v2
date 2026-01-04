/**
 * Analytics Dashboard Page
 * Comprehensive fleet analytics and KPI visualization
 */

'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  BarChart3,
  Plane,
  Target,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Palmtree,
  Info,
  Download,
  FileText,
} from 'lucide-react'

interface AnalyticsData {
  pilot: {
    total: number
    active: number
    inactive: number
    captains: number
    firstOfficers: number
    retirementPlanning: {
      retiringIn2Years: number
      retiringIn5Years: number
      pilotsRetiringIn2Years: Array<{
        id: string
        name: string
        rank: string
        retirementDate: string
        yearsToRetirement: number
      }>
      pilotsRetiringIn5Years: Array<{
        id: string
        name: string
        rank: string
        retirementDate: string
        yearsToRetirement: number
      }>
    }
  }
  certification: {
    total: number
    current: number
    expiring: number
    expired: number
    complianceRate: number
    categoryBreakdown: Array<{
      category: string
      current: number
      expiring: number
      expired: number
    }>
  }
  leave: {
    total: number
    pending: number
    approved: number
    denied: number
    byType: Array<{
      type: string
      count: number
      totalDays: number
    }>
  }
  fleet: {
    utilization: number
    availability: number
    readiness: number
    pilotAvailability: {
      available: number
      onLeave: number
    }
    complianceStatus: {
      fullyCompliant: number
      minorIssues: number
      majorIssues: number
    }
  }
  risk: {
    overallRiskScore: number
    riskFactors: Array<{
      factor: string
      severity: string
      impact: number
      description: string
    }>
    criticalAlerts: Array<{
      id: string
      type: string
      severity: string
      title: string
      description: string
      affectedItems: number
    }>
  }
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics')
      const result = await response.json()

      if (result.success) {
        setAnalytics(result.data)
      } else {
        setError(result.error || 'Failed to fetch analytics')
      }
    } catch (err) {
      setError('Failed to fetch analytics data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchAnalytics()
  }

  async function handleExport(format: 'csv' | 'pdf') {
    if (!analytics) return

    try {
      setExporting(true)
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, data: analytics }),
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Export failed')

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fleet-analytics-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'txt' : 'csv'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Export error:', err)
      alert('Failed to export analytics data')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="p-8 text-center">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="text-primary h-6 w-6 animate-spin" aria-hidden="true" />
            <p className="text-muted-foreground text-sm">Loading analytics...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="space-y-4">
        <Card className="p-8 text-center">
          <div className="space-y-3">
            <span className="text-4xl">❌</span>
            <div>
              <h3 className="text-foreground mb-1 text-lg font-bold">Error</h3>
              <p className="text-muted-foreground text-sm">
                {error || 'Analytics data not available'}
              </p>
            </div>
            <Button onClick={handleRefresh}>Try Again</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-foreground text-xl font-bold">Fleet Analytics Dashboard</h2>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Comprehensive analytics and key performance indicators
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="w-full sm:w-auto"
        >
          {refreshing ? (
            <span className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Refreshing...</span>
            </span>
          ) : (
            '🔄 Refresh Data'
          )}
        </Button>
      </div>

      {/* Critical Alerts Section */}
      {analytics.risk.criticalAlerts.length > 0 && (
        <Card className="border-destructive/20 bg-red-50 p-4">
          <div className="flex items-start space-x-2">
            <span className="text-2xl">🚨</span>
            <div className="flex-1">
              <h3 className="text-foreground mb-2 text-base font-bold">Critical Alerts</h3>
              <div className="space-y-1.5">
                {analytics.risk.criticalAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="border-destructive/30 bg-destructive/5 rounded-lg border p-3"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-foreground font-medium">{alert.title}</span>
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          alert.severity === 'critical'
                            ? 'bg-red-600 text-white'
                            : 'bg-yellow-600 text-white'
                        }`}
                      >
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">{alert.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Fleet Readiness Overview */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <div className="mb-2 flex items-center justify-between">
            <BarChart3 className="h-8 w-8 text-blue-600" aria-hidden="true" />
            <span className="text-2xl font-bold text-blue-900">{analytics.fleet.utilization}%</span>
          </div>
          <h3 className="text-muted-foreground text-xs font-medium uppercase">Fleet Utilization</h3>
          <p className="text-muted-foreground mt-0.5 text-xs">Certification compliance rate</p>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-4">
          <div className="mb-2 flex items-center justify-between">
            <Plane className="h-8 w-8 text-green-600" aria-hidden="true" />
            <span className="text-2xl font-bold text-green-900">
              {analytics.fleet.availability}%
            </span>
          </div>
          <h3 className="text-muted-foreground text-xs font-medium uppercase">
            Pilot Availability
          </h3>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {analytics.fleet.pilotAvailability.available} available,{' '}
            {analytics.fleet.pilotAvailability.onLeave} on leave
          </p>
        </Card>

        <Card className="border-primary/20 from-primary/5 bg-gradient-to-br to-purple-100 p-4">
          <div className="mb-2 flex items-center justify-between">
            <Target className="text-primary h-8 w-8" aria-hidden="true" />
            <span className="text-primary-foreground text-2xl font-bold">
              {analytics.fleet.readiness}%
            </span>
          </div>
          <h3 className="text-muted-foreground text-xs font-medium uppercase">Fleet Readiness</h3>
          <p className="text-muted-foreground mt-0.5 text-xs">Overall operational readiness</p>
        </Card>
      </div>

      {/* Pilot Analytics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-foreground mb-3 border-b pb-1.5 text-base font-semibold">
            👥 Pilot Distribution
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-foreground text-2xl font-bold">{analytics.pilot.total}</div>
              <div className="text-muted-foreground text-xs">Total Pilots</div>
            </div>
            <div className="rounded-lg bg-green-50 p-3">
              <div className="text-2xl font-bold text-green-900">{analytics.pilot.active}</div>
              <div className="text-muted-foreground text-xs">Active</div>
            </div>
            <div className="bg-primary/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-900">{analytics.pilot.captains}</div>
              <div className="text-muted-foreground text-xs">Captains</div>
            </div>
            <div className="rounded-lg bg-indigo-50 p-3">
              <div className="text-2xl font-bold text-indigo-900">
                {analytics.pilot.firstOfficers}
              </div>
              <div className="text-muted-foreground text-xs">First Officers</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-foreground mb-4 border-b pb-2 text-lg font-semibold">
            ⏰ Retirement Planning
          </h3>
          <div className="space-y-4">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-muted-foreground text-sm">Retiring in 2 Years</div>
                  <div className="mt-1 text-2xl font-bold text-yellow-900">
                    {analytics.pilot.retirementPlanning.retiringIn2Years} pilots
                  </div>
                  {analytics.pilot.retirementPlanning.pilotsRetiringIn2Years.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {analytics.pilot.retirementPlanning.pilotsRetiringIn2Years.map((pilot) => (
                        <div
                          key={pilot.id}
                          className="flex items-center justify-between rounded-md bg-white/50 px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-yellow-900">
                            {pilot.rank} {pilot.name}
                          </span>
                          <span className="text-xs text-yellow-700">
                            {new Date(pilot.retirementDate).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <AlertTriangle className="h-8 w-8 flex-shrink-0 text-red-600" aria-hidden="true" />
              </div>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-muted-foreground text-sm">Retiring in 3-5 Years</div>
                  <div className="mt-1 text-2xl font-bold text-orange-900">
                    {analytics.pilot.retirementPlanning.pilotsRetiringIn5Years.length} pilots
                  </div>
                  {analytics.pilot.retirementPlanning.pilotsRetiringIn5Years.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {analytics.pilot.retirementPlanning.pilotsRetiringIn5Years.map((pilot) => (
                        <div
                          key={pilot.id}
                          className="flex items-center justify-between rounded-md bg-white/50 px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-orange-900">
                            {pilot.rank} {pilot.name}
                          </span>
                          <span className="text-xs text-orange-700">
                            {new Date(pilot.retirementDate).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Calendar className="h-8 w-8 flex-shrink-0 text-yellow-600" aria-hidden="true" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Certification Analytics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-foreground mb-4 flex items-center border-b pb-2 text-lg font-semibold">
            <CheckCircle className="mr-2 h-5 w-5 text-green-600" aria-hidden="true" />
            Certification Status
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-foreground text-3xl font-bold">
                {analytics.certification.total}
              </div>
              <div className="text-muted-foreground text-sm">Total Certifications</div>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <div className="text-3xl font-bold text-green-900">
                {analytics.certification.current}
              </div>
              <div className="text-muted-foreground text-sm">Current</div>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4">
              <div className="text-3xl font-bold text-yellow-900">
                {analytics.certification.expiring}
              </div>
              <div className="text-muted-foreground text-sm">Expiring (≤30 days)</div>
            </div>
            <div className="rounded-lg bg-red-50 p-4">
              <div className="text-3xl font-bold text-red-900">
                {analytics.certification.expired}
              </div>
              <div className="text-muted-foreground text-sm">Expired</div>
            </div>
          </div>
          <div className="bg-primary/5 mt-4 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-card-foreground text-sm font-medium">Compliance Rate</span>
              <span className="text-2xl font-bold text-blue-900">
                {analytics.certification.complianceRate}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-foreground mb-4 border-b pb-2 text-lg font-semibold">
            📂 Category Breakdown
          </h3>
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {analytics.certification.categoryBreakdown.map((category) => (
              <div key={category.category} className="bg-muted/50 rounded-lg p-3">
                <div className="text-foreground mb-2 font-medium">{category.category}</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-bold text-green-700">{category.current}</div>
                    <div className="text-muted-foreground">Current</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-yellow-700">{category.expiring}</div>
                    <div className="text-muted-foreground">Expiring</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-red-700">{category.expired}</div>
                    <div className="text-muted-foreground">Expired</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Leave Analytics */}
      <Card className="p-6">
        <h3 className="text-foreground mb-4 flex items-center border-b pb-2 text-lg font-semibold">
          <Palmtree className="mr-2 h-5 w-5 text-green-600" aria-hidden="true" />
          Leave Request Analytics
        </h3>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-foreground text-3xl font-bold">{analytics.leave.total}</div>
            <div className="text-muted-foreground text-sm">Total Requests</div>
          </div>
          <div className="rounded-lg bg-yellow-50 p-4">
            <div className="text-3xl font-bold text-yellow-900">{analytics.leave.pending}</div>
            <div className="text-muted-foreground text-sm">Pending</div>
          </div>
          <div className="rounded-lg bg-green-50 p-4">
            <div className="text-3xl font-bold text-green-900">{analytics.leave.approved}</div>
            <div className="text-muted-foreground text-sm">Approved</div>
          </div>
          <div className="rounded-lg bg-red-50 p-4">
            <div className="text-3xl font-bold text-red-900">{analytics.leave.denied}</div>
            <div className="text-muted-foreground text-sm">Denied</div>
          </div>
        </div>

        <h4 className="text-foreground mb-3 font-medium">Leave Types Breakdown</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
          {analytics.leave.byType.map((type) => (
            <div key={type.type} className="bg-muted/50 rounded-lg p-3">
              <div className="text-foreground font-medium">{type.type}</div>
              <div className="text-muted-foreground mt-1 text-sm">
                {type.count} requests • {type.totalDays} days
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Risk Analytics */}
      <Card className="p-6">
        <h3 className="text-foreground mb-4 flex items-center border-b pb-2 text-lg font-semibold">
          <AlertTriangle className="mr-2 h-5 w-5 text-red-600" aria-hidden="true" />
          Risk Assessment
        </h3>
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-card-foreground text-sm font-medium">Overall Risk Score</span>
            <span
              className={`text-3xl font-bold ${
                analytics.risk.overallRiskScore > 50
                  ? 'text-red-900'
                  : analytics.risk.overallRiskScore > 25
                    ? 'text-yellow-900'
                    : 'text-green-900'
              }`}
            >
              {analytics.risk.overallRiskScore}/100
            </span>
          </div>
          <div className="bg-muted h-3 w-full rounded-full">
            <div
              className={`h-3 rounded-full ${
                analytics.risk.overallRiskScore > 50
                  ? 'bg-destructive'
                  : analytics.risk.overallRiskScore > 25
                    ? 'bg-warning'
                    : 'bg-success'
              }`}
              style={{ width: `${analytics.risk.overallRiskScore}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {analytics.risk.riskFactors.map((factor, index) => (
            <div key={index} className="bg-muted/50 rounded-lg p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-foreground font-medium">{factor.factor}</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    factor.severity === 'critical'
                      ? 'bg-red-600 text-white'
                      : factor.severity === 'high'
                        ? 'bg-orange-500 text-white'
                        : factor.severity === 'medium'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-green-500 text-white'
                  }`}
                >
                  {factor.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">{factor.description}</p>
              <div className="text-muted-foreground mt-2 text-xs">
                Impact: {factor.impact.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Export Section */}
      <Card className="bg-primary/5 border-primary/20 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Info className="h-6 w-6 text-blue-600" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-foreground text-sm font-medium">Analytics Dashboard</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Data refreshes automatically. Export your analytics data for offline analysis and
                reporting.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              Export CSV
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              disabled={exporting}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <FileText className="h-4 w-4" aria-hidden="true" />
              )}
              Export Report
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
