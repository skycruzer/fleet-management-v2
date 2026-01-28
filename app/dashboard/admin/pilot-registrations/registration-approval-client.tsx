'use client'

/**
 * Registration Approval Client Component
 *
 * Handles interactive approval/denial of pilot portal registrations.
 * Client component is required for state management and API calls.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { approvePilotRegistration, denyPilotRegistration } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PendingRegistration {
  id: string
  email: string
  first_name: string
  last_name: string
  rank: string | null
  employee_id?: string
  created_at: string
  registration_approved: boolean | null
}

interface Props {
  initialRegistrations: PendingRegistration[]
}

export function RegistrationApprovalClient({ initialRegistrations }: Props) {
  const router = useRouter()
  const [registrations, setRegistrations] = useState<PendingRegistration[]>(initialRegistrations)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Sync state with props when initialRegistrations changes
  useEffect(() => {
    setRegistrations(initialRegistrations)
  }, [initialRegistrations])

  const handleApproval = async (registrationId: string, approved: boolean) => {
    setIsProcessing(registrationId)
    setError(null)
    setSuccess(null)

    try {
      // Use server actions instead of API to bypass authentication issues
      const result = approved
        ? await approvePilotRegistration(registrationId)
        : await denyPilotRegistration(registrationId)

      if (!result.success) {
        setError(result.error || 'Failed to process approval')
        setIsProcessing(null)
        return
      }

      // Remove the processed registration from the list
      setRegistrations((prev) => prev.filter((reg) => reg.id !== registrationId))

      setSuccess(
        approved ? 'Registration approved successfully' : 'Registration denied successfully'
      )

      // Refresh the page data after a short delay
      setTimeout(() => {
        router.refresh()
        setSuccess(null)
      }, 2000)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsProcessing(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (registrations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Registrations</CardTitle>
          <CardDescription>No pending pilot registrations at this time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 text-6xl">✅</div>
            <p className="text-foreground text-lg font-medium">All caught up!</p>
            <p className="text-muted-foreground mt-2 text-sm">
              There are no pending pilot registrations to review.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Registrations</CardTitle>
          <CardDescription>
            Review pilot information and approve or deny access to the portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">
                      {registration.first_name} {registration.last_name}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`mailto:${registration.email}`}
                        className="text-blue-600 hover:text-blue-500 hover:underline"
                      >
                        {registration.email}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant={registration.rank === 'Captain' ? 'default' : 'secondary'}>
                        {registration.rank || 'Not Specified'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {registration.employee_id || (
                        <span className="text-muted-foreground text-sm">Not provided</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(registration.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 text-white hover:bg-green-700"
                          onClick={() => handleApproval(registration.id, true)}
                          disabled={isProcessing === registration.id}
                        >
                          {isProcessing === registration.id ? 'Processing...' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleApproval(registration.id, false)}
                          disabled={isProcessing === registration.id}
                        >
                          {isProcessing === registration.id ? 'Processing...' : 'Deny'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
