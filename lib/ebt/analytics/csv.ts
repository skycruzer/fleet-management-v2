// Pure CSV (RFC-4180) serializer for analytics exports. No I/O, no framework imports —
// imported identically by the per-pilot and fleet export Route Handlers so every CSV is
// escaped the same way. Includes spreadsheet formula-injection neutralization.

export type CsvValue = string | number | boolean | null | undefined

const NEEDS_QUOTING = /[",\r\n]/
// Leading chars that Excel/Sheets would interpret as a formula. Prefix with ' to neutralize.
const FORMULA_LEAD = /^[=+\-@\t\r]/

/** Render one cell: empty for null/undefined, formula-guard, and RFC-4180 quote/escape. */
export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return ''
  let s = String(value)
  if (FORMULA_LEAD.test(s)) s = "'" + s
  if (NEEDS_QUOTING.test(s)) s = '"' + s.replaceAll('"', '""') + '"'
  return s
}

/** Render a header + rows to an RFC-4180 document: CRLF line endings, trailing CRLF. */
export function toCsv(header: string[], rows: CsvValue[][]): string {
  const lines = [header.map(csvCell).join(','), ...rows.map((r) => r.map(csvCell).join(','))]
  return lines.join('\r\n') + '\r\n'
}
