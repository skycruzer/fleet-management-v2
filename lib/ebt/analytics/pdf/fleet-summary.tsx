import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export interface FleetPdfKpis {
  notCompetentPilots: number
  additionalTrainingPilots: number
  pctBelowEffective: number
  modulePassRate: number | null // FleetKpis.modulePassRate is null when there are no module outcomes.
}
export interface FleetPdfHeatmapRow {
  competency_code: string
  aircraft_type_id: string | null
  rank: string | null
  pct_below_3: number | null
  n_graded: number
}
export interface FleetPdfInput {
  kpis: FleetPdfKpis
  heatmap: FleetPdfHeatmapRow[]
}

const pct = (v: number): string => `${Math.round(v * 100)}%`
// modulePassRate (and any nullable rate) renders "—" when null so an absent metric reads as N/A,
// never as a misleading 0% — mirrors the CSV/screen null-handling.
const pctOrDash = (v: number | null): string => (v == null ? '—' : pct(v))

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#111' },
  h1: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 12 },
  kpis: { flexDirection: 'row', marginBottom: 14, gap: 18 },
  kpi: { fontSize: 9 },
  kpiNum: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  th: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  row: { flexDirection: 'row', borderBottom: '1px solid #eee', paddingVertical: 3 },
  cComp: { width: '25%' },
  cAt: { width: '25%' },
  cRank: { width: '20%' },
  cBelow: { width: '15%' },
  cN: { width: '15%' },
})

/** Fleet Analytics Summary — KPI strip + competency-health table (rank NULL → "Unspecified"). */
export function FleetSummaryDoc({ d }: { d: FleetPdfInput }) {
  return (
    <Document title="Fleet Analytics Summary">
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Fleet Analytics Summary</Text>
        <View style={styles.kpis}>
          <View style={styles.kpi}>
            <Text style={styles.kpiNum}>{d.kpis.notCompetentPilots}</Text>
            <Text>Pilots not competent</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiNum}>{d.kpis.additionalTrainingPilots}</Text>
            <Text>Needing add&apos;l training</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiNum}>{pct(d.kpis.pctBelowEffective)}</Text>
            <Text>% below effective</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiNum}>{pctOrDash(d.kpis.modulePassRate)}</Text>
            <Text>Module pass rate</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={[styles.th, styles.cComp]}>Competency</Text>
          <Text style={[styles.th, styles.cAt]}>Aircraft type</Text>
          <Text style={[styles.th, styles.cRank]}>Rank</Text>
          <Text style={[styles.th, styles.cBelow]}>% below 3</Text>
          <Text style={[styles.th, styles.cN]}>n</Text>
        </View>
        {d.heatmap.map((r, i) => (
          <View
            key={`${r.competency_code}-${r.aircraft_type_id}-${r.rank ?? 'u'}-${i}`}
            style={styles.row}
          >
            <Text style={styles.cComp}>{r.competency_code}</Text>
            <Text style={styles.cAt}>{r.aircraft_type_id ?? '—'}</Text>
            <Text style={styles.cRank}>{r.rank ?? 'Unspecified'}</Text>
            <Text style={styles.cBelow}>{r.pct_below_3 == null ? '—' : pct(r.pct_below_3)}</Text>
            <Text style={styles.cN}>{r.n_graded}</Text>
          </View>
        ))}
      </Page>
    </Document>
  )
}
