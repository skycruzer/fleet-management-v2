/**
 * Admin Dashboard Page - IMPROVED VERSION
 * Enhanced Tailwind CSS styling with better spacing, typography, and responsive design
 */

import { dashboardMetadata } from '@/lib/utils/metadata'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  getAdminStats,
  getAdminUsers,
  getCheckTypes,
  getContractTypes,
  getCheckTypeCategories,
} from '@/lib/services/admin-service'
import { format } from 'date-fns'
import { Users, CheckCircle2, FileText, Database, UserPlus, Settings, List } from 'lucide-react'

export const metadata = dashboardMetadata.admin

export default async function AdminPage() {
  // Fetch all data in parallel
  const [stats, users, checkTypes, contractTypes, categories] = await Promise.all([
    getAdminStats(),
    getAdminUsers(),
    getCheckTypes(),
    getContractTypes(),
    getCheckTypeCategories(),
  ])

  return (
    <div className="@container space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8 xl:p-10">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:gap-6">
        <div className="space-y-1.5">
          <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
            System configuration and user management
          </p>
        </div>
        <Link href="/dashboard/admin/users/new" className="shrink-0">
          <Button size="lg" className="touch-target w-full gap-2 sm:w-auto sm:gap-2.5 lg:gap-3">
            <UserPlus className="size-5" />
            <span className="hidden sm:inline">Add New User</span>
            <span className="sm:hidden">Add User</span>
          </Button>
        </Link>
      </div>

      {/* System Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6 xl:gap-8">
        <Card className="group @container p-4 transition-all duration-200 hover:shadow-lg sm:p-5 lg:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1.5 @sm:space-y-2">
              <p className="text-muted-foreground truncate text-xs font-medium tracking-wide uppercase sm:text-sm">
                System Status
              </p>
              <p className="text-foreground truncate text-xl leading-none font-bold sm:text-2xl lg:text-3xl">
                Operational
              </p>
            </div>
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 transition-all group-hover:scale-105 group-hover:bg-emerald-500/20 sm:size-12 lg:size-14">
              <CheckCircle2 className="size-5 text-emerald-400 sm:size-6 lg:size-7" />
            </div>
          </div>
        </Card>

        <Card className="group @container p-4 transition-all duration-200 hover:shadow-lg sm:p-5 lg:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1.5 @sm:space-y-2">
              <p className="text-muted-foreground truncate text-xs font-medium tracking-wide uppercase sm:text-sm">
                Active Users
              </p>
              <p className="text-foreground truncate text-xl leading-none font-bold sm:text-2xl lg:text-3xl">
                {stats.totalAdmins + stats.totalManagers + stats.totalPilots}
              </p>
              <p className="text-muted-foreground truncate text-xs leading-relaxed">
                {stats.totalAdmins + stats.totalManagers} staff, {stats.totalPilots} pilots
              </p>
            </div>
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-500/10 transition-all group-hover:scale-105 group-hover:bg-blue-500/20 sm:size-12 lg:size-14">
              <Users className="size-5 text-blue-400 sm:size-6 lg:size-7" />
            </div>
          </div>
        </Card>

        <Card className="group @container p-4 transition-all duration-200 hover:shadow-lg sm:p-5 lg:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1.5 @sm:space-y-2">
              <p className="text-muted-foreground truncate text-xs font-medium tracking-wide uppercase sm:text-sm">
                Check Types
              </p>
              <p className="text-foreground truncate text-xl leading-none font-bold sm:text-2xl lg:text-3xl">
                {stats.totalCheckTypes}
              </p>
              <p className="text-muted-foreground truncate text-xs leading-relaxed">
                certification types
              </p>
            </div>
            <div className="bg-primary/10 group-hover:bg-primary/20 flex size-11 shrink-0 items-center justify-center rounded-full transition-all group-hover:scale-105 sm:size-12 lg:size-14">
              <FileText className="text-primary size-5 sm:size-6 lg:size-7" />
            </div>
          </div>
        </Card>

        <Card className="group @container p-4 transition-all duration-200 hover:shadow-lg sm:p-5 lg:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1.5 @sm:space-y-2">
              <p className="text-muted-foreground truncate text-xs font-medium tracking-wide uppercase sm:text-sm">
                Certifications
              </p>
              <p className="text-foreground truncate text-xl leading-none font-bold sm:text-2xl lg:text-3xl">
                {stats.totalCertifications}
              </p>
              <p className="text-muted-foreground truncate text-xs leading-relaxed">
                total records
              </p>
            </div>
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-orange-500/10 transition-all group-hover:scale-105 group-hover:bg-orange-500/20 sm:size-12 lg:size-14">
              <Database className="size-5 text-orange-400 sm:size-6 lg:size-7" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-4 sm:p-5 lg:p-6">
        <h2 className="text-foreground mb-4 text-lg font-semibold sm:mb-5 sm:text-xl lg:mb-6">
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:gap-5">
          <Link href="/dashboard/admin/users/new" className="block">
            <Button
              variant="outline"
              className="group h-auto w-full justify-start gap-3 p-4 text-left transition-all hover:shadow-md sm:gap-4 sm:p-5 lg:p-6"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 transition-all group-hover:scale-105 group-hover:bg-blue-500/20 sm:size-11 lg:size-12">
                <UserPlus className="size-4 text-blue-400 sm:size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold sm:text-base">Add New User</p>
                <p className="text-muted-foreground truncate text-xs leading-relaxed sm:text-sm">
                  Create admin or manager
                </p>
              </div>
            </Button>
          </Link>

          <Link href="/dashboard/admin/check-types" className="block">
            <Button
              variant="outline"
              className="group h-auto w-full justify-start gap-3 p-4 text-left transition-all hover:shadow-md sm:gap-4 sm:p-5 lg:p-6"
            >
              <div className="bg-primary/10 group-hover:bg-primary/20 flex size-10 shrink-0 items-center justify-center rounded-lg transition-all group-hover:scale-105 sm:size-11 lg:size-12">
                <List className="text-primary size-4 sm:size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold sm:text-base">Manage Check Types</p>
                <p className="text-muted-foreground truncate text-xs leading-relaxed sm:text-sm">
                  Edit certification types
                </p>
              </div>
            </Button>
          </Link>

          <Link href="/dashboard/admin/settings" className="block">
            <Button
              variant="outline"
              className="group h-auto w-full justify-start gap-3 p-4 text-left transition-all hover:shadow-md sm:gap-4 sm:p-5 lg:p-6"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 transition-all group-hover:scale-105 group-hover:bg-emerald-500/20 sm:size-11 lg:size-12">
                <Settings className="size-4 text-emerald-400 sm:size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold sm:text-base">System Settings</p>
                <p className="text-muted-foreground truncate text-xs leading-relaxed sm:text-sm">
                  Configure preferences
                </p>
              </div>
            </Button>
          </Link>
        </div>
      </Card>

      {/* Admin Users */}
      <Card className="p-4 sm:p-5 lg:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-center sm:justify-between lg:mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-foreground truncate text-lg font-semibold sm:text-xl">
              Admin & Manager Users
            </h2>
            <p className="text-muted-foreground mt-1 truncate text-xs leading-relaxed sm:text-sm">
              System administrators and managers
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs sm:text-sm">
            {users.length} users
          </Badge>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted/30 sticky top-0 z-10">
              <tr className="border-b text-left">
                <th className="text-muted-foreground px-4 py-3 text-xs font-semibold tracking-wider uppercase sm:px-6 sm:text-sm">
                  Name
                </th>
                <th className="text-muted-foreground hidden px-4 py-3 text-xs font-semibold tracking-wider uppercase sm:table-cell sm:px-6 sm:text-sm">
                  Email
                </th>
                <th className="text-muted-foreground px-4 py-3 text-xs font-semibold tracking-wider uppercase sm:px-6 sm:text-sm">
                  Role
                </th>
                <th className="text-muted-foreground hidden px-4 py-3 text-xs font-semibold tracking-wider uppercase sm:px-6 sm:text-sm md:table-cell">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="group hover:bg-muted/50 active:bg-muted transition-colors"
                >
                  <td className="px-4 py-3.5 text-sm font-medium sm:px-6 sm:py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-foreground truncate">{user.name}</span>
                      <span className="text-muted-foreground truncate text-xs sm:hidden">
                        {user.email}
                      </span>
                    </div>
                  </td>
                  <td className="text-muted-foreground hidden px-4 py-3.5 text-sm sm:table-cell sm:px-6 sm:py-4">
                    <span className="truncate">{user.email}</span>
                  </td>
                  <td className="px-4 py-3.5 sm:px-6 sm:py-4">
                    <Badge
                      variant={user.role === 'admin' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {user.role.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground hidden px-4 py-3.5 text-sm sm:px-6 sm:py-4 md:table-cell">
                    {user.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Check Types by Category */}
      <Card className="p-4 sm:p-5 lg:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-center sm:justify-between lg:mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-foreground truncate text-lg font-semibold sm:text-xl">
              Check Types Configuration
            </h2>
            <p className="text-muted-foreground mt-1 truncate text-xs leading-relaxed sm:text-sm">
              Certification types by category
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs sm:text-sm">
            {checkTypes.length} types
          </Badge>
        </div>

        {/* Category Stats */}
        <div className="mb-6 grid gap-3 sm:mb-7 sm:grid-cols-2 sm:gap-4 lg:mb-8 lg:grid-cols-4 lg:gap-5">
          {categories.map((category) => {
            const count = checkTypes.filter((ct) => ct.category === category).length
            return (
              <Card
                key={category}
                className="group bg-muted/40 hover:bg-muted/60 @container p-4 transition-all hover:shadow-md sm:p-5 lg:p-6"
              >
                <p className="text-muted-foreground truncate text-xs font-semibold tracking-wide uppercase sm:text-sm">
                  {category}
                </p>
                <p className="text-foreground mt-2 truncate text-2xl leading-none font-bold sm:mt-3 sm:text-3xl lg:text-4xl">
                  {count}
                </p>
              </Card>
            )
          })}
        </div>

        {/* Check Types Table - Showing first 10 for better readability */}
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted/30 sticky top-0 z-10">
              <tr className="border-b text-left">
                <th className="text-muted-foreground px-4 py-3 text-xs font-semibold tracking-wider uppercase sm:px-6 sm:text-sm">
                  Code
                </th>
                <th className="text-muted-foreground px-4 py-3 text-xs font-semibold tracking-wider uppercase sm:px-6 sm:text-sm">
                  Description
                </th>
                <th className="text-muted-foreground hidden px-4 py-3 text-xs font-semibold tracking-wider uppercase sm:px-6 sm:text-sm md:table-cell">
                  Category
                </th>
                <th className="text-muted-foreground hidden px-4 py-3 text-xs font-semibold tracking-wider uppercase sm:px-6 sm:text-sm lg:table-cell">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y">
              {checkTypes.slice(0, 10).map((checkType) => (
                <tr
                  key={checkType.id}
                  className="group hover:bg-muted/50 active:bg-muted transition-colors"
                >
                  <td className="px-4 py-3.5 text-sm font-medium sm:px-6 sm:py-4">
                    <span className="text-foreground truncate font-mono">
                      {checkType.check_code}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm sm:px-6 sm:py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-foreground truncate">
                        {checkType.check_description}
                      </span>
                      <span className="text-muted-foreground truncate text-xs md:hidden">
                        {checkType.category || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="text-muted-foreground hidden px-4 py-3.5 text-sm sm:px-6 sm:py-4 md:table-cell">
                    <span className="truncate">{checkType.category || 'N/A'}</span>
                  </td>
                  <td className="text-muted-foreground hidden px-4 py-3.5 text-sm sm:px-6 sm:py-4 lg:table-cell">
                    {format(new Date(checkType.updated_at), 'MMM dd, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {checkTypes.length > 10 && (
          <div className="mt-4 text-center sm:mt-5">
            <Link href="/dashboard/admin/check-types">
              <Button variant="outline" size="sm" className="gap-2">
                View All {checkTypes.length} Check Types
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Contract Types */}
      <Card className="p-4 sm:p-5 lg:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-center sm:justify-between lg:mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-foreground truncate text-lg font-semibold sm:text-xl">
              Contract Types
            </h2>
            <p className="text-muted-foreground mt-1 truncate text-xs leading-relaxed sm:text-sm">
              Employment contract types
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs sm:text-sm">
            {contractTypes.length} types
          </Badge>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted/30 sticky top-0 z-10">
              <tr className="border-b text-left">
                <th className="text-muted-foreground px-4 py-3 text-xs font-semibold tracking-wider uppercase sm:px-6 sm:text-sm">
                  Name
                </th>
                <th className="text-muted-foreground hidden px-4 py-3 text-xs font-semibold tracking-wider uppercase sm:table-cell sm:px-6 sm:text-sm">
                  Description
                </th>
                <th className="text-muted-foreground px-4 py-3 text-xs font-semibold tracking-wider uppercase sm:px-6 sm:text-sm">
                  Status
                </th>
                <th className="text-muted-foreground hidden px-4 py-3 text-xs font-semibold tracking-wider uppercase sm:px-6 sm:text-sm md:table-cell">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y">
              {contractTypes.map((contract) => (
                <tr
                  key={contract.id}
                  className="group hover:bg-muted/50 active:bg-muted transition-colors"
                >
                  <td className="px-4 py-3.5 text-sm font-medium sm:px-6 sm:py-4">
                    <span className="text-foreground truncate">{contract.name}</span>
                  </td>
                  <td className="text-muted-foreground hidden px-4 py-3.5 text-sm sm:table-cell sm:px-6 sm:py-4">
                    <span className="truncate">{contract.description || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-3.5 sm:px-6 sm:py-4">
                    <Badge
                      variant={contract.is_active ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {contract.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground hidden px-4 py-3.5 text-sm sm:px-6 sm:py-4 md:table-cell">
                    {format(new Date(contract.created_at), 'MMM dd, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
