/**
 * Pilot Rank Group Component
 * Displays pilots grouped by rank with expandable sections sorted by seniority
 *
 * Developer: Maurice Rondeau
 * @version 2.0.0
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { RankBadge } from '@/components/pilots/rank-badge'
import Link from 'next/link'
import type { Database } from '@/types/supabase'
import { useRouter } from 'next/navigation'

type Pilot = Database['public']['Tables']['pilots']['Row']

interface PilotRankGroupProps {
  rank: string
  pilots: Pilot[]
  defaultExpanded?: boolean
}

export function PilotRankGroup({ rank, pilots, defaultExpanded = true }: PilotRankGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pilotToDelete, setPilotToDelete] = useState<Pilot | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { csrfToken } = useCsrfToken()

  // Calculate rank statistics
  const stats = {
    total: pilots.length,
    active: pilots.filter((p) => p.is_active).length,
    inactive: pilots.filter((p) => !p.is_active).length,
  }

  // Handle delete pilot
  const handleDeletePilot = async () => {
    if (!pilotToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/pilots/${pilotToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete pilot')
      }

      // Close dialog and refresh page
      setDeleteDialogOpen(false)
      setPilotToDelete(null)
      router.refresh()
    } catch (error: any) {
      console.error('Error deleting pilot:', error)
      alert(error.message || 'Failed to delete pilot')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="overflow-x-auto">
      {/* Rank Header */}
      <div
        className="hover:bg-muted/50 flex cursor-pointer items-center justify-between p-4 transition-colors"
        role="button"
        aria-expanded={isExpanded}
        aria-controls={`rank-group-${rank.replace(/\s+/g, '-').toLowerCase()}`}
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsExpanded(!isExpanded) } }}
      >
        <div className="flex flex-1 items-center gap-4">
          <RankBadge rank={rank} />
          <h3 className="text-foreground text-lg font-semibold">{rank}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {stats.total} Total
            </Badge>
            <Badge variant="success" className="text-xs">
              {stats.active} Active
            </Badge>
            {stats.inactive > 0 && (
              <Badge
                variant="outline"
                className="border-border bg-muted text-muted-foreground text-xs"
              >
                {stats.inactive} Inactive
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Pilots Table */}
      {isExpanded && (
        <div id={`rank-group-${rank.replace(/\s+/g, '-').toLowerCase()}`} className="border-t">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seniority</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contract Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pilots.map((pilot) => (
                <TableRow key={pilot.id}>
                  <TableCell className="text-foreground font-medium whitespace-nowrap">
                    #{pilot.seniority_number || 'N/A'}
                  </TableCell>
                  <TableCell className="text-foreground whitespace-nowrap">
                    {pilot.employee_id}
                  </TableCell>
                  <TableCell className="text-foreground whitespace-nowrap">
                    {pilot.first_name} {pilot.middle_name ? `${pilot.middle_name} ` : ''}
                    {pilot.last_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {pilot.contract_type || 'N/A'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={pilot.is_active ? 'success' : 'secondary'}>
                      {pilot.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/pilots/${pilot.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          View
                        </Button>
                      </Link>
                      <Link href={`/dashboard/pilots/${pilot.id}/edit`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-primary hover:text-primary-foreground text-xs"
                        >
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-destructive hover:text-destructive-foreground text-xs"
                        onClick={() => {
                          setPilotToDelete(pilot)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pilot</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">
                {pilotToDelete?.first_name} {pilotToDelete?.last_name}
              </span>
              ? This action cannot be undone and will also delete all associated certifications,
              leave requests, and other records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setPilotToDelete(null)
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePilot} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Pilot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
