'use client'

/**
 * Leave Bid Edit Form Component
 * Allows administrators to edit leave bid status and review information
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, CheckCircle, XCircle, Clock, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface LeaveBidOption {
  id: string
  priority: number
  start_date: string
  end_date: string
}

interface Pilot {
  id: string
  first_name: string
  last_name: string
  middle_name: string | null
  employee_id: string | null
  role: string | null
  seniority_number: number | null
  email: string | null
}

interface LeaveBid {
  id: string
  roster_period_code: string
  status: string | null
  created_at: string | null
  updated_at: string | null
  reviewed_at: string | null
  review_comments: string | null
  notes: string | null
  reason: string | null
  pilot_id: string
  pilots: Pilot
  leave_bid_options: LeaveBidOption[]
}

interface LeaveBidEditFormProps {
  bid: LeaveBid
  userId: string
}

export function LeaveBidEditForm({ bid, userId }: LeaveBidEditFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    status: bid.status || 'PENDING',
    review_comments: bid.review_comments || '',
    notes: bid.notes || '',
    reason: bid.reason || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/admin/leave-bids/${bid.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          reviewed_at: formData.status !== bid.status ? new Date().toISOString() : bid.reviewed_at,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to update leave bid')
        return
      }

      setSuccess('Leave bid updated successfully!')
      setTimeout(() => {
        router.push('/dashboard/admin/leave-bids')
        router.refresh()
      }, 1500)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="border-yellow-300 bg-yellow-100 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            Pending Review
          </Badge>
        )
      case 'PROCESSING':
        return (
          <Badge className="border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200">
            <Clock className="mr-1 h-3 w-3" />
            Processing
          </Badge>
        )
      case 'APPROVED':
        return (
          <Badge className="border-green-300 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge className="border-red-300 bg-red-100 text-red-800 dark:border-red-700 dark:bg-red-900 dark:text-red-200">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const pilot = bid.pilots

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/leave-bids">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Leave Bids
            </Button>
          </Link>
          <div>
            <h1 className="text-foreground text-3xl font-bold">Edit Leave Bid</h1>
            <p className="text-muted-foreground">
              Submitted {bid.created_at ? format(new Date(bid.created_at), 'MMMM dd, yyyy') : 'N/A'}
            </p>
          </div>
        </div>
        {getStatusBadge(bid.status)}
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Pilot Information (Read-Only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Pilot Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {pilot.first_name} {pilot.middle_name ? pilot.middle_name + ' ' : ''}
              {pilot.last_name}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Employee ID</p>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {pilot.employee_id || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rank</p>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {pilot.role || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Seniority</p>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
              #{pilot.seniority_number || 'N/A'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Leave Preferences (Read-Only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {bid.leave_bid_options
              .sort((a, b) => a.priority - b.priority)
              .map((option) => (
                <div
                  key={option.id}
                  className="rounded-lg border-2 border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-900 dark:bg-cyan-900 dark:text-cyan-100">
                      {option.priority}
                    </span>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {option.priority === 1 && '1st Choice'}
                      {option.priority === 2 && '2nd Choice'}
                      {option.priority === 3 && '3rd Choice'}
                      {option.priority > 3 && `${option.priority}th Choice`}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Start - End
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {format(new Date(option.start_date), 'MMM dd')} -{' '}
                        {format(new Date(option.end_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Duration
                      </p>
                      <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-400">
                        {Math.ceil(
                          (new Date(option.end_date).getTime() -
                            new Date(option.start_date).getTime()) /
                            (1000 * 60 * 60 * 24)
                        ) + 1}{' '}
                        days
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Review & Update</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending Review</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Leave</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g., Annual vacation, Personal time off"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Pilot Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes from pilot"
                rows={3}
              />
            </div>

            {/* Review Comments */}
            <div className="space-y-2">
              <Label htmlFor="review_comments">Admin Review Comments</Label>
              <Textarea
                id="review_comments"
                value={formData.review_comments}
                onChange={(e) => setFormData({ ...formData, review_comments: e.target.value })}
                placeholder="Add your review comments here..."
                rows={4}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                These comments will be visible to the pilot.
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <Link href="/dashboard/admin/leave-bids">
                <Button type="button" variant="outline" disabled={saving}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </>
  )
}
