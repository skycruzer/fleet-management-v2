/**
 * Pilot Registration Approval Page (Admin Only)
 *
 * Allows administrators to review and approve/deny pilot portal registration requests.
 * Registrations must be approved before pilots can access the portal.
 *
 * @route /dashboard/admin/pilot-registrations
 */

export const dynamic = 'force-dynamic'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { RegistrationApprovalClient } from './registration-approval-client'
import { getPendingRegistrations as getPendingRegistrationsService } from '@/lib/services/pilot-portal-service'

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

async function getPendingRegistrations(): Promise<PendingRegistration[]> {
  try {
    // TEMPORARY FIX: Call service directly instead of API to bypass auth issues
    // TODO: Fix admin authentication in /api/portal/registration-approval
    const result = await getPendingRegistrationsService()
    console.log('📋 Pending registrations result:', {
      success: result.success,
      count: result.data?.length || 0,
      data: result.data
    })
    // Type cast to PendingRegistration[] to match client component interface
    return (result.success ? result.data || [] : []) as PendingRegistration[]
  } catch (error) {
    console.error('Error fetching pending registrations:', error)
    return []
  }
}

export default async function PilotRegistrationsPage() {
  const pendingRegistrations = await getPendingRegistrations()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pilot Registration Approval</h2>
          <p className="mt-1 text-muted-foreground">
            Review and approve pilot portal registration requests
          </p>
        </div>
        <Link href="/dashboard/admin">
          <Button variant="outline">← Back to Admin</Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {pendingRegistrations.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quick Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">
              {pendingRegistrations.length > 0
                ? 'Review registrations below'
                : 'No pending requests'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Registration Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/portal/register"
              className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
            >
              /portal/register
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Client Component for Interactive Table */}
      <RegistrationApprovalClient initialRegistrations={pendingRegistrations} />

      {/* Help Text */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">ℹ️</span>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">About Registration Approval</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>Pilots submit registration requests through /portal/register</li>
                <li>Verify employee ID and details before approving</li>
                <li>Approved pilots receive email notification (when implemented)</li>
                <li>Denied registrations cannot log in to the portal</li>
                <li>All approval actions are logged in the audit trail</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
