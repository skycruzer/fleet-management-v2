// Maurice Rondeau — Published Roster Service
// CRUD operations for uploaded roster PDFs and their parsed assignments.

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { sanitizeRosterFilename } from '@/lib/validations/published-roster-schema'
import { logError, ErrorSeverity } from '@/lib/error-logger'
import { parseRosterPdf, toAssignmentInserts } from './roster-parser-service'
import { ensureActivityCodesExist } from './activity-code-service'
import type { Database } from '@/types/supabase'

type PublishedRoster = Database['public']['Tables']['published_rosters']['Row']

const BUCKET = 'published-rosters'
const SIGNED_URL_EXPIRATION = 3600 // 1 hour

export interface UploadRosterResult {
  success: boolean
  roster?: PublishedRoster
  captainCount?: number
  foCount?: number
  newActivityCodes?: string[]
  unmatchedPilots?: string[]
  error?: string
}

export interface RosterWithAssignments extends PublishedRoster {
  assignments: Database['public']['Tables']['roster_assignments']['Row'][]
}

// ─── Upload & Parse ─────────────────────────────────────────────

export async function uploadAndParseRoster(
  fileBuffer: ArrayBuffer,
  fileName: string,
  uploadedBy: string,
  options?: { replace?: boolean }
): Promise<UploadRosterResult> {
  const supabase = createServiceRoleClient()

  // Make true copies — pdfjs-dist detaches the original ArrayBuffer on parse
  const raw = new Uint8Array(fileBuffer)
  const uploadBytes = raw.slice() // independent copy for storage upload
  const fileSize = raw.byteLength

  // 1. Parse the PDF first (fail fast if parsing fails)
  const parsed = await parseRosterPdf(raw.slice().buffer as ArrayBuffer)

  // 2. Check if roster already exists for this period
  const { data: existing } = await supabase
    .from('published_rosters')
    .select('id')
    .eq('roster_period_code', parsed.periodCode)
    .single()

  if (existing) {
    if (options?.replace) {
      // Delete existing roster (cascade deletes assignments), clean up storage
      const deleteResult = await deletePublishedRoster(existing.id)
      if (!deleteResult.success) {
        return { success: false, error: `Failed to replace existing roster: ${deleteResult.error}` }
      }
    } else {
      return { success: false, error: `Roster already exists for ${parsed.periodCode}` }
    }
  }

  // 3. Ensure all activity codes from the PDF exist in the reference table
  const allCodes = new Set<string>()
  for (const pilot of [...parsed.captains, ...parsed.firstOfficers]) {
    for (const a of pilot.assignments) {
      if (a.activityCode) allCodes.add(a.activityCode)
    }
  }
  const { newCodes } = await ensureActivityCodesExist(Array.from(allCodes))

  // 4. Upload PDF to storage
  const sanitizedName = sanitizeRosterFilename(fileName)
  const storagePath = `${parsed.periodCode.replace('/', '-')}/${Date.now()}-${sanitizedName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, uploadBytes, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    return { success: false, error: `Storage upload failed: ${uploadError.message}` }
  }

  // 5. Insert published_rosters record
  const { data: roster, error: insertError } = await supabase
    .from('published_rosters')
    .insert({
      roster_period_code: parsed.periodCode,
      title: parsed.title,
      file_path: storagePath,
      file_name: fileName,
      file_size: fileSize,
      uploaded_by: uploadedBy,
      parsed: true,
      parsed_at: new Date().toISOString(),
      captain_count: parsed.captains.length,
      fo_count: parsed.firstOfficers.length,
      period_start_date: parsed.startDate,
      period_end_date: parsed.endDate,
    })
    .select()
    .single()

  if (insertError || !roster) {
    // Clean up uploaded file
    const { error: cleanupError } = await supabase.storage.from(BUCKET).remove([storagePath])
    if (cleanupError) {
      logError(new Error(`Orphaned storage file: ${storagePath}`), {
        source: 'published-roster-service/uploadAndParseRoster',
        severity: ErrorSeverity.MEDIUM,
        metadata: { cleanupError: cleanupError.message },
      })
    }
    return { success: false, error: `Database insert failed: ${insertError?.message}` }
  }

  // 6. Build pilot name map for matching
  const pilotMap = await buildPilotNameMap()

  // 7. Insert roster assignments
  const assignmentInserts = toAssignmentInserts(parsed, roster.id, pilotMap)
  const unmatchedPilots: string[] = []

  // Track unmatched pilots
  const seenPilots = new Set<string>()
  for (const insert of assignmentInserts) {
    const key = `${insert.pilot_last_name}_${insert.pilot_first_name}`
    if (!insert.pilot_id && !seenPilots.has(key)) {
      unmatchedPilots.push(`${insert.pilot_last_name} ${insert.pilot_first_name}`)
      seenPilots.add(key)
    }
  }

  // Batch insert assignments (Supabase supports bulk inserts)
  if (assignmentInserts.length > 0) {
    const { error: assignError } = await supabase
      .from('roster_assignments')
      .insert(assignmentInserts)

    if (assignError) {
      // Clean up on failure
      await supabase.from('published_rosters').delete().eq('id', roster.id)
      const { error: cleanupError } = await supabase.storage.from(BUCKET).remove([storagePath])
      if (cleanupError) {
        logError(new Error(`Orphaned storage file after assignment failure: ${storagePath}`), {
          source: 'published-roster-service/uploadAndParseRoster',
          severity: ErrorSeverity.MEDIUM,
          metadata: { cleanupError: cleanupError.message },
        })
      }
      return { success: false, error: `Assignment insert failed: ${assignError.message}` }
    }
  }

  return {
    success: true,
    roster,
    captainCount: parsed.captains.length,
    foCount: parsed.firstOfficers.length,
    newActivityCodes: newCodes,
    unmatchedPilots,
  }
}

// ─── Read Operations ────────────────────────────────────────────

export async function getPublishedRosters(filters?: { year?: number }): Promise<PublishedRoster[]> {
  const supabase = createServiceRoleClient()
  let query = supabase
    .from('published_rosters')
    .select('*')
    .order('period_start_date', { ascending: false })

  if (filters?.year) {
    const yearStart = `${filters.year}-01-01`
    const yearEnd = `${filters.year}-12-31`
    query = query.gte('period_start_date', yearStart).lte('period_start_date', yearEnd)
  }

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch published rosters: ${error.message}`)
  return data
}

export async function getPublishedRosterByPeriod(
  periodCode: string
): Promise<PublishedRoster | null> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('published_rosters')
    .select('*')
    .eq('roster_period_code', periodCode)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch roster: ${error.message}`)
  }
  return data
}

export async function getRosterAssignments(
  publishedRosterId: string
): Promise<Database['public']['Tables']['roster_assignments']['Row'][]> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('roster_assignments')
    .select('*')
    .eq('published_roster_id', publishedRosterId)
    .order('rank')
    .order('pilot_last_name')
    .order('day_number')

  if (error) throw new Error(`Failed to fetch assignments: ${error.message}`)
  return data
}

export async function getRosterWithAssignments(
  periodCode: string
): Promise<RosterWithAssignments | null> {
  const roster = await getPublishedRosterByPeriod(periodCode)
  if (!roster) return null

  const assignments = await getRosterAssignments(roster.id)
  return { ...roster, assignments }
}

/**
 * Get all roster period codes that have uploaded rosters.
 * Used by the period navigator to show which periods have data.
 */
export async function getUploadedPeriodCodes(): Promise<string[]> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('published_rosters')
    .select('roster_period_code')
    .order('period_start_date', { ascending: true })

  if (error) throw new Error(`Failed to fetch period codes: ${error.message}`)
  return data.map((r) => r.roster_period_code)
}

// ─── PDF Access ─────────────────────────────────────────────────

export async function getSignedPdfUrl(publishedRosterId: string): Promise<string | null> {
  const supabase = createServiceRoleClient()

  const { data: roster, error: dbError } = await supabase
    .from('published_rosters')
    .select('file_path')
    .eq('id', publishedRosterId)
    .single()

  if (dbError && dbError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch roster for PDF URL: ${dbError.message}`)
  }
  if (!roster) return null

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(roster.file_path, SIGNED_URL_EXPIRATION)

  if (error) {
    throw new Error(`Failed to create signed PDF URL: ${error.message}`)
  }
  return data.signedUrl
}

// ─── Delete ─────────────────────────────────────────────────────

export async function deletePublishedRoster(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient()

  // Get file path before deleting
  const { data: roster } = await supabase
    .from('published_rosters')
    .select('file_path')
    .eq('id', id)
    .single()

  if (!roster) return { success: false, error: 'Roster not found' }

  // Delete from storage (log but don't fail on storage cleanup errors)
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([roster.file_path])
  if (storageError) {
    logError(new Error(`Failed to delete storage file: ${roster.file_path}`), {
      source: 'published-roster-service/deletePublishedRoster',
      severity: ErrorSeverity.MEDIUM,
      metadata: { storageError: storageError.message },
    })
  }

  // Delete from database (cascade deletes assignments)
  const { error } = await supabase.from('published_rosters').delete().eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ─── Pilot Name Matching ────────────────────────────────────────

/**
 * Build a map of "LASTNAME_FIRSTNAME" -> pilot UUID for matching
 * roster entries to pilot records. Case-insensitive.
 */
async function buildPilotNameMap(): Promise<Map<string, string>> {
  const supabase = createServiceRoleClient()
  const { data: pilots, error } = await supabase.from('pilots').select('id, last_name, first_name')

  if (error) throw new Error(`Failed to load pilots for name matching: ${error.message}`)
  if (!pilots) return new Map()

  const map = new Map<string, string>()
  for (const pilot of pilots) {
    const key = `${pilot.last_name.toUpperCase()}_${pilot.first_name.toUpperCase()}`
    map.set(key, pilot.id)
  }

  return map
}
