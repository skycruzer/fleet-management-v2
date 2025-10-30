/**
 * Team Status Widget
 *
 * Displays current team availability and status on dashboard
 * Shows pilots on leave, available pilots, and upcoming returns
 *
 * @created 2025-10-29
 * @priority Priority 2
 */

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Calendar, CheckCircle, Clock } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  rank: 'Captain' | 'First Officer'
  status: 'available' | 'on_leave' | 'returning_soon'
  leaveType?: string
  returnDate?: Date
}

interface TeamStatusWidgetProps {
  teamMembers: TeamMember[]
  currentPilotRank: 'Captain' | 'First Officer'
}

const statusConfig = {
  available: {
    label: 'Available',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
  },
  on_leave: {
    label: 'On Leave',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Calendar,
  },
  returning_soon: {
    label: 'Returning Soon',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock,
  },
}

export function TeamStatusWidget({
  teamMembers,
  currentPilotRank
}: TeamStatusWidgetProps) {
  // Filter by same rank
  const sameRankMembers = teamMembers.filter(m => m.rank === currentPilotRank)

  // Calculate stats
  const availableCount = sameRankMembers.filter(m => m.status === 'available').length
  const onLeaveCount = sameRankMembers.filter(m => m.status === 'on_leave').length
  const returningSoonCount = sameRankMembers.filter(m => m.status === 'returning_soon').length

  // Get members on leave or returning soon (max 5)
  const displayMembers = sameRankMembers
    .filter(m => m.status !== 'available')
    .slice(0, 5)

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-cyan-600" />
        <h3 className="text-lg font-semibold text-foreground">Team Status</h3>
        <Badge variant="outline" className="ml-auto">
          {currentPilotRank}s
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
            <CheckCircle className="h-4 w-4" />
            <p className="text-2xl font-bold">{availableCount}</p>
          </div>
          <p className="text-xs text-green-700 font-medium">Available</p>
        </div>

        <div className="text-center p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
            <Calendar className="h-4 w-4" />
            <p className="text-2xl font-bold">{onLeaveCount}</p>
          </div>
          <p className="text-xs text-yellow-700 font-medium">On Leave</p>
        </div>

        <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
            <Clock className="h-4 w-4" />
            <p className="text-2xl font-bold">{returningSoonCount}</p>
          </div>
          <p className="text-xs text-blue-700 font-medium">Returning</p>
        </div>
      </div>

      {/* Team Members List */}
      {displayMembers.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Current Status
          </p>
          {displayMembers.map((member) => {
            const config = statusConfig[member.status]
            const StatusIcon = config.icon

            return (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {member.name}
                  </p>
                  {member.leaveType && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {member.leaveType}
                    </p>
                  )}
                </div>

                <Badge
                  variant="outline"
                  className={`flex items-center gap-1 ${config.color} flex-shrink-0`}
                >
                  <StatusIcon className="h-3 w-3" />
                  <span className="text-xs">{config.label}</span>
                </Badge>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">
            All {currentPilotRank.toLowerCase()}s are currently available
          </p>
        </div>
      )}

      {/* Total Team Size */}
      <div className="mt-6 pt-4 border-t">
        <p className="text-xs text-center text-muted-foreground">
          Total {currentPilotRank}s: {sameRankMembers.length}
        </p>
      </div>
    </Card>
  )
}
