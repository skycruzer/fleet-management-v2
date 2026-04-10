/**
 * Approval Checklist Component
 * Pre-approval checklist for leave requests with persistent state
 *
 * Author: Maurice Rondeau
 * Date: December 20, 2025
 * Updated: December 21, 2025 - Added persistence support
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Save, Loader2 } from 'lucide-react'

export const CHECKLIST_ITEMS = [
  { id: 'crew_coverage', label: 'Crew coverage verified' },
  { id: 'seniority', label: 'Seniority checked' },
  { id: 'notice_21_days', label: '21 days notice confirmed' },
  { id: 'oracle_entry', label: 'Oracle entry completed' },
] as const

export type ChecklistItemId = (typeof CHECKLIST_ITEMS)[number]['id']

interface ApprovalChecklistProps {
  /** Unique identifier for this checklist (usually request ID) */
  checklistId: string
  /** Initial checked items from database */
  initialCheckedItems?: string[]
  /** Callback when all items are checked/unchecked */
  onAllChecked: (allChecked: boolean) => void
  /** Callback when checklist changes (for saving progress) */
  onChecklistChange?: (checkedItems: string[]) => void
  /** Callback to save progress */
  onSaveProgress?: (checkedItems: string[]) => Promise<void>
  /** Whether save is in progress */
  isSaving?: boolean
  /** Additional class names */
  className?: string
  /** Reset the checklist (controlled externally) */
  reset?: boolean
}

export function ApprovalChecklist({
  checklistId,
  initialCheckedItems = [],
  onAllChecked,
  onChecklistChange,
  onSaveProgress,
  isSaving = false,
  className,
  reset = false,
}: ApprovalChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<ChecklistItemId>>(
    new Set(
      initialCheckedItems.filter((id) =>
        CHECKLIST_ITEMS.some((item) => item.id === id)
      ) as ChecklistItemId[]
    )
  )
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const initialLoadRef = useRef(true)

  // Track previous reset value using state (React Compiler pattern)
  const [prevReset, setPrevReset] = useState(reset)

  // Handle reset during render - React schedules a synchronous re-render
  if (reset !== prevReset) {
    setPrevReset(reset)
    if (reset) {
      // Transition to true: reset the checklist
      setCheckedItems(new Set())
      setHasUnsavedChanges(false)
    }
  }

  // Notify parent when all items are checked
  useEffect(() => {
    const allChecked = checkedItems.size === CHECKLIST_ITEMS.length
    onAllChecked(allChecked)
  }, [checkedItems, onAllChecked])

  // Notify parent of checklist changes
  useEffect(() => {
    if (onChecklistChange && !initialLoadRef.current) {
      onChecklistChange(Array.from(checkedItems))
    }
  }, [checkedItems, onChecklistChange])

  const toggleItem = (id: ChecklistItemId) => {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    setHasUnsavedChanges(true)
    initialLoadRef.current = false
  }

  const handleSaveProgress = useCallback(async () => {
    if (onSaveProgress) {
      await onSaveProgress(Array.from(checkedItems))
      setHasUnsavedChanges(false)
    }
  }, [checkedItems, onSaveProgress])

  const checkedCount = checkedItems.size
  const totalCount = CHECKLIST_ITEMS.length
  const isPartiallyComplete = checkedCount > 0 && checkedCount < totalCount

  return (
    <div className={cn('space-y-2.5', className)}>
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm font-medium">
          Pre-Approval Checklist ({checkedCount}/{totalCount})
        </p>
        {isPartiallyComplete && hasUnsavedChanges && onSaveProgress && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveProgress}
            disabled={isSaving}
            className="h-7 gap-1 text-xs"
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save Progress
          </Button>
        )}
      </div>
      <div className="space-y-1.5">
        {CHECKLIST_ITEMS.map((item) => {
          // Create unique ID per request to prevent cross-card interference
          const uniqueId = `${checklistId}-${item.id}`
          return (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-2.5 rounded-md border p-1.5 transition-colors',
                checkedItems.has(item.id)
                  ? 'border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)]'
                  : 'border-border'
              )}
            >
              <Checkbox
                id={uniqueId}
                checked={checkedItems.has(item.id)}
                onCheckedChange={() => toggleItem(item.id)}
                className="h-4 w-4"
              />
              <Label
                htmlFor={uniqueId}
                className={cn(
                  'cursor-pointer text-sm',
                  checkedItems.has(item.id) && 'text-[var(--color-status-low)]'
                )}
              >
                {item.label}
              </Label>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Get the number of checked items from an approval checklist state
 */
export function getChecklistProgress(approvalChecklist: { checked_items: string[] } | null): {
  checked: number
  total: number
} {
  const checked = approvalChecklist?.checked_items?.length ?? 0
  return { checked, total: CHECKLIST_ITEMS.length }
}
