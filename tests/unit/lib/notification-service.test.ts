import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAdminClientMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('@/lib/services/logging-service', () => ({
  logger: { error: vi.fn() },
}))

function query(result: unknown) {
  const builder: Record<string, any> = {}
  builder.select = vi.fn(() => builder)
  builder.eq = vi.fn(() => builder)
  builder.insert = vi.fn(() => builder)
  builder.single = vi.fn().mockResolvedValue(result)
  builder.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject)
  return builder
}

describe('createPilotNotificationForPilotId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves the portal account before inserting a pilot notification', async () => {
    const mapping = query({ data: { pilot_user_id: 'portal-user-id' }, error: null })
    const insert = query({
      data: {
        id: 'notification-id',
        recipient_id: 'portal-user-id',
        title: 'Leave Bid Approved',
        message: 'Your leave bid was approved.',
        type: 'leave_bid_approved',
        read: false,
        created_at: null,
      },
      error: null,
    })
    const from = vi.fn().mockReturnValueOnce(mapping).mockReturnValueOnce(insert)
    createAdminClientMock.mockReturnValue({ from })

    const { createPilotNotificationForPilotId } =
      await import('@/lib/services/notification-service')
    const result = await createPilotNotificationForPilotId({
      pilotId: 'fleet-pilot-id',
      title: 'Leave Bid Approved',
      message: 'Your leave bid was approved.',
      type: 'leave_bid_approved',
    })

    expect(mapping.eq).toHaveBeenCalledWith('pilot_id', 'fleet-pilot-id')
    expect(insert.insert).toHaveBeenCalledWith(
      expect.objectContaining({ recipient_id: 'portal-user-id' })
    )
    expect(result.success).toBe(true)
  })
})
