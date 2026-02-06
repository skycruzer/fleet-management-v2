'use client'

/**
 * Pilot Certifications Page - Enhanced UX/UI
 * View pilot's certification status with filtering, search, and visual indicators
 *
 * @spec 001-missing-core-features (US1)
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  FileText,
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Search,
  Clock,
  LayoutGrid,
  List,
} from 'lucide-react'

interface Certification {
  id: string
  expiry_date: string | null
  check_types: {
    check_code: string
    check_description: string
    category: string
  } | null
}

type StatusFilter = 'all' | 'expired' | 'critical' | 'warning' | 'current'
type ViewMode = 'card' | 'list'

// Certification status thresholds (days until expiry)
const CERTIFICATION_THRESHOLDS = {
  CRITICAL_DAYS: 14, // Critical warning when <= 14 days remaining
  WARNING_DAYS: 60, // Warning when <= 60 days remaining
  VALIDITY_PERIOD: 365, // Assumed certification validity period for progress calculation
} as const

export default function CertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('card')

  // Define getCertificationStatus before it's used in effects
  const getCertificationStatus = useCallback((expiryDate: string | null) => {
    if (!expiryDate) {
      return {
        status: 'No Expiry',
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-300',
        icon: Clock,
        filterKey: 'current' as StatusFilter,
        daysRemaining: null,
        progressPercent: 100,
      }
    }

    const expiry = new Date(expiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    // Calculate progress percentage based on validity period
    const progressPercent = Math.max(
      0,
      Math.min(100, (daysUntilExpiry / CERTIFICATION_THRESHOLDS.VALIDITY_PERIOD) * 100)
    )

    if (daysUntilExpiry < 0) {
      return {
        status: 'Expired',
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-300',
        icon: XCircle,
        filterKey: 'expired' as StatusFilter,
        daysRemaining: Math.abs(daysUntilExpiry),
        progressPercent: 0,
      }
    } else if (daysUntilExpiry <= CERTIFICATION_THRESHOLDS.CRITICAL_DAYS) {
      return {
        status: 'Critical',
        color: 'orange',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-300',
        icon: AlertTriangle,
        filterKey: 'critical' as StatusFilter,
        daysRemaining: daysUntilExpiry,
        progressPercent,
      }
    } else if (daysUntilExpiry <= CERTIFICATION_THRESHOLDS.WARNING_DAYS) {
      return {
        status: 'Warning',
        color: 'yellow',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-300',
        icon: AlertTriangle,
        filterKey: 'warning' as StatusFilter,
        daysRemaining: daysUntilExpiry,
        progressPercent,
      }
    } else {
      return {
        status: 'Current',
        color: 'green',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-300',
        icon: CheckCircle,
        filterKey: 'current' as StatusFilter,
        daysRemaining: daysUntilExpiry,
        progressPercent,
      }
    }
  }, [])

  // Fetch certifications on mount with proper cleanup to prevent memory leaks
  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        const response = await fetch('/api/portal/certifications')

        // Check if component is still mounted before proceeding
        if (!isMounted) return

        if (!response.ok) {
          setError('Failed to fetch certifications')
          setIsLoading(false)
          return
        }

        const result = await response.json()

        // Check again after JSON parsing (async operation)
        if (!isMounted) return

        if (!result.success) {
          setError(result.error || 'Failed to fetch certifications')
          setIsLoading(false)
          return
        }

        setCertifications(result.data || [])
        setIsLoading(false)
      } catch (err) {
        // Only update state if still mounted
        if (isMounted) {
          setError('An unexpected error occurred')
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [])

  // Apply filters using useMemo (derived state - React Compiler friendly)
  const filteredCerts = useMemo(() => {
    let filtered = [...certifications]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (cert) =>
          cert.check_types?.check_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cert.check_types?.check_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cert.check_types?.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((cert) => {
        const status = getCertificationStatus(cert.expiry_date)
        return status.filterKey === statusFilter
      })
    }

    return filtered
  }, [searchQuery, statusFilter, certifications, getCertificationStatus])

  // Calculate statistics (memoized to avoid recalculating on every render)
  const stats = useMemo(() => {
    const counts = { total: 0, expired: 0, critical: 0, warning: 0, current: 0 }
    counts.total = certifications.length

    for (const cert of certifications) {
      const status = getCertificationStatus(cert.expiry_date)
      if (status.filterKey === 'expired') counts.expired++
      else if (status.filterKey === 'critical') counts.critical++
      else if (status.filterKey === 'warning') counts.warning++
      else if (status.filterKey === 'current') counts.current++
    }

    return counts
  }, [certifications, getCertificationStatus])

  // Group certifications by category (memoized)
  const { groupedCerts, sortedCategories } = useMemo(() => {
    const grouped: Record<string, Certification[]> = {}

    for (const cert of filteredCerts) {
      const category = cert.check_types?.category || 'Uncategorized'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(cert)
    }

    return {
      groupedCerts: grouped,
      sortedCategories: Object.keys(grouped).sort(),
    }
  }, [filteredCerts])

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Card className="p-12">
          <p className="text-gray-600">Loading certifications...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-card/80 sticky top-0 z-10 border-b backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-600 to-emerald-600"
                aria-hidden="true"
              >
                <FileText className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
                  My Certifications
                </h1>
                <p className="text-muted-foreground text-xs">{stats.total} total certifications</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <div
          className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5"
          role="group"
          aria-label="Certification status filters"
        >
          <Card className="p-4 transition-shadow hover:shadow-md">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="mt-1 text-xs text-gray-600">Total</p>
            </div>
          </Card>
          <Card
            className="cursor-pointer p-4 transition-shadow hover:shadow-md focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
            onClick={() => setStatusFilter('expired')}
            onKeyDown={(e) => e.key === 'Enter' && setStatusFilter('expired')}
            tabIndex={0}
            role="button"
            aria-label={`Filter by expired certifications: ${stats.expired} expired`}
            aria-pressed={statusFilter === 'expired'}
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              <p className="mt-1 text-xs text-gray-600">Expired</p>
            </div>
          </Card>
          <Card
            className="cursor-pointer p-4 transition-shadow hover:shadow-md focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
            onClick={() => setStatusFilter('critical')}
            onKeyDown={(e) => e.key === 'Enter' && setStatusFilter('critical')}
            tabIndex={0}
            role="button"
            aria-label={`Filter by critical certifications: ${stats.critical} critical`}
            aria-pressed={statusFilter === 'critical'}
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.critical}</p>
              <p className="mt-1 text-xs text-gray-600">Critical</p>
            </div>
          </Card>
          <Card
            className="cursor-pointer p-4 transition-shadow hover:shadow-md focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none"
            onClick={() => setStatusFilter('warning')}
            onKeyDown={(e) => e.key === 'Enter' && setStatusFilter('warning')}
            tabIndex={0}
            role="button"
            aria-label={`Filter by warning certifications: ${stats.warning} warning`}
            aria-pressed={statusFilter === 'warning'}
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
              <p className="mt-1 text-xs text-gray-600">Warning</p>
            </div>
          </Card>
          <Card
            className="cursor-pointer p-4 transition-shadow hover:shadow-md focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
            onClick={() => setStatusFilter('current')}
            onKeyDown={(e) => e.key === 'Enter' && setStatusFilter('current')}
            tabIndex={0}
            role="button"
            aria-label={`Filter by current certifications: ${stats.current} current`}
            aria-pressed={statusFilter === 'current'}
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.current}</p>
              <p className="mt-1 text-xs text-gray-600">Current</p>
            </div>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6 p-4">
          <div
            className="flex flex-col gap-4 md:flex-row"
            role="search"
            aria-label="Filter certifications"
          >
            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400"
                aria-hidden="true"
              />
              <Input
                type="text"
                placeholder="Search certifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Search certifications by code, description, or category"
              />
            </div>

            {/* View Toggle */}
            <div className="flex gap-1 rounded-lg border border-gray-200 p-1">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                Card
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                List
              </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'expired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('expired')}
                className={statusFilter === 'expired' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Expired
              </Button>
              <Button
                variant={statusFilter === 'critical' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('critical')}
                className={statusFilter === 'critical' ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                Critical
              </Button>
              <Button
                variant={statusFilter === 'warning' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('warning')}
                className={statusFilter === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
              >
                Warning
              </Button>
              <Button
                variant={statusFilter === 'current' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('current')}
                className={statusFilter === 'current' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Current
              </Button>
            </div>
          </div>
        </Card>

        {/* Error Alert */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 p-4">
            <p className="text-red-700">{error}</p>
          </Card>
        )}

        {/* Certifications List */}
        {filteredCerts.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {searchQuery || statusFilter !== 'all'
                  ? 'No matching certifications'
                  : 'No Certifications Found'}
              </h3>
              <p className="text-muted-foreground mt-2">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : "You don't have any certification records yet"}
              </p>
              {(searchQuery || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            {sortedCategories.map((category) => (
              <div key={category}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="inline-block border-b-2 border-blue-600 pb-2 text-lg font-semibold text-gray-900">
                    {category}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {groupedCerts[category].length}{' '}
                    {groupedCerts[category].length === 1 ? 'cert' : 'certs'}
                  </Badge>
                </div>
                {viewMode === 'card' ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groupedCerts[category].map((cert: Certification) => {
                      const status = getCertificationStatus(cert.expiry_date)
                      const StatusIcon = status.icon

                      return (
                        <Card
                          key={cert.id}
                          className={`border-l-4 p-5 transition-all hover:shadow-lg ${status.borderColor}`}
                        >
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <StatusIcon className={`h-5 w-5 ${status.textColor}`} />
                              <Badge className={`${status.bgColor} ${status.textColor} border-0`}>
                                {status.status}
                              </Badge>
                            </div>
                          </div>

                          <h4 className="mb-1 text-lg font-bold text-gray-900">
                            {cert.check_types?.check_code || 'Unknown'}
                          </h4>
                          <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                            {cert.check_types?.check_description || 'No description'}
                          </p>

                          {cert.expiry_date && (
                            <>
                              <div className="mb-3 flex items-center space-x-2 text-sm text-gray-600">
                                <Calendar className="h-4 w-4" aria-hidden="true" />
                                <span>
                                  {status.daysRemaining !== null &&
                                  status.status !== 'No Expiry' ? (
                                    status.status === 'Expired' ? (
                                      <span className="font-semibold text-red-600">
                                        Expired {status.daysRemaining} days ago
                                      </span>
                                    ) : (
                                      <span className="font-semibold">
                                        {status.daysRemaining} days remaining
                                      </span>
                                    )
                                  ) : (
                                    'No expiry date'
                                  )}
                                </span>
                              </div>

                              {status.status !== 'Expired' && status.progressPercent !== null && (
                                <div className="mb-2">
                                  <div className="h-2 w-full rounded-full bg-gray-200">
                                    <div
                                      className={`h-2 rounded-full transition-all ${
                                        status.filterKey === 'critical'
                                          ? 'bg-orange-600'
                                          : status.filterKey === 'warning'
                                            ? 'bg-yellow-600'
                                            : 'bg-green-600'
                                      }`}
                                      style={{ width: `${status.progressPercent}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              <p className="text-xs text-gray-500">
                                Expires:{' '}
                                {new Date(cert.expiry_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </>
                          )}
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {groupedCerts[category].map((cert: Certification) => {
                      const status = getCertificationStatus(cert.expiry_date)
                      const StatusIcon = status.icon

                      return (
                        <Card
                          key={cert.id}
                          className={`border-l-4 p-4 transition-all hover:shadow-md ${status.borderColor}`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            {/* Left: Status and Title */}
                            <div className="flex flex-1 items-center gap-4">
                              <StatusIcon className={`h-5 w-5 flex-shrink-0 ${status.textColor}`} />
                              <div className="min-w-0 flex-1">
                                <h4 className="truncate font-bold text-gray-900">
                                  {cert.check_types?.check_code || 'Unknown'}
                                </h4>
                                <p className="text-muted-foreground truncate text-sm">
                                  {cert.check_types?.check_description || 'No description'}
                                </p>
                              </div>
                            </div>

                            {/* Middle: Status Badge */}
                            <Badge
                              className={`${status.bgColor} ${status.textColor} flex-shrink-0 border-0`}
                            >
                              {status.status}
                            </Badge>

                            {/* Right: Expiry Info */}
                            <div className="flex flex-shrink-0 items-center gap-4">
                              {cert.expiry_date ? (
                                <>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-700">
                                      {status.daysRemaining !== null &&
                                      status.status !== 'No Expiry' ? (
                                        status.status === 'Expired' ? (
                                          <span className="text-red-600">
                                            Expired {status.daysRemaining} days ago
                                          </span>
                                        ) : (
                                          <span>{status.daysRemaining} days remaining</span>
                                        )
                                      ) : (
                                        'No expiry'
                                      )}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Expires:{' '}
                                      {new Date(cert.expiry_date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                    </p>
                                  </div>
                                  {status.status !== 'Expired' &&
                                    status.progressPercent !== null && (
                                      <div className="h-16 w-16 flex-shrink-0">
                                        <svg className="h-full w-full" viewBox="0 0 36 36">
                                          <path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="#e5e7eb"
                                            strokeWidth="3"
                                          />
                                          <path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke={
                                              status.filterKey === 'critical'
                                                ? '#ea580c'
                                                : status.filterKey === 'warning'
                                                  ? '#ca8a04'
                                                  : '#16a34a'
                                            }
                                            strokeWidth="3"
                                            strokeDasharray={`${status.progressPercent}, 100`}
                                          />
                                          <text
                                            x="18"
                                            y="20.5"
                                            className="text-xs font-semibold"
                                            textAnchor="middle"
                                            fill={
                                              status.filterKey === 'critical'
                                                ? '#ea580c'
                                                : status.filterKey === 'warning'
                                                  ? '#ca8a04'
                                                  : '#16a34a'
                                            }
                                          >
                                            {Math.round(status.progressPercent)}%
                                          </text>
                                        </svg>
                                      </div>
                                    )}
                                </>
                              ) : (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Clock className="h-4 w-4" aria-hidden="true" />
                                  <span>No expiry date</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
