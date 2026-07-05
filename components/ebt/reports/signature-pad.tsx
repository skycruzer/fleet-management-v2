'use client'
import { useId, useRef, useState } from 'react'
import {
  saveSignature,
  type SignatureKind,
  type SignatureResult,
} from '@/app/dashboard/ebt/reports/signature-actions'

export function SignaturePad({
  reportId,
  kind,
  label,
  signed,
  locked,
  save: saveFn,
}: {
  reportId: string
  kind: string
  label: string
  signed: boolean
  locked: boolean
  save?: (reportId: string, kind: string, dataUrl: string) => Promise<SignatureResult>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [done, setDone] = useState(signed)
  const [msg, setMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  // Blank guard (#4): the canvas has content from either input method — mouse/touch strokes
  // (hasDrawn) or a typed name (typed). Save stays disabled until one of them is present, and
  // the server still rejects a zero-byte PNG.
  const [hasDrawn, setHasDrawn] = useState(false)
  const [typed, setTyped] = useState('')
  const typeFieldId = useId()

  const hasContent = hasDrawn || typed.trim() !== ''

  function pos(e: React.PointerEvent) {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  function down(e: React.PointerEvent) {
    if (locked) return
    drawing.current = true
    setHasDrawn(true)
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const p = pos(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const p = pos(e)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1e293b'
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }
  function up() {
    drawing.current = false
  }

  // Keyboard/AT signing path (#4): render the typed name onto the same canvas so the stored
  // artifact stays a PNG. Typing is the alternative to drawing, so it replaces any prior strokes.
  function renderTyped(text: string) {
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return // unsupported 2d context (e.g. jsdom): the state still drives the guard
    ctx.clearRect(0, 0, c.width, c.height)
    if (text.trim()) {
      ctx.fillStyle = '#1e293b'
      ctx.font = "30px 'Segoe Script','Snell Roundhand',cursive"
      ctx.textBaseline = 'middle'
      ctx.fillText(text, 14, c.height / 2)
    }
  }
  function onType(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setTyped(v)
    setHasDrawn(false) // typing re-renders the canvas, replacing any strokes
    renderTyped(v)
  }

  function clear() {
    const c = canvasRef.current
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height)
    setHasDrawn(false)
    setTyped('')
  }
  async function save() {
    setSaving(true)
    setMsg(null)
    const dataUrl = canvasRef.current!.toDataURL('image/png')
    const fn: (reportId: string, kind: string, dataUrl: string) => Promise<SignatureResult> =
      saveFn ?? ((r, k, d) => saveSignature(r, k as SignatureKind, d))
    const res = await fn(reportId, kind, dataUrl)
    setSaving(false)
    if (res.ok) {
      setDone(true)
      setMsg('Signed ✓')
    } else setMsg(res.message ?? 'Could not save.')
  }

  return (
    <div
      className={`rf-sigbox${done ? 'signed' : ''}`}
      style={{
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        padding: done ? '12px' : '10px',
        gap: 8,
      }}
    >
      {done ? (
        <span className="rf-sigink">✓</span>
      ) : !locked ? (
        <>
          <canvas
            ref={canvasRef}
            width={300}
            height={90}
            aria-label={label}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerLeave={up}
            className="touch-none"
            style={{
              width: '100%',
              borderRadius: 8,
              border: '1px dashed #d4cabd',
              background: '#fdfbf8',
            }}
          />
          {/* Keyboard/AT alternative to drawing — renders the typed name onto the canvas. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label
              htmlFor={typeFieldId}
              style={{ fontSize: 11, color: 'var(--rf-muted, #6b6270)' }}
            >
              Or type your name to sign
            </label>
            <input
              id={typeFieldId}
              type="text"
              className="rf-ctl"
              value={typed}
              onChange={onType}
              placeholder="Full name"
              autoComplete="off"
              style={{ fontSize: 13, padding: '6px 10px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="rf-btn primary"
              onClick={save}
              disabled={saving || !hasContent}
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              {saving ? 'Saving…' : 'Save signature'}
            </button>
            <button
              type="button"
              className="rf-btn"
              onClick={clear}
              disabled={!hasContent}
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              Clear
            </button>
          </div>
        </>
      ) : (
        <span style={{ fontSize: 12, color: 'var(--rf-faint, #6b6270)' }}>Signed on submit.</span>
      )}
      {msg && (
        <span
          role="status"
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: done ? 'var(--rf-green, #2f7d4f)' : 'var(--rf-red, #c0392b)',
          }}
        >
          {msg}
        </span>
      )}
    </div>
  )
}
