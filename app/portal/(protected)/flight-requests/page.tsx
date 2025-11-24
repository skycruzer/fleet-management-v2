'use client'

/**
 * RDO/SDO Requests List Page
 *
 * Displays all RDO/SDO requests for the authenticated pilot with status,
 * allows filtering and cancellation of pending requests.
 *
 * @spec 001-missing-core-features (US3)
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Plus,
  Plane,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Trash2,
  ArrowLeft,
  Pencil,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface FlightRequest {
  id: string
  request_type: 'RDO' | 'SDO'
  start_date: string
  end_date?: string | null
  roster_period?: string | null
  description?: string | null
  reason?: string | null
  workflow_status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'DENIED'
  reviewer_comments?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  created_at: string
}

export default function FlightRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<FlightRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'DENIED'>(
    'ALL'
  )

  useEffect(() => {
    fetchFlightRequests()
  }, [])

  const fetchFlightRequests = async () => {
    try {
      const response = await fetch('/api/portal/flight-requests')
      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to fetch RDO/SDO requests')
        setIsLoading(false)
        return
      }

      setRequests(result.data || [])
      setIsLoading(false)
    } catch (err) {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const cancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this RDO/SDO request?')) {
      return
    }

    setDeletingRequestId(requestId)
    setError('')

    try {
      const response = await fetch(`/api/portal/flight-requests?id=${requestId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to cancel request')
        setDeletingRequestId(null)
        return
      }

      // Refresh list
      await fetchFlightRequests()
      setDeletingRequestId(null)

      // Refresh router cache
      router.refresh()
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (err) {
      setError('An unexpected error occurred while canceling the request')
      setDeletingRequestId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <Badge variant="outline" className="border-gray-300 bg-gray-100 text-gray-800">
            <Clock className="mr-1 h-3 w-3" />
            Submitted
          </Badge>
        )
      case 'UNDER_REVIEW':
        return (
          <Badge variant="outline" className="border-yellow-300 bg-yellow-100 text-yellow-800">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Under Review
          </Badge>
        )
      case 'APPROVED':
        return (
          <Badge variant="outline" className="border-green-300 bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        )
      case 'DENIED':
        return (
          <Badge variant="outline" className="border-red-300 bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            Denied
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      RDO: 'RDO (Rostered Day Off)',
      SDO: 'SDO (Scheduled Day Off)',
    }
    return labels[type] || type
  }

  const getRequestTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      RDO: 'bg-blue-500',
      SDO: 'bg-purple-500',
    }
    return colors[type] || 'bg-gray-400'
  }

  // Safe date formatting with fallback
  const formatSafeDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      return format(date, 'MMM dd, yyyy')
    } catch {
      return 'Invalid date'
    }
  }

  const formatSafeDistanceToNow = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return 'Invalid date'
    }
  }

  const filteredRequests = filter === 'ALL' ? requests : requests.filter((r) => r.workflow_status === filter)

  const stats = {
    total: requests.length,
    submitted: requests.filter((r) => r.workflow_status === 'SUBMITTED').length,
    under_review: requests.filter((r) => r.workflow_status === 'UNDER_REVIEW').length,
    approved: requests.filter((r) => r.workflow_status === 'APPROVED').length,
    denied: requests.filter((r) => r.workflow_status === 'DENIED').length,
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p>Loading RDO/SDO requests...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RDO/SDO Requests</h1>
          <p className="mt-1 text-gray-600">
            {stats.total} total request{stats.total !== 1 ? 's' : ''} |{' '}
            {stats.submitted + stats.under_review} active
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/portal/flight-requests/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'ALL' ? 'default' : 'outline'}
          onClick={() => setFilter('ALL')}
          size="sm"
        >
          All ({stats.total})
        </Button>
        <Button
          variant={filter === 'SUBMITTED' ? 'default' : 'outline'}
          onClick={() => setFilter('SUBMITTED')}
          size="sm"
        >
          Submitted ({stats.submitted})
        </Button>
        <Button
          variant={filter === 'UNDER_REVIEW' ? 'default' : 'outline'}
          onClick={() => setFilter('UNDER_REVIEW')}
          size="sm"
        >
          Under Review ({stats.under_review})
        </Button>
        <Button
          variant={filter === 'APPROVED' ? 'default' : 'outline'}
          onClick={() => setFilter('APPROVED')}
          size="sm"
        >
          Approved ({stats.approved})
        </Button>
        <Button
          variant={filter === 'DENIED' ? 'default' : 'outline'}
          onClick={() => setFilter('DENIED')}
          size="sm"
        >
          Denied ({stats.denied})
        </Button>
      </div>

      {/* RDO/SDO Requests List */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Plane className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-500">
              {filter === 'ALL'
                ? 'No RDO/SDO requests yet'
                : `No ${filter.toLowerCase().replace('_', ' ')} RDO/SDO requests`}
            </p>
            {filter === 'ALL' && (
              <Link href="/portal/flight-requests/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Your First Request
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <Badge className={getRequestTypeColor(request.request_type)}>
                        {getRequestTypeLabel(request.request_type)}
                      </Badge>
                      {getStatusBadge(request.workflow_status)}
                    </div>
                    <CardTitle className="text-xl">
                      {request.end_date
                        ? `${formatSafeDate(request.start_date)} - ${formatSafeDate(request.end_date)}`
                        : formatSafeDate(request.start_date)}
                    </CardTitle>
                    <CardDescription>
                      Submitted {formatSafeDistanceToNow(request.created_at)}
                    </CardDescription>
                  </div>

                  {request.workflow_status === 'SUBMITTED' && (
                    <div className="flex items-center gap-2">
                      <Link href={`/portal/flight-requests/${request.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => cancelRequest(request.id)}
                        disabled={deletingRequestId === request.id}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        {deletingRequestId === request.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {request.description && (
                    <div>
                      <p className="mb-1 text-sm font-medium text-gray-700">Description:</p>
                      <p className="text-sm text-gray-600">{request.description}</p>
                    </div>
                  )}

                  {request.reason && (
                    <div>
                      <p className="mb-1 text-sm font-medium text-gray-700">Additional Reason:</p>
                      <p className="text-sm text-gray-600">{request.reason}</p>
                    </div>
                  )}

                  {request.reviewer_comments && (
                    <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3">
                      <p className="mb-1 text-sm font-medium text-blue-900">Reviewer Comments:</p>
                      <p className="text-sm text-blue-800">{request.reviewer_comments}</p>
                    </div>
                  )}

                  {request.workflow_status !== 'SUBMITTED' && request.reviewed_at && (
                    <p className="text-xs text-gray-500">
                      Reviewed {formatSafeDistanceToNow(request.reviewed_at)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
