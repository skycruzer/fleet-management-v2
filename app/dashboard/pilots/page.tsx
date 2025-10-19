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
  const captains = pilots?.filter((p) => p.role === 'Captain').length || 0
  const firstOfficers = pilots?.filter((p) => p.role === 'First Officer').length || 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Pilots</h2>
          <p className="text-muted-foreground mt-1">Manage pilot profiles and qualifications</p>
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
              <p className="text-card-foreground text-2xl font-bold">{totalPilots}</p>
              <p className="text-muted-foreground text-sm font-medium">Total Pilots</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">⭐</span>
            <div>
              <p className="text-card-foreground text-2xl font-bold">{captains}</p>
              <p className="text-muted-foreground text-sm font-medium">Captains</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">👤</span>
            <div>
              <p className="text-card-foreground text-2xl font-bold">{firstOfficers}</p>
              <p className="text-muted-foreground text-sm font-medium">First Officers</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pilots Table */}
      <Card className="p-6">
        <h3 className="text-card-foreground mb-4 text-lg font-semibold">All Pilots</h3>
        <div className="overflow-x-auto">
          <table className="divide-border min-w-full divide-y">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Seniority
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Employee ID
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Name
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Role
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Status
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {pilots?.map((pilot) => (
                <tr key={pilot.id} className="hover:bg-muted/30">
                  <td className="text-card-foreground px-4 py-4 text-sm font-medium whitespace-nowrap">
                    #{pilot.seniority_number}
                  </td>
                  <td className="text-card-foreground px-4 py-4 text-sm whitespace-nowrap">
                    {pilot.employee_id}
                  </td>
                  <td className="text-card-foreground px-4 py-4 text-sm whitespace-nowrap">
                    {pilot.first_name} {pilot.last_name}
                  </td>
                  <td className="text-card-foreground px-4 py-4 text-sm whitespace-nowrap">
                    {pilot.role}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        pilot.is_active
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {pilot.is_active ? 'Active' : 'Inactive'}
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
        <div className="text-muted-foreground mt-4 text-sm">Showing {totalPilots} pilots</div>
      </Card>
    </div>
  )
}
