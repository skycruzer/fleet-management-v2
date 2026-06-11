/**
 * useDataTable
 * TanStack Table wired to URL state via nuqs: page, perPage, sort, and
 * per-column filters all live in the query string so views are deep-linkable
 * and survive back/forward navigation.
 *
 * Adapted from Kiranism/next-shadcn-dashboard-starter (MIT). Key deviation:
 * the reference is server-driven (manual pagination/sorting/filtering); this
 * version processes client-side — our admin tables load full datasets
 * (small fleet) and filter in the browser.
 */

'use client'
'use no memo'

import {
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type TableState,
  type Updater,
  type VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  type Parser,
  type UseQueryStateOptions,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from 'nuqs'
import * as React from 'react'

import { useDebouncedCallback } from '@/lib/hooks/use-debounced-callback'
import { getSortingStateParser } from '@/lib/utils/data-table-parsers'
import type { ExtendedColumnSort } from '@/types/data-table'

const PAGE_KEY = 'page'
const PER_PAGE_KEY = 'perPage'
const SORT_KEY = 'sort'
const ARRAY_SEPARATOR = ','
const DEBOUNCE_MS = 300
const THROTTLE_MS = 50

interface UseDataTableProps<TData> extends Omit<TableOptions<TData>, 'state' | 'getCoreRowModel'> {
  initialState?: Omit<Partial<TableState>, 'sorting'> & {
    sorting?: ExtendedColumnSort<TData>[]
  }
  history?: 'push' | 'replace'
  debounceMs?: number
  throttleMs?: number
  clearOnDefault?: boolean
  scroll?: boolean
  shallow?: boolean
}

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  const {
    columns,
    initialState,
    history = 'replace',
    debounceMs = DEBOUNCE_MS,
    throttleMs = THROTTLE_MS,
    clearOnDefault = true,
    scroll = false,
    shallow = true,
    ...tableProps
  } = props

  const queryStateOptions = React.useMemo<Omit<UseQueryStateOptions<string>, 'parse'>>(
    () => ({
      history,
      scroll,
      shallow,
      throttleMs,
      debounceMs,
      clearOnDefault,
    }),
    [history, scroll, shallow, throttleMs, debounceMs, clearOnDefault]
  )

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    initialState?.rowSelection ?? {}
  )
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    initialState?.columnVisibility ?? {}
  )

  const [page, setPage] = useQueryState(
    PAGE_KEY,
    parseAsInteger.withOptions(queryStateOptions).withDefault(1)
  )
  const [perPage, setPerPage] = useQueryState(
    PER_PAGE_KEY,
    parseAsInteger
      .withOptions(queryStateOptions)
      .withDefault(initialState?.pagination?.pageSize ?? 25)
  )

  const pagination: PaginationState = React.useMemo(
    () => ({
      pageIndex: page - 1, // URL is one-based; TanStack is zero-based
      pageSize: perPage,
    }),
    [page, perPage]
  )

  const onPaginationChange = React.useCallback(
    (updaterOrValue: Updater<PaginationState>) => {
      const next =
        typeof updaterOrValue === 'function' ? updaterOrValue(pagination) : updaterOrValue
      void setPage(next.pageIndex + 1)
      void setPerPage(next.pageSize)
    },
    [pagination, setPage, setPerPage]
  )

  const columnIds = React.useMemo(() => {
    return new Set(columns.map((column) => column.id).filter(Boolean) as string[])
  }, [columns])

  const [sorting, setSorting] = useQueryState(
    SORT_KEY,
    getSortingStateParser<TData>(columnIds)
      .withOptions(queryStateOptions)
      .withDefault(initialState?.sorting ?? [])
  )

  const onSortingChange = React.useCallback(
    (updaterOrValue: Updater<SortingState>) => {
      const next = typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue
      void setSorting(next as ExtendedColumnSort<TData>[])
    },
    [sorting, setSorting]
  )

  const filterableColumns = React.useMemo(
    () => columns.filter((column) => column.enableColumnFilter),
    [columns]
  )

  const filterParsers = React.useMemo(() => {
    return filterableColumns.reduce<Record<string, Parser<string> | Parser<string[]>>>(
      (acc, column) => {
        if (column.meta?.options) {
          acc[column.id ?? ''] = parseAsArrayOf(parseAsString, ARRAY_SEPARATOR).withOptions(
            queryStateOptions
          )
        } else {
          acc[column.id ?? ''] = parseAsString.withOptions(queryStateOptions)
        }
        return acc
      },
      {}
    )
  }, [filterableColumns, queryStateOptions])

  const [filterValues, setFilterValues] = useQueryStates(filterParsers)

  const debouncedSetFilterValues = useDebouncedCallback((values: typeof filterValues) => {
    void setPage(1)
    void setFilterValues(values)
  }, debounceMs)

  const initialColumnFilters: ColumnFiltersState = React.useMemo(() => {
    return Object.entries(filterValues).reduce<ColumnFiltersState>((filters, [key, value]) => {
      if (value !== null) {
        filters.push({ id: key, value })
      }
      return filters
    }, [])
  }, [filterValues])

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initialColumnFilters)

  const onColumnFiltersChange = React.useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>) => {
      setColumnFilters((prev) => {
        const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue

        const filterUpdates = next.reduce<Record<string, string | string[] | null>>(
          (acc, filter) => {
            if (filterableColumns.find((column) => column.id === filter.id)) {
              acc[filter.id] = filter.value as string | string[]
            }
            return acc
          },
          {}
        )

        for (const prevFilter of prev) {
          if (!next.some((filter) => filter.id === prevFilter.id)) {
            filterUpdates[prevFilter.id] = null
          }
        }

        debouncedSetFilterValues(filterUpdates)
        return next
      })
    },
    [debouncedSetFilterValues, filterableColumns]
  )

  const table = useReactTable({
    ...tableProps,
    columns,
    initialState,
    state: {
      pagination,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    defaultColumn: {
      ...tableProps.defaultColumn,
      enableColumnFilter: false,
    },
    onRowSelectionChange: setRowSelection,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return { table, shallow, debounceMs, throttleMs }
}
