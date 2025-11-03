/**
 * All Certifications Export Report API
 * Author: Maurice Rondeau
 * Date: November 3, 2025
 *
 * Export complete certification database in CSV or Excel format
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCSV, csvToBlob, generateExcel, generateFilename, getMimeType } from '@/lib/utils/report-generators'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { format = 'csv', parameters = {} } = body

    // Get all certifications with pilot and check type details
    const { data: certifications, error } = await supabase
      .from('pilot_checks')
      .select(`
        *,
        pilots!inner (
          employee_id,
          first_name,
          last_name,
          role
        ),
        check_types (
          check_name,
          check_category
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    if (!certifications || certifications.length === 0) {
      return NextResponse.json({ error: 'No certification data available' }, { status: 404 })
    }

    // Apply date range filter if provided
    let filteredCerts = certifications
    if (parameters.dateRange?.start && parameters.dateRange?.end) {
      filteredCerts = certifications.filter((cert) => {
        const compDate = new Date(cert.created_at)
        const start = new Date(parameters.dateRange.start)
        const end = new Date(parameters.dateRange.end)
        return compDate >= start && compDate <= end
      })
    }

    // Prepare data for export
    const exportData = filteredCerts.map((cert) => ({
      'Employee Number': cert.pilots?.employee_id || 'N/A',
      'Pilot Name': cert.pilots ? `${cert.pilots.first_name} ${cert.pilots.last_name}` : 'N/A',
      'Rank': cert.pilots?.role || 'N/A',
      'Check Type': cert.check_types?.check_name || 'N/A',
      'Check Category': cert.check_types?.check_category || 'N/A',
      'Created Date': cert.created_at,
      'Expiry Date': cert.expiry_date,
      'Updated Date': cert.updated_at,
    }))

    // Generate file based on format
    let fileBlob: Blob
    let filename: string

    switch (format.toLowerCase()) {
      case 'csv':
        const csv = generateCSV(exportData)
        fileBlob = csvToBlob(csv)
        filename = generateFilename('all-certifications', 'csv')
        break

      case 'excel':
        fileBlob = generateExcel(exportData, { sheetName: 'All Certifications' })
        filename = generateFilename('all-certifications', 'xlsx')
        break

      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
    }

    // Return file
    return new NextResponse(fileBlob, {
      status: 200,
      headers: {
        'Content-Type': getMimeType(format),
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('All certifications report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
