import { z } from 'zod'

/**
 * Body schema for the account data export endpoint (/api/settings/export-data).
 * Each flag toggles a category of the requesting admin's own data.
 */
export const ExportDataSchema = z.object({
  includeProfile: z.boolean(),
  includeCertifications: z.boolean(),
  includeLeaveRequests: z.boolean(),
  includeActivityLog: z.boolean(),
})

export type ExportDataInput = z.infer<typeof ExportDataSchema>
