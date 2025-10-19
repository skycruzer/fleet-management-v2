/**
 * Analytics Dashboard Page
 * Comprehensive fleet analytics and KPI visualization
 */

'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <div className="flex items-center justify-center space-x-2">
            <span className="animate-spin text-3xl">⏳</span>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <span className="text-6xl">❌</span>
            <div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">Error</h3>
              <p className="text-gray-600">{error || 'Analytics data not available'}</p>
            </div>
            <Button onClick={handleRefresh}>Try Again</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fleet Analytics Dashboard</h2>
          <p className="mt-1 text-gray-600">
            Comprehensive analytics and key performance indicators
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          {refreshing ? (
            <span className="flex items-center space-x-2">
              <span className="animate-spin">⏳</span>
              <span>Refreshing...</span>
            </span>
          ) : (
            '🔄 Refresh Data'
          )}
        </Button>
      </div>

      {/* Critical Alerts Section */}
      {analytics.risk.criticalAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50 p-6">
          <div className="flex items-start space-x-3">
            <span className="text-3xl">🚨</span>
            <div className="flex-1">
              <h3 className="mb-3 text-lg font-bold text-gray-900">Critical Alerts</h3>
              <div className="space-y-2">
                {analytics.risk.criticalAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-lg border border-red-300 bg-white p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium text-gray-900">{alert.title}</span>
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
                    <p className="text-sm text-gray-600">{alert.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Fleet Readiness Overview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-4xl">📊</span>
            <span className="text-3xl font-bold text-blue-900">{analytics.fleet.utilization}%</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 uppercase">Fleet Utilization</h3>
          <p className="mt-1 text-xs text-gray-500">Certification compliance rate</p>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-4xl">✈️</span>
            <span className="text-3xl font-bold text-green-900">
              {analytics.fleet.availability}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 uppercase">Pilot Availability</h3>
          <p className="mt-1 text-xs text-gray-500">
            {analytics.fleet.pilotAvailability.available} available,{' '}
            {analytics.fleet.pilotAvailability.onLeave} on leave
          </p>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-4xl">🎯</span>
            <span className="text-3xl font-bold text-purple-900">{analytics.fleet.readiness}%</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 uppercase">Fleet Readiness</h3>
          <p className="mt-1 text-xs text-gray-500">Overall operational readiness</p>
        </Card>
      </div>

      {/* Pilot Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-900">
            👥 Pilot Distribution
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-3xl font-bold text-gray-900">{analytics.pilot.total}</div>
              <div className="text-sm text-gray-600">Total Pilots</div>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <div className="text-3xl font-bold text-green-900">{analytics.pilot.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="text-3xl font-bold text-blue-900">{analytics.pilot.captains}</div>
              <div className="text-sm text-gray-600">Captains</div>
            </div>
            <div className="rounded-lg bg-indigo-50 p-4">
              <div className="text-3xl font-bold text-indigo-900">
                {analytics.pilot.firstOfficers}
              </div>
              <div className="text-sm text-gray-600">First Officers</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-900">
            ⏰ Retirement Planning
          </h3>
          <div className="space-y-4">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Retiring in 2 Years</div>
                  <div className="mt-1 text-2xl font-bold text-yellow-900">
                    {analytics.pilot.retirementPlanning.retiringIn2Years} pilots
                  </div>
                </div>
                <span className="text-3xl">⚠️</span>
              </div>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Retiring in 5 Years</div>
                  <div className="mt-1 text-2xl font-bold text-orange-900">
                    {analytics.pilot.retirementPlanning.retiringIn5Years} pilots
                  </div>
                </div>
                <span className="text-3xl">📅</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Certification Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-900">
            ✅ Certification Status
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-3xl font-bold text-gray-900">
                {analytics.certification.total}
              </div>
              <div className="text-sm text-gray-600">Total Certifications</div>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <div className="text-3xl font-bold text-green-900">
                {analytics.certification.current}
              </div>
              <div className="text-sm text-gray-600">Current</div>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4">
              <div className="text-3xl font-bold text-yellow-900">
                {analytics.certification.expiring}
              </div>
              <div className="text-sm text-gray-600">Expiring (≤30 days)</div>
            </div>
            <div className="rounded-lg bg-red-50 p-4">
              <div className="text-3xl font-bold text-red-900">
                {analytics.certification.expired}
              </div>
              <div className="text-sm text-gray-600">Expired</div>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Compliance Rate</span>
              <span className="text-2xl font-bold text-blue-900">
                {analytics.certification.complianceRate}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-900">
            📂 Category Breakdown
          </h3>
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {analytics.certification.categoryBreakdown.map((category) => (
              <div key={category.category} className="rounded-lg bg-gray-50 p-3">
                <div className="mb-2 font-medium text-gray-900">{category.category}</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-bold text-green-700">{category.current}</div>
                    <div className="text-gray-600">Current</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-yellow-700">{category.expiring}</div>
                    <div className="text-gray-600">Expiring</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-red-700">{category.expired}</div>
                    <div className="text-gray-600">Expired</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Leave Analytics */}
      <Card className="p-6">
        <h3 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-900">
          🏖️ Leave Request Analytics
        </h3>
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="text-3xl font-bold text-gray-900">{analytics.leave.total}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
          <div className="rounded-lg bg-yellow-50 p-4">
            <div className="text-3xl font-bold text-yellow-900">{analytics.leave.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="rounded-lg bg-green-50 p-4">
            <div className="text-3xl font-bold text-green-900">{analytics.leave.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="rounded-lg bg-red-50 p-4">
            <div className="text-3xl font-bold text-red-900">{analytics.leave.denied}</div>
            <div className="text-sm text-gray-600">Denied</div>
          </div>
        </div>

        <h4 className="mb-3 font-medium text-gray-900">Leave Types Breakdown</h4>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {analytics.leave.byType.map((type) => (
            <div key={type.type} className="rounded-lg bg-gray-50 p-3">
              <div className="font-medium text-gray-900">{type.type}</div>
              <div className="mt-1 text-sm text-gray-600">
                {type.count} requests • {type.totalDays} days
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Risk Analytics */}
      <Card className="p-6">
        <h3 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-900">
          ⚠️ Risk Assessment
        </h3>
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Overall Risk Score</span>
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
          <div className="h-3 w-full rounded-full bg-gray-200">
            <div
              className={`h-3 rounded-full ${
                analytics.risk.overallRiskScore > 50
                  ? 'bg-red-600'
                  : analytics.risk.overallRiskScore > 25
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
              }`}
              style={{ width: `${analytics.risk.overallRiskScore}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {analytics.risk.riskFactors.map((factor, index) => (
            <div key={index} className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-gray-900">{factor.factor}</span>
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
              <p className="text-sm text-gray-600">{factor.description}</p>
              <div className="mt-2 text-xs text-gray-500">Impact: {factor.impact.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Export Section */}
      <Card className="bg-primary/5 border-primary/20 p-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">ℹ️</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Analytics Data Export</p>
            <p className="mt-1 text-sm text-gray-600">
              Data refreshes automatically. Use the Refresh button to get the latest metrics. Export
              functionality coming soon.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
