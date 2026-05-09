import { describe, expect, it } from 'vitest'
import { shouldFetchNotifications } from '@/lib/utils/notification-polling'

describe('shouldFetchNotifications', () => {
  it('allows notification fetches for visible tabs', () => {
    expect(shouldFetchNotifications('visible')).toBe(true)
  })

  it('skips notification fetches for hidden tabs unless forced', () => {
    expect(shouldFetchNotifications('hidden')).toBe(false)
    expect(shouldFetchNotifications('hidden', { force: true })).toBe(true)
  })
})
