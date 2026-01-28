/**
 * Pilot Registration Approval Page (Admin Only)
 *
 * Allows administrators to review and approve/deny pilot portal registration requests.
 * Registrations must be approved before pilots can access the portal.
 *
 * @route /dashboard/admin/pilot-registrations
 */

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
    // Direct service call - See tasks/061-tracked-admin-auth-registration-approval.md
    const result = await getPendingRegistrationsService()
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
          <h2 className="text-foreground text-2xl font-bold">Pilot Registration Approval</h2>
          <p className="text-muted-foreground mt-1">
            Review and approve pilot portal registration requests
          </p>
        </div>
        <Link href="/dashboard/admin">
          <Button variant="outline">← Back to Admin</Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-amber-500/20 bg-amber-500/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-foreground text-3xl font-bold">{pendingRegistrations.length}</div>
            <p className="text-muted-foreground mt-1 text-xs">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-emerald-500/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Quick Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground text-sm">
              {pendingRegistrations.length > 0
                ? 'Review registrations below'
                : 'No pending requests'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Registration Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/portal/register"
              className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
            >
              /portal/register
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Client Component for Interactive Table */}
      <RegistrationApprovalClient initialRegistrations={pendingRegistrations} />

      {/* Help Text */}
      <Card className="border-blue-500/20 bg-blue-500/10">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">ℹ️</span>
            <div className="space-y-2">
              <p className="text-foreground text-sm font-medium">About Registration Approval</p>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
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
