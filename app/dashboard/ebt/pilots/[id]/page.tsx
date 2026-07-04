import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSessionUser, hasRole } from '@/lib/ebt/auth/roles'
import { getPilot, getPilotCurrency, getPilotModuleProgress } from '@/lib/ebt/roster/queries'
import { ModuleTimeline } from '@/components/ebt/roster/module-timeline'
import { StandardsTab } from '@/components/ebt/standards/standards-tab'
import { formatAuDate } from '@/lib/ebt/utils'

// Shape of the data returned by getPilot (cast away GenericStringError union —
// getPilot throws on real DB errors, so by the time we reach here it is clean).
interface PilotDetail {
  id: string
  staff_no: string
  full_name: string
  rank: string | null
  employment_status: string
  aircraft_type_id: string | null
  aircraft_types: { code: string; name: string } | Array<{ code: string; name: string }> | null
  licences: Array<{
    id: string
    licence_type: string | null
    licence_no: string | null
    expiry: string | null
  }> | null
  medicals: Array<{ id: string; medical_class: string | null; expiry: string | null }> | null
  pilot_qualifications: Array<{
    id: string
    valid_to: string | null
    qualifications: { code: string; name: string } | null
  }> | null
}

type AlertBucket = 'valid' | 'expiring' | 'expired' | null

function bucketClass(b: AlertBucket): string {
  if (b === 'valid') return 'ok'
  if (b === 'expiring') return 'warn'
  if (b === 'expired') return 'bad'
  return ''
}

export default async function PilotDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const [{ id }, { tab }] = await Promise.all([params, searchParams])
  // currency/progress depend only on the id — fetch them alongside the session + pilot
  // instead of as a serial third stage.
  const [user, pilotRaw, currency, progress] = await Promise.all([
    getSessionUser(),
    getPilot(id),
    getPilotCurrency(id),
    getPilotModuleProgress(id),
  ])
  if (!pilotRaw) notFound()
  const activeTab = tab === 'standards' ? 'standards' : 'overview'
  // Cast away Supabase's GenericStringError union — getPilot throws on real DB errors.
  const pilot = pilotRaw as unknown as PilotDetail
  const canEdit = hasRole(user?.role ?? null, 'fleet_manager') // admins + fleet managers edit details

  const aircraft = Array.isArray(pilot.aircraft_types)
    ? ((pilot.aircraft_types[0] as { code: string; name: string } | null | undefined) ?? null)
    : (pilot.aircraft_types as { code: string; name: string } | null)
  const licences = pilot.licences ?? []
  const medicals = pilot.medicals ?? []
  const quals = pilot.pilot_qualifications ?? []

  // Build a map of qualification_code → alert_bucket for the chips
  const currencyMap: Record<string, AlertBucket> = {}
  for (const c of currency) {
    if (c.qualification_code) {
      currencyMap[c.qualification_code] = c.alert_bucket as AlertBucket
    }
  }
  const medBucket = currencyMap['MEDICAL'] ?? null
  const irBucket = currencyMap['INSTRUMENT_RATING'] ?? null
  const prfBucket = currencyMap['PROFICIENCY'] ?? null

  return (
    <main className="ax-main">
      <div className="ax-wrap">
        <div className="ax-pagehead">
          <div>
            <div className="ax-eyebrow">Pilot</div>
            <h1>{pilot.full_name}</h1>
            <div className="sub">
              Staff {pilot.staff_no} · {pilot.rank ?? '—'} · {aircraft?.code ?? '—'}
            </div>
          </div>
          <div className="right">
            {canEdit && (
              <Link href={`/dashboard/ebt/pilots/${pilot.id}/edit`} className="ax-btn">
                Edit
              </Link>
            )}
          </div>
        </div>

        {/* Overview | Standards tabs */}
        <div className="border-border mb-5 flex gap-1 border-b" role="tablist">
          <Link
            href={`/dashboard/ebt/pilots/${pilot.id}`}
            id="tab-overview"
            role="tab"
            aria-selected={activeTab === 'overview'}
            aria-controls="panel-overview"
            tabIndex={activeTab === 'overview' ? 0 : -1}
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-primary text-foreground border-b-2'
                : 'text-muted-foreground'
            }`}
          >
            Overview
          </Link>
          <Link
            href={`/dashboard/ebt/pilots/${pilot.id}?tab=standards`}
            id="tab-standards"
            role="tab"
            aria-selected={activeTab === 'standards'}
            aria-controls="panel-standards"
            tabIndex={activeTab === 'standards' ? 0 : -1}
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === 'standards'
                ? 'border-primary text-foreground border-b-2'
                : 'text-muted-foreground'
            }`}
          >
            Standards
          </Link>
        </div>

        {activeTab === 'standards' ? (
          <div id="panel-standards" role="tabpanel" aria-labelledby="tab-standards" tabIndex={0}>
            <StandardsTab pilotId={pilot.id} moduleProgress={progress} />
          </div>
        ) : (
          <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" tabIndex={0}>
            {/* Currency card */}
            <div className="ax-card" style={{ marginBottom: '20px' }}>
              <div className="ax-hd">
                <h3>Currency</h3>
              </div>
              <div className="ax-bd">
                {currency.length === 0 ? (
                  <div className="ax-empty">No currency records yet.</div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {medBucket != null && (
                      <span className={`ax-chip ${bucketClass(medBucket)}`}>
                        <span className="cd" />
                        MED
                      </span>
                    )}
                    {irBucket != null && (
                      <span className={`ax-chip ${bucketClass(irBucket)}`}>
                        <span className="cd" />
                        IR
                      </span>
                    )}
                    {prfBucket != null && (
                      <span className={`ax-chip ${bucketClass(prfBucket)}`}>
                        <span className="cd" />
                        PRF
                      </span>
                    )}
                    {/* Render remaining currency items as detail rows */}
                    <div style={{ width: '100%', marginTop: '12px' }}>
                      {currency.map((c) => {
                        const bucket = c.alert_bucket as AlertBucket
                        const cls = bucketClass(bucket)
                        const label =
                          c.qualification_code === 'INSTRUMENT_RATING'
                            ? 'Instrument Rating'
                            : c.qualification_code === 'MEDICAL'
                              ? 'Medical'
                              : c.qualification_code === 'PROFICIENCY'
                                ? 'Proficiency'
                                : (c.qualification_code ?? '—').replace(/_/g, ' ')
                        return (
                          <div
                            key={`${c.qualification_code}-${c.valid_to}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '8px 0',
                              borderBottom: '1px solid var(--ax-line)',
                            }}
                          >
                            <span style={{ flex: 1, fontSize: '13px', color: 'var(--ax-ink-2)' }}>
                              {label}
                            </span>
                            <span style={{ fontSize: '13px', color: 'var(--ax-muted)' }}>
                              {formatAuDate(c.valid_to)}
                            </span>
                            {cls && (
                              <span className={`ax-chip ${cls}`}>
                                <span className="cd" />
                                {bucket}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* EBT Module Timeline card */}
            <div className="ax-card" style={{ marginBottom: '20px' }}>
              <div className="ax-hd">
                <h3>EBT Module Progress</h3>
              </div>
              <div className="ax-bd">
                <ModuleTimeline
                  lastCompleted={progress?.last_completed_module_no ?? null}
                  modulesCompleted={progress?.modules_completed ?? null}
                  nextSuggested={progress?.next_module_suggested ?? null}
                />
              </div>
            </div>

            {/* Licences / Medicals / Qualifications cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div className="ax-card">
                <div className="ax-hd">
                  <h3>Licences</h3>
                </div>
                <div className="ax-bd">
                  {licences.length === 0 ? (
                    <div className="ax-empty">None.</div>
                  ) : (
                    licences.map((l) => (
                      <div
                        key={l.id}
                        style={{
                          padding: '8px 0',
                          borderBottom: '1px solid var(--ax-line)',
                          fontSize: '13px',
                          color: 'var(--ax-ink-2)',
                        }}
                        className="last:border-0"
                      >
                        {l.licence_type ?? '—'} {l.licence_no ?? ''}
                        <span style={{ color: 'var(--ax-muted)' }}>
                          {l.expiry ? ` · exp ${formatAuDate(l.expiry)}` : ' · no expiry on file'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="ax-card">
                <div className="ax-hd">
                  <h3>Medicals</h3>
                </div>
                <div className="ax-bd">
                  {medicals.length === 0 ? (
                    <div className="ax-empty">None.</div>
                  ) : (
                    medicals.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          padding: '8px 0',
                          borderBottom: '1px solid var(--ax-line)',
                          fontSize: '13px',
                          color: 'var(--ax-ink-2)',
                        }}
                      >
                        {/* medical_class arrives already prefixed (e.g. "Class 1") — don't prefix twice */}
                        {m.medical_class
                          ? /^class\b/i.test(m.medical_class)
                            ? m.medical_class
                            : `Class ${m.medical_class}`
                          : 'Class —'}
                        <span style={{ color: 'var(--ax-muted)' }}>
                          {m.expiry ? ` · exp ${formatAuDate(m.expiry)}` : ' · no expiry on file'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="ax-card">
                <div className="ax-hd">
                  <h3>Qualifications</h3>
                </div>
                <div className="ax-bd">
                  {quals.length === 0 ? (
                    <div className="ax-empty">None.</div>
                  ) : (
                    quals.map((q) => (
                      <div
                        key={q.id}
                        style={{
                          padding: '8px 0',
                          borderBottom: '1px solid var(--ax-line)',
                          fontSize: '13px',
                          color: 'var(--ax-ink-2)',
                        }}
                      >
                        {q.qualifications?.name ?? '—'}
                        <span style={{ color: 'var(--ax-muted)' }}>
                          {' '}
                          · valid to {formatAuDate(q.valid_to)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
