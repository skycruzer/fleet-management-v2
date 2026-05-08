export interface RosterPeriodLeaveRow {
  roster_period: string | null
  workflow_status: string | null
  request_type: string | null
}

export interface RosterPeriodCertificationRow {
  planned_roster_period: string | null
}

export interface RosterPeriodStats {
  leaveRequests: {
    pending: number
    approved: number
    total: number
    byType: Record<string, number>
  }
  certChecks: number
}

function emptyStats(): RosterPeriodStats {
  return {
    leaveRequests: {
      pending: 0,
      approved: 0,
      total: 0,
      byType: {},
    },
    certChecks: 0,
  }
}

export function buildRosterPeriodStats(
  rosterPeriods: string[],
  leaveRows: RosterPeriodLeaveRow[],
  certificationRows: RosterPeriodCertificationRow[]
): Record<string, RosterPeriodStats> {
  const stats = Object.fromEntries(rosterPeriods.map((period) => [period, emptyStats()]))

  for (const row of leaveRows) {
    if (!row.roster_period || !stats[row.roster_period]) continue

    const periodStats = stats[row.roster_period]
    periodStats.leaveRequests.total += 1

    if (row.workflow_status === 'SUBMITTED') {
      periodStats.leaveRequests.pending += 1
    }

    if (row.workflow_status === 'APPROVED') {
      periodStats.leaveRequests.approved += 1
    }

    const requestType = row.request_type || 'UNKNOWN'
    periodStats.leaveRequests.byType[requestType] =
      (periodStats.leaveRequests.byType[requestType] || 0) + 1
  }

  for (const row of certificationRows) {
    if (!row.planned_roster_period || !stats[row.planned_roster_period]) continue
    stats[row.planned_roster_period].certChecks += 1
  }

  return stats
}

export function emptyRosterPeriodStats(): RosterPeriodStats {
  return emptyStats()
}
