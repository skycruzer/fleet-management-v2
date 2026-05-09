/**
 * Unit tests for the rank-separated crew availability check.
 *
 * The core operational rule: Captains and First Officers are evaluated
 * INDEPENDENTLY. A Captain's leave should not be denied because there
 * aren't enough First Officers available, and vice versa.
 *
 * These tests mock the Supabase RPC and exercise the rank-routing
 * logic in checkCrewAvailabilityAtomic so it can never silently revert
 * to the older "AND" behavior — that's the operational regression that
 * grounds aircraft.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpcMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: rpcMock,
  }),
}))

interface AtomicResult {
  total_pilots: number
  on_leave_count: number
  available: number
  minimum_required: number
  remaining_after_approval: number
  can_approve: boolean
  reason: string
}

function res(canApprove: boolean, available: number, minimum = 10): AtomicResult {
  return {
    total_pilots: 27,
    on_leave_count: 27 - available,
    available,
    minimum_required: minimum,
    remaining_after_approval: available - 1,
    can_approve: canApprove,
    reason: canApprove ? 'OK' : `Below minimum (${available}/${minimum})`,
  }
}

function setupRpcResponses(captainResult: AtomicResult, foResult: AtomicResult) {
  rpcMock
    .mockResolvedValueOnce({ data: captainResult, error: null })
    .mockResolvedValueOnce({ data: foResult, error: null })
}

describe('checkCrewAvailabilityAtomic — rank separation', () => {
  beforeEach(() => {
    rpcMock.mockReset()
  })

  it('approves a Captain request when Captains are available, even if FOs are below minimum', async () => {
    setupRpcResponses(res(true, 12), res(false, 8))
    const { checkCrewAvailabilityAtomic } = await import('@/lib/services/leave-eligibility-service')

    const result = await checkCrewAvailabilityAtomic(
      '2026-06-01',
      '2026-06-07',
      undefined,
      'Captain'
    )

    expect(result.canApprove).toBe(true)
    expect(result.captains.canApprove).toBe(true)
    expect(result.firstOfficers.canApprove).toBe(false)
  })

  it('approves a First Officer request when FOs are available, even if Captains are below minimum', async () => {
    setupRpcResponses(res(false, 8), res(true, 12))
    const { checkCrewAvailabilityAtomic } = await import('@/lib/services/leave-eligibility-service')

    const result = await checkCrewAvailabilityAtomic(
      '2026-06-01',
      '2026-06-07',
      undefined,
      'First Officer'
    )

    expect(result.canApprove).toBe(true)
    expect(result.firstOfficers.canApprove).toBe(true)
    expect(result.captains.canApprove).toBe(false)
  })

  it('denies a Captain request when Captains are below minimum (regardless of FO availability)', async () => {
    setupRpcResponses(res(false, 9), res(true, 15))
    const { checkCrewAvailabilityAtomic } = await import('@/lib/services/leave-eligibility-service')

    const result = await checkCrewAvailabilityAtomic(
      '2026-06-01',
      '2026-06-07',
      undefined,
      'Captain'
    )

    expect(result.canApprove).toBe(false)
    expect(result.reason.toLowerCase()).toContain('captain')
  })

  it('denies a FO request when FOs are below minimum (regardless of Captain availability)', async () => {
    setupRpcResponses(res(true, 15), res(false, 9))
    const { checkCrewAvailabilityAtomic } = await import('@/lib/services/leave-eligibility-service')

    const result = await checkCrewAvailabilityAtomic(
      '2026-06-01',
      '2026-06-07',
      undefined,
      'First Officer'
    )

    expect(result.canApprove).toBe(false)
    expect(result.reason.toLowerCase()).toContain('first officer')
  })

  it('approves at the boundary: Captain rank with exactly minimum + 1 available', async () => {
    setupRpcResponses(res(true, 11), res(false, 0))
    const { checkCrewAvailabilityAtomic } = await import('@/lib/services/leave-eligibility-service')
    const result = await checkCrewAvailabilityAtomic(
      '2026-06-01',
      '2026-06-07',
      undefined,
      'Captain'
    )
    expect(result.canApprove).toBe(true)
  })

  it('legacy mode (no pilotRank): denies when EITHER rank fails', async () => {
    setupRpcResponses(res(true, 15), res(false, 8))
    const { checkCrewAvailabilityAtomic } = await import('@/lib/services/leave-eligibility-service')

    const result = await checkCrewAvailabilityAtomic('2026-06-01', '2026-06-07')

    expect(result.canApprove).toBe(false)
    expect(result.reason).toContain('First Officers')
  })

  it('legacy mode (no pilotRank): approves only when BOTH ranks pass', async () => {
    setupRpcResponses(res(true, 15), res(true, 12))
    const { checkCrewAvailabilityAtomic } = await import('@/lib/services/leave-eligibility-service')
    const result = await checkCrewAvailabilityAtomic('2026-06-01', '2026-06-07')
    expect(result.canApprove).toBe(true)
  })

  it('propagates RPC error for Captain check as a thrown exception', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'connection refused' } })
    const { checkCrewAvailabilityAtomic } = await import('@/lib/services/leave-eligibility-service')

    await expect(
      checkCrewAvailabilityAtomic('2026-06-01', '2026-06-07', undefined, 'Captain')
    ).rejects.toThrow(/Captain availability/i)
  })
})
