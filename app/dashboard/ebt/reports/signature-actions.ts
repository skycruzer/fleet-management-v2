'use server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/ebt/auth/roles'
import { createClient } from '@/lib/ebt/supabase/server'
import { checkSignaturePng } from '@/lib/ebt/reports/signature-png'

export type SignatureKind = 'examiner' | 'trainee'
export type SignatureResult = { ok: boolean; message?: string }

// Strict allow-list: a base64 PNG produced by canvas.toDataURL('image/png').
const PNG_DATA_URI = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const KINDS: readonly SignatureKind[] = ['examiner', 'trainee']

export async function saveSignature(
  reportId: string,
  kind: SignatureKind,
  dataUrl: string
): Promise<SignatureResult> {
  const user = await requireRole('examiner')

  // Validate inputs against strict allow-lists BEFORE any storage/DB I/O. reportId and kind are
  // interpolated into a storage object path, so reject anything that isn't a bare UUID / known
  // kind — defends the signatures bucket against path traversal.
  if (!UUID.test(reportId)) return { ok: false, message: 'Invalid report id.' }
  if (!KINDS.includes(kind)) return { ok: false, message: 'Invalid signature kind.' }

  const m = PNG_DATA_URI.exec(dataUrl ?? '')
  if (!m) return { ok: false, message: 'Signature must be a PNG image.' }
  const bytes = Buffer.from(m[1], 'base64')
  if (bytes.length === 0 || bytes.length > 5_000_000)
    return { ok: false, message: 'Signature image is empty or too large.' }
  // A blank (uniform) PNG must be rejected SERVER-SIDE: the client disables Save while the pad
  // is untouched, but a signature is a mandatory lifecycle gate on a regulatory record, so the
  // keyboard path / direct action callers cannot be allowed to record an empty one.
  const content = checkSignaturePng(bytes)
  if (!content.ok) {
    return {
      ok: false,
      message:
        content.reason === 'blank'
          ? 'Signature is blank — draw or type a name first.'
          : 'Signature image could not be read.',
    }
  }

  const supabase = await createClient()

  // Authorization (IDOR guard): the `signatures` bucket policy only checks `bucket_id`, so it
  // does NOT scope writes per report — an examiner could otherwise overwrite another report's
  // signature object at `<otherId>/<kind>.png`. Confirm the caller is THIS report's assigned
  // examiner (RLS already limits visibility to own/fleet-manager reports) and that the report
  // is still an editable draft, before touching storage.
  const { data: report, error: repErr } = await supabase
    .from('training_reports')
    .select('examiner_id, status')
    .eq('id', reportId)
    .maybeSingle()
  if (repErr) return { ok: false, message: 'Could not verify the report.' }
  if (!report || report.examiner_id !== user.id)
    return { ok: false, message: 'You are not authorized to sign this report.' }
  if (report.status !== 'draft')
    return { ok: false, message: 'Signatures can only be captured on a draft report.' }

  const path = `${reportId}/${kind}.png` // deterministic: a re-capture overwrites, never duplicates
  const up = await supabase.storage
    .from('signatures')
    .upload(path, bytes, { contentType: 'image/png', upsert: true })
  if (up.error) {
    // Never echo raw storage error text (leaks bucket/path internals) — log it server-side only.
    console.error('[signature-actions] signature upload failed', up.error)
    return { ok: false, message: 'Could not upload the signature. Please try again.' }
  }

  const { error } = await supabase.from('report_signatures').upsert(
    {
      report_id: reportId,
      kind,
      storage_path: path,
      signed_by: user.id,
      signed_at: new Date().toISOString(),
    },
    { onConflict: 'report_id,kind' }
  )
  if (error) {
    // Never echo raw DB error text (leaks table/column/constraint names) — log it server-side only.
    console.error('[signature-actions] recording signature failed', error)
    return { ok: false, message: 'Could not record the signature. Please try again.' }
  }

  revalidatePath(`/dashboard/ebt/reports/${reportId}`)
  return { ok: true }
}

export type SignOffKind = 'fleet_manager' | 'emfts'
const SIGNOFF_KINDS: readonly SignOffKind[] = ['fleet_manager', 'emfts']

export async function saveSignOffSignature(
  reportId: string,
  kind: SignOffKind,
  dataUrl: string
): Promise<SignatureResult> {
  const user = await requireRole('fleet_manager')
  if (!UUID.test(reportId)) return { ok: false, message: 'Invalid report id.' }
  if (!SIGNOFF_KINDS.includes(kind)) return { ok: false, message: 'Invalid signature kind.' }
  const m = PNG_DATA_URI.exec(dataUrl ?? '')
  if (!m) return { ok: false, message: 'Signature must be a PNG image.' }
  const bytes = Buffer.from(m[1], 'base64')
  if (bytes.length === 0 || bytes.length > 5_000_000)
    return { ok: false, message: 'Signature image is empty or too large.' }
  const content = checkSignaturePng(bytes)
  if (!content.ok) {
    return {
      ok: false,
      message:
        content.reason === 'blank'
          ? 'Signature is blank — draw or type a name first.'
          : 'Signature image could not be read.',
    }
  }

  const supabase = await createClient()
  const { data: report, error: repErr } = await supabase
    .from('training_reports')
    .select('status')
    .eq('id', reportId)
    .maybeSingle()
  if (repErr) return { ok: false, message: 'Could not verify the report.' }
  if (!report) return { ok: false, message: 'Report not found.' }
  if (report.status !== 'submitted')
    return { ok: false, message: 'Sign-off signatures are captured on a submitted report.' }

  // Sign-off identity guard: once a fleet manager has recorded THEIR signature for this kind,
  // another FM must not silently overwrite it — the signature names who attested a regulatory
  // record. Re-capture by the SAME person stays allowed (fixing a bad scrawl).
  const { data: existing, error: exErr } = await supabase
    .from('report_signatures')
    .select('signed_by')
    .eq('report_id', reportId)
    .eq('kind', kind)
    .maybeSingle()
  if (exErr) return { ok: false, message: 'Could not verify the existing signature.' }
  if (existing && existing.signed_by !== user.id) {
    return { ok: false, message: 'This sign-off was already signed by another fleet manager.' }
  }

  const path = `${reportId}/${kind}.png`
  const up = await supabase.storage
    .from('signatures')
    .upload(path, bytes, { contentType: 'image/png', upsert: true })
  if (up.error) {
    // Never echo raw storage error text (leaks bucket/path internals) — log it server-side only.
    console.error('[signature-actions] signature upload failed', up.error)
    return { ok: false, message: 'Could not upload the signature. Please try again.' }
  }
  const { error } = await supabase.from('report_signatures').upsert(
    {
      report_id: reportId,
      kind,
      storage_path: path,
      signed_by: user.id,
      signed_at: new Date().toISOString(),
    },
    { onConflict: 'report_id,kind' }
  )
  if (error) {
    // Never echo raw DB error text (leaks table/column/constraint names) — log it server-side only.
    console.error('[signature-actions] recording signature failed', error)
    return { ok: false, message: 'Could not record the signature. Please try again.' }
  }
  revalidatePath(`/dashboard/ebt/reports/${reportId}`)
  return { ok: true }
}
