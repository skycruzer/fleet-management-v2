/**
 * Certifications Page
 * Track and manage pilot certifications
 */

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
          <h2 className="text-2xl font-bold text-gray-900">Certifications</h2>
          <p className="mt-1 text-gray-600">
            Track and manage pilot certifications and check types
          </p>
        </div>
        <Link href="/dashboard/certifications/new">
          <Button className="bg-blue-600 text-white hover:bg-blue-700">Add Certification</Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-red-200 bg-red-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🔴</span>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
              <p className="text-sm font-medium text-gray-600">Expired</p>
            </div>
          </div>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🟡</span>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.expiring}</p>
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
            </div>
          </div>
        </Card>
        <Card className="border-green-200 bg-green-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🟢</span>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.current}</p>
              <p className="text-sm font-medium text-gray-600">Current</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Certifications Table */}
      <Card className="bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">All Certifications</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Pilot
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Check Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Completion
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Expiry
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {certifications.map((cert) => (
                <tr key={cert.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                    {cert.pilot?.first_name} {cert.pilot?.last_name}
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-900">
                    {cert.check_type?.check_description}
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-500">
                    {cert.check_type?.category || 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-500">
                    {cert.created_at ? format(new Date(cert.created_at), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-500">
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
        <div className="mt-4 text-sm text-gray-600">
          Showing {certifications.length} of {total} certifications
        </div>
      </Card>
    </div>
  )
}
