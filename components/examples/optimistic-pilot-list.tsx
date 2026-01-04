/**
 * Optimistic Pilot List Example
 * Demonstrates optimistic UI updates for pilot management
 *
 * Features:
 * - Instant visual feedback on create/update/delete
 * - Automatic rollback on errors
 * - Pending state indicators
 * - Error handling with retry
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

'use client'

import { useState } from 'react'
import { useOptimisticMutation, type OptimisticUpdate } from '@/lib/hooks/use-optimistic-mutation'
import { generateTempId } from '@/lib/utils/optimistic-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, UserPlus, Trash2, Edit2, AlertCircle } from 'lucide-react'

interface Pilot {
  id: string
  first_name: string
  last_name: string
  rank: string
  is_active: boolean
}

interface OptimisticPilotListProps {
  initialPilots: Pilot[]
}

export function OptimisticPilotList({ initialPilots }: OptimisticPilotListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  // Mutation function that calls the API
  const performMutation = async (update: OptimisticUpdate<Pilot>): Promise<Pilot> => {
    switch (update.action) {
      case 'create': {
        const response = await fetch('/api/pilots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update.data),
        })

        if (!response.ok) {
          throw new Error('Failed to create pilot')
        }

        const result = await response.json()
        return result.data
      }

      case 'update': {
        const response = await fetch(`/api/pilots/${update.data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update.data),
        })

        if (!response.ok) {
          throw new Error('Failed to update pilot')
        }

        const result = await response.json()
        return result.data
      }

      case 'delete': {
        const response = await fetch(`/api/pilots/${update.data.id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to delete pilot')
        }

        return update.data
      }

      default:
        throw new Error('Unknown action')
    }
  }

  // Use optimistic mutation hook
  const {
    data: pilots,
    mutate,
    isPending,
    error,
    reset,
  } = useOptimisticMutation(initialPilots, performMutation)

  // Handle create pilot
  const handleCreate = async () => {
    const newPilot: Pilot = {
      id: '', // Will be replaced with tempId
      first_name: 'John',
      last_name: 'Doe',
      rank: 'Captain',
      is_active: true,
    }

    await mutate(
      {
        action: 'create',
        data: newPilot,
        tempId: generateTempId('pilot'),
      },
      {
        onSuccess: (result) => {
          console.log('Pilot created:', result)
        },
        onError: (err) => {
          console.error('Failed to create pilot:', err)
        },
      }
    )
  }

  // Handle update pilot
  const handleUpdate = async (pilot: Pilot) => {
    const updatedPilot: Pilot = {
      ...pilot,
      first_name: pilot.first_name + ' (Updated)',
    }

    await mutate(
      {
        action: 'update',
        data: updatedPilot,
      },
      {
        onSuccess: (result) => {
          console.log('Pilot updated:', result)
          setEditingId(null)
        },
        onError: (err) => {
          console.error('Failed to update pilot:', err)
        },
      }
    )
  }

  // Handle delete pilot
  const handleDelete = async (pilot: Pilot) => {
    if (!confirm(`Delete ${pilot.first_name} ${pilot.last_name}?`)) {
      return
    }

    await mutate(
      {
        action: 'delete',
        data: pilot,
      },
      {
        onSuccess: () => {
          console.log('Pilot deleted')
        },
        onError: (err) => {
          console.error('Failed to delete pilot:', err)
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Optimistic Pilot List Example</CardTitle>
            <div className="flex items-center gap-2">
              {isPending && (
                <span className="text-muted-foreground flex items-center text-sm">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </span>
              )}
              <Button onClick={handleCreate} disabled={isPending}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Pilot (Optimistic)
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            This component demonstrates optimistic UI updates. When you create, update, or delete a
            pilot, the UI updates instantly without waiting for the server response. If the server
            request fails, the changes are automatically rolled back.
          </p>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-900">Operation Failed</h4>
                <p className="mt-1 text-sm text-red-700">{error.message}</p>
                <Button variant="outline" size="sm" onClick={reset} className="mt-2">
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pilot List */}
      <div className="grid gap-4">
        {pilots.map((pilot) => {
          const isTemp = pilot.id.startsWith('temp-')

          return (
            <Card
              key={pilot.id}
              className={isTemp ? 'border-dashed border-blue-300 bg-blue-50' : ''}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-semibold">
                        {pilot.first_name} {pilot.last_name}
                      </h4>
                      <p className="text-muted-foreground text-sm">{pilot.rank}</p>
                      {isTemp && (
                        <p className="mt-1 text-xs text-blue-600">Creating (optimistic)...</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {pilot.is_active ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdate(pilot)}
                      disabled={isPending || isTemp}
                    >
                      <Edit2 className="mr-1 h-4 w-4" />
                      Update
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(pilot)}
                      disabled={isPending || isTemp}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {pilots.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No pilots found. Add one to get started.</p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{pilots.length}</p>
              <p className="text-muted-foreground text-sm">Total Pilots</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {pilots.filter((p) => p.id.startsWith('temp-')).length}
              </p>
              <p className="text-muted-foreground text-sm">Pending Creates</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{isPending ? '1' : '0'}</p>
              <p className="text-muted-foreground text-sm">Active Operations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
