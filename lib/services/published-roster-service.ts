/**
 * Published Roster Service
 *
 * Manages uploaded roster PDFs, parsing, and storage.
 * Handles roster CRUD operations and pilot name matching.
 *
 * Developer: Maurice Rondeau
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { ServiceResponse } from '@/lib/types/service-response'
import type { Database } from '@/types/supabase'
import type { ParsedRosterData, PilotAssignment } from './roster-parser-service'
import { searchPilots } from './pilot-service'

const STORAGE_BUCKET = 'published-rosters'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export type PublishedRoster = Database['public']['Tables']['published_rosters']['Row']

/**
 * Uploads a roster PDF file, parses it, and stores assignments.
 *
 * Flow: parse first → validate UI selection matches PDF → check for existing
 * row → (optionally replace) → upload file → insert row + assignments.
 *
 * The check and the insert both key off the PDF-extracted periodCode so the
 * pre-check can never disagree with the unique-constraint outcome.
 */
export async function uploadPublishedRoster(
  file: File,
  rosterPeriodCode: string,
  uploadedByUserId: string,
  options: { replace?: boolean } = {}
): Promise<ServiceResponse<PublishedRoster>> {
  try {
    const supabase = createServiceRoleClient()

    if (!file.name.endsWith('.pdf')) {
      return ServiceResponse.error('Only PDF files are allowed')
    }

    if (file.size > MAX_FILE_SIZE) {
      return ServiceResponse.error('File size exceeds 10MB limit')
    }

    // 1. Parse PDF first — authoritative period code comes from the date grid.
    //    Pass the UI-selected code as a year-disambiguation hint only.
    const fileBuffer = await file.arrayBuffer()
    let parsedData: ParsedRosterData
    try {
      const { parseRosterPdf } = await import('./roster-parser-service')
      parsedData = await parseRosterPdf(Buffer.from(fileBuffer), rosterPeriodCode)
    } catch (parseError) {
      const errorMsg = parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      return ServiceResponse.error(`PDF parsing failed: ${errorMsg}`)
    }

    // Normalize to padded form so "RP5/2026" from an older PDF matches "RP05/2026"
    const parsedCode = normalizePeriodCode(parsedData.periodCode)
    const selectedCode = normalizePeriodCode(rosterPeriodCode)

    // 2. Guard against the user picking the wrong PDF for the selected period
    if (parsedCode !== selectedCode) {
      return ServiceResponse.error(
        `PDF is for ${parsedCode} but you selected ${selectedCode}. ` +
          `Please select the correct period or upload the matching PDF.`
      )
    }

    // 3. Check for an existing roster for this period (keyed by the parsed code)
    const existing = await supabase
      .from('published_rosters')
      .select('id, file_path')
      .eq('roster_period_code', parsedCode)
      .maybeSingle()

    if (existing.error) {
      return ServiceResponse.error(`Existence check failed: ${existing.error.message}`)
    }

    if (existing.data) {
      if (!options.replace) {
        return ServiceResponse.error(
          `Roster already uploaded for period ${parsedCode}. Use Replace to overwrite.`
        )
      }

      // Replace: delete old storage file and DB row (cascade removes assignments)
      if (existing.data.file_path) {
        await supabase.storage.from(STORAGE_BUCKET).remove([existing.data.file_path])
      }
      const deleteResult = await supabase
        .from('published_rosters')
        .delete()
        .eq('id', existing.data.id)

      if (deleteResult.error) {
        return ServiceResponse.error(
          `Failed to remove existing roster: ${deleteResult.error.message}`
        )
      }
    }

    // 4. Upload file to storage (keyed by the normalized period code)
    const filePath = `${parsedCode}/${file.name}`

    const uploadResult = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, fileBuffer, { upsert: true, contentType: 'application/pdf' })

    if (uploadResult.error) {
      return ServiceResponse.error(`File upload failed: ${uploadResult.error.message}`)
    }

    // 5. Insert roster record
    const rosterInsertResult = await supabase
      .from('published_rosters')
      .insert({
        roster_period_code: parsedCode,
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

    // 6. Insert per-pilot per-day assignments
    const assignments = await buildAssignmentRecords(
      parsedData.captains.concat(parsedData.firstOfficers),
      rosterRecord.id,
      parsedCode
    )

    if (assignments.length > 0) {
      const assignmentResult = await supabase.from('roster_assignments').insert(assignments)

      if (assignmentResult.error) {
        // Non-fatal: the roster row is in and retrievable; log for follow-up
        console.error('Assignment insertion error:', assignmentResult.error)
      }
    }

    return ServiceResponse.success(rosterRecord as PublishedRoster)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return ServiceResponse.error(`Upload failed: ${errorMsg}`)
  }
}

/**
 * Normalizes a roster period code to the canonical "RPNN/YYYY" form so older
 * rows stored as "RP5/2026" match the current "RP05/2026" UI format.
 */
function normalizePeriodCode(code: string): string {
  const match = code.trim().match(/^RP(\d{1,2})\/(\d{4})$/)
  if (!match) return code.trim()
  return `RP${match[1].padStart(2, '0')}/${match[2]}`
}

/**
 * Gets all published rosters with optional filters
 */
export async function getPublishedRosters(filters?: {
  year?: number
  rosterId?: string
}): Promise<ServiceResponse<PublishedRoster[]>> {
  try {
    const supabase = createServiceRoleClient()

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
    const supabase = createServiceRoleClient()

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
      return ServiceResponse.error(`Failed to fetch assignments: ${assignmentResult.error.message}`)
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
export async function deletePublishedRoster(rosterId: string): Promise<ServiceResponse<void>> {
  try {
    const supabase = createServiceRoleClient()

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
      await supabase.storage.from(STORAGE_BUCKET).remove([rosterResult.data.file_path])
    }

    // Delete roster (cascade will remove assignments)
    const deleteResult = await supabase.from('published_rosters').delete().eq('id', rosterId)

    if (deleteResult.error) {
      return ServiceResponse.error(`Delete failed: ${deleteResult.error.message}`)
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
    const supabase = createServiceRoleClient()

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
    const supabase = createServiceRoleClient()

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
    const supabase = createServiceRoleClient()

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
