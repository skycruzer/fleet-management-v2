'use client'

/**
 * Leave Requests List Page
 *
 * Displays all leave requests for the authenticated pilot with status,
 * allows filtering and cancellation of pending requests.
 *
 * @spec 001-missing-core-features (US2)
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Calendar, CheckCircle, XCircle, Clock, Trash2, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface LeaveRequest {
  id: string
  request_type: string
  start_date: string
  end_date: string
  status: 'PENDING' | 'APPROVED' | 'DENIED'
  reason?: string | null
  request_date?: string | null
  is_late_request?: boolean | null
  days_count: number
  reviewed_by?: string | null
  reviewed_at?: string | null
  review_comments?: string | null
  created_at: string | null
}

export default function LeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'DENIED'>('ALL')

  useEffect(() => {
    fetchLeaveRequests()
  }, [])

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch('/api/portal/leave-requests')
      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to fetch leave requests')
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
    if (!confirm('Are you sure you want to cancel this leave request?')) {
      return
    }

    try {
      const response = await fetch(`/api/portal/leave-requests?id=${requestId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        alert(result.error || 'Failed to cancel request')
        return
      }

      // Refresh list
      fetchLeaveRequests()
    } catch (err) {
      alert('An unexpected error occurred')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="border-yellow-300 bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending
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

  const getLeaveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      RDO: 'bg-blue-500',
      SDO: 'bg-indigo-500',
      ANNUAL: 'bg-green-500',
      SICK: 'bg-red-500',
      LSL: 'bg-purple-500',
      LWOP: 'bg-gray-500',
      MATERNITY: 'bg-pink-500',
      COMPASSIONATE: 'bg-orange-500',
    }
    return colors[type] || 'bg-gray-400'
  }

  const filteredRequests = filter === 'ALL' ? requests : requests.filter((r) => r.status === filter)

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'PENDING').length,
    approved: requests.filter((r) => r.status === 'APPROVED').length,
    denied: requests.filter((r) => r.status === 'DENIED').length,
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p>Loading leave requests...</p>
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
          <h1 className="text-3xl font-bold">Leave Requests</h1>
          <p className="mt-1 text-gray-600">
            {stats.total} total request{stats.total !== 1 ? 's' : ''} | {stats.pending} pending
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/portal/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/portal/leave-requests/new">
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
      <div className="flex gap-2">
        <Button
          variant={filter === 'ALL' ? 'default' : 'outline'}
          onClick={() => setFilter('ALL')}
          size="sm"
        >
          All ({stats.total})
        </Button>
        <Button
          variant={filter === 'PENDING' ? 'default' : 'outline'}
          onClick={() => setFilter('PENDING')}
          size="sm"
        >
          Pending ({stats.pending})
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

      {/* Leave Requests List */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-500">
              {filter === 'ALL'
                ? 'No leave requests yet'
                : `No ${filter.toLowerCase()} leave requests`}
            </p>
            {filter === 'ALL' && (
              <Link href="/portal/leave-requests/new">
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
                      <Badge className={getLeaveTypeColor(request.request_type)}>
                        {request.request_type}
                      </Badge>
                      {getStatusBadge(request.status)}
                      {request.is_late_request && (
                        <Badge
                          variant="outline"
                          className="border-yellow-300 bg-yellow-50 text-yellow-700"
                        >
                          Late Request
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">
                      {format(new Date(request.start_date), 'MMM dd, yyyy')} -{' '}
                      {format(new Date(request.end_date), 'MMM dd, yyyy')}
                    </CardTitle>
                    <CardDescription>
                      {request.days_count} day{request.days_count !== 1 ? 's' : ''} • Submitted{' '}
                      {request.created_at
                        ? formatDistanceToNow(new Date(request.created_at), { addSuffix: true })
                        : 'recently'}
                    </CardDescription>
                  </div>

                  {request.status === 'PENDING' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => cancelRequest(request.id)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {request.reason && (
                  <div className="mb-4">
                    <p className="mb-1 text-sm font-medium text-gray-700">Reason:</p>
                    <p className="text-sm text-gray-600">{request.reason}</p>
                  </div>
                )}

                {request.review_comments && (
                  <div className="mt-4 rounded-md bg-gray-50 p-3">
                    <p className="mb-1 text-sm font-medium text-gray-700">Review Comments:</p>
                    <p className="text-sm text-gray-600">{request.review_comments}</p>
                  </div>
                )}

                {request.status !== 'PENDING' && request.reviewed_at && (
                  <p className="mt-2 text-xs text-gray-500">
                    Reviewed{' '}
                    {formatDistanceToNow(new Date(request.reviewed_at), { addSuffix: true })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
