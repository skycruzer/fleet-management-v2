/**
 * Optimistic UI Utilities
 * Helper functions for implementing optimistic updates
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

/**
 * Generate a temporary ID for optimistic creates
 */
export function generateTempId(prefix = 'temp'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if an ID is a temporary optimistic ID
 */
export function isTempId(id: string): boolean {
  return id.startsWith('temp-')
}

/**
 * Replace temporary ID with real ID in data
 */
export function replaceTempId<T extends { id: string }>(
  items: T[],
  tempId: string,
  realId: string
): T[] {
  return items.map((item) => (item.id === tempId ? { ...item, id: realId } : item))
}

/**
 * Rollback strategy for failed mutations
 */
export type RollbackStrategy = 'remove' | 'restore' | 'mark-error'

export interface RollbackOptions<T> {
  strategy: RollbackStrategy
  previousData?: T[]
  errorData?: Partial<T>
}

/**
 * Apply rollback based on strategy
 */
export function applyRollback<T extends { id: string }>(
  currentData: T[],
  failedItem: T,
  options: RollbackOptions<T>
): T[] {
  switch (options.strategy) {
    case 'remove':
      // Remove the failed item
      return currentData.filter((item) => item.id !== failedItem.id)

    case 'restore':
      // Restore from previous data
      if (options.previousData) {
        return options.previousData
      }
      return currentData

    case 'mark-error':
      // Mark item with error state
      return currentData.map((item) =>
        item.id === failedItem.id ? { ...item, ...options.errorData, _optimisticError: true } : item
      )

    default:
      return currentData
  }
}

/**
 * Debounce optimistic updates to prevent rapid mutations
 */
export function debounceOptimistic<T extends (...args: any[]) => any>(
  fn: T,
  delay = 300
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

/**
 * Queue multiple optimistic updates for batch processing
 */
export class OptimisticQueue<T extends { id: string }> {
  private queue: Array<{
    id: string
    action: 'create' | 'update' | 'delete'
    data: T
    timestamp: number
  }> = []

  add(action: 'create' | 'update' | 'delete', data: T) {
    this.queue.push({
      id: generateTempId('queue'),
      action,
      data,
      timestamp: Date.now(),
    })
  }

  flush(): Array<{ action: 'create' | 'update' | 'delete'; data: T }> {
    const items = this.queue.map(({ action, data }) => ({ action, data }))
    this.queue = []
    return items
  }

  clear() {
    this.queue = []
  }

  get size(): number {
    return this.queue.length
  }

  isEmpty(): boolean {
    return this.queue.length === 0
  }
}

/**
 * Optimistic update conflict resolution
 */
export interface ConflictResolution<T> {
  type: 'client-wins' | 'server-wins' | 'merge'
  mergeStrategy?: (client: T, server: T) => T
}

/**
 * Resolve conflicts between optimistic and server data
 */
export function resolveConflict<T extends { id: string }>(
  clientData: T,
  serverData: T,
  resolution: ConflictResolution<T>
): T {
  switch (resolution.type) {
    case 'client-wins':
      return clientData

    case 'server-wins':
      return serverData

    case 'merge':
      if (resolution.mergeStrategy) {
        return resolution.mergeStrategy(clientData, serverData)
      }
      // Default merge: server data takes precedence but keep client changes
      return { ...clientData, ...serverData }

    default:
      return serverData
  }
}

/**
 * Track optimistic mutation state
 */
export interface OptimisticState<T> {
  data: T[]
  pendingMutations: number
  lastUpdate: number
  errors: Array<{ id: string; error: Error; timestamp: number }>
}

/**
 * Create initial optimistic state
 */
export function createOptimisticState<T>(initialData: T[]): OptimisticState<T> {
  return {
    data: initialData,
    pendingMutations: 0,
    lastUpdate: Date.now(),
    errors: [],
  }
}

/**
 * Update optimistic state with new data
 */
export function updateOptimisticState<T>(
  state: OptimisticState<T>,
  updates: Partial<OptimisticState<T>>
): OptimisticState<T> {
  return {
    ...state,
    ...updates,
    lastUpdate: Date.now(),
  }
}

/**
 * Add error to optimistic state
 */
export function addOptimisticError<T>(
  state: OptimisticState<T>,
  id: string,
  error: Error
): OptimisticState<T> {
  return {
    ...state,
    errors: [...state.errors, { id, error, timestamp: Date.now() }],
    lastUpdate: Date.now(),
  }
}

/**
 * Clear old errors from optimistic state
 */
export function clearOldErrors<T>(state: OptimisticState<T>, maxAge = 5000): OptimisticState<T> {
  const now = Date.now()
  return {
    ...state,
    errors: state.errors.filter((err) => now - err.timestamp < maxAge),
    lastUpdate: now,
  }
}
