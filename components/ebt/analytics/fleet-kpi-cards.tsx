import type { FleetKpis } from '@/lib/ebt/analytics/queries'

export function FleetKpiCards({ kpis }: { kpis: FleetKpis }) {
  const pass = kpis.modulePassRate === null ? '—' : `${(kpis.modulePassRate * 100).toFixed(0)}%`
  const belowEffective = `${(kpis.pctBelowEffective * 100).toFixed(0)}%`
  const total = kpis.totalPilots
  const belowCount = kpis.notCompetent + kpis.additionalTraining + kpis.competentMonitor
  const ofPilots = (n: number) => `${n} of ${total} pilot${total === 1 ? '' : 's'}`
  return (
    <div className="ax-kpis">
      <div className={`ax-kpi ${kpis.notCompetent > 0 ? 'bad' : 'ok'}`}>
        <div className="t">Not competent</div>
        <div className="big">{kpis.notCompetent}</div>
        <div className="sm">{ofPilots(kpis.notCompetent)} · any grade 1</div>
      </div>
      <div className={`ax-kpi ${kpis.additionalTraining > 0 ? 'warn' : 'ok'}`}>
        <div className="t">Additional training</div>
        <div className="big">{kpis.additionalTraining}</div>
        <div className="sm">{ofPilots(kpis.additionalTraining)} · recurring 2 over two modules</div>
      </div>
      <div className={`ax-kpi ${kpis.pctBelowEffective > 0 ? 'warn' : 'ok'}`}>
        <div className="t">% below effective</div>
        <div className="big">{belowEffective}</div>
        <div className="sm">{ofPilots(belowCount)} below the effective standard</div>
      </div>
      <div className="ax-kpi ok">
        <div className="t">Module pass rate</div>
        <div className="big">{pass}</div>
        <div className="sm">passes ÷ decided EVALs (blanks excluded)</div>
      </div>
    </div>
  )
}
