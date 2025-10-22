/**
 * Pilot Rank Group Component
 * Displays pilots grouped by rank with expandable sections sorted by seniority
 *
 * @version 1.0.0
 * @since 2025-10-20
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
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

  // Get rank icon
  const getRankIcon = (rank: string) => {
    if (rank === 'Captain') return '⭐'
    if (rank === 'First Officer') return '👤'
    return '👨‍✈️'
  }

  return (
    <Card className="overflow-hidden">
      {/* Rank Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1">
          <span className="text-2xl">{getRankIcon(rank)}</span>
          <h3 className="text-lg font-semibold text-foreground">{rank}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {stats.total} Total
            </Badge>
            <Badge variant="outline" className="text-xs border-green-500 bg-green-50 text-green-800">
              {stats.active} Active
            </Badge>
            {stats.inactive > 0 && (
              <Badge variant="outline" className="text-xs border-gray-500 bg-gray-50 text-gray-800">
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
        <div className="border-t">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Seniority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contract Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {pilots.map((pilot) => (
                  <tr key={pilot.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-foreground whitespace-nowrap">
                      #{pilot.seniority_number || 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground whitespace-nowrap">
                      {pilot.employee_id}
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground whitespace-nowrap">
                      {pilot.first_name} {pilot.middle_name ? `${pilot.middle_name} ` : ''}
                      {pilot.last_name}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {pilot.contract_type || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          pilot.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {pilot.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
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
                            className="text-xs hover:bg-primary hover:text-primary-foreground"
                          >
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => {
                            setPilotToDelete(pilot)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
