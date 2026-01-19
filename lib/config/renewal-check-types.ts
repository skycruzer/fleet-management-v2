/**
 * Check Type Configuration for Renewal Planning
 * Maurice Rondeau - January 2026
 *
 * Maps check_codes to their display names and default selection state
 */

export interface CheckTypeConfig {
  checkCode: string // Exact check_code from database
  label: string // Display name
  parentCategory: string // Parent category
  includedByDefault: boolean // Default selection state
}

export const CHECK_TYPE_CONFIG: CheckTypeConfig[] = [
  // Simulator Checks (included by default)
  {
    checkCode: 'B767_COMP',
    label: 'B767 - COMP',
    parentCategory: 'Simulator Checks',
    includedByDefault: true,
  },
  {
    checkCode: 'B767_IRR',
    label: 'B767 - IRR',
    parentCategory: 'Simulator Checks',
    includedByDefault: true,
  },
  // Flight Checks (excluded by default)
  {
    checkCode: 'B767_RTC',
    label: 'B767 - RTC',
    parentCategory: 'Flight Checks',
    includedByDefault: false,
  },
  {
    checkCode: 'INSTR_AUTH',
    label: 'Instrument of Authorisation',
    parentCategory: 'Flight Checks',
    includedByDefault: false,
  },
  {
    checkCode: 'RHS_RTC',
    label: 'Right Hand Seat - RTC',
    parentCategory: 'Flight Checks',
    includedByDefault: false,
  },
]

export const CATEGORIES_WITH_CHECK_TYPES = ['Simulator Checks', 'Flight Checks']

export function getCheckTypesForCategory(category: string): CheckTypeConfig[] {
  return CHECK_TYPE_CONFIG.filter((c) => c.parentCategory === category)
}

export function getDefaultSelectedCheckCodes(): string[] {
  return CHECK_TYPE_CONFIG.filter((c) => c.includedByDefault).map((c) => c.checkCode)
}

/**
 * Get all check codes for a given category
 */
export function getAllCheckCodesForCategory(category: string): string[] {
  return CHECK_TYPE_CONFIG.filter((c) => c.parentCategory === category).map((c) => c.checkCode)
}
