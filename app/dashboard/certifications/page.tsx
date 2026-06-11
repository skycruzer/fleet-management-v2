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
'use no memo'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQueryState } from 'nuqs'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import { formatDate } from '@/lib/utils/date-utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton, TableSkeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header'
import { DataTableToolbar } from '@/components/ui/data-table/data-table-toolbar'
import { useDataTable } from '@/lib/hooks/use-data-table'
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
import { Plus, Download, AlertCircle, CheckCircle, Clock, Trash2 } from 'lucide-react'
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
// TABLE FILTER FUNCTIONS
// ===================================

// Text search spans pilot name, employee ID, and check description —
// preserves the previous single-search behavior.
const searchFilterFn: FilterFn<Certification> = (row, _columnId, filterValue) => {
  const query = String(filterValue).toLowerCase()
  const cert = row.original
  return (
    `${cert.pilot.first_name} ${cert.pilot.last_name}`.toLowerCase().includes(query) ||
    cert.pilot.employee_id?.toLowerCase().includes(query) ||
    cert.check_type.check_description?.toLowerCase().includes(query) ||
    cert.check_type.check_code?.toLowerCase().includes(query) ||
    false
  )
}

// Sort status by severity (expired first), not alphabetically
const STATUS_SEVERITY: Record<string, number> = { red: 0, yellow: 1, green: 2, gray: 3 }

// ===================================
// COMPONENT
// ===================================

export default function CertificationsPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Data state
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [pilots, setPilots] = useState<Pilot[]>([])
  const [checkTypes, setCheckTypes] = useState<CheckType[]>([])

  // URL-synced so deep links work (?filter=expiring from dashboard widgets,
  // ?filter=attention from the /certifications/expiring redirect)
  const [statusFilter, setStatusFilter] = useQueryState('filter', { defaultValue: 'all' })
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

  // Status quick-filter (URL `filter` contract) pre-filters the table data;
  // search/sort/pagination/column-visibility are handled by useDataTable
  const statusFilteredCertifications = useMemo(() => {
    if (statusFilter === 'all') return certifications
    return certifications.filter((cert) => {
      switch (statusFilter) {
        case 'current':
          return cert.status.color === 'green'
        case 'expiring':
          return cert.status.color === 'yellow'
        case 'expired':
          return cert.status.color === 'red'
        case 'attention':
          // Combined view: anything expiring soon or already expired
          return cert.status.color === 'yellow' || cert.status.color === 'red'
        default:
          return true
      }
    })
  }, [certifications, statusFilter])

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

  const columns = useMemo<ColumnDef<Certification>[]>(
    () => [
      {
        id: 'pilot',
        accessorFn: (row) => `${row.pilot.last_name}, ${row.pilot.first_name}`,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pilot" />,
        meta: { label: 'Pilot', variant: 'text', placeholder: 'Search pilot or check type...' },
        enableColumnFilter: true,
        filterFn: searchFilterFn,
        cell: ({ row }) => (
          <span className="text-foreground font-medium">
            {row.original.pilot.first_name} {row.original.pilot.last_name}
          </span>
        ),
      },
      {
        id: 'employee',
        accessorFn: (row) => row.pilot.employee_id,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Employee ID" />,
        meta: { label: 'Employee ID' },
        cell: ({ row }) => (
          <span className="text-foreground">{row.original.pilot.employee_id}</span>
        ),
      },
      {
        id: 'check',
        accessorFn: (row) => row.check_type.check_description,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Check Type" />,
        meta: { label: 'Check Type' },
        cell: ({ row }) => (
          <span className="text-foreground">{row.original.check_type.check_description}</span>
        ),
      },
      {
        id: 'expiry',
        accessorKey: 'expiry_date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Expiry Date" />,
        meta: { label: 'Expiry Date' },
        cell: ({ row }) => (
          <>
            {row.original.expiry_date
              ? format(new Date(row.original.expiry_date), 'MMM d, yyyy')
              : 'No date set'}
            {row.original.status.daysUntilExpiry !== undefined && (
              <span className="text-muted-foreground ml-2 text-xs">
                ({row.original.status.daysUntilExpiry > 0 ? '+' : ''}
                {row.original.status.daysUntilExpiry}d)
              </span>
            )}
          </>
        ),
      },
      {
        id: 'status',
        accessorFn: (row) => STATUS_SEVERITY[row.status.color] ?? 4,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        meta: { label: 'Status' },
        cell: ({ row }) => (
          <Badge
            variant={getStatusBadgeVariant(row.original.status.color)}
            className="gap-1"
            data-status={row.original.status.label.toLowerCase().replace(/\s+/g, '-')}
          >
            {getStatusIcon(row.original.status.color)}
            {row.original.status.label}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleEditClick(row.original)}>
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteClick(row.original)}
              className="text-[var(--color-destructive-muted-foreground)] hover:text-[var(--color-danger-300)]"
              aria-label={`Delete certification for ${row.original.pilot.first_name} ${row.original.pilot.last_name}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  const { table } = useDataTable({
    data: statusFilteredCertifications,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: false,
    initialState: {
      sorting: [{ id: 'pilot', desc: false }],
      pagination: { pageIndex: 0, pageSize: 25 },
    },
  })

  // Handle export to CSV (respects current search/sort/status filters)
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
    const exportRows = table.getFilteredRowModel().rows.map((tableRow) => tableRow.original)
    const rows = exportRows.map((cert) => [
      `${cert.pilot.first_name} ${cert.pilot.last_name}`,
      cert.pilot.employee_id,
      cert.check_type.check_description,
      cert.completion_date ? formatDate(cert.completion_date) : 'N/A',
      cert.expiry_date ? formatDate(cert.expiry_date) : 'N/A',
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
    // Include the page-header skeleton so the header doesn't vanish during client fetch
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-44 rounded-md" />
          </div>
        </div>
        <TableSkeleton rows={8} columns={6} />
      </div>
    )
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
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-info-bg)]">
              <CheckCircle className="h-5 w-5 text-[var(--color-info)]" />
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
              <CheckCircle className="h-5 w-5 text-[var(--color-success-muted-foreground)]" />
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
              <Clock className="h-5 w-5 text-[var(--color-warning-muted-foreground)]" />
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
              <AlertCircle className="h-5 w-5 text-[var(--color-destructive-muted-foreground)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statusCounts.expired}</p>
              <p className="text-muted-foreground text-sm">Expired</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Certifications Table — search/sort/pagination URL-synced via useDataTable */}
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value)
              table.setPageIndex(0)
            }}
          >
            <SelectTrigger className="h-8 w-full sm:w-[200px]" aria-label="Filter by status">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({statusCounts.all})</SelectItem>
              <SelectItem value="current">Current ({statusCounts.current})</SelectItem>
              <SelectItem value="expiring">Expiring ({statusCounts.expiring})</SelectItem>
              <SelectItem value="expired">Expired ({statusCounts.expired})</SelectItem>
              <SelectItem value="attention">
                Needs Attention ({statusCounts.expiring + statusCounts.expired})
              </SelectItem>
            </SelectContent>
          </Select>
        </DataTableToolbar>
      </DataTable>

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
