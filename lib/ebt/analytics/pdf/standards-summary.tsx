import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { StandingTier } from '../standing'
import { tierLabel } from '../standing-display'

export interface PilotPdfLatest {
  competency_code: string
  grade: number | null
  module_no: number | null
}
export interface PilotPdfInput {
  pilotName: string | null
  staffNo: string | null
  tier: StandingTier
  notCompetentCount: number
  belowEffectiveCount: number
  latest: PilotPdfLatest[]
}

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#111' },
  h1: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  sub: { fontSize: 9, color: '#666', marginBottom: 12 },
  badge: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  counts: { fontSize: 9, color: '#444', marginBottom: 12 },
  th: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  row: { flexDirection: 'row', borderBottom: '1px solid #eee', paddingVertical: 3 },
  cComp: { width: '40%' },
  cGrade: { width: '30%' },
  cModule: { width: '30%' },
})

/** Per-pilot Standards Summary — KPI strip (tier badge + counts) + latest-grade table. */
export function StandardsSummaryDoc({ d }: { d: PilotPdfInput }) {
  return (
    <Document title={`Standards Summary — ${d.pilotName ?? d.staffNo ?? 'pilot'}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Standards Summary</Text>
        <Text style={styles.sub}>
          {d.pilotName ?? '—'}
          {d.staffNo ? ` · Staff ${d.staffNo}` : ''}
        </Text>
        <Text style={styles.badge}>Standing: {tierLabel(d.tier)}</Text>
        <Text style={styles.counts}>
          Not competent (=1): {d.notCompetentCount} · Below effective (≤2): {d.belowEffectiveCount}
        </Text>
        <View style={styles.row}>
          <Text style={[styles.th, styles.cComp]}>Competency</Text>
          <Text style={[styles.th, styles.cGrade]}>Latest grade</Text>
          <Text style={[styles.th, styles.cModule]}>Module</Text>
        </View>
        {d.latest.map((r) => (
          <View key={r.competency_code} style={styles.row}>
            <Text style={styles.cComp}>{r.competency_code}</Text>
            <Text style={styles.cGrade}>{r.grade ?? '—'}</Text>
            <Text style={styles.cModule}>{r.module_no ?? '—'}</Text>
          </View>
        ))}
      </Page>
    </Document>
  )
}
