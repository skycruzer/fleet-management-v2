import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { listPilotsMock, listPilotCurrencyMock, getSessionUserMock } = vi.hoisted(() => ({
  listPilotsMock: vi.fn(),
  listPilotCurrencyMock: vi.fn(),
  getSessionUserMock: vi.fn(),
}))

vi.mock('@/lib/ebt/roster/queries', () => ({
  listPilots: listPilotsMock,
  listPilotCurrency: listPilotCurrencyMock,
}))

vi.mock('@/lib/ebt/auth/roles', () => ({
  getSessionUser: getSessionUserMock,
  hasRole: vi.fn().mockReturnValue(false),
}))

import PilotsPage from '@/app/dashboard/ebt/pilots/page'

describe('EBT pilots roster empty state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSessionUserMock.mockResolvedValue({ role: 'fleet_manager' })
    listPilotCurrencyMock.mockResolvedValue(new Map())
  })

  it('explains when inactive pilots are hidden and no active rows remain', async () => {
    listPilotsMock.mockResolvedValue([
      {
        id: crypto.randomUUID(),
        staff_no: '1001',
        full_name: 'Inactive Pilot',
        rank: 'Captain',
        aircraft: 'B767',
        employment_status: 'inactive',
      },
    ])

    render(await PilotsPage({ searchParams: Promise.resolve({}) }))

    expect(
      screen.getByText('No active pilots. Show inactive pilots to view the roster.')
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Show inactive (1)' })).toBeInTheDocument()
  })

  it('keeps the original empty-roster message when no pilots exist', async () => {
    listPilotsMock.mockResolvedValue([])

    render(await PilotsPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByText('No pilots yet.')).toBeInTheDocument()
  })
})
