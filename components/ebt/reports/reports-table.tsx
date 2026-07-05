'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { ReportListItem } from '@/lib/ebt/reports/queries'
import { statusLabel, resultLabel } from '@/lib/ebt/reports/format'
import { formatAuDate } from '@/lib/ebt/utils'

const PAGE_SIZE = 25

type SortKey =
  | 'pilot_name'
  | 'staff_no'
  | 'module_no'
  | 'check_type'
  | 'training_date'
  | 'eval_result'
  | 'status'
type SortDir = 'asc' | 'desc'

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'pilot_name', label: 'Pilot' },
  { key: 'staff_no', label: 'Staff #' },
  { key: 'module_no', label: 'Mod' },
  { key: 'check_type', label: 'Check type' },
  { key: 'training_date', label: 'Training date' },
  { key: 'eval_result', label: 'Result' },
  { key: 'status', label: 'Status' },
]

function compare(a: ReportListItem, b: ReportListItem, key: SortKey): number {
  const av = a[key]
  const bv = b[key]
  // Missing values always sort last regardless of direction-flip caller behaviour.
  if (av == null && bv == null) return 0
  if (av == null) return 1
  if (bv == null) return -1
  if (typeof av === 'number' && typeof bv === 'number') return av - bv
  return String(av).localeCompare(String(bv))
}

export function ReportsTable({ reports }: { reports: ReportListItem[] }) {
  const [search, setSearch] = useState('')
  const [module, setModule] = useState('')
  const [checkType, setCheckType] = useState('')
  const [result, setResult] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('training_date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)

  const moduleOptions = useMemo(
    () =>
      [...new Set(reports.map((r) => r.module_no).filter((m): m is number => m != null))].sort(
        (a, b) => a - b
      ),
    [reports]
  )
  const checkTypeOptions = useMemo(
    () =>
      [...new Set(reports.map((r) => r.check_type).filter((c): c is string => c != null))].sort(),
    [reports]
  )
  const statusOptions = useMemo(() => [...new Set(reports.map((r) => r.status))].sort(), [reports])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = reports.filter((r) => {
      if (
        q &&
        !(r.pilot_name ?? '').toLowerCase().includes(q) &&
        !(r.staff_no ?? '').toLowerCase().includes(q)
      )
        return false
      if (module && String(r.module_no ?? '') !== module) return false
      if (checkType && r.check_type !== checkType) return false
      if (result && (r.eval_result ?? 'none') !== result) return false
      if (status && r.status !== status) return false
      if (dateFrom && (r.training_date ?? '') < dateFrom) return false
      if (dateTo && (r.training_date ?? '9999') > dateTo) return false
      return true
    })
    rows = [...rows].sort((a, b) => {
      const cmp = compare(a, b, sortKey)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return rows
  }, [reports, search, module, checkType, result, status, dateFrom, dateTo, sortKey, sortDir])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)
  const hasFilter = search || module || checkType || result || status || dateFrom || dateTo

  function resetPageAnd<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v)
      setPage(0)
    }
  }

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'training_date' ? 'desc' : 'asc')
    }
    setPage(0)
  }

  return (
    <div>
      <div className="ax-filters" style={{ alignItems: 'center' }}>
        <input
          type="search"
          aria-label="Search by pilot name or staff number"
          placeholder="Search pilot or staff #…"
          className="ax-ctl"
          style={{ width: 230, height: 36, padding: '0 12px' }}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
        />
        <select
          aria-label="Module"
          value={module}
          onChange={(e) => resetPageAnd(setModule)(e.target.value)}
        >
          <option value="">All modules</option>
          {moduleOptions.map((m) => (
            <option key={m} value={String(m)}>
              Module {m}
            </option>
          ))}
        </select>
        <select
          aria-label="Check type"
          value={checkType}
          onChange={(e) => resetPageAnd(setCheckType)(e.target.value)}
        >
          <option value="">All check types</option>
          {checkTypeOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          aria-label="Result"
          value={result}
          onChange={(e) => resetPageAnd(setResult)(e.target.value)}
        >
          <option value="">All results</option>
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
          <option value="incomplete">Incomplete</option>
          <option value="none">No result</option>
        </select>
        <select
          aria-label="Status"
          value={status}
          onChange={(e) => resetPageAnd(setStatus)(e.target.value)}
        >
          <option value="">All statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
        <label
          style={{
            fontSize: 12,
            color: 'var(--ax-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          From
          <input
            type="date"
            aria-label="Training date from"
            className="ax-ctl"
            style={{ width: 150, height: 36, padding: '0 8px' }}
            value={dateFrom}
            onChange={(e) => resetPageAnd(setDateFrom)(e.target.value)}
          />
        </label>
        <label
          style={{
            fontSize: 12,
            color: 'var(--ax-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          To
          <input
            type="date"
            aria-label="Training date to"
            className="ax-ctl"
            style={{ width: 150, height: 36, padding: '0 8px' }}
            value={dateTo}
            onChange={(e) => resetPageAnd(setDateTo)(e.target.value)}
          />
        </label>
        {hasFilter && (
          <button
            className="ax-btn"
            style={{ padding: '6px 12px', fontSize: 12 }}
            onClick={() => {
              setSearch('')
              setModule('')
              setCheckType('')
              setResult('')
              setStatus('')
              setDateFrom('')
              setDateTo('')
              setPage(0)
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="ax-card ax-tablecard">
        <table className="ax-table compact">
          <thead>
            <tr>
              {COLUMNS.map((c) => {
                const active = sortKey === c.key
                return (
                  <th
                    key={c.key}
                    aria-sort={
                      active ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined
                    }
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        font: 'inherit',
                        color: 'inherit',
                        letterSpacing: 'inherit',
                        textTransform: 'inherit',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {c.label}
                      <span aria-hidden="true" style={{ opacity: active ? 1 : 0.25, fontSize: 9 }}>
                        {active ? (sortDir === 'asc' ? '▲' : '▼') : '▲▼'}
                      </span>
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length}>
                  <div className="ax-empty">
                    {hasFilter ? 'No reports match the current filters.' : 'No reports yet.'}
                  </div>
                </td>
              </tr>
            )}
            {pageRows.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link className="pname" href={`/dashboard/ebt/reports/${r.id}`}>
                    {r.pilot_name ?? '—'}
                  </Link>
                </td>
                <td className="staff">{r.staff_no ?? '—'}</td>
                <td>{r.module_no ?? '—'}</td>
                <td
                  style={{
                    maxWidth: 120,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={r.check_type ?? undefined}
                >
                  {r.check_type ?? '—'}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>{formatAuDate(r.training_date)}</td>
                <td>
                  {r.eval_result && (
                    <span className={`ax-badge ${r.eval_result}`}>
                      {resultLabel(r.eval_result)}
                    </span>
                  )}
                </td>
                <td>
                  <span className={`ax-badge ${r.status}`}>{statusLabel(r.status)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
        <span style={{ fontSize: 13, color: 'var(--ax-muted)' }}>
          {filtered.length === 0
            ? '0 reports'
            : `${safePage * PAGE_SIZE + 1}–${Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length} report${filtered.length === 1 ? '' : 's'}`}
          {hasFilter && filtered.length !== reports.length && ` (filtered from ${reports.length})`}
        </span>
        {pageCount > 1 && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="ax-btn"
              style={{ padding: '6px 12px', fontSize: 12 }}
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              ← Previous
            </button>
            <span style={{ fontSize: 13, color: 'var(--ax-muted)' }}>
              Page {safePage + 1} of {pageCount}
            </span>
            <button
              className="ax-btn"
              style={{ padding: '6px 12px', fontSize: 12 }}
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage(safePage + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
