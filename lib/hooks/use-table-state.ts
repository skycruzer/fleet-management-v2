/**
 * Table State Management Hook
 *
 * Provides reusable state management for data tables including:
 * - Row selection (single and bulk)
 * - Sorting by column with direction toggle
 * - Delete confirmation dialog state
 *
 * Developer: Maurice Rondeau
 * Extracted from components/requests/requests-table.tsx
 *
 * @version 1.0.0
 * @since 2025-12-19
 */

'use client'

import { useState, useMemo, useCallback } from 'react'

// ============================================================================
// Types
// ============================================================================

export type SortDirection = 'asc' | 'desc'

export interface UseTableSelectionOptions<T> {
  items: T[]
  getItemId: (item: T) => string
}

export interface UseTableSortOptions<T, K extends string> {
  items: T[]
  defaultColumn: K
  defaultDirection?: SortDirection
  getSortValue: (item: T, column: K) => string | number | Date
}

export interface UseDeleteDialogOptions {
  onConfirmDelete?: (id: string) => Promise<void>
}

// ============================================================================
// Selection Hook
// ============================================================================

/**
 * Hook for managing table row selection state
 *
 * @example
 * const { selectedIds, handleSelectAll, handleSelectItem, clearSelection, isAllSelected } =
 *   useTableSelection({
 *     items: requests,
 *     getItemId: (r) => r.id,
 *   })
 */
export function useTableSelection<T>({ items, getItemId }: UseTableSelectionOptions<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(items.map(getItemId)))
      } else {
        setSelectedIds(new Set())
      }
    },
    [items, getItemId]
  )

  const handleSelectItem = useCallback((itemId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(itemId)
      } else {
        newSet.delete(itemId)
      }
      return newSet
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isSelected = useCallback((itemId: string) => selectedIds.has(itemId), [selectedIds])

  const isAllSelected = useMemo(
    () => items.length > 0 && selectedIds.size === items.length,
    [items.length, selectedIds.size]
  )

  const isSomeSelected = useMemo(
    () => selectedIds.size > 0 && selectedIds.size < items.length,
    [selectedIds.size, items.length]
  )

  const selectedCount = selectedIds.size

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(getItemId(item))),
    [items, selectedIds, getItemId]
  )

  return {
    selectedIds,
    selectedCount,
    selectedItems,
    handleSelectAll,
    handleSelectItem,
    clearSelection,
    isSelected,
    isAllSelected,
    isSomeSelected,
  }
}

// ============================================================================
// Sorting Hook
// ============================================================================

/**
 * Hook for managing table sorting state
 *
 * @example
 * const { sortColumn, sortDirection, handleSort, sortedItems } = useTableSort({
 *   items: requests,
 *   defaultColumn: 'submission_date',
 *   getSortValue: (item, column) => {
 *     if (column === 'submission_date') return new Date(item.submission_date)
 *     if (column === 'name') return item.name.toLowerCase()
 *     return item[column]
 *   },
 * })
 */
export function useTableSort<T, K extends string>({
  items,
  defaultColumn,
  defaultDirection = 'desc',
  getSortValue,
}: UseTableSortOptions<T, K>) {
  const [sortColumn, setSortColumn] = useState<K>(defaultColumn)
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection)

  const handleSort = useCallback(
    (column: K) => {
      if (column === sortColumn) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortColumn(column)
        setSortDirection('asc')
      }
    },
    [sortColumn]
  )

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aValue = getSortValue(a, sortColumn)
      const bValue = getSortValue(b, sortColumn)

      // Handle Date objects
      const aCompare = aValue instanceof Date ? aValue.getTime() : aValue
      const bCompare = bValue instanceof Date ? bValue.getTime() : bValue

      if (aCompare < bCompare) return sortDirection === 'asc' ? -1 : 1
      if (aCompare > bCompare) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [items, sortColumn, sortDirection, getSortValue])

  return {
    sortColumn,
    sortDirection,
    handleSort,
    sortedItems,
  }
}

// ============================================================================
// Delete Dialog Hook
// ============================================================================

/**
 * Hook for managing delete confirmation dialog state
 *
 * @example
 * const { isOpen, itemToDelete, openDialog, closeDialog, confirmDelete } = useDeleteDialog({
 *   onConfirmDelete: async (id) => await deleteRequest(id),
 * })
 */
export function useDeleteDialog({ onConfirmDelete }: UseDeleteDialogOptions = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const openDialog = useCallback((id: string) => {
    setItemToDelete(id)
    setIsOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setIsOpen(false)
    setItemToDelete(null)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete || !onConfirmDelete) return

    setIsDeleting(true)
    try {
      await onConfirmDelete(itemToDelete)
      closeDialog()
    } finally {
      setIsDeleting(false)
    }
  }, [itemToDelete, onConfirmDelete, closeDialog])

  return {
    isOpen,
    itemToDelete,
    isDeleting,
    openDialog,
    closeDialog,
    confirmDelete,
  }
}

// ============================================================================
// Combined Table State Hook
// ============================================================================

/**
 * Combined hook for full table state management
 * Combines selection, sorting, and delete dialog in one hook
 *
 * @example
 * const tableState = useTableState({
 *   items: requests,
 *   getItemId: (r) => r.id,
 *   sortConfig: {
 *     defaultColumn: 'submission_date',
 *     getSortValue: (item, col) => item[col],
 *   },
 *   onDelete: async (id) => await deleteRequest(id),
 * })
 */
export function useTableState<T, K extends string>({
  items,
  getItemId,
  sortConfig,
  onDelete,
}: {
  items: T[]
  getItemId: (item: T) => string
  sortConfig: {
    defaultColumn: K
    defaultDirection?: SortDirection
    getSortValue: (item: T, column: K) => string | number | Date
  }
  onDelete?: (id: string) => Promise<void>
}) {
  const selection = useTableSelection({ items, getItemId })

  const sorting = useTableSort({
    items,
    defaultColumn: sortConfig.defaultColumn,
    defaultDirection: sortConfig.defaultDirection,
    getSortValue: sortConfig.getSortValue,
  })

  const deleteDialog = useDeleteDialog({ onConfirmDelete: onDelete })

  return {
    // Selection
    ...selection,
    // Sorting (prefixed to avoid conflicts)
    sortColumn: sorting.sortColumn,
    sortDirection: sorting.sortDirection,
    handleSort: sorting.handleSort,
    sortedItems: sorting.sortedItems,
    // Delete dialog
    deleteDialog,
  }
}
