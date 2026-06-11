/**
 * Certifications Table Component
 * Table view of all certifications built on the URL-synced data table system
 * (useDataTable + components/ui/data-table). Toolbar owns search (pilot,
 * employee ID, check code/description) plus rank/category/status faceted
 * filters, column visibility, and pagination — all synced to the query string.
 */

'use client'
'use no memo'

import * as React from 'react'
import Link from 'next/link'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import { Download, Eye, FileText } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header'
import { DataTableToolbar } from '@/components/ui/data-table/data-table-toolbar'
import { EmptyState } from '@/components/ui/empty-state'
import { RankBadge } from '@/components/pilots/rank-badge'
import { useDataTable } from '@/lib/hooks/use-data-table'
import { exportToCSV, generateFilename } from '@/lib/utils/export-utils'
import { formatDate } from '@/lib/utils/date-utils'
import type { CertificationWithDetails } from '@/lib/services/certification-service'

interface CertificationsTableProps {
  certifications: CertificationWithDetails[]
}

// Text search spans pilot name, employee ID, and check code/description —
// preserves the old single-search behavior.
const searchFilterFn: FilterFn<CertificationWithDetails> = (row, _columnId, filterValue) => {
  const query = String(filterValue).toLowerCase()
  const cert = row.original
  return (
    cert.pilot?.first_name?.toLowerCase().includes(query) ||
    cert.pilot?.last_name?.toLowerCase().includes(query) ||
    cert.pilot?.employee_id?.toLowerCase().includes(query) ||
    cert.check_type?.check_code?.toLowerCase().includes(query) ||
    cert.check_type?.check_description?.toLowerCase().includes(query) ||
    false
  )
}

// Faceted filters store an array of selected values; match rows whose cell
// value is one of them. An empty selection means "no filter".
const facetedFilterFn: FilterFn<CertificationWithDetails> = (row, columnId, filterValue) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true
  return (filterValue as string[]).includes(String(row.getValue(columnId) ?? ''))
}

export function CertificationsTable({ certifications }: CertificationsTableProps) {
  const categoryOptions = React.useMemo(() => {
    const categories = new Set(
      certifications.map((cert) => cert.check_type?.category || 'Uncategorized')
    )
    return [...categories].sort().map((category) => ({ label: category, value: category }))
  }, [certifications])

  const statusOptions = React.useMemo(() => {
    const labels = new Set(certifications.map((cert) => cert.status?.label || 'No Date'))
    return [...labels].sort().map((label) => ({ label, value: label }))
  }, [certifications])

  const columns = React.useMemo<ColumnDef<CertificationWithDetails>[]>(
    () => [
      {
        id: 'pilot',
        accessorFn: (row) => `${row.pilot?.last_name}, ${row.pilot?.first_name}`,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pilot" />,
        meta: { label: 'Pilot', variant: 'text', placeholder: 'Search pilot or check...' },
        enableColumnFilter: true,
        filterFn: searchFilterFn,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-foreground font-medium">
              {row.original.pilot?.first_name} {row.original.pilot?.last_name}
            </span>
            <span className="text-muted-foreground text-xs">{row.original.pilot?.employee_id}</span>
          </div>
        ),
      },
      {
        id: 'rank',
        accessorFn: (row) => row.pilot?.role || '',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Rank" />,
        meta: {
          label: 'Rank',
          variant: 'multiSelect',
          options: [
            { label: 'Captain', value: 'Captain' },
            { label: 'First Officer', value: 'First Officer' },
          ],
        },
        enableColumnFilter: true,
        filterFn: facetedFilterFn,
        cell: ({ row }) =>
          row.original.pilot?.role ? (
            <RankBadge rank={row.original.pilot.role} />
          ) : (
            <Badge variant="secondary">-</Badge>
          ),
      },
      {
        id: 'check',
        accessorFn: (row) => row.check_type?.check_code || '',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Check Type" />,
        meta: { label: 'Check Type' },
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-foreground font-medium">
              {row.original.check_type?.check_code}
            </span>
            <span className="text-muted-foreground text-xs">
              {row.original.check_type?.check_description}
            </span>
          </div>
        ),
      },
      {
        id: 'category',
        accessorFn: (row) => row.check_type?.category || 'Uncategorized',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
        meta: { label: 'Category', variant: 'multiSelect', options: categoryOptions },
        enableColumnFilter: true,
        filterFn: facetedFilterFn,
        cell: ({ row }) => (
          <span className="text-foreground text-sm">
            {row.original.check_type?.category || 'Uncategorized'}
          </span>
        ),
      },
      {
        id: 'expiry',
        accessorKey: 'expiry_date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Expiry Date" />,
        meta: { label: 'Expiry Date' },
        cell: ({ row }) => (
          <span className="text-foreground">{formatDate(row.original.expiry_date) || '-'}</span>
        ),
      },
      {
        id: 'status',
        accessorFn: (row) => row.status?.label || 'No Date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        meta: { label: 'Status', variant: 'multiSelect', options: statusOptions },
        enableColumnFilter: true,
        filterFn: facetedFilterFn,
        cell: ({ row }) => {
          const status = row.original.status
          if (!status) return <Badge variant="secondary">No Date</Badge>

          const variant =
            status.color === 'red'
              ? 'destructive'
              : status.color === 'yellow'
                ? 'warning'
                : status.color === 'green'
                  ? 'success'
                  : 'secondary'

          return (
            <div className="flex flex-col gap-1">
              <Badge variant={variant}>{status.label}</Badge>
              {status.daysUntilExpiry !== undefined && (
                <span className="text-muted-foreground text-xs">
                  {status.daysUntilExpiry < 0
                    ? `${Math.abs(status.daysUntilExpiry)} days ago`
                    : `${status.daysUntilExpiry} days`}
                </span>
              )}
            </div>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <Link href={`/dashboard/pilots/${row.original.pilot_id}`}>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`View pilot ${row.original.pilot?.first_name} ${row.original.pilot?.last_name}`}
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        ),
      },
    ],
    [categoryOptions, statusOptions]
  )

  const { table } = useDataTable({
    data: certifications,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: false,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 25 },
    },
  })

  // Export respects current filters and sort order
  const handleExport = React.useCallback(() => {
    const rows = table.getFilteredRowModel().rows.map((row) => row.original)
    const exportColumns = [
      {
        header: 'Pilot Name',
        accessor: (row: CertificationWithDetails) =>
          `${row.pilot?.first_name} ${row.pilot?.last_name}`,
      },
      {
        header: 'Employee ID',
        accessor: (row: CertificationWithDetails) => row.pilot?.employee_id ?? '',
      },
      { header: 'Rank', accessor: (row: CertificationWithDetails) => row.pilot?.role ?? '' },
      {
        header: 'Check Code',
        accessor: (row: CertificationWithDetails) => row.check_type?.check_code ?? '',
      },
      {
        header: 'Check Description',
        accessor: (row: CertificationWithDetails) => row.check_type?.check_description ?? '',
      },
      {
        header: 'Category',
        accessor: (row: CertificationWithDetails) => row.check_type?.category ?? 'Uncategorized',
      },
      {
        header: 'Expiry Date',
        accessor: (row: CertificationWithDetails) => formatDate(row.expiry_date),
      },
      {
        header: 'Status',
        accessor: (row: CertificationWithDetails) => row.status?.label ?? 'No Date',
      },
      {
        header: 'Days Until Expiry',
        accessor: (row: CertificationWithDetails) => row.status?.daysUntilExpiry ?? '',
      },
    ]

    exportToCSV(rows, exportColumns, generateFilename('certifications'))
  }, [table])

  if (certifications.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No certifications found"
        description="Get started by adding certifications to track pilot qualifications and expiry dates."
        action={{
          label: 'Add Certification',
          href: '/dashboard/certifications/new',
        }}
      />
    )
  }

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          Export CSV
        </Button>
      </DataTableToolbar>
    </DataTable>
  )
}
