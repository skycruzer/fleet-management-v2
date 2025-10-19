/**
 * Certifications Page
 * Track and manage pilot certifications
 */

export const dynamic = 'force-dynamic'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getCertifications } from '@/lib/services/certification-service'
import { format } from 'date-fns'

export default async function CertificationsPage() {
  // Fetch certifications data
  const { certifications, total } = await getCertifications(1, 100) // Get first 100

  // Calculate stats from the data
  const stats = certifications.reduce(
    (acc, cert) => {
      if (!cert.status) return acc
      if (cert.status.color === 'red') acc.expired++
      else if (cert.status.color === 'yellow') acc.expiring++
      else if (cert.status.color === 'green') acc.current++
      return acc
    },
    { expired: 0, expiring: 0, current: 0 }
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Certifications</h2>
          <p className="text-muted-foreground mt-1">
            Track and manage pilot certifications and check types
          </p>
        </div>
        <Link href="/dashboard/certifications/new">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Add Certification
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-red-200 bg-red-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🔴</span>
            <div>
              <p className="text-foreground text-2xl font-bold">{stats.expired}</p>
              <p className="text-muted-foreground text-sm font-medium">Expired</p>
            </div>
          </div>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🟡</span>
            <div>
              <p className="text-foreground text-2xl font-bold">{stats.expiring}</p>
              <p className="text-muted-foreground text-sm font-medium">Expiring Soon</p>
            </div>
          </div>
        </Card>
        <Card className="border-green-200 bg-green-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🟢</span>
            <div>
              <p className="text-foreground text-2xl font-bold">{stats.current}</p>
              <p className="text-muted-foreground text-sm font-medium">Current</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Certifications Table */}
      <Card className="bg-white p-6">
        <h3 className="text-foreground mb-4 text-lg font-semibold">All Certifications</h3>
        <div className="overflow-x-auto">
          <table className="divide-border min-w-full divide-y">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Pilot
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Check Type
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Category
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Completion
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Expiry
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y bg-white">
              {certifications.map((cert) => (
                <tr key={cert.id} className="hover:bg-muted/50">
                  <td className="text-foreground px-4 py-4 text-sm font-medium whitespace-nowrap">
                    {cert.pilot?.first_name} {cert.pilot?.last_name}
                  </td>
                  <td className="text-foreground px-4 py-4 text-sm whitespace-nowrap">
                    {cert.check_type?.check_description}
                  </td>
                  <td className="text-muted-foreground px-4 py-4 text-sm whitespace-nowrap">
                    {cert.check_type?.category || 'N/A'}
                  </td>
                  <td className="text-muted-foreground px-4 py-4 text-sm whitespace-nowrap">
                    {cert.created_at ? format(new Date(cert.created_at), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td className="text-muted-foreground px-4 py-4 text-sm whitespace-nowrap">
                    {cert.expiry_date ? format(new Date(cert.expiry_date), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {cert.status && (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          cert.status.color === 'red'
                            ? 'bg-red-100 text-red-800'
                            : cert.status.color === 'yellow'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {cert.status.label}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-muted-foreground mt-4 text-sm">
          Showing {certifications.length} of {total} certifications
        </div>
      </Card>
    </div>
  )
}
