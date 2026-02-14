'use client'

/**
 * Portal Users Table Component
 * Interactive table for viewing and filtering pilot portal users with activity metrics.
 * Fetches data from the portal users admin API with server-side filtering, sorting, and pagination.
 *
 * @author Maurice Rondeau
 * @date February 2026
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableSkeleton } from '@/components/ui/skeleton'

// --- Types ---

interface PortalUserWithActivity {
  id: string
  first_name: string
  last_name: string
  email: string
  employee_id: string | null
  rank: string | null
  seniority_number: number | null
  registration_approved: boolean | null
  registration_date: string
  approved_at: string | null
  last_login_at: string | null
  must_change_password: boolean
  pilot_id: string | null
  login_count: number
  active_sessions: number
  total_requests: number
  leave_requests: number
  flight_requests: number
  leave_bids: number
  feedback_count: number
}

interface PaginationInfo {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface ApiResponse {
  success: boolean
  data: PortalUserWithActivity[]
  pagination: PaginationInfo
}

type SortField =
  | 'name'
  | 'employee_id'
  | 'rank'
  | 'registration_date'
  | 'last_login_at'
  | 'total_requests'
  | 'active_sessions'
type SortOrder = 'asc' | 'desc'

// --- Helpers ---

function getStatusBadge(approved: boolean | null) {
  if (approved === true) {
    return (
      <Badge className="bg-[var(--color-success-muted)] text-[var(--color-success-400)]">
        Approved
      </Badge>
    )
  }
  if (approved === false) {
    return (
      <Badge className="bg-[var(--color-destructive-muted)] text-[var(--color-danger-400)]">
        Denied
      </Badge>
    )
  }
  return (
    <Badge className="bg-[var(--color-warning-muted)] text-[var(--color-warning-400)]">
      Pending
    </Badge>
  )
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never'
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy')
  } catch {
    return 'N/A'
  }
}

// --- Component ---

export function PortalUsersTable() {
  // Filter state
  const [status, setStatus] = useState('all')
  const [rank, setRank] = useState('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Sort state
  const [sortBy, setSortBy] = useState<SortField>('registration_date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Pagination state
  const [page, setPage] = useState(1)
  const pageSize = 25

  // Data state
  const [users, setUsers] = useState<PortalUserWithActivity[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to first page on new search
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [status, rank])

  // Fetch data
  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        status,
        rank: rank === 'all' ? '' : rank,
        search: debouncedSearch,
        sortBy,
        sortOrder,
        page: String(page),
        pageSize: String(pageSize),
      })

      const response = await fetch(`/api/admin/portal-users?${params}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch portal users: ${response.statusText}`)
      }

      const result: ApiResponse = await response.json()

      if (!result.success) {
        throw new Error('API returned an error')
      }

      setUsers(result.data)
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [status, rank, debouncedSearch, sortBy, sortOrder, page, pageSize])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Sort toggle handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  // Sort indicator
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Portal Users</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
            </SelectContent>
          </Select>

          <Select value={rank} onValueChange={setRank}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Rank" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ranks</SelectItem>
              <SelectItem value="Captain">Captain</SelectItem>
              <SelectItem value="First Officer">First Officer</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by name, email, or employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-[var(--color-danger-500)]/20 bg-[var(--color-destructive-muted)] p-4 text-sm text-[var(--color-danger-500)]">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && <TableSkeleton rows={8} columns={8} />}

        {/* Table */}
        {!isLoading && !error && (
          <>
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-foreground text-lg font-medium">No portal users found</p>
                <p className="text-muted-foreground mt-2 text-sm">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button
                          type="button"
                          onClick={() => handleSort('name')}
                          className="hover:text-foreground inline-flex items-center"
                        >
                          Name
                          <SortIcon field="name" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          type="button"
                          onClick={() => handleSort('employee_id')}
                          className="hover:text-foreground inline-flex items-center"
                        >
                          Employee ID
                          <SortIcon field="employee_id" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          type="button"
                          onClick={() => handleSort('rank')}
                          className="hover:text-foreground inline-flex items-center"
                        >
                          Rank
                          <SortIcon field="rank" />
                        </button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <button
                          type="button"
                          onClick={() => handleSort('last_login_at')}
                          className="hover:text-foreground inline-flex items-center"
                        >
                          Last Login
                          <SortIcon field="last_login_at" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          type="button"
                          onClick={() => handleSort('total_requests')}
                          className="hover:text-foreground inline-flex items-center"
                        >
                          Requests
                          <SortIcon field="total_requests" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          type="button"
                          onClick={() => handleSort('active_sessions')}
                          className="hover:text-foreground inline-flex items-center"
                        >
                          Sessions
                          <SortIcon field="active_sessions" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          type="button"
                          onClick={() => handleSort('registration_date')}
                          className="hover:text-foreground inline-flex items-center"
                        >
                          Registered
                          <SortIcon field="registration_date" />
                        </button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        {/* Name */}
                        <TableCell className="font-medium">
                          {user.pilot_id ? (
                            <Link
                              href={`/dashboard/pilots/${user.pilot_id}`}
                              className="text-primary hover:underline"
                            >
                              {user.first_name} {user.last_name}
                            </Link>
                          ) : (
                            <span>
                              {user.first_name} {user.last_name}
                            </span>
                          )}
                          <p className="text-muted-foreground text-xs">{user.email}</p>
                        </TableCell>

                        {/* Employee ID */}
                        <TableCell>
                          {user.employee_id ? (
                            <code className="text-muted-foreground text-xs">
                              {user.employee_id}
                            </code>
                          ) : (
                            <span className="text-muted-foreground text-xs">--</span>
                          )}
                        </TableCell>

                        {/* Rank */}
                        <TableCell>
                          {user.rank ? (
                            <Badge variant={user.rank === 'Captain' ? 'default' : 'secondary'}>
                              {user.rank}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">--</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>{getStatusBadge(user.registration_approved)}</TableCell>

                        {/* Last Login */}
                        <TableCell className="text-muted-foreground text-sm">
                          {formatRelativeTime(user.last_login_at)}
                        </TableCell>

                        {/* Requests */}
                        <TableCell>
                          <span
                            className="text-foreground text-sm"
                            title={`Leave: ${user.leave_requests} | Flight: ${user.flight_requests}`}
                          >
                            {user.total_requests}
                          </span>
                        </TableCell>

                        {/* Sessions */}
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            {user.active_sessions > 0 && (
                              <span className="bg-success inline-block h-2 w-2 rounded-full" />
                            )}
                            <span className="text-foreground">{user.active_sessions}</span>
                          </span>
                        </TableCell>

                        {/* Registered */}
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(user.registration_date)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-muted-foreground text-sm">
                  {pagination.total} total users &middot; Page {pagination.page} of{' '}
                  {pagination.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Persistent loading indicator for refetches */}
        {isLoading && users.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            <span className="text-muted-foreground text-sm">Refreshing...</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
