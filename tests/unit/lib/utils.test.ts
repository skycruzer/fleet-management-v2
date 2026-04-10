/**
 * Unit tests for shared utilities
 */

import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn (class name merger)', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'ignored', 'added')).toBe('base added')
  })

  it('handles undefined and null gracefully', () => {
    expect(cn(undefined, null, 'valid')).toBe('valid')
  })
})
