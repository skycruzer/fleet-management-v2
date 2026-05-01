import { formatDistanceToNow } from 'date-fns'
import { getRecordAuditHistory, type AuditLog } from '@/lib/services/audit-service'
import { formatDateTime } from '@/lib/utils/date-utils'
import { createAdminClient } from '@/lib/supabase/admin'

interface AuditTimelineProps {
  matterId: string
}

const ACTION_VERBS: Record<string, string> = {
  INSERT: 'created this matter',
  UPDATE: 'updated this matter',
  DELETE: 'deleted this matter',
  RESTORE: 'restored this matter',
  SOFT_DELETE: 'closed this matter',
}

const FIELD_LABELS: Record<string, string> = {
  status: 'Status',
  severity: 'Severity',
  assigned_to: 'Assigned To',
  resolved_by: 'Resolved By',
  reported_by: 'Reported By',
  resolved_date: 'Resolved Date',
  due_date: 'Due Date',
  notification_date: 'Notification Date',
  description: 'Description',
  title: 'Title',
  corrective_actions: 'Corrective Actions',
  impact_on_operations: 'Impact on Operations',
  resolution_notes: 'Resolution Notes',
  regulatory_notification_required: 'Regulatory Notification',
  regulatory_body: 'Regulatory Body',
  aircraft_registration: 'Aircraft',
  flight_number: 'Flight Number',
  location: 'Location',
  incident_type_id: 'Incident Type',
  pilot_id: 'Pilot',
}

// Fields whose stored values are UUIDs that should be resolved to human-readable names
// before display. Mapped to the source table the FK points at.
const USER_FK_FIELDS = new Set(['assigned_to', 'resolved_by', 'reported_by'])
const PILOT_FK_FIELDS = new Set(['pilot_id'])
const INCIDENT_TYPE_FK_FIELDS = new Set(['incident_type_id'])

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function formatValue(value: unknown, lookup?: Map<string, string>): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'string') {
    if (lookup && UUID_RE.test(value) && lookup.has(value)) return lookup.get(value)!
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
    return value
  }
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function describeChanges(
  log: AuditLog,
  fkLookup: Map<string, string>
): { label: string; from: string; to: string }[] {
  if (log.action !== 'UPDATE' || !log.changed_fields?.length) return []
  const oldVals = (log.old_values || {}) as Record<string, unknown>
  const newVals = (log.new_values || {}) as Record<string, unknown>
  return log.changed_fields
    .filter((field) => field !== 'updated_at')
    .map((field) => {
      const useLookup =
        USER_FK_FIELDS.has(field) ||
        PILOT_FK_FIELDS.has(field) ||
        INCIDENT_TYPE_FK_FIELDS.has(field)
      const lookup = useLookup ? fkLookup : undefined
      return {
        label: FIELD_LABELS[field] ?? field.replace(/_/g, ' '),
        from: formatValue(oldVals[field], lookup),
        to: formatValue(newVals[field], lookup),
      }
    })
}

// Collect every UUID that appears under an FK field across all logs, so we can fetch
// the display names in a single round-trip per source table.
function collectFkUuids(logs: AuditLog[]): {
  userIds: Set<string>
  pilotIds: Set<string>
  incidentTypeIds: Set<string>
} {
  const userIds = new Set<string>()
  const pilotIds = new Set<string>()
  const incidentTypeIds = new Set<string>()

  const collect = (record: Record<string, unknown> | null | undefined) => {
    if (!record) return
    for (const [key, value] of Object.entries(record)) {
      if (typeof value !== 'string' || !UUID_RE.test(value)) continue
      if (USER_FK_FIELDS.has(key)) userIds.add(value)
      else if (PILOT_FK_FIELDS.has(key)) pilotIds.add(value)
      else if (INCIDENT_TYPE_FK_FIELDS.has(key)) incidentTypeIds.add(value)
    }
  }

  for (const log of logs) {
    collect((log.old_values as Record<string, unknown>) ?? null)
    collect((log.new_values as Record<string, unknown>) ?? null)
  }

  return { userIds, pilotIds, incidentTypeIds }
}

async function buildFkLookup(logs: AuditLog[]): Promise<Map<string, string>> {
  const lookup = new Map<string, string>()
  const { userIds, pilotIds, incidentTypeIds } = collectFkUuids(logs)
  if (userIds.size === 0 && pilotIds.size === 0 && incidentTypeIds.size === 0) return lookup

  const supabase = createAdminClient()

  const [usersResult, pilotsResult, incidentTypesResult] = await Promise.all([
    userIds.size > 0
      ? supabase.from('an_users').select('id, name, email').in('id', Array.from(userIds))
      : Promise.resolve({ data: null }),
    pilotIds.size > 0
      ? supabase
          .from('pilots')
          .select('id, first_name, last_name, role')
          .in('id', Array.from(pilotIds))
      : Promise.resolve({ data: null }),
    incidentTypeIds.size > 0
      ? supabase.from('incident_types').select('id, name').in('id', Array.from(incidentTypeIds))
      : Promise.resolve({ data: null }),
  ])

  for (const row of usersResult.data ?? []) {
    lookup.set(row.id, row.name || row.email || row.id)
  }
  for (const row of pilotsResult.data ?? []) {
    lookup.set(row.id, `${row.role} ${row.first_name} ${row.last_name}`)
  }
  for (const row of incidentTypesResult.data ?? []) {
    lookup.set(row.id, row.name)
  }

  return lookup
}

export async function AuditTimeline({ matterId }: AuditTimelineProps) {
  const allLogs = await getRecordAuditHistory('disciplinary_matters', matterId)
  // Hide UPDATE entries whose only change is `updated_at` — those are no-op saves.
  const logs = allLogs.filter(
    (log) =>
      log.action !== 'UPDATE' ||
      (log.changed_fields?.some((field) => field !== 'updated_at') ?? false)
  )

  const fkLookup = await buildFkLookup(logs)

  return (
    <section className="bg-card border-border rounded-lg border p-6 shadow-sm">
      <h2 className="text-foreground mb-4 text-lg font-semibold">Activity Timeline</h2>

      {logs.length === 0 ? (
        <p className="text-muted-foreground text-sm">No activity recorded yet.</p>
      ) : (
        <ol className="border-border space-y-4 border-l pl-6">
          {logs.map((log) => {
            const verb = ACTION_VERBS[log.action] ?? log.action.toLowerCase()
            const actor = log.user_email ?? 'System'
            const role = log.user_role ? ` · ${log.user_role}` : ''
            const changes = describeChanges(log, fkLookup)
            return (
              <li key={log.id} className="relative">
                <span
                  className="bg-primary border-card absolute -left-[31px] mt-1 h-3 w-3 rounded-full border-2"
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-foreground text-sm font-medium">{actor}</span>
                  <span className="text-muted-foreground text-sm">
                    {verb}
                    {role}
                  </span>
                  <time
                    dateTime={log.created_at}
                    title={formatDateTime(log.created_at)}
                    className="text-muted-foreground ml-auto text-xs"
                  >
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </time>
                </div>

                {changes.length > 0 && (
                  <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
                    {changes.map((c) => (
                      <li key={c.label}>
                        <span className="text-foreground/80 font-medium">{c.label}:</span>{' '}
                        <span className="line-through opacity-60">{c.from}</span>
                        {' → '}
                        <span className="text-foreground">{c.to}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {log.description && (
                  <p className="text-muted-foreground mt-1 text-sm">{log.description}</p>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
