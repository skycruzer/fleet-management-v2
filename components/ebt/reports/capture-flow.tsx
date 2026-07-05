'use client'
import { createContext, useCallback, useContext, useState } from 'react'
import { cn } from '@/lib/ebt/cn'
import {
  SECTION_ORDER,
  sectionStatus,
  type ReportSnapshot,
  type SectionKey,
} from '@/lib/ebt/reports/sections'
import type { SaveState } from '@/lib/ebt/reports/use-autosave'

const SaveCtx = createContext<(s: SaveState, m?: string | null) => void>(() => {})
export const useFlowSave = () => useContext(SaveCtx)

export function CaptureFlow({
  snapshot,
  steps,
  footer,
}: {
  reportId: string
  locked: boolean
  snapshot: ReportSnapshot
  steps: Record<SectionKey, React.ReactNode>
  footer?: React.ReactNode
}) {
  const [active, setActive] = useState<SectionKey>('trainee')
  const [save, setSave] = useState<{ state: SaveState; message?: string | null }>({
    state: 'idle',
  })
  const idx = SECTION_ORDER.findIndex((s) => s.key === active)
  // Stable identity (useCallback) so consumers' `useEffect(..., [flowSave])` don't re-fire every
  // render, and a no-op bail-out when status is unchanged — together these break the render loop
  // that EvalHeader (and any other useFlowSave consumer) would otherwise trigger.
  const setSaveStatus = useCallback((state: SaveState, message: string | null = null) => {
    setSave((prev) =>
      prev.state === state && (prev.message ?? null) === message ? prev : { state, message }
    )
  }, [])

  const completed = SECTION_ORDER.filter(
    (s) => sectionStatus(s.key, snapshot) === 'complete'
  ).length
  const pct = Math.round((completed / SECTION_ORDER.length) * 100)

  const nextLabel = idx < SECTION_ORDER.length - 1 ? SECTION_ORDER[idx + 1].label : null

  // Build rail items with group headers
  const railItems: React.ReactNode[] = []
  let lastGroup = ''
  for (const s of SECTION_ORDER) {
    if (s.group !== lastGroup) {
      railItems.push(
        <div key={`grp-${s.group}`} className="rf-grp">
          {s.group}
        </div>
      )
      lastGroup = s.group
    }
    const st = sectionStatus(s.key, snapshot)
    const tickCls =
      st === 'complete' ? 'rf-tick on' : st === 'attention' ? 'rf-tick warn' : 'rf-tick'
    railItems.push(
      <button
        key={s.key}
        type="button"
        className={cn('rf-railbtn', active === s.key && 'active')}
        onClick={() => setActive(s.key)}
      >
        <span className="rf-bdg">{s.badge}</span>
        <span className="rf-lbl2">{s.label}</span>
        <span className={tickCls} />
      </button>
    )
  }

  return (
    <SaveCtx.Provider value={setSaveStatus}>
      <div className="rf-panes">
        {/* Rail */}
        <aside className="rf-rail">
          <h2>Report sections</h2>
          <div className="rf-meter">
            <i style={{ width: pct + '%' }} />
          </div>
          <nav>{railItems}</nav>
        </aside>

        {/* Work area */}
        <div className="rf-work">
          {SECTION_ORDER.map((s) => (
            <div key={s.key} className={cn('rf-panel', active === s.key && 'show')}>
              {steps[s.key]}
            </div>
          ))}
          {footer}
        </div>
      </div>

      {/* Sticky footer */}
      <footer className="rf-footer">
        <div className="rf-inner">
          {/* Always-mounted live region: only the TEXT inside changes, so screen readers
              announce saving → saved/error transitions instead of missing them entirely. */}
          <span role="status" aria-live="polite">
            {save.state === 'saving' ? (
              <span className="rf-saved saving">Saving…</span>
            ) : save.state === 'saved' ? (
              <span className="rf-saved">
                <span className="sd" />
                Saved
              </span>
            ) : save.state === 'error' ? (
              <span className="rf-saved err">{save.message ?? "Couldn't save — retry"}</span>
            ) : (
              <span className="rf-progresstxt">All changes save automatically</span>
            )}
          </span>
          <span className="rf-progresstxt">
            {`Section ${idx + 1} of ${SECTION_ORDER.length} · ${SECTION_ORDER[idx].label}`}
          </span>
          <div className="rf-fbtns">
            <button
              type="button"
              className="rf-btn"
              disabled={idx <= 0}
              onClick={() => setActive(SECTION_ORDER[idx - 1].key)}
            >
              Back
            </button>
            <button
              type="button"
              className="rf-btn primary"
              disabled={idx >= SECTION_ORDER.length - 1}
              onClick={() => setActive(SECTION_ORDER[idx + 1].key)}
            >
              {nextLabel ? `Next: ${nextLabel}` : 'Done'}
            </button>
          </div>
        </div>
      </footer>
    </SaveCtx.Provider>
  )
}
