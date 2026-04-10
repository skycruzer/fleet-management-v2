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
import { cookies } from 'next/headers'

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
    // Use API route with proper admin authentication
    const cookieStore = await cookies()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/portal/registration-approval`, {
      headers: {
        Cookie: cookieStore.toString(),
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return []
    }

    const result = await response.json()
    return (result.success ? result.data || [] : []) as PendingRegistration[]
  } catch {
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
        <Card className="border-[var(--color-warning-500)]/20 bg-[var(--color-warning-muted)]">
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

        <Card className="border-[var(--color-success-500)]/20 bg-[var(--color-success-muted)]">
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

        <Card className="border-[var(--color-info)]/20 bg-[var(--color-info-bg)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Registration Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/portal/register"
              className="text-sm text-[var(--color-info)] hover:text-[var(--color-info)]/80 hover:underline"
            >
              /portal/register
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Client Component for Interactive Table */}
      <RegistrationApprovalClient initialRegistrations={pendingRegistrations} />
    </div>
  )
}
