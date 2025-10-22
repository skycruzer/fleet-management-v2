/**
 * Certifications Page
 * Track and manage pilot certifications grouped by category
 */

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getCertificationsGroupedByCategory } from '@/lib/services/certification-service'
import { CertificationsViewToggle } from '@/components/certifications/certifications-view-toggle'
import { BarChart3, AlertCircle, Circle, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CertificationsPage() {
  // Fetch certifications grouped by category on the server
  const groupedCertifications = await getCertificationsGroupedByCategory()

  // Get all certifications as flat array
  const allCertifications = Object.values(groupedCertifications).flat()

  // Calculate overall stats
  const overallStats = allCertifications.reduce(
    (acc, cert) => {
      acc.total++
      if (!cert.status) return acc
      if (cert.status.color === 'red') acc.expired++
      else if (cert.status.color === 'yellow') acc.expiring++
      else if (cert.status.color === 'green') acc.current++
      return acc
    },
    { total: 0, expired: 0, expiring: 0, current: 0 }
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Certifications</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Track and manage pilot certifications with sortable table or grouped by category
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link href="/dashboard/certifications/new" className="w-full sm:w-auto">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Add Certification
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="border-primary/20 bg-primary/5 p-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-primary" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{overallStats.total}</p>
              <p className="text-muted-foreground text-sm font-medium">Total Certifications</p>
            </div>
          </div>
        </Card>
        <Card className="border-destructive/20 bg-red-50 p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-8 w-8 text-red-600" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{overallStats.expired}</p>
              <p className="text-muted-foreground text-sm font-medium">Expired</p>
            </div>
          </div>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-8 w-8 text-yellow-600" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{overallStats.expiring}</p>
              <p className="text-muted-foreground text-sm font-medium">Expiring Soon</p>
            </div>
          </div>
        </Card>
        <Card className="border-green-200 bg-green-50 p-6">
          <div className="flex items-center space-x-3">
            <Circle className="h-8 w-8 fill-green-600 text-green-600" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{overallStats.current}</p>
              <p className="text-muted-foreground text-sm font-medium">Current</p>
            </div>
          </div>
        </Card>
      </div>

      {/* View Toggle and Content (Client Component) */}
      <CertificationsViewToggle
        groupedCertifications={groupedCertifications}
        allCertifications={allCertifications}
      />
    </div>
  )
}
