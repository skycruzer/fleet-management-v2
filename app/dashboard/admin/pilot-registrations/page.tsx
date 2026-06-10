/**
 * Pilot Registration Approval Page (Admin Only)
 *
 * Allows administrators to review and approve/deny pilot portal registration requests.
 * Registrations must be approved before pilots can access the portal.
 *
 * @route /dashboard/admin/pilot-registrations
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getPendingRegistrations } from '@/lib/services/pilot-portal-service'
import { RegistrationApprovalClient } from './registration-approval-client'

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

export default async function PilotRegistrationsPage() {
  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  // Call the service directly — a load failure must render as an error,
  // never as an empty "all caught up" list
  const result = await getPendingRegistrations()
  const loadFailed = !result.success
  const pendingRegistrations = (result.success ? result.data || [] : []) as PendingRegistration[]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Pilot Registration Approval"
        description="Review and approve pilot portal registration requests"
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Pilot Registrations' },
        ]}
      />

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
      {loadFailed ? (
        <Card className="border-destructive/30 bg-destructive/5" role="alert">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <AlertCircle className="text-destructive h-6 w-6" aria-hidden="true" />
            <p className="text-foreground text-sm">
              Couldn&apos;t load pending registrations. Reload the page to try again.
            </p>
          </CardContent>
        </Card>
      ) : (
        <RegistrationApprovalClient initialRegistrations={pendingRegistrations} />
      )}
    </div>
  )
}
