import { describe, expect, it } from 'vitest'
import { escapeLikePattern } from '@/lib/utils/postgrest-pattern'

describe('escapeLikePattern', () => {
  it('escapes every PostgreSQL LIKE metacharacter', () => {
    expect(escapeLikePattern(String.raw`admin_%\@example.com`)).toBe(
      String.raw`admin\_\%\\@example.com`
    )
  })
})
