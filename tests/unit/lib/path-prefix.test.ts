import { describe, expect, it } from 'vitest'
import { matchesPathPrefix } from '@/lib/routing/path-prefix'

describe('matchesPathPrefix', () => {
  it('matches the exact path and child segments', () => {
    expect(matchesPathPrefix('/api/pilot', '/api/pilot')).toBe(true)
    expect(matchesPathPrefix('/api/pilot/logout', '/api/pilot')).toBe(true)
  })

  it('does not match a longer sibling segment', () => {
    expect(matchesPathPrefix('/api/pilots', '/api/pilot')).toBe(false)
    expect(matchesPathPrefix('/api/pilots/123', '/api/pilot')).toBe(false)
  })
})
