'use client'

/**
 * Admin Feedback Dashboard Client Component
 *
 * Displays all pilot feedback with filtering, search, and response capabilities
 */

import { useState, useEffect } from 'react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, Search, Filter, MessageSquare } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { FeedbackWithPilot, FeedbackStats } from '@/lib/services/feedback-service'

interface FeedbackDashboardProps {
  initialFeedback: FeedbackWithPilot[]
  initialStats: FeedbackStats
}

export function FeedbackDashboardClient({
  initialFeedback,
  initialStats,
}: FeedbackDashboardProps) {
  const { toast } = useToast()
  const [feedback, setFeedback] = useState<FeedbackWithPilot[]>(initialFeedback)
  const [stats, setStats] = useState<FeedbackStats>(initialStats)
  const [loading, setLoading] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithPilot | null>(null)
  const [adminResponse, setAdminResponse] = useState('')
  const [respondingId, setRespondingId] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch feedback with filters
  async function fetchFeedback() {
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
  }

  // Fetch stats
  async function fetchStats() {
    try {
      const response = await fetch('/api/feedback?stats=true')
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Apply filters
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchFeedback()
    }, 300)

    return () => clearTimeout(debounce)
  }, [statusFilter, categoryFilter, searchTerm])

  // Submit admin response
  async function handleSubmitResponse() {
    if (!selectedFeedback || !adminResponse.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a response',
        variant: 'destructive',
      })
      return
    }

    try {
      setRespondingId(selectedFeedback.id)

      const response = await fetch(`/api/feedback/${selectedFeedback.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminResponse: adminResponse }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Response submitted successfully',
        })

        // Refresh data
        await Promise.all([fetchFeedback(), fetchStats()])

        // Close modal and reset
        setSelectedFeedback(null)
        setAdminResponse('')
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to submit response',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error submitting response:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit response',
        variant: 'destructive',
      })
    } finally {
      setRespondingId(null)
    }
  }

  // Update status
  async function handleUpdateStatus(feedbackId: string, newStatus: string) {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Status updated successfully',
        })

        // Refresh data
        await Promise.all([fetchFeedback(), fetchStats()])
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update status',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      })
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

  // Get status badge
  function getStatusBadge(status: string) {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PENDING: 'default',
      REVIEWED: 'secondary',
      RESOLVED: 'outline',
      DISMISSED: 'destructive',
    }

    return (
      <Badge variant={variants[status] || 'default'}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Pending</div>
          <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Reviewed</div>
          <div className="text-2xl font-bold text-blue-600">{stats.reviewed}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Resolved</div>
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Feedback Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Pilot</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading feedback...
                </TableCell>
              </TableRow>
            ) : feedback.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No feedback found
                </TableCell>
              </TableRow>
            ) : (
              feedback.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {new Date(item.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {item.is_anonymous
                      ? 'Anonymous'
                      : `${item.pilot?.first_name} ${item.pilot?.last_name}`}
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.subject}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFeedback(item)
                        setAdminResponse(item.admin_response || '')
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Feedback Detail Modal */}
      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
            <DialogDescription>
              Review and respond to pilot feedback
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-4">
              {/* Feedback Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Submitted By</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedFeedback.is_anonymous
                      ? 'Anonymous'
                      : `${selectedFeedback.pilot?.first_name} ${selectedFeedback.pilot?.last_name}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedFeedback.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <p className="text-sm text-muted-foreground">{selectedFeedback.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div>{getStatusBadge(selectedFeedback.status)}</div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-sm font-medium">Subject</label>
                <p className="text-sm mt-1">{selectedFeedback.subject}</p>
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-medium">Message</label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{selectedFeedback.message}</p>
              </div>

              {/* Admin Response */}
              <div>
                <label className="text-sm font-medium">Admin Response</label>
                <Textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Enter your response to the pilot..."
                  rows={5}
                  className="mt-1"
                />
              </div>

              {/* Status Update */}
              <div>
                <label className="text-sm font-medium">Update Status</label>
                <Select
                  value={selectedFeedback.status}
                  onValueChange={(value) => handleUpdateStatus(selectedFeedback.id, value)}
                >
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
              {respondingId === selectedFeedback?.id ? 'Submitting...' : 'Submit Response'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
