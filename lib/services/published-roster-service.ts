/**
 * Published Roster Service
 *
 * Manages uploaded roster PDFs, parsing, and storage.
 * Handles roster CRUD operations and pilot name matching.
 *
 * Developer: Maurice Rondeau
 */

import { createClient } from '@/lib/supabase/server'
import { ServiceResponse } from '@/lib/types/service-response'
import type { Database } from '@/types/supabase'
import type {
  ParsedRosterData,
  PilotAssignment,
} from './roster-parser-service'
import { searchPilots } from './pilot-service'

const STORAGE_BUCKET = 'published-rosters'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export type PublishedRoster = Database['public']['Tables']['published_rosters']['Row']

/**
 * Uploads a roster PDF file, parses it, and stores assignments
 */
export async function uploadPublishedRoster(
  file: File,
  rosterPeriodCode: string,
  uploadedByUserId: string
): Promise<ServiceResponse<PublishedRoster>> {
  try {
    const supabase = await createClient()

    // Validate file
    if (!file.name.endsWith('.pdf')) {
      return ServiceResponse.error('Only PDF files are allowed')
    }

    if (file.size > MAX_FILE_SIZE) {
      return ServiceResponse.error('File size exceeds 10MB limit')
    }

    // Check if period already has a roster
    const existing = await supabase
      .from('published_rosters')
      .select('id')
      .eq('roster_period_code', rosterPeriodCode)
      .single()

    if (existing.data) {
      return ServiceResponse.error(
        `Roster already uploaded for period ${rosterPeriodCode}`
      )
    }

    // Upload file to storage
    const fileBuffer = await file.arrayBuffer()
    const filePath = `${rosterPeriodCode}/${file.name}`

    const uploadResult = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, fileBuffer, { upsert: false })

    if (uploadResult.error) {
      return ServiceResponse.error(`File upload failed: ${uploadResult.error.message}`)
    }

    // Parse PDF to extract roster data
    let parsedData: ParsedRosterData
    try {
      // Lazy-load PDF parser to avoid DOMMatrix issues during build
      const { parseRosterPdf } = await import('./roster-parser-service')
      parsedData = await parseRosterPdf(Buffer.from(fileBuffer))
    } catch (parseError) {
      // Clean up uploaded file on parse failure
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath])

      const errorMsg =
        parseError instanceof Error
          ? parseError.message
          : 'Unknown parsing error'
      return ServiceResponse.error(`PDF parsing failed: ${errorMsg}`)
    }

    // Insert roster record
    const rosterInsertResult = await supabase
      .from('published_rosters')
      .insert({
        roster_period_code: parsedData.periodCode,
        title: parsedData.rosterTitle,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: uploadedByUserId,
        parsed: true,
        parsed_at: new Date().toISOString(),
        captain_count: parsedData.captainCount,
        fo_count: parsedData.foCount,
        period_start_date: parsedData.dates.start,
        period_end_date: parsedData.dates.end,
      })
      .select()
      .single()

    if (rosterInsertResult.error) {
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath])
      return ServiceResponse.error(`Database insert failed: ${rosterInsertResult.error.message}`)
    }

    const rosterRecord = rosterInsertResult.data

    // Insert roster assignments (pilots × 28 days)
    const assignments = await buildAssignmentRecords(
      parsedData.captains.concat(parsedData.firstOfficers),
      rosterRecord.id,
      parsedData.periodCode
    )

    if (assignments.length > 0) {
      const assignmentResult = await supabase
        .from('roster_assignments')
        .insert(assignments)

      if (assignmentResult.error) {
        // Log but don't fail if assignments insert fails
        console.error('Assignment insertion error:', assignmentResult.error)
      }
    }

    return ServiceResponse.success(rosterRecord as PublishedRoster)
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : 'Unknown error'
    return ServiceResponse.error(`Upload failed: ${errorMsg}`)
  }
}

/**
 * Gets all published rosters with optional filters
 */
export async function getPublishedRosters(
  filters?: {
    year?: number
    rosterId?: string
  }
): Promise<ServiceResponse<PublishedRoster[]>> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('published_rosters')
      .select('*')
      .order('period_start_date', { ascending: false })

    if (filters?.rosterId) {
      query = query.eq('id', filters.rosterId)
    }

    if (filters?.year) {
      query = query
        .gte('period_start_date', `${filters.year}-01-01`)
        .lt('period_start_date', `${filters.year + 1}-01-01`)
    }

    const result = await query

    if (result.error) {
      return ServiceResponse.error(`Failed to fetch rosters: ${result.error.message}`)
    }

    return ServiceResponse.success((result.data || []) as PublishedRoster[])
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return ServiceResponse.error(`Fetch failed: ${errorMsg}`)
  }
}

/**
 * Gets a published roster by ID with all assignments
 */
export async function getPublishedRosterById(
  rosterId: string,
  filters?: {
    pilotId?: string
    rank?: 'CAPTAIN' | 'FIRST_OFFICER'
    activityCode?: string
  }
): Promise<
  ServiceResponse<{
    roster: PublishedRoster
    assignments: any[]
  }>
> {
  try {
    const supabase = await createClient()

    // Get roster
    const rosterResult = await supabase
      .from('published_rosters')
      .select('*')
      .eq('id', rosterId)
      .single()

    if (rosterResult.error) {
      return ServiceResponse.notFound('Roster not found')
    }

    // Get assignments
    let assignmentQuery = supabase
      .from('roster_assignments')
      .select('*')
      .eq('published_roster_id', rosterId)

    if (filters?.pilotId) {
      assignmentQuery = assignmentQuery.eq('pilot_id', filters.pilotId)
    }

    if (filters?.rank) {
      assignmentQuery = assignmentQuery.eq('rank', filters.rank)
    }

    if (filters?.activityCode) {
      assignmentQuery = assignmentQuery.eq('activity_code', filters.activityCode)
    }

    const assignmentResult = await assignmentQuery

    if (assignmentResult.error) {
      return ServiceResponse.error(
        `Failed to fetch assignments: ${assignmentResult.error.message}`
      )
    }

    return ServiceResponse.success({
      roster: rosterResult.data as PublishedRoster,
      assignments: assignmentResult.data || [],
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return ServiceResponse.error(`Fetch failed: ${errorMsg}`)
  }
}

/**
 * Deletes a published roster and all related assignments
 */
export async function deletePublishedRoster(
  rosterId: string
): Promise<ServiceResponse<void>> {
  try {
    const supabase = await createClient()

    // Get roster to delete file
    const rosterResult = await supabase
      .from('published_rosters')
      .select('file_path')
      .eq('id', rosterId)
      .single()

    if (rosterResult.error) {
      return ServiceResponse.notFound('Roster not found')
    }

    // Delete from storage
    if (rosterResult.data.file_path) {
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([rosterResult.data.file_path])
    }

    // Delete roster (cascade will remove assignments)
    const deleteResult = await supabase
      .from('published_rosters')
      .delete()
      .eq('id', rosterId)

    if (deleteResult.error) {
      return ServiceResponse.error(
        `Delete failed: ${deleteResult.error.message}`
      )
    }

    return ServiceResponse.success(undefined)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return ServiceResponse.error(`Delete failed: ${errorMsg}`)
  }
}

/**
 * Gets a signed URL for PDF download
 */
export async function getSignedPdfUrl(
  rosterId: string,
  expiresIn: number = 3600
): Promise<ServiceResponse<string>> {
  try {
    const supabase = await createClient()

    const rosterResult = await supabase
      .from('published_rosters')
      .select('file_path')
      .eq('id', rosterId)
      .single()

    if (rosterResult.error) {
      return ServiceResponse.notFound('Roster not found')
    }

    const { data } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(rosterResult.data.file_path, expiresIn)

    if (!data) {
      return ServiceResponse.error('Failed to generate signed URL')
    }

    return ServiceResponse.success(data.signedUrl)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return ServiceResponse.error(`URL generation failed: ${errorMsg}`)
  }
}

/**
 * Gets all uploaded roster period codes
 */
export async function getUploadedPeriodCodes(): Promise<string[]> {
  try {
    const supabase = await createClient()

    const result = await supabase
      .from('published_rosters')
      .select('roster_period_code')
      .order('roster_period_code', { ascending: false })

    if (result.error) {
      console.error('Failed to fetch period codes:', result.error)
      return []
    }

    // Extract unique period codes
    const codes = result.data?.map((r) => r.roster_period_code) || []
    return [...new Set(codes)]
  } catch (error) {
    console.error('Error fetching period codes:', error)
    return []
  }
}

/**
 * Gets a roster with assignments by period code
 * Returns the roster merged with its assignments, or null if not found
 */
export async function getRosterWithAssignments(
  periodCode: string
): Promise<(PublishedRoster & { assignments: any[] }) | null> {
  try {
    const supabase = await createClient()

    // Get roster by period code
    const rosterResult = await supabase
      .from('published_rosters')
      .select('*')
      .eq('roster_period_code', periodCode)
      .single()

    if (rosterResult.error || !rosterResult.data) {
      return null
    }

    const roster = rosterResult.data as PublishedRoster

    // Get assignments for this roster
    const assignmentResult = await supabase
      .from('roster_assignments')
      .select('*')
      .eq('published_roster_id', roster.id)

    if (assignmentResult.error) {
      console.error('Failed to fetch assignments:', assignmentResult.error)
      return {
        ...roster,
        assignments: [],
      }
    }

    return {
      ...roster,
      assignments: assignmentResult.data || [],
    }
  } catch (error) {
    console.error('Error fetching roster with assignments:', error)
    return null
  }
}

/**
 * Builds roster assignment records from parsed pilot data
 * Matches pilots to pilots table and creates assignment rows
 */
async function buildAssignmentRecords(
  pilots: PilotAssignment[],
  rosterId: string,
  periodCode: string
): Promise<any[]> {
  const assignments: any[] = []

  for (const pilot of pilots) {
    // Match pilot by last name and first name
    let matchedPilotId: string | null = null

    try {
      // Search for pilot by last name first, then combine with first name
      const searchTerm = `${pilot.pilotLastName} ${pilot.pilotFirstName}`
      const matchedPilots = await searchPilots(searchTerm, {
        role: pilot.rank === 'CAPTAIN' ? 'Captain' : 'First Officer',
        status: 'active',
      })

      if (matchedPilots.length > 0) {
        // Take the first match (most likely to be correct)
        matchedPilotId = matchedPilots[0].id
      }
    } catch (error) {
      // If pilot matching fails, log and continue with null pilot_id
      console.warn(`Failed to match pilot ${pilot.pilotName}:`, error)
    }

    for (const assignment of pilot.assignments) {
      assignments.push({
        published_roster_id: rosterId,
        roster_period_code: periodCode,
        pilot_id: matchedPilotId,
        pilot_name: pilot.pilotName,
        pilot_last_name: pilot.pilotLastName,
        pilot_first_name: pilot.pilotFirstName,
        rank: pilot.rank,
        day_number: assignment.dayNumber,
        date: assignment.date,
        activity_code: assignment.activityCode,
      })
    }
  }

  return assignments
}
