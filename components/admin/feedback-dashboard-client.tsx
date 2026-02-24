/**
 * Admin Feedback Dashboard Client Component
 *
 * Developer: Maurice Rondeau
 * Date: January 2026
 *
 * Redesigned as Facebook-style feed with threaded comments.
 * Displays all pilot feedback with filtering, search, and response capabilities.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { csrfHeaders } from '@/lib/hooks/use-csrf-token'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Download, Search, MessageSquare, LayoutList, LayoutGrid } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { FeedbackPost, type FeedbackPostData } from '@/components/shared/feedback-post'
import type { FeedbackWithPilot, FeedbackStats } from '@/lib/services/feedback-service'

interface FeedbackDashboardProps {
  initialFeedback: FeedbackWithPilot[]
  initialStats: FeedbackStats
  currentUserId: string
  currentUserName: string
}

type ViewMode = 'feed' | 'table'

export function FeedbackDashboardClient({
  initialFeedback,
  initialStats,
  currentUserId,
  currentUserName,
}: FeedbackDashboardProps) {
  const { toast } = useToast()
  const [feedback, setFeedback] = useState<FeedbackWithPilot[]>(initialFeedback)
  const [stats, setStats] = useState<FeedbackStats>(initialStats)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('feed')

  // Modal states for table view
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithPilot | null>(null)
  const [adminResponse, setAdminResponse] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [respondingId, setRespondingId] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch feedback with filters
  const fetchFeedback = useCallback(async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/feedback?${params}`)
      const data = await response.json()

      if (data.success) {
        setFeedback(data.data)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch feedback',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch feedback',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, categoryFilter, searchTerm])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/feedback?stats=true')
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  // Apply filters
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchFeedback()
    }, 300)

    return () => clearTimeout(debounce)
  }, [fetchFeedback])

  // Submit admin response and/or status update (for table view)
  async function handleSubmitResponse() {
    if (!selectedFeedback) return

    const hasResponseChange =
      adminResponse.trim() && adminResponse !== selectedFeedback.admin_response
    const hasStatusChange = selectedStatus !== selectedFeedback.status

    if (!hasResponseChange && !hasStatusChange) {
      toast({
        title: 'No Changes',
        description: 'No changes to submit',
        variant: 'default',
      })
      return
    }

    try {
      setRespondingId(selectedFeedback.id)

      // Submit status update if changed
      if (hasStatusChange) {
        const statusResponse = await fetch(`/api/feedback/${selectedFeedback.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
          body: JSON.stringify({ status: selectedStatus }),
          credentials: 'include',
        })
        const statusData = await statusResponse.json()
        if (!statusData.success) {
          toast({
            title: 'Error',
            description: statusData.error || 'Failed to update status',
            variant: 'destructive',
          })
          return
        }
      }

      // Submit admin response if provided
      if (hasResponseChange) {
        const response = await fetch(`/api/feedback/${selectedFeedback.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
          body: JSON.stringify({ adminResponse: adminResponse }),
          credentials: 'include',
        })
        const data = await response.json()
        if (!data.success) {
          toast({
            title: 'Error',
            description: data.error || 'Failed to submit response',
            variant: 'destructive',
          })
          return
        }
      }

      toast({
        title: 'Success',
        description: 'Feedback updated successfully',
      })

      // Refresh data
      await Promise.all([fetchFeedback(), fetchStats()])

      // Close modal and reset
      setSelectedFeedback(null)
      setAdminResponse('')
      setSelectedStatus('')
    } catch (error) {
      console.error('Error submitting response:', error)
      toast({
        title: 'Error',
        description: 'Failed to update feedback',
        variant: 'destructive',
      })
    } finally {
      setRespondingId(null)
    }
  }

  // Export to CSV
  async function handleExport() {
    try {
      const params = new URLSearchParams({ export: 'csv' })
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/feedback?${params}`)
      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `feedback-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Success',
        description: 'Feedback exported successfully',
      })
    } catch (error) {
      console.error('Error exporting feedback:', error)
      toast({
        title: 'Error',
        description: 'Failed to export feedback',
        variant: 'destructive',
      })
    }
  }

  // Convert FeedbackWithPilot to FeedbackPostData
  function convertToPostData(item: FeedbackWithPilot): FeedbackPostData {
    return {
      id: item.id,
      pilot_id: item.pilot_id,
      category: item.category,
      subject: item.subject,
      message: item.message,
      is_anonymous: item.is_anonymous,
      status: item.status as 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED',
      admin_response: item.admin_response,
      responded_by: item.responded_by,
      responded_at: item.responded_at,
      created_at: item.created_at,
      updated_at: item.updated_at,
      pilot: item.pilot,
    }
  }

  // Handle view details click in feed mode
  function handleViewDetails(feedbackItem: FeedbackPostData) {
    const original = feedback.find((f) => f.id === feedbackItem.id)
    if (original) {
      setSelectedFeedback(original)
      setAdminResponse(original.admin_response || '')
      setSelectedStatus(original.status)
    }
  }

  // Get status badge
  function getStatusBadge(status: string) {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PENDING: 'default',
      REVIEWED: 'secondary',
      RESOLVED: 'outline',
      DISMISSED: 'destructive',
    }

    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="text-muted-foreground text-sm font-medium">Total</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-muted-foreground text-sm font-medium">Pending</div>
          <div className="text-2xl font-bold text-[var(--color-status-medium)]">
            {stats.pending}
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-muted-foreground text-sm font-medium">Reviewed</div>
          <div className="text-2xl font-bold text-[var(--color-info)]">{stats.reviewed}</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-muted-foreground text-sm font-medium">Resolved</div>
          <div className="text-2xl font-bold text-[var(--color-status-low)]">{stats.resolved}</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
          <Input
            placeholder="Search feedback..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="REVIEWED">Reviewed</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="DISMISSED">Dismissed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="GENERAL">General</SelectItem>
            <SelectItem value="OPERATIONS">Operations</SelectItem>
            <SelectItem value="SAFETY">Safety</SelectItem>
            <SelectItem value="TRAINING">Training</SelectItem>
            <SelectItem value="SCHEDULING">Scheduling</SelectItem>
            <SelectItem value="SYSTEM_IT">System/IT</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode Toggle */}
        <div className="border-input flex rounded-md border">
          <Button
            variant={viewMode === 'feed' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('feed')}
            className="rounded-r-none"
          >
            <LayoutGrid className="mr-1 h-4 w-4" />
            Feed
          </Button>
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="rounded-l-none"
          >
            <LayoutList className="mr-1 h-4 w-4" />
            Table
          </Button>
        </div>

        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-muted-foreground py-12 text-center">Loading feedback...</div>
      ) : feedback.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">No feedback found</div>
      ) : viewMode === 'feed' ? (
        /* Facebook-style Feed View */
        <div className="space-y-4">
          {feedback.map((item) => (
            <FeedbackPost
              key={item.id}
              feedback={convertToPostData(item)}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              isAdmin={true}
              showIdentity={true}
              commentsApiPath="/api/feedback"
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      ) : (
        /* Table View (Legacy) */
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Pilot</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Subject</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedback.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="px-4 py-3 text-sm">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {item.is_anonymous
                      ? 'Anonymous'
                      : `${item.pilot?.first_name} ${item.pilot?.last_name}`}
                  </td>
                  <td className="px-4 py-3 text-sm">{item.category}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-sm">{item.subject}</td>
                  <td className="px-4 py-3 text-sm">{getStatusBadge(item.status)}</td>
                  <td className="px-4 py-3 text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFeedback(item)
                        setAdminResponse(item.admin_response || '')
                        setSelectedStatus(item.status)
                      }}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Feedback Detail Modal */}
      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
            <DialogDescription>Review and respond to pilot feedback</DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-4">
              {/* Feedback Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Submitted By</label>
                  <p className="text-muted-foreground text-sm">
                    {selectedFeedback.is_anonymous
                      ? 'Anonymous'
                      : `${selectedFeedback.pilot?.first_name} ${selectedFeedback.pilot?.last_name}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <p className="text-muted-foreground text-sm">
                    {new Date(selectedFeedback.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <p className="text-muted-foreground text-sm">{selectedFeedback.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div>{getStatusBadge(selectedFeedback.status)}</div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-sm font-medium">Subject</label>
                <p className="mt-1 text-sm">{selectedFeedback.subject}</p>
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-medium">Message</label>
                <p className="mt-1 text-sm whitespace-pre-wrap">{selectedFeedback.message}</p>
              </div>

              {/* B767 Office Response */}
              <div>
                <label className="text-sm font-medium">B767 Office Response (Legacy)</label>
                <Textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Enter your response to the pilot..."
                  rows={5}
                  className="mt-1"
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  Note: Consider using comments in feed view for threaded conversations
                </p>
              </div>

              {/* Status Update */}
              <div>
                <label className="text-sm font-medium">Update Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="REVIEWED">Reviewed</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="DISMISSED">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedFeedback(null)}>
              Close
            </Button>
            <Button onClick={handleSubmitResponse} disabled={respondingId === selectedFeedback?.id}>
              {respondingId === selectedFeedback?.id ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
