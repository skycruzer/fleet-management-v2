/**
 * Unit tests for the FAA Red/Yellow/Green certification status helper.
 *
 * Coverage focus: boundary days at -1, 0, 1, 29, 30, 31, 89, 90, 91 with both
 * the 30-day default and the 90-day extended threshold. The boundaries are
 * the most likely site of off-by-one regressions and they drive every
 * certification badge in the UI plus FAA reports.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getCertificationStatus,
  DEFAULT_THRESHOLDS,
  type CertificationColor,
  type CertificationLabel,
} from '@/lib/utils/certification-status'

const FROZEN_NOW = new Date('2026-05-08T12:00:00Z')

function dateOffsetDays(days: number): Date {
  const d = new Date(FROZEN_NOW)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

function expectStatus(
  result: ReturnType<typeof getCertificationStatus>,
  color: CertificationColor,
  label: CertificationLabel,
  daysUntilExpiry?: number
) {
  expect(result.color).toBe(color)
  expect(result.label).toBe(label)
  if (daysUntilExpiry !== undefined) {
    expect(result.daysUntilExpiry).toBe(daysUntilExpiry)
  }
}

describe('getCertificationStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FROZEN_NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('null/invalid inputs', () => {
    it('returns gray "No Date" for null', () => {
      expectStatus(getCertificationStatus(null), 'gray', 'No Date')
    })
    it('returns gray "No Date" for undefined', () => {
      expectStatus(getCertificationStatus(undefined), 'gray', 'No Date')
    })
    it('returns gray "No Date" for an invalid date string', () => {
      expectStatus(getCertificationStatus('not-a-date'), 'gray', 'No Date')
    })
    it('returns gray "No Date" for empty string', () => {
      expectStatus(getCertificationStatus(''), 'gray', 'No Date')
    })
  })

  describe('30-day threshold (default) — boundary days', () => {
    it('days = -1 → red "Expired"', () => {
      expectStatus(getCertificationStatus(dateOffsetDays(-1)), 'red', 'Expired', -1)
    })
    it('days = 0 → yellow "Expiring Soon" (today still counts as expiring, not expired)', () => {
      expectStatus(getCertificationStatus(dateOffsetDays(0)), 'yellow', 'Expiring Soon', 0)
    })
    it('days = 1 → yellow "Expiring Soon"', () => {
      expectStatus(getCertificationStatus(dateOffsetDays(1)), 'yellow', 'Expiring Soon', 1)
    })
    it('days = 29 → yellow "Expiring Soon"', () => {
      expectStatus(getCertificationStatus(dateOffsetDays(29)), 'yellow', 'Expiring Soon', 29)
    })
    it('days = 30 → yellow "Expiring Soon" (inclusive of threshold)', () => {
      expectStatus(getCertificationStatus(dateOffsetDays(30)), 'yellow', 'Expiring Soon', 30)
    })
    it('days = 31 → green "Current"', () => {
      expectStatus(getCertificationStatus(dateOffsetDays(31)), 'green', 'Current', 31)
    })
  })

  describe('extended 90-day threshold (overview page)', () => {
    const T = DEFAULT_THRESHOLDS.EXTENDED_WARNING_DAYS

    it('days = 89 → yellow', () => {
      expectStatus(getCertificationStatus(dateOffsetDays(89), T), 'yellow', 'Expiring Soon', 89)
    })
    it('days = 90 → yellow (inclusive)', () => {
      expectStatus(getCertificationStatus(dateOffsetDays(90), T), 'yellow', 'Expiring Soon', 90)
    })
    it('days = 91 → green', () => {
      expectStatus(getCertificationStatus(dateOffsetDays(91), T), 'green', 'Current', 91)
    })
    it('days = -1 still red regardless of threshold', () => {
      expectStatus(getCertificationStatus(dateOffsetDays(-1), T), 'red', 'Expired', -1)
    })
  })

  describe('input shape variants', () => {
    it('accepts a Date object', () => {
      expectStatus(getCertificationStatus(dateOffsetDays(45)), 'green', 'Current', 45)
    })
    it('accepts an ISO string', () => {
      const iso = dateOffsetDays(45).toISOString()
      expectStatus(getCertificationStatus(iso), 'green', 'Current', 45)
    })
    it('accepts a YYYY-MM-DD date string', () => {
      const ymd = dateOffsetDays(60).toISOString().split('T')[0]
      const result = getCertificationStatus(ymd)
      // Note: YYYY-MM-DD is parsed as UTC midnight; with our fake clock at noon
      // UTC, the day delta is still 60 — color must be green at default threshold.
      expect(result.color).toBe('green')
    })
  })

  describe('default threshold constant matches the 30-day FAA standard', () => {
    it('exposes WARNING_DAYS = 30', () => {
      expect(DEFAULT_THRESHOLDS.WARNING_DAYS).toBe(30)
    })
    it('exposes EXTENDED_WARNING_DAYS = 90', () => {
      expect(DEFAULT_THRESHOLDS.EXTENDED_WARNING_DAYS).toBe(90)
    })
  })
})
