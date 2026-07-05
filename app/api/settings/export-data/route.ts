/**
 * Account Data Export
 *
 * Assembles a copy of the requesting admin's own data server-side. Previously the
 * settings dialog queried an_users / pilots / audit_logs directly from the browser
 * with the anon key; those tables are no longer anon-readable (they hold password
 * hashes and audit history), so the export is built here with the service role and
 * scoped to the authenticated requester.
 */

import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { createAdminClient } from '@/lib/supabase/admin'
import { ExportDataSchema, type ExportDataInput } from '@/lib/validations/export-data-schema'

export const POST = createAdminRoute<ExportDataInput>(
  {
    operation: 'exportAccountData',
    endpoint: '/api/settings/export-data',
    schema: ExportDataSchema,
  },
  async ({ body, admin }) => {
    const supabase = createAdminClient()

    const exportData: Record<string, unknown> = {
      export_date: new Date().toISOString(),
      user_id: admin.userId,
    }

    if (body.includeProfile) {
      const { data: profile } = await supabase
        .from('an_users')
        .select('id, email, name, role, created_at, updated_at')
        .eq('id', admin.userId)
        .single()
      exportData.profile = profile
    }

    // Pilot-scoped data is matched by the admin's email against the pilots roster.
    if ((body.includeCertifications || body.includeLeaveRequests) && admin.email) {
      const { data: pilot } = await supabase
        .from('pilots')
        .select('*')
        .eq('email', admin.email)
        .single()

      if (pilot) {
        exportData.pilot_profile = pilot

        if (body.includeCertifications) {
          const { data: certifications } = await supabase
            .from('pilot_checks')
            .select('*, check_types(*)')
            .eq('pilot_id', pilot.id)
          exportData.certifications = certifications
        }

        if (body.includeLeaveRequests) {
          const { data: leaveRequests } = await supabase
            .from('pilot_requests')
            .select('*')
            .eq('pilot_id', pilot.id)
            .eq('request_category', 'LEAVE')
          exportData.leave_requests = leaveRequests
        }
      }
    }

    if (body.includeActivityLog) {
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', admin.userId)
        .order('created_at', { ascending: false })
        .limit(100)
      exportData.activity_log = auditLogs
    }

    return NextResponse.json(exportData)
  }
)
