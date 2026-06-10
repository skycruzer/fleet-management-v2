// Maurice Rondeau — Published Roster PDF API
// GET: Streams the PDF file directly (avoids CORS issues with signed URLs)
// @updated 2026-06-10 - Migrated to createAdminRoute factory

import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { authRateLimit } from '@/lib/rate-limit'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { logError } from '@/lib/utils/logger'

const STORAGE_BUCKET = 'published-rosters'

export const GET = createAdminRoute(
  {
    operation: 'getPublishedRosterPdf',
    endpoint: '/api/published-rosters/[id]/pdf',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ params }) => {
    try {
      const { id } = params
      const supabase = createServiceRoleClient()

      // Get file path from roster record
      const { data: roster, error: rosterError } = await supabase
        .from('published_rosters')
        .select('file_path, file_name')
        .eq('id', id)
        .single()

      if (rosterError || !roster?.file_path) {
        return NextResponse.json({ success: false, error: 'Roster not found' }, { status: 404 })
      }

      // Download the file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(roster.file_path)

      if (downloadError || !fileData) {
        return NextResponse.json({ success: false, error: 'PDF file not found' }, { status: 404 })
      }

      // Stream the PDF directly
      const buffer = await fileData.arrayBuffer()
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${roster.file_name || 'roster.pdf'}"`,
          'Cache-Control': 'private, max-age=3600',
        },
      })
    } catch (error) {
      logError('Published roster PDF GET error', error, {
        route: '/api/published-rosters/[id]/pdf',
      })
      return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
    }
  }
)
