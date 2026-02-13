/**
 * Portal Users Admin Page
 * Displays all pilot portal users with their activity metrics
 *
 * @author Maurice Rondeau
 * @date February 2026
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Breadcrumb } from '@/components/navigation/breadcrumb'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getPortalUsersSummary } from '@/lib/services/portal-admin-service'
import { Users, UserCheck, Clock, UserX } from 'lucide-react'
import { PortalUsersTable } from '@/components/admin/portal-users-table'

export default async function PortalUsersPage() {
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  const summary = await getPortalUsersSummary()

  return (
    <div className="space-y-8 p-8">
      <Breadcrumb />

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold tracking-tight">Portal Users</h1>
          <p className="text-muted-foreground mt-2">
            Manage pilot portal accounts and view activity metrics
          </p>
        </div>
        <Link href="/dashboard/admin">
          <Button variant="outline">← Back to Admin</Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium">Total Users</p>
              <p className="text-foreground text-2xl font-bold">{summary.total}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <Users className="text-primary h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium">Approved</p>
              <p className="text-foreground text-2xl font-bold">{summary.approved}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <UserCheck className="text-success h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium">Pending</p>
              <p className="text-foreground text-2xl font-bold">{summary.pending}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <Clock className="text-warning h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium">Denied</p>
              <p className="text-foreground text-2xl font-bold">{summary.denied}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <UserX className="text-destructive h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Portal Users Table */}
      <PortalUsersTable />
    </div>
  )
}
