/**
 * Pilots Table Component
 * Sortable and filterable table view of all pilots
 */

'use client'

import * as React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, DataTableSearch, useTableFilter, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Eye, Pencil, Users, Download } from 'lucide-react'
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
}

interface PilotsTableProps {
  pilots: PilotTableRow[]
}

export function PilotsTable({ pilots }: PilotsTableProps) {
  // Filter function for search
  const filterFn = React.useCallback((pilot: PilotTableRow, query: string) => {
    const searchStr = query.toLowerCase()
    return (
      pilot.first_name.toLowerCase().includes(searchStr) ||
      pilot.last_name.toLowerCase().includes(searchStr) ||
      pilot.role.toLowerCase().includes(searchStr) ||
      (pilot.seniority_number?.toString() || '').includes(searchStr)
    )
  }, [])

  const { filteredData, filterQuery, setFilterQuery } = useTableFilter(pilots, filterFn)

  // Export function
  const handleExport = React.useCallback(() => {
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

    exportToCSV(filteredData, exportColumns, generateFilename('pilots'))
  }, [filteredData])

  // Define columns
  const columns: Column<PilotTableRow>[] = [
    {
      id: 'seniority',
      header: 'Seniority',
      accessorKey: 'seniority_number',
      sortable: true,
      cell: (row) => (
        <span className="text-muted-foreground font-medium">
          {row.seniority_number ? `#${row.seniority_number}` : '-'}
        </span>
      ),
    },
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      cell: (row) => (
        <span className="text-foreground font-medium">
          {row.first_name} {row.last_name}
        </span>
      ),
    },
    {
      id: 'role',
      header: 'Rank',
      accessorKey: 'role',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.role === 'Captain' ? 'default' : 'secondary'}>{row.role}</Badge>
      ),
    },
    {
      id: 'commencement',
      header: 'Commencement Date',
      accessorKey: 'commencement_date',
      sortable: true,
      cell: (row) => (
        <span className="text-foreground">{formatDate(row.commencement_date) || '-'}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'is_active',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.is_active ? 'default' : 'destructive'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/pilots/${row.id}`}>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`View ${row.first_name} ${row.last_name}`}
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link href={`/dashboard/pilots/${row.id}/edit`}>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Edit ${row.first_name} ${row.last_name}`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      ),
    },
  ]

  // Show empty state if no pilots at all
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
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DataTableSearch
          value={filterQuery}
          onChange={setFilterQuery}
          placeholder="Search pilots by name, rank, or seniority..."
          className="max-w-md"
        />
        <Button onClick={handleExport} variant="outline" size="sm" className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          Export to CSV
        </Button>
      </div>
      {filteredData.length === 0 && filterQuery ? (
        <EmptyState
          title="No pilots match your search"
          description={`We couldn't find any pilots matching "${filterQuery}". Try adjusting your search terms.`}
          action={{
            label: 'Clear search',
            onClick: () => setFilterQuery(''),
          }}
        />
      ) : (
        <DataTable
          data={filteredData}
          columns={columns}
          emptyMessage="No pilots found. Try adjusting your search."
          enablePagination={true}
          initialPageSize={25}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      )}
    </div>
  )
}
