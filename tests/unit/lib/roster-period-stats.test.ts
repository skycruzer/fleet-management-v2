import { describe, expect, it } from 'vitest'
import { buildRosterPeriodStats } from '@/lib/utils/roster-period-stats'

describe('buildRosterPeriodStats', () => {
  it('aggregates leave and certification counts by roster period', () => {
    const stats = buildRosterPeriodStats(
      ['RP01/2026', 'RP02/2026'],
      [
        { roster_period: 'RP01/2026', workflow_status: 'SUBMITTED', request_type: 'ANNUAL' },
        { roster_period: 'RP01/2026', workflow_status: 'APPROVED', request_type: 'ANNUAL' },
        { roster_period: 'RP02/2026', workflow_status: 'SUBMITTED', request_type: 'RDO' },
        { roster_period: null, workflow_status: 'SUBMITTED', request_type: 'ANNUAL' },
      ],
      [
        { planned_roster_period: 'RP01/2026' },
        { planned_roster_period: 'RP01/2026' },
        { planned_roster_period: 'RP03/2026' },
      ]
    )

    expect(stats['RP01/2026']).toEqual({
      leaveRequests: {
        pending: 1,
        approved: 1,
        total: 2,
        byType: { ANNUAL: 2 },
      },
      certChecks: 2,
    })
    expect(stats['RP02/2026']).toEqual({
      leaveRequests: {
        pending: 1,
        approved: 0,
        total: 1,
        byType: { RDO: 1 },
      },
      certChecks: 0,
    })
  })
})
