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
import {
  ArrowLeft,
  Save,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  Trash2,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'
import { useConfirm } from '@/components/ui/confirm-dialog'

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
  const { csrfToken } = useCsrfToken()
  const { confirm, ConfirmDialog } = useConfirm()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
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

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Leave Bid',
      description:
        'Are you sure you want to permanently delete this leave bid? This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'destructive',
    })
    if (!confirmed) return

    setDeleting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/admin/leave-bids/${bid.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to delete leave bid')
        return
      }

      setSuccess('Leave bid deleted successfully.')
      setTimeout(() => {
        router.push('/dashboard/admin/leave-bids')
        router.refresh()
      }, 1500)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)]">
            <Clock className="mr-1 h-3 w-3" />
            Pending Review
          </Badge>
        )
      case 'PROCESSING':
        return (
          <Badge className="border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info)]">
            <Clock className="mr-1 h-3 w-3" />
            Processing
          </Badge>
        )
      case 'APPROVED':
        return (
          <Badge className="border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)] text-[var(--color-status-low)]">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge className="border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]">
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
      <ConfirmDialog />
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
        <Alert className="border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)]">
          <CheckCircle className="h-4 w-4 text-[var(--color-status-low)]" />
          <AlertDescription className="text-[var(--color-status-low)]">{success}</AlertDescription>
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
            <p className="text-muted-foreground text-sm font-medium">Name</p>
            <p className="text-foreground text-base font-semibold">
              {pilot.first_name} {pilot.middle_name ? pilot.middle_name + ' ' : ''}
              {pilot.last_name}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Employee ID</p>
            <p className="text-foreground text-base font-semibold">{pilot.employee_id || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Rank</p>
            <p className="text-foreground text-base font-semibold">{pilot.role || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Seniority</p>
            <p className="text-foreground text-base font-semibold">
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
                  className="border-border bg-card rounded-lg border-2 p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="bg-accent/10 text-accent flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                      {option.priority}
                    </span>
                    <span className="text-muted-foreground text-sm font-medium">
                      {option.priority === 1 && '1st Choice'}
                      {option.priority === 2 && '2nd Choice'}
                      {option.priority === 3 && '3rd Choice'}
                      {option.priority > 3 && `${option.priority}th Choice`}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-muted-foreground text-xs font-medium">Start - End</p>
                      <p className="text-foreground text-sm font-semibold">
                        {format(new Date(option.start_date), 'MMM dd')} -{' '}
                        {format(new Date(option.end_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs font-medium">Duration</p>
                      <p className="text-accent text-sm font-semibold">
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
              <p className="text-muted-foreground text-xs">
                These comments will be visible to the pilot.
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-between border-t pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={saving || deleting}
              >
                {deleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                {deleting ? 'Deleting...' : 'Delete Bid'}
              </Button>
              <div className="flex gap-3">
                <Link href="/dashboard/admin/leave-bids">
                  <Button type="button" variant="outline" disabled={saving || deleting}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={saving || deleting}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </>
  )
}
