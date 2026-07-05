import Link from 'next/link'
import { getSessionUser } from '@/lib/ebt/auth/roles'
import { getDashboardData, type CurrencyKind } from '@/lib/ebt/dashboard/queries'
import { dashboardView } from '@/lib/ebt/dashboard/dashboard-view'
import { currencyCardView } from '@/lib/ebt/dashboard/currency-display'
import { getFleetSummary, type FleetSummary } from '@/lib/ebt/analytics/queries'
import { statusLabel, resultLabel } from '@/lib/ebt/reports/format'
import { formatAuDate } from '@/lib/ebt/utils'

// ─── helpers ────────────────────────────────────────────────────────────────

function KpiCard({ kind, label }: { kind: CurrencyKind; label: string }) {
  // The big number always carries its noun (e.g. "1 expired" vs "1 expiring"),
  // so two cards both reading "1" can never be mistaken for the same thing.
  const view = currencyCardView(kind)
  return (
    <div className={`ax-kpi ${view.tone}`}>
      <div className="t">{label}</div>
      <div className="big">
        {view.hero.num} <span className={`unit ${view.hero.tone}`}>{view.hero.word}</span>
      </div>
      <div className="sm">{view.rest.join(' · ')}</div>
      {view.noRecord > 0 && <div className="sm nr">⚠ {view.noRecord} no record on file</div>}
    </div>
  )
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const [user, data, summary] = await Promise.all([
    getSessionUser(),
    // FIX #2/#8: log the swallowed error (it was silent before) and return a null sentinel.
    // null means ERROR — distinct from a successful-but-empty fetch, which returns real zeros.
    getDashboardData().catch((e) => {
      console.error('[dashboard] getDashboardData failed:', e)
      return null
    }),
    getFleetSummary().catch<FleetSummary | null>((e) => {
      console.error('[dashboard] getFleetSummary failed:', e)
      return null
    }),
  ])
  void user

  // FIX #2/#8: on a fetch error each section shows an explicit "unavailable" state — NEVER
  // zero-currency cards, which during an outage would read as a healthy, compliant fleet.
  const view = dashboardView(data)

  return (
    <main className="ax-main">
      <div className="ax-wrap">
        {/* Page header */}
        <div className="ax-pagehead">
          <div>
            <div className="ax-eyebrow">Overview</div>
            <h1>Dashboard</h1>
            <div className="sub">
              Active fleet · as of {formatAuDate(new Date().toISOString().slice(0, 10))}
            </div>
          </div>
          <div className="right">
            <Link className="ax-btn primary" href="/dashboard/ebt/reports/new">
              ＋ New report
            </Link>
          </div>
        </div>

        {/* KPI row */}
        <div className="ax-kpis">
          {view.status === 'error' ? (
            <div className="ax-kpi bad" role="alert">
              <div className="t">Currency data unavailable</div>
              <div className="big">—</div>
              <div className="sm">Couldn’t load pilot currency. Reload to retry.</div>
            </div>
          ) : (
            <>
              <KpiCard kind={view.currency.medical} label="Medical" />
              <KpiCard kind={view.currency.ir} label="Instrument Rating" />
              <KpiCard kind={view.currency.proficiency} label="Proficiency" />
            </>
          )}
        </div>

        {/* Two-column grid */}
        <div className="ax-grid2">
          {/* Fleet competency health */}
          <div className="ax-card ax-health">
            <div className="ax-hd">
              <h3>Fleet competency health</h3>
            </div>
            <div className="ax-bd">
              {view.status === 'error' ? (
                <div className="ax-empty" role="alert">
                  Competency health unavailable — reload to retry.
                </div>
              ) : view.health.length === 0 ? (
                <div className="ax-empty">No graded reports yet.</div>
              ) : (
                <>
                  {view.healthDegraded && (
                    <div className="ax-empty" role="alert">
                      ⚠ Active-only view unavailable — these figures temporarily INCLUDE inactive
                      pilots.
                    </div>
                  )}
                  <div className="ax-legend">
                    <span className="k">
                      <span className="sw" style={{ background: 'var(--ax-green)' }} />
                      ≥3 effective
                    </span>
                    <span className="k">
                      <span className="sw" style={{ background: 'var(--ax-amber)' }} />
                      2–3 below
                    </span>
                    <span className="k">
                      <span className="sw" style={{ background: 'var(--ax-red)' }} />
                      &lt;2 weak
                    </span>
                    <span className="k">avg grade per competency (1–5); tick = grade 3</span>
                  </div>
                  {view.health.map((row) => (
                    <div className="row" key={row.code}>
                      <span className="cc">{row.code}</span>
                      <span
                        className="bar"
                        title={`avg ${row.avg.toFixed(2)} over ${row.n} graded EVAL${row.n === 1 ? '' : 's'}`}
                      >
                        <i
                          style={{
                            width: `${Math.min(100, (row.avg / 5) * 100)}%`,
                            background:
                              row.avg >= 3
                                ? 'var(--ax-green)'
                                : row.avg >= 2
                                  ? 'var(--ax-amber)'
                                  : 'var(--ax-red)',
                          }}
                        />
                        <span className="mark" style={{ left: '60%' }} />
                      </span>
                      <span className="val">{row.avg.toFixed(1)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Recent reports */}
          <div className="ax-card">
            <div className="ax-hd">
              <h3>Recent reports</h3>
              <Link className="more" href="/dashboard/ebt/reports">
                All reports
              </Link>
            </div>
            <div className="ax-bd">
              {view.status === 'error' ? (
                <div className="ax-empty" role="alert">
                  Recent reports unavailable — reload to retry.
                </div>
              ) : view.recent.length === 0 ? (
                <div className="ax-empty">No reports yet.</div>
              ) : (
                view.recent.map((r) => (
                  <Link key={r.id} className="ax-rep" href={`/dashboard/ebt/reports/${r.id}`}>
                    <div>
                      <div className="nm">{r.pilot_name ?? '—'}</div>
                      <div className="meta">
                        Module {r.module_no ?? '—'} · {r.training_date ?? '—'}
                      </div>
                    </div>
                    <div className="right">
                      {r.eval_result && (
                        <span className={`ax-badge ${r.eval_result}`}>
                          {resultLabel(r.eval_result)}
                        </span>
                      )}
                      <span className={`ax-badge ${r.status}`}>{statusLabel(r.status)}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Fleet standing summary → /analytics */}
        <div className="ax-card" style={{ marginTop: '20px' }}>
          <div className="ax-hd">
            <h3>Fleet standing</h3>
            <Link className="more" href="/dashboard/ebt/analytics">
              Open analytics
            </Link>
          </div>
          <div className="ax-bd">
            {summary === null ? (
              <div className="ax-empty">Standing data unavailable.</div>
            ) : (
              <div className="ax-kpis">
                <div className={`ax-kpi ${summary.notCompetent > 0 ? 'bad' : 'ok'}`}>
                  <div className="t">Not competent</div>
                  <div className="big">{summary.notCompetent}</div>
                </div>
                <div className={`ax-kpi ${summary.additionalTraining > 0 ? 'warn' : 'ok'}`}>
                  <div className="t">Additional training</div>
                  <div className="big">{summary.additionalTraining}</div>
                </div>
                <div className={`ax-kpi ${summary.pctBelowEffective > 0 ? 'warn' : 'ok'}`}>
                  <div className="t">% below effective</div>
                  <div className="big">{`${(summary.pctBelowEffective * 100).toFixed(0)}%`}</div>
                  <div className="sm">{summary.belowEffectiveCount} pilots</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
