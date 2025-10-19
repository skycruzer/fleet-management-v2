/**
 * Pilot Certifications View Page
 * Display all certifications for the current pilot with status indicators
 */

export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentPilotUser, getPilotCertifications } from '@/lib/services/pilot-portal-service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function CertificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect if not authenticated
  if (!user) {
    redirect('/auth/login')
  }

  // Get pilot user data
  const pilotUser = await getCurrentPilotUser()

  // Redirect if not a pilot or not approved
  if (!pilotUser || !pilotUser.registration_approved) {
    redirect('/portal/dashboard')
  }

  // Fetch all certifications
  const certifications = await getPilotCertifications(pilotUser.id)

  // Calculate statistics
  const stats = {
    total: certifications.length,
    current: certifications.filter((c) => c.status.color === 'green').length,
    expiringSoon: certifications.filter((c) => c.status.color === 'yellow').length,
    expired: certifications.filter((c) => c.status.color === 'red').length,
  }

  // Group certifications by category
  const categorized = {
    licenses: certifications.filter((c) => c.check_type.check_description.includes('License')),
    medicals: certifications.filter((c) => c.check_type.check_description.includes('Medical')),
    recurrent: certifications.filter(
      (c) =>
        c.check_type.check_description.includes('OPC') ||
        c.check_type.check_description.includes('Line Check')
    ),
    other: certifications.filter(
      (c) =>
        !c.check_type.check_description.includes('License') &&
        !c.check_type.check_description.includes('Medical') &&
        !c.check_type.check_description.includes('OPC') &&
        !c.check_type.check_description.includes('Line Check')
    ),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-2xl font-bold">My Certifications</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {pilotUser.rank} {pilotUser.first_name} {pilotUser.last_name} • Seniority #
                {pilotUser.seniority}
              </p>
            </div>
            <Link href="/portal/dashboard">
              <Button variant="outline">← Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card className="bg-white p-6">
            <p className="text-muted-foreground text-sm font-medium">Total Certifications</p>
            <p className="text-foreground mt-2 text-3xl font-bold">{stats.total}</p>
          </Card>
          <Card className="border-green-200 bg-green-50 p-6">
            <p className="text-muted-foreground text-sm font-medium">Current</p>
            <p className="mt-2 text-3xl font-bold text-green-700">{stats.current}</p>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50 p-6">
            <p className="text-muted-foreground text-sm font-medium">Expiring Soon</p>
            <p className="mt-2 text-3xl font-bold text-yellow-700">{stats.expiringSoon}</p>
          </Card>
          <Card className="border-red-200 bg-red-50 p-6">
            <p className="text-muted-foreground text-sm font-medium">Expired</p>
            <p className="mt-2 text-3xl font-bold text-red-700">{stats.expired}</p>
          </Card>
        </div>

        {/* Critical Alerts */}
        {stats.expired > 0 && (
          <Card className="mb-6 border-red-300 bg-red-50 p-6">
            <div className="flex items-start space-x-4">
              <span className="text-3xl">⚠️</span>
              <div className="flex-1">
                <h3 className="mb-2 font-semibold text-red-900">Expired Certifications</h3>
                <p className="mb-4 text-sm text-red-800">
                  You have {stats.expired} expired certification{stats.expired !== 1 ? 's' : ''}.
                  Please contact fleet management immediately.
                </p>
                <a
                  href="mailto:fleet@airniugini.com.pg?subject=Expired Certifications - Urgent"
                  className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  Contact Fleet Management
                </a>
              </div>
            </div>
          </Card>
        )}

        {stats.expiringSoon > 0 && stats.expired === 0 && (
          <Card className="mb-6 border-yellow-300 bg-yellow-50 p-6">
            <div className="flex items-start space-x-4">
              <span className="text-3xl">📅</span>
              <div>
                <h3 className="mb-2 font-semibold text-yellow-900">Expiring Soon</h3>
                <p className="text-sm text-yellow-800">
                  You have {stats.expiringSoon} certification{stats.expiringSoon !== 1 ? 's' : ''}{' '}
                  expiring within 30 days. Plan ahead to ensure timely renewal.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Certifications by Category */}
        <div className="space-y-6">
          {/* Licenses */}
          {categorized.licenses.length > 0 && (
            <Card className="bg-white p-6">
              <h2 className="text-foreground mb-4 flex items-center text-lg font-semibold">
                <span className="mr-2 text-2xl">📜</span>
                Licenses & Ratings ({categorized.licenses.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="divide-border min-w-full divide-y">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                        Check Type
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                        Last Check
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                        Expiry Date
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                        Days Until Expiry
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y bg-white">
                    {categorized.licenses.map((cert) => (
                      <tr key={cert.id} className="hover:bg-muted/50">
                        <td className="text-foreground px-4 py-4 text-sm font-medium">
                          {cert.check_type.check_description}
                        </td>
                        <td className="text-muted-foreground px-4 py-4 text-sm">
                          {format(new Date(cert.created_at), 'MMM dd, yyyy')}
                        </td>
                        <td className="text-foreground px-4 py-4 text-sm">
                          {cert.expiry_date
                            ? format(new Date(cert.expiry_date), 'MMM dd, yyyy')
                            : 'N/A'}
                        </td>
                        <td className="text-muted-foreground px-4 py-4 text-sm">
                          {cert.status.daysUntilExpiry >= 0
                            ? cert.status.daysUntilExpiry
                            : `Expired ${Math.abs(cert.status.daysUntilExpiry)} days ago`}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              cert.status.color === 'green'
                                ? 'bg-green-100 text-green-800'
                                : cert.status.color === 'yellow'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {cert.status.label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Medicals */}
          {categorized.medicals.length > 0 && (
            <Card className="bg-white p-6">
              <h2 className="text-foreground mb-4 flex items-center text-lg font-semibold">
                <span className="mr-2 text-2xl">🏥</span>
                Medical Certifications ({categorized.medicals.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="divide-border min-w-full divide-y">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                        Check Type
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                        Last Check
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                        Expiry Date
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                        Days Until Expiry
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y bg-white">
                    {categorized.medicals.map((cert) => (
                      <tr key={cert.id} className="hover:bg-muted/50">
                        <td className="text-foreground px-4 py-4 text-sm font-medium">
                          {cert.check_type.check_description}
                        </td>
                        <td className="text-muted-foreground px-4 py-4 text-sm">
                          {format(new Date(cert.created_at), 'MMM dd, yyyy')}
                        </td>
                        <td className="text-foreground px-4 py-4 text-sm">
                          {cert.expiry_date
                            ? format(new Date(cert.expiry_date), 'MMM dd, yyyy')
                            : 'N/A'}
                        </td>
                        <td className="text-muted-foreground px-4 py-4 text-sm">
                          {cert.status.daysUntilExpiry >= 0
                            ? cert.status.daysUntilExpiry
                            : `Expired ${Math.abs(cert.status.daysUntilExpiry)} days ago`}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              cert.status.color === 'green'
                                ? 'bg-green-100 text-green-800'
                                : cert.status.color === 'yellow'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {cert.status.label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Recurrent Training */}
          {categorized.recurrent.length > 0 && (
            <Card className="bg-white p-6">
              <h2 className="text-foreground mb-4 flex items-center text-lg font-semibold">
                <span className="mr-2 text-2xl">✈️</span>
                Recurrent Training & Checks ({categorized.recurrent.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="divide-border min-w-full divide-y">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                        Check Type
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                        Last Check
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                        Expiry Date
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                        Days Until Expiry
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y bg-white">
                    {categorized.recurrent.map((cert) => (
                      <tr key={cert.id} className="hover:bg-muted/50">
                        <td className="text-foreground px-4 py-4 text-sm font-medium">
                          {cert.check_type.check_description}
                        </td>
                        <td className="text-muted-foreground px-4 py-4 text-sm">
                          {format(new Date(cert.created_at), 'MMM dd, yyyy')}
                        </td>
                        <td className="text-foreground px-4 py-4 text-sm">
                          {cert.expiry_date
                            ? format(new Date(cert.expiry_date), 'MMM dd, yyyy')
                            : 'N/A'}
                        </td>
                        <td className="text-muted-foreground px-4 py-4 text-sm">
                          {cert.status.daysUntilExpiry >= 0
                            ? cert.status.daysUntilExpiry
                            : `Expired ${Math.abs(cert.status.daysUntilExpiry)} days ago`}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              cert.status.color === 'green'
                                ? 'bg-green-100 text-green-800'
                                : cert.status.color === 'yellow'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {cert.status.label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Other Certifications */}
          {categorized.other.length > 0 && (
            <Card className="bg-white p-6">
              <h2 className="text-foreground mb-4 flex items-center text-lg font-semibold">
                <span className="mr-2 text-2xl">📋</span>
                Other Certifications ({categorized.other.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="divide-border min-w-full divide-y">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                        Check Type
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                        Last Check
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                        Expiry Date
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                        Days Until Expiry
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y bg-white">
                    {categorized.other.map((cert) => (
                      <tr key={cert.id} className="hover:bg-muted/50">
                        <td className="text-foreground px-4 py-4 text-sm font-medium">
                          {cert.check_type.check_description}
                        </td>
                        <td className="text-muted-foreground px-4 py-4 text-sm">
                          {format(new Date(cert.created_at), 'MMM dd, yyyy')}
                        </td>
                        <td className="text-foreground px-4 py-4 text-sm">
                          {cert.expiry_date
                            ? format(new Date(cert.expiry_date), 'MMM dd, yyyy')
                            : 'N/A'}
                        </td>
                        <td className="text-muted-foreground px-4 py-4 text-sm">
                          {cert.status.daysUntilExpiry >= 0
                            ? cert.status.daysUntilExpiry
                            : `Expired ${Math.abs(cert.status.daysUntilExpiry)} days ago`}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              cert.status.color === 'green'
                                ? 'bg-green-100 text-green-800'
                                : cert.status.color === 'yellow'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {cert.status.label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Help Section */}
        <Card className="mt-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="flex items-start space-x-4">
            <span className="text-3xl">💡</span>
            <div>
              <h3 className="text-foreground mb-2 font-semibold">Certification Status Guide</h3>
              <div className="text-card-foreground space-y-2 text-sm">
                <p>
                  <span className="mr-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    CURRENT
                  </span>
                  More than 30 days until expiry
                </p>
                <p>
                  <span className="mr-2 inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                    EXPIRING SOON
                  </span>
                  30 days or less until expiry - plan renewal now
                </p>
                <p>
                  <span className="mr-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                    EXPIRED
                  </span>
                  Past expiry date - contact fleet management immediately
                </p>
              </div>
              <p className="text-muted-foreground mt-4 text-sm">
                Questions about certifications?{' '}
                <a href="mailto:fleet@airniugini.com.pg" className="text-blue-600 hover:underline">
                  fleet@airniugini.com.pg
                </a>
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
