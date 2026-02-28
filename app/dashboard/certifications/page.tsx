/**
 * Certifications Management Page - Table View with Dialogs
 * Comprehensive certification tracking with table UI and in-page CRUD dialogs
 *
 * Features:
 * - View all certifications (607 total)
 * - Search by pilot name or check type
 * - Filter by status (All/Current/Expiring/Expired)
 * - FAA color coding (red/yellow/green)
 * - Dialog-based CRUD operations
 * - Export to PDF
 *
 * @version 2.0.0
 * @updated 2025-10-28 - Phase 5 P1: Added dialog-based CRUD
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pagination, usePagination } from '@/components/ui/pagination'
import { TableSkeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { CertificationFormDialog } from '@/components/certifications/certification-form-dialog'
import {
  Plus,
  Search,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

// ===================================
// TYPES
// ===================================

interface Pilot {
  id: string
  first_name: string
  last_name: string
  employee_number: string
}

interface CheckType {
  id: string
  check_code: string
  check_description: string
}

interface Certification {
  id: string
  pilot_id: string
  check_type_id: string
  completion_date: string | null
  expiry_date: string | null
  notes: string | null
  pilot: {
    id: string
    first_name: string
    last_name: string
    employee_id: string
    role: string
  }
  check_type: {
    id: string
    check_code: string
    check_description: string
  }
  status: {
    color: 'red' | 'yellow' | 'green' | 'gray'
    label: 'Expired' | 'Expiring Soon' | 'Current' | 'No Date'
    daysUntilExpiry?: number
  }
}

// ===================================
// SORTING TYPES
// ===================================

type CertSortColumn = 'pilot' | 'check_type' | 'status' | 'expiry_date' | 'days_remaining'
type SortDirection = 'asc' | 'desc'

// ===================================
// COMPONENT
// ===================================

export default function CertificationsPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Data state
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [filteredCertifications, setFilteredCertifications] = useState<Certification[]>([])
  const [pilots, setPilots] = useState<Pilot[]>([])
  const [checkTypes, setCheckTypes] = useState<CheckType[]>([])

  // Sort state
  const [sortColumn, setSortColumn] = useState<CertSortColumn>('pilot')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [formDialogMode, setFormDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedCertification, setSelectedCertification] = useState<Certification | undefined>()

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [certificationToDelete, setCertificationToDelete] = useState<Certification | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch certifications function (extracted for reuse)
  const fetchCertifications = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/certifications', {
        cache: 'no-store', // Force fresh data
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch certifications')
      }

      const data = await response.json()
      // API returns { data: { certifications: [...], pagination: {...} } }
      const certificationsList = data.data?.certifications || []
      setCertifications(certificationsList)
      setFilteredCertifications(certificationsList)
    } catch (err) {
      console.error('Error fetching certifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to load certifications')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch certifications on mount
  useEffect(() => {
    fetchCertifications()
  }, [fetchCertifications])

  // Fetch pilots and check types for form
  useEffect(() => {
    async function fetchFormData() {
      try {
        const [pilotsRes, checkTypesRes] = await Promise.all([
          fetch('/api/pilots', { credentials: 'include' }),
          fetch('/api/check-types', { credentials: 'include' }),
        ])

        if (pilotsRes.ok) {
          const pilotsData = await pilotsRes.json()
          // API returns { data: { pilots: [...] } }
          setPilots(pilotsData.data?.pilots || pilotsData.data || [])
        }

        if (checkTypesRes.ok) {
          const checkTypesData = await checkTypesRes.json()
          setCheckTypes(checkTypesData.data || [])
        }
      } catch (err) {
        console.error('Error fetching form data:', err)
      }
    }

    fetchFormData()
  }, [])

  // Filter certifications based on search and status
  useEffect(() => {
    let filtered = certifications

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((cert) => {
        const pilotName = `${cert.pilot.first_name} ${cert.pilot.last_name}`.toLowerCase()
        const checkType = cert.check_type.check_description.toLowerCase()
        const query = searchQuery.toLowerCase()
        return pilotName.includes(query) || checkType.includes(query)
      })
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((cert) => {
        switch (statusFilter) {
          case 'current':
            return cert.status.color === 'green'
          case 'expiring':
            return cert.status.color === 'yellow'
          case 'expired':
            return cert.status.color === 'red'
          default:
            return true
        }
      })
    }

    setFilteredCertifications(filtered)
  }, [searchQuery, statusFilter, certifications])

  // Sort handler
  const handleSort = (column: CertSortColumn) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // aria-sort helper for accessible sortable column headers
  const getAriaSortValue = (column: CertSortColumn): 'ascending' | 'descending' | 'none' => {
    if (sortColumn !== column) return 'none'
    return sortDirection === 'asc' ? 'ascending' : 'descending'
  }

  // Sort icon helper
  const getSortIcon = (column: CertSortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5" />
    )
  }

  // Sort the filtered data
  const sortedCertifications = [...filteredCertifications].sort((a, b) => {
    let aValue: string | number
    let bValue: string | number

    switch (sortColumn) {
      case 'pilot':
        aValue = `${a.pilot.first_name} ${a.pilot.last_name}`.toLowerCase()
        bValue = `${b.pilot.first_name} ${b.pilot.last_name}`.toLowerCase()
        break
      case 'check_type':
        aValue = a.check_type.check_description.toLowerCase()
        bValue = b.check_type.check_description.toLowerCase()
        break
      case 'status': {
        const statusOrder: Record<string, number> = { red: 0, yellow: 1, green: 2, gray: 3 }
        aValue = statusOrder[a.status.color] ?? 4
        bValue = statusOrder[b.status.color] ?? 4
        break
      }
      case 'expiry_date':
        aValue = a.expiry_date ? new Date(a.expiry_date).getTime() : 0
        bValue = b.expiry_date ? new Date(b.expiry_date).getTime() : 0
        break
      case 'days_remaining':
        aValue = a.status.daysUntilExpiry ?? -9999
        bValue = b.status.daysUntilExpiry ?? -9999
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Client-side pagination of sorted + filtered results
  const { currentPage, pageSize, totalPages, paginatedData, setCurrentPage, setPageSize } =
    usePagination<Certification>(sortedCertifications, 25)

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, setCurrentPage])

  // Get status badge variant
  const getStatusBadgeVariant = (color: string) => {
    switch (color) {
      case 'red':
        return 'destructive'
      case 'yellow':
        return 'warning'
      case 'green':
        return 'success'
      default:
        return 'secondary'
    }
  }

  // Get status icon (decorative - status conveyed by label)
  const getStatusIcon = (color: string) => {
    switch (color) {
      case 'red':
        return <AlertCircle className="h-4 w-4" aria-hidden="true" />
      case 'yellow':
        return <Clock className="h-4 w-4" aria-hidden="true" />
      case 'green':
        return <CheckCircle className="h-4 w-4" aria-hidden="true" />
      default:
        return null
    }
  }

  // Count by status
  const statusCounts = {
    all: certifications.length,
    current: certifications.filter((c) => c.status.color === 'green').length,
    expiring: certifications.filter((c) => c.status.color === 'yellow').length,
    expired: certifications.filter((c) => c.status.color === 'red').length,
  }

  // Handle create certification
  const handleCreateClick = () => {
    setFormDialogMode('create')
    setSelectedCertification(undefined)
    setFormDialogOpen(true)
  }

  // Handle edit certification
  const handleEditClick = (cert: Certification) => {
    setFormDialogMode('edit')
    setSelectedCertification(cert)
    setFormDialogOpen(true)
  }

  // Handle delete certification click
  const handleDeleteClick = (cert: Certification) => {
    setCertificationToDelete(cert)
    setDeleteDialogOpen(true)
  }

  // Handle export to CSV
  const handleExport = () => {
    // Prepare CSV data
    const headers = [
      'Pilot Name',
      'Employee ID',
      'Check Type',
      'Check Date',
      'Expiry Date',
      'Status',
      'Days Until Expiry',
    ]
    const rows = filteredCertifications.map((cert) => [
      `${cert.pilot.first_name} ${cert.pilot.last_name}`,
      cert.pilot.employee_id,
      cert.check_type.check_description,
      cert.completion_date ? new Date(cert.completion_date).toLocaleDateString() : 'N/A',
      cert.expiry_date ? new Date(cert.expiry_date).toLocaleDateString() : 'N/A',
      cert.status.label,
      cert.status.daysUntilExpiry?.toString() || 'N/A',
    ])

    // Convert to CSV
    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `certifications_export_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      description: 'Certifications exported successfully',
    })
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!certificationToDelete) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/certifications/${certificationToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error ||
            errorData.message ||
            `HTTP ${response.status}: Failed to delete certification`
        )
      }

      toast({
        title: 'Success',
        description: 'Certification deleted successfully',
      })

      // Close dialog
      setDeleteDialogOpen(false)
      setCertificationToDelete(null)

      // Refresh router cache (proper Next.js 16 cache invalidation)
      router.refresh()
      await new Promise((resolve) => setTimeout(resolve, 100))
      // Data will refresh automatically via revalidatePath in API
    } catch (error) {
      console.error('Error deleting certification:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete certification',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return <TableSkeleton rows={8} columns={6} />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
              Certifications
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Error loading certifications</p>
          </div>
        </div>

        <Card className="border-destructive/20 bg-[var(--color-destructive-muted)] p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-[var(--color-danger-600)]" />
          <h3 className="text-foreground mt-4 text-lg font-semibold">
            Failed to Load Certifications
          </h3>
          <p className="text-muted-foreground mt-2">{error}</p>
          <div className="mt-4">
            <Button onClick={() => router.refresh()}>Retry</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header - Linear-inspired: compact, clean */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
            Certifications
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage pilot certifications and track expiry dates
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExport}
            aria-label="Export certifications to CSV"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export
          </Button>
          <Button className="gap-2" onClick={handleCreateClick} aria-label="Add new certification">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Certification
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <CheckCircle className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statusCounts.all}</p>
              <p className="text-muted-foreground text-sm">Total Certifications</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-success-muted)]">
              <CheckCircle className="h-5 w-5 text-[var(--color-success-400)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statusCounts.current}</p>
              <p className="text-muted-foreground text-sm">Current</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-warning-muted)]">
              <Clock className="h-5 w-5 text-[var(--color-warning-400)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statusCounts.expiring}</p>
              <p className="text-muted-foreground text-sm">Expiring Soon</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-destructive-muted)]">
              <AlertCircle className="h-5 w-5 text-[var(--color-danger-400)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statusCounts.expired}</p>
              <p className="text-muted-foreground text-sm">Expired</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div
          className="flex flex-col gap-4 sm:flex-row sm:items-center"
          role="search"
          aria-label="Filter certifications"
        >
          <div className="relative flex-1">
            <Search
              className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              placeholder="Search by pilot name or check type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search certifications"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({statusCounts.all})</SelectItem>
              <SelectItem value="current">Current ({statusCounts.current})</SelectItem>
              <SelectItem value="expiring">Expiring ({statusCounts.expiring})</SelectItem>
              <SelectItem value="expired">Expired ({statusCounts.expired})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Certifications Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead aria-sort={getAriaSortValue('pilot')}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('pilot')}
                    className="-ml-3"
                  >
                    Pilot {getSortIcon('pilot')}
                  </Button>
                </TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead aria-sort={getAriaSortValue('check_type')}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('check_type')}
                    className="-ml-3"
                  >
                    Check Type {getSortIcon('check_type')}
                  </Button>
                </TableHead>
                <TableHead aria-sort={getAriaSortValue('expiry_date')}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('expiry_date')}
                    className="-ml-3"
                  >
                    Expiry Date {getSortIcon('expiry_date')}
                  </Button>
                </TableHead>
                <TableHead aria-sort={getAriaSortValue('status')}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('status')}
                    className="-ml-3"
                  >
                    Status {getSortIcon('status')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <p className="text-muted-foreground">No certifications found</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell className="text-foreground font-medium">
                      {cert.pilot.first_name} {cert.pilot.last_name}
                    </TableCell>
                    <TableCell className="text-foreground">{cert.pilot.employee_id}</TableCell>
                    <TableCell className="text-foreground">
                      {cert.check_type.check_description}
                    </TableCell>
                    <TableCell>
                      {cert.expiry_date
                        ? format(new Date(cert.expiry_date), 'MMM d, yyyy')
                        : 'No date set'}
                      {cert.status.daysUntilExpiry !== undefined && (
                        <span className="text-muted-foreground ml-2 text-xs">
                          ({cert.status.daysUntilExpiry > 0 ? '+' : ''}
                          {cert.status.daysUntilExpiry}d)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(cert.status.color)}
                        className="gap-1"
                        data-status={cert.status.label.toLowerCase().replace(/\s+/g, '-')}
                      >
                        {getStatusIcon(cert.status.color)}
                        {cert.status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(cert)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(cert)}
                          className="text-[var(--color-danger-400)] hover:text-[var(--color-danger-300)]"
                          aria-label={`Delete certification for ${cert.pilot.first_name} ${cert.pilot.last_name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredCertifications.length > 0 && (
          <div className="border-t p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCertifications.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </Card>

      {/* Certification Form Dialog */}
      <CertificationFormDialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open)
          // Refetch certifications when dialog closes after successful save
          if (!open) {
            fetchCertifications()
          }
        }}
        certification={selectedCertification}
        pilots={pilots}
        checkTypes={checkTypes}
        mode={formDialogMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the certification for{' '}
              <strong>
                {certificationToDelete?.pilot.first_name} {certificationToDelete?.pilot.last_name}
              </strong>{' '}
              ({certificationToDelete?.check_type.check_description}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-[var(--color-danger-600)] hover:bg-[var(--color-danger-700)]"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
