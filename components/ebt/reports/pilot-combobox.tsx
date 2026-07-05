'use client'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { PilotCurrencyDetail, CurrencyDetail } from '@/lib/ebt/roster/queries'
import { formatAuDate } from '@/lib/ebt/utils'

export interface PilotOption {
  id: string
  name: string
  staffNo: string
  rank: string | null
  aircraft: string | null
  currency: PilotCurrencyDetail | null
}

const MAX_RESULTS = 8

function bucketClass(b: CurrencyDetail['bucket']): string {
  if (b === 'valid') return 'ok'
  if (b === 'expiring') return 'warn'
  return 'bad'
}

function CurrencyLine({ code, detail }: { code: string; detail: CurrencyDetail | null }) {
  if (!detail) {
    return <span style={{ fontSize: 12, color: 'var(--ax-muted)' }}>{code} · no record</span>
  }
  return (
    <span style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span className={`ax-chip ${bucketClass(detail.bucket)}`}>
        <span className="cd" />
        {code}
      </span>
      <span style={{ color: 'var(--ax-muted)' }}>
        {detail.validTo ? formatAuDate(detail.validTo) : '—'}
      </span>
    </span>
  )
}

/** Type-ahead pilot picker: filters on name or staff number, submits the selected id via a
 *  hidden input, and previews the chosen pilot (rank, aircraft, currency) before creation. */
export function PilotCombobox({ pilots, name }: { pilots: PilotOption[]; name: string }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<PilotOption | null>(null)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return pilots.slice(0, MAX_RESULTS)
    return pilots
      .filter((p) => p.name.toLowerCase().includes(q) || p.staffNo.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS)
  }, [pilots, query])

  // Close on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function choose(p: PilotOption) {
    setSelected(p)
    setQuery('')
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) setOpen(true)
      else setHighlight((h) => Math.min(h + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      if (open && matches[highlight]) {
        e.preventDefault()
        choose(matches[highlight])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <input type="hidden" name={name} value={selected?.id ?? ''} />
      {selected ? (
        <div
          className="ax-card"
          style={{
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            boxShadow: 'none',
            background: '#fdfbf8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700 }}>{selected.name}</span>
            <span style={{ fontSize: 12.5, color: 'var(--ax-muted)' }}>
              Staff {selected.staffNo}
              {selected.rank ? ` · ${selected.rank}` : ''}
              {selected.aircraft ? ` · ${selected.aircraft}` : ''}
            </span>
            <button
              type="button"
              className="ax-btn"
              style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: 12 }}
              onClick={() => {
                setSelected(null)
                setOpen(false)
              }}
            >
              Change
            </button>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <CurrencyLine code="MED" detail={selected.currency?.medical ?? null} />
            <CurrencyLine code="IR" detail={selected.currency?.ir ?? null} />
            <CurrencyLine code="PRF" detail={selected.currency?.proficiency ?? null} />
          </div>
        </div>
      ) : (
        <>
          <input
            className="ax-ctl"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-label="Search pilots by name or staff number"
            placeholder="Type a name or staff #…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
              setHighlight(0)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
          />
          {open && (
            <ul
              id={listId}
              role="listbox"
              style={{
                position: 'absolute',
                zIndex: 20,
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                margin: 0,
                padding: 4,
                listStyle: 'none',
                background: '#fff',
                border: '1px solid var(--ax-line-2)',
                borderRadius: 11,
                boxShadow: 'var(--ax-sh-2)',
                maxHeight: 320,
                overflowY: 'auto',
              }}
            >
              {matches.length === 0 && (
                <li style={{ padding: '10px 12px', fontSize: 13, color: 'var(--ax-muted)' }}>
                  No active pilots match “{query}”.
                </li>
              )}
              {matches.map((p, i) => (
                <li
                  key={p.id}
                  role="option"
                  aria-selected={i === highlight}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    choose(p)
                  }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13.5,
                    background: i === highlight ? 'var(--ax-bg-2)' : 'transparent',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--ax-muted)' }}>
                    {p.staffNo}
                    {p.rank ? ` · ${p.rank}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
