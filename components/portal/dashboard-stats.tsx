'use client'

/**
 * Dashboard Stats Component
 *
 * Displays key pilot portal statistics including certifications,
 * leave requests, and upcoming checks.
 *
 * @spec 001-missing-core-features (US1)
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Calendar, Award, AlertCircle, Plane } from 'lucide-react'

interface PortalStats {
  total_pilots: number
  active_certifications: number
  pending_leave_requests: number
  pending_flight_requests: number
  upcoming_checks: number
}

export function DashboardStats({ pilotId }: { pilotId: string }) {
  const [stats, setStats] = useState<PortalStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchStats()
  }, [pilotId])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/portal/stats')
      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to fetch statistics')
        setIsLoading(false)
        return
      }

      setStats(result.data)
      setIsLoading(false)
    } catch (err) {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      title: 'Active Certifications',
      value: stats.active_certifications,
      icon: Award,
      description: 'Current valid certifications',
      color: 'text-green-600',
    },
    {
      title: 'Upcoming Checks',
      value: stats.upcoming_checks,
      icon: AlertCircle,
      description: 'Expiring within 60 days',
      color: stats.upcoming_checks > 0 ? 'text-yellow-600' : 'text-gray-600',
    },
    {
      title: 'Pending Leave Requests',
      value: stats.pending_leave_requests,
      icon: Calendar,
      description: 'Awaiting approval',
      color: 'text-blue-600',
    },
    {
      title: 'Pending Flight Requests',
      value: stats.pending_flight_requests,
      icon: Plane,
      description: 'Pending or under review',
      color: 'text-indigo-600',
    },
    {
      title: 'Fleet Pilots',
      value: stats.total_pilots,
      icon: FileText,
      description: 'Active pilots',
      color: 'text-purple-600',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
