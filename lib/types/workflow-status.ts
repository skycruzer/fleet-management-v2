import { z } from 'zod'

/**
 * Canonical workflow status alphabet for the unified `pilot_requests` table.
 * Matches the DB CHECK constraint exactly.
 *
 * One source of truth — every Zod schema and TS type that mentions
 * workflow_status SHOULD derive from these.
 */
export const WorkflowStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'IN_REVIEW',
  'APPROVED',
  'DENIED',
  'WITHDRAWN',
])

export type WorkflowStatus = z.infer<typeof WorkflowStatusEnum>

/**
 * Subsets used by specific call-sites (filters, decision endpoints, etc.).
 * Define them here so drift is impossible.
 */
export const ActionableWorkflowStatusEnum = WorkflowStatusEnum.extract([
  'IN_REVIEW',
  'APPROVED',
  'DENIED',
])

export type ActionableWorkflowStatus = z.infer<typeof ActionableWorkflowStatusEnum>

export const VisibleWorkflowStatusEnum = WorkflowStatusEnum.extract([
  'SUBMITTED',
  'IN_REVIEW',
  'APPROVED',
  'DENIED',
])

export type VisibleWorkflowStatus = z.infer<typeof VisibleWorkflowStatusEnum>

/**
 * Branded RosterPeriodCode — values produced by `parseRosterPeriodCode` /
 * `getRosterPeriodCodeFromDate` in `lib/utils/roster-utils.ts`. The brand
 * makes it a TS error to pass arbitrary strings (`"foo"`) into APIs that
 * expect a validated period code, while staying structurally a string for
 * JSON, DB, and display.
 *
 * Construct with `asRosterPeriodCode(code)` only after running it through
 * the validator.
 */
declare const __rosterPeriodCodeBrand: unique symbol
export type RosterPeriodCode = string & { readonly [__rosterPeriodCodeBrand]: true }

/**
 * Validate-and-brand: returns null for malformed inputs.
 */
export function asRosterPeriodCode(value: string): RosterPeriodCode | null {
  // RP01..RP13 / four-digit year (matches roster-utils.formatting)
  if (/^RP(0[1-9]|1[0-3])\/\d{4}$/.test(value)) {
    return value as RosterPeriodCode
  }
  return null
}

/**
 * Internal escape hatch for code paths that already validated the value
 * (e.g., construction from period number + year). Use sparingly.
 */
export function unsafeRosterPeriodCode(value: string): RosterPeriodCode {
  return value as RosterPeriodCode
}

import { z as zod } from 'zod'

/**
 * Zod schema for the branded code — derives the brand automatically.
 */
export const RosterPeriodCodeSchema = zod
  .string()
  .regex(/^RP(0[1-9]|1[0-3])\/\d{4}$/, 'Roster period code must look like "RP01/2025".')
  .transform((v) => v as RosterPeriodCode)
