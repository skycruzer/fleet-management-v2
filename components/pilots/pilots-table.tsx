/**
 * Pilots Table Component
 * Table view of all pilots built on the URL-synced data table system
 * (useDataTable + components/ui/data-table). Owns its own filtering via the
 * toolbar (name search, rank/status/contract faceted filters), column
 * visibility, and pagination — all synced to the query string.
 *
 * Developer: Maurice Rondeau
 */

'use client'
'use no memo'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import { Download, Eye, Pencil, Users } from 'lucide-react'

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

export interface PilotTableRow {
  id: string
  seniority_number: number | null
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  commencement_date: string | null
  contract_type?: string | null
}

interface PilotsTableProps {
  pilots: PilotTableRow[]
  contractTypes?: string[]
}

// Faceted filters store an array of selected values; match rows whose cell
// value is one of them. An empty selection means "no filter".
const facetedFilterFn: FilterFn<PilotTableRow> = (row, columnId, filterValue) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true
  return (filterValue as string[]).includes(String(row.getValue(columnId) ?? ''))
}

export function PilotsTable({ pilots, contractTypes = [] }: PilotsTableProps) {
  const router = useRouter()

  const columns = React.useMemo<ColumnDef<PilotTableRow>[]>(
    () => [
      {
        id: 'seniority_number',
        accessorKey: 'seniority_number',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Seniority" />,
        meta: { label: 'Seniority' },
        cell: ({ row }) => (
          <span className="text-muted-foreground font-medium">
            {row.original.seniority_number ? `#${row.original.seniority_number}` : '-'}
          </span>
        ),
      },
      {
        id: 'name',
        accessorFn: (row) => `${row.first_name} ${row.last_name}`,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        meta: { label: 'Name', variant: 'text', placeholder: 'Search name...' },
        enableColumnFilter: true,
        filterFn: 'includesString',
        cell: ({ row }) => (
          <span className="text-foreground font-medium">
            {row.original.first_name} {row.original.last_name}
          </span>
        ),
      },
      {
        id: 'role',
        accessorKey: 'role',
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
        cell: ({ row }) => <RankBadge rank={row.original.role} />,
      },
      {
        id: 'commencement_date',
        accessorKey: 'commencement_date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Commencement" />,
        meta: { label: 'Commencement' },
        cell: ({ row }) => (
          <span className="text-foreground">
            {formatDate(row.original.commencement_date) || '-'}
          </span>
        ),
      },
      {
        id: 'status',
        accessorFn: (row) => (row.is_active ? 'Active' : 'Inactive'),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        meta: {
          label: 'Status',
          variant: 'multiSelect',
          options: [
            { label: 'Active', value: 'Active' },
            { label: 'Inactive', value: 'Inactive' },
          ],
        },
        enableColumnFilter: true,
        filterFn: facetedFilterFn,
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? 'default' : 'destructive'}>
            {row.original.is_active ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'contract',
        accessorFn: (row) => row.contract_type ?? '',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Contract" />,
        meta: {
          label: 'Contract',
          variant: 'multiSelect',
          options: contractTypes.map((type) => ({ label: type, value: type })),
        },
        enableColumnFilter: contractTypes.length > 0,
        filterFn: facetedFilterFn,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.contract_type || '-'}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/pilots/${row.original.id}`}>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`View ${row.original.first_name} ${row.original.last_name}`}
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href={`/dashboard/pilots/${row.original.id}/edit`}>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Edit ${row.original.first_name} ${row.original.last_name}`}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        ),
      },
    ],
    [contractTypes]
  )

  const { table } = useDataTable({
    data: pilots,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: false,
    initialState: {
      sorting: [{ id: 'seniority_number', desc: false }],
      pagination: { pageIndex: 0, pageSize: 25 },
      columnVisibility: { contract: false },
    },
  })

  // Export respects current filters and sort order
  const handleExport = React.useCallback(() => {
    const rows = table.getFilteredRowModel().rows.map((row) => row.original)
    const exportColumns = [
      { header: 'Seniority', accessor: (row: PilotTableRow) => row.seniority_number ?? '' },
      { header: 'First Name', accessor: (row: PilotTableRow) => row.first_name },
      { header: 'Last Name', accessor: (row: PilotTableRow) => row.last_name },
      { header: 'Rank', accessor: (row: PilotTableRow) => row.role },
      {
        header: 'Commencement Date',
        accessor: (row: PilotTableRow) => formatDate(row.commencement_date),
      },
      {
        header: 'Status',
        accessor: (row: PilotTableRow) => (row.is_active ? 'Active' : 'Inactive'),
      },
    ]

    exportToCSV(rows, exportColumns, generateFilename('pilots'))
  }, [table])

  const handleRowClick = React.useCallback(
    (row: PilotTableRow) => {
      router.push(`/dashboard/pilots/${row.id}`)
    },
    [router]
  )

  if (pilots.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No pilots found"
        description="Get started by adding your first pilot to the fleet management system."
        action={{
          label: 'Add Pilot',
          href: '/dashboard/pilots/new',
        }}
      />
    )
  }

  return (
    <DataTable table={table} onRowClick={handleRowClick}>
      <DataTableToolbar table={table}>
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          Export CSV
        </Button>
      </DataTableToolbar>
    </DataTable>
  )
}
