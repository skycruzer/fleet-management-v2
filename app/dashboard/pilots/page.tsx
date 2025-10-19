/**
 * Pilots Page
 * List and manage all pilots in the fleet
 */

export const dynamic = 'force-dynamic'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function PilotsPage() {
  const supabase = await createClient()

  // Fetch all pilots
  const { data: pilots, error } = await supabase
    .from('pilots')
    .select('*')
    .order('seniority_number', { ascending: true })

  if (error) {
    console.error('Error fetching pilots:', error)
  }

  const totalPilots = pilots?.length || 0
  const captains = pilots?.filter((p) => p.rank === 'Captain').length || 0
  const firstOfficers = pilots?.filter((p) => p.rank === 'First Officer').length || 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pilots</h2>
          <p className="mt-1 text-gray-600">Manage pilot profiles and qualifications</p>
        </div>
        <Link href="/dashboard/pilots/new">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Add Pilot
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">👨‍✈️</span>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalPilots}</p>
              <p className="text-sm font-medium text-gray-600">Total Pilots</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">⭐</span>
            <div>
              <p className="text-2xl font-bold text-gray-900">{captains}</p>
              <p className="text-sm font-medium text-gray-600">Captains</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">👤</span>
            <div>
              <p className="text-2xl font-bold text-gray-900">{firstOfficers}</p>
              <p className="text-sm font-medium text-gray-600">First Officers</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pilots Table */}
      <Card className="bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">All Pilots</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Seniority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Employee ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Base
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {pilots?.map((pilot) => (
                <tr key={pilot.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                    #{pilot.seniority_number}
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-900">
                    {pilot.employee_id}
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-900">
                    {pilot.first_name} {pilot.last_name}
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-900">
                    {pilot.rank}
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-500">
                    {pilot.base || 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        pilot.employment_status === 'active'
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {pilot.employment_status || 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap">
                    <Link href={`/dashboard/pilots/${pilot.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-gray-600">Showing {totalPilots} pilots</div>
      </Card>
    </div>
  )
}
