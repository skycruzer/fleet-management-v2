/**
 * DataTable
 * Headless-table renderer for tables driven by useDataTable (TanStack Table +
 * nuqs URL state). Pass toolbar as children; optional onRowClick navigates
 * unless the click landed on an interactive element.
 *
 * Pattern adapted from Kiranism/next-shadcn-dashboard-starter (MIT).
 * Deviation: normal-flow container (border + overflow-x-auto) instead of the
 * reference's absolute-inset ScrollArea, which requires a fixed-height shell.
 */

'use client'
'use no memo'

import { type Row, type Table as TanstackTable, flexRender } from '@tanstack/react-table'
import * as React from 'react'

import { DataTablePagination } from '@/components/ui/data-table/data-table-pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface DataTableProps<TData> extends React.ComponentProps<'div'> {
  table: TanstackTable<TData>
  actionBar?: React.ReactNode
  onRowClick?: (row: TData) => void
  pageSizeOptions?: number[]
  /**
   * Optional detail row rendered directly beneath a data row (full width).
   * Return null for rows without expanded content — the caller owns the
   * expansion state.
   */
  renderSubRow?: (row: Row<TData>) => React.ReactNode
}

export function DataTable<TData>({
  table,
  actionBar,
  onRowClick,
  pageSizeOptions,
  renderSubRow,
  children,
  className,
  ...props
}: DataTableProps<TData>) {
  const handleRowClick = (event: React.MouseEvent, row: TData) => {
    if (!onRowClick) return
    // Ignore clicks on interactive elements (action buttons, links)
    if ((event.target as HTMLElement).closest('a, button, [role="checkbox"]')) return
    onRowClick(row)
  }

  return (
    <div className={cn('flex w-full flex-col gap-4', className)} {...props}>
      {children}
      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const subRow = renderSubRow?.(row)
                  return (
                    <React.Fragment key={row.id}>
                      <TableRow
                        data-state={row.getIsSelected() && 'selected'}
                        onClick={(event) => handleRowClick(event, row.original)}
                        className={cn(onRowClick && 'cursor-pointer')}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                      {subRow != null && (
                        <TableRow>
                          <TableCell colSpan={row.getVisibleCells().length} className="bg-muted/50">
                            {subRow}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />
        {actionBar && table.getFilteredSelectedRowModel().rows.length > 0 && actionBar}
      </div>
    </div>
  )
}
