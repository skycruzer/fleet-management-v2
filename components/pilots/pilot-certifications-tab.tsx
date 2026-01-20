/**
 * Pilot Certifications Tab Component
 *
 * Full-page certification management with inline editing.
 * Replaces modal-based editing for better UX.
 *
 * Developer: Maurice Rondeau
 * @date December 6, 2025
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Save,
  X,
  Edit2,
  FileText,
  Filter,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Pilot, Certification } from './pilot-detail-tabs'

interface PilotCertificationsTabProps {
  pilot: Pilot
  initialCertifications: Certification[]
  csrfToken: string | null
  onCertificationSaved: () => void
  onCertificationsLoaded: (certs: Certification[]) => void
}

type StatusFilter = 'all' | 'current' | 'expiring' | 'expired'

export function PilotCertificationsTab({
  pilot,
  initialCertifications,
  csrfToken,
  onCertificationSaved,
  onCertificationsLoaded,
}: PilotCertificationsTabProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [certifications, setCertifications] = useState<Certification[]>(initialCertifications)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Fetch certifications on mount if not provided
  useEffect(() => {
    if (initialCertifications.length === 0) {
      fetchCertifications()
    }
  }, [])

  async function fetchCertifications() {
    try {
      setLoading(true)
      const timestamp = new Date().getTime()
      const response = await fetch(
        `/api/certifications?pilotId=${pilot.id}&pageSize=100&_t=${timestamp}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      )
      const data = await response.json()

      if (data.success) {
        setCertifications(data.data || [])
        onCertificationsLoaded(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch certifications:', err)
      toast({
        title: 'Error',
        description: 'Failed to load certifications',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate days until expiry
  function getDaysUntilExpiry(expiryDate: string | null): number | null {
    if (!expiryDate) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(expiryDate)
    expiry.setHours(0, 0, 0, 0)
    const diffTime = expiry.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Get status badge
  function getStatusBadge(expiryDate: string | null) {
    const days = getDaysUntilExpiry(expiryDate)

    if (days === null) {
      return <Badge variant="outline">No Expiry</Badge>
    }

    if (days < 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Expired ({Math.abs(days)} days ago)
        </Badge>
      )
    }

    if (days <= 30) {
      return (
        <Badge className="flex items-center gap-1 bg-[var(--color-status-medium)] hover:bg-[var(--color-status-medium)]/90">
          <AlertCircle className="h-3 w-3" />
          Expiring ({days} days)
        </Badge>
      )
    }

    return (
      <Badge className="flex items-center gap-1 bg-[var(--color-status-low)] hover:bg-[var(--color-status-low)]/90">
        <CheckCircle2 className="h-3 w-3" />
        Current ({days} days)
      </Badge>
    )
  }

  // Get certification status for filtering
  function getCertStatus(expiryDate: string | null): 'current' | 'expiring' | 'expired' | 'none' {
    const days = getDaysUntilExpiry(expiryDate)
    if (days === null) return 'none'
    if (days < 0) return 'expired'
    if (days <= 30) return 'expiring'
    return 'current'
  }

  // Filter certifications
  const filteredCertifications = certifications.filter((cert) => {
    if (statusFilter === 'all') return true
    return getCertStatus(cert.expiry_date) === statusFilter
  })

  // Sort by expiry date (expired/expiring first)
  const sortedCertifications = [...filteredCertifications].sort((a, b) => {
    const daysA = getDaysUntilExpiry(a.expiry_date) ?? Infinity
    const daysB = getDaysUntilExpiry(b.expiry_date) ?? Infinity
    return daysA - daysB
  })

  // Start editing
  function handleStartEdit(certId: string, currentExpiry: string | null) {
    setEditingId(certId)
    if (currentExpiry) {
      const date = new Date(currentExpiry)
      setEditDate(date.toISOString().split('T')[0])
    } else {
      setEditDate('')
    }
  }

  // Cancel editing
  function handleCancelEdit() {
    setEditingId(null)
    setEditDate('')
  }

  // Save certification
  async function handleSave(certId: string) {
    if (!editDate) {
      toast({
        title: 'Error',
        description: 'Please select an expiry date',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/certifications/${certId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        body: JSON.stringify({
          expiry_date: new Date(editDate).toISOString(),
        }),
        credentials: 'include',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Certification updated successfully',
        })

        // Update local state
        setCertifications((prev) =>
          prev.map((cert) =>
            cert.id === certId ? { ...cert, expiry_date: new Date(editDate).toISOString() } : cert
          )
        )

        // Clear edit state
        setEditingId(null)
        setEditDate('')

        // Notify parent and refresh
        onCertificationSaved()
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update certification',
          variant: 'destructive',
        })
      }
    } catch (err) {
      console.error('Save error:', err)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Format date for display
  function formatDate(dateString: string | null): string {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Group by category
  const groupedByCategory = sortedCertifications.reduce(
    (acc, cert) => {
      const category = cert.check_type?.category || 'Other'
      if (!acc[category]) acc[category] = []
      acc[category].push(cert)
      return acc
    },
    {} as Record<string, Certification[]>
  )

  const categories = Object.keys(groupedByCategory).sort()

  return (
    <div className="space-y-6">
      {/* Header with Filter and Refresh */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-foreground text-xl font-bold">
              Certifications for {pilot.first_name} {pilot.last_name}
            </h2>
            <p className="text-muted-foreground text-sm">
              {certifications.length} total certifications across {categories.length} categories
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="text-muted-foreground h-4 w-4" />
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="expiring">Expiring</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Refresh Button */}
            <Button variant="outline" size="sm" onClick={fetchCertifications} disabled={loading}>
              <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {loading && certifications.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="text-primary mb-4 h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Loading certifications...</p>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && certifications.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <FileText className="text-muted-foreground/50 mb-4 h-16 w-16" />
            <h3 className="text-foreground mb-2 text-lg font-semibold">No Certifications Found</h3>
            <p className="text-muted-foreground">
              This pilot doesn&apos;t have any certifications recorded yet.
            </p>
          </div>
        </Card>
      )}

      {/* Certifications by Category */}
      {categories.map((category) => (
        <Card key={category} className="overflow-hidden">
          <div className="bg-muted/50 border-b px-4 py-3">
            <h3 className="text-foreground flex items-center gap-2 font-semibold">
              <FileText className="h-4 w-4" />
              {category}
              <Badge variant="secondary" className="ml-2">
                {groupedByCategory[category].length}
              </Badge>
            </h3>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Check Type</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedByCategory[category].map((cert) => (
                <TableRow
                  key={cert.id}
                  className={cn(
                    getCertStatus(cert.expiry_date) === 'expired' &&
                      'bg-[var(--color-status-high-bg)]/50',
                    getCertStatus(cert.expiry_date) === 'expiring' &&
                      'bg-[var(--color-status-medium-bg)]/50'
                  )}
                >
                  <TableCell className="font-medium">
                    {cert.check_type?.check_description || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{cert.check_type?.check_code || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>
                    {editingId === cert.id ? (
                      <Input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-[160px]"
                        disabled={saving}
                      />
                    ) : (
                      formatDate(cert.expiry_date)
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(cert.expiry_date)}</TableCell>
                  <TableCell className="text-right">
                    {editingId === cert.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(cert.id)}
                          disabled={saving}
                          className="bg-[var(--color-status-low)] hover:bg-[var(--color-status-low)]/90"
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={saving}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartEdit(cert.id, cert.expiry_date)}
                        disabled={editingId !== null}
                      >
                        <Edit2 className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ))}

      {/* Summary Stats */}
      <Card className="bg-muted/30 p-4">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[var(--color-status-low)]" />
            <span className="text-muted-foreground">
              Current:{' '}
              {certifications.filter((c) => getCertStatus(c.expiry_date) === 'current').length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[var(--color-status-medium)]" />
            <span className="text-muted-foreground">
              Expiring:{' '}
              {certifications.filter((c) => getCertStatus(c.expiry_date) === 'expiring').length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[var(--color-status-high)]" />
            <span className="text-muted-foreground">
              Expired:{' '}
              {certifications.filter((c) => getCertStatus(c.expiry_date) === 'expired').length}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
