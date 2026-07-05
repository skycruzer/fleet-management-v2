'use client'
import { useCallback, useRef, useState } from 'react'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'
export type SaveFn<T> = (value: T) => Promise<{ ok: boolean; message?: string }>

/** Debounced, last-write-wins autosave with a truthful status. The caller renders `state`
 *  ("idle"|"saving"|"saved"|"error") + `message` in the flow footer. `schedule` debounces
 *  (text inputs); `saveNow` flushes immediately (selects/toggles/blur). */
export function useAutosave<T>(save: SaveFn<T>, opts: { debounceMs?: number } = {}) {
  const { debounceMs = 600 } = opts
  const [state, setState] = useState<SaveState>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef<{ value: T } | null>(null)
  const chain = useRef<Promise<void>>(Promise.resolve())

  const flush = useCallback(() => {
    // Saves are CHAINED so two flushes can never race: the DB write order matches input
    // order and the footer always reflects the LAST save's outcome (true last-write-wins).
    const next = chain.current.then(async () => {
      if (!latest.current) return // value already consumed by an earlier queued flush
      const { value } = latest.current
      latest.current = null
      setState('saving')
      setMessage(null)
      try {
        const res = await save(value)
        if (res.ok) setState('saved')
        else {
          setState('error')
          setMessage(res.message ?? "Couldn't save — retry.")
        }
      } catch {
        // A REJECTED server-action call (network drop, 500 before the action runs) must
        // surface as an error — previously it was an unhandled rejection that left the
        // footer stuck on "Saving…" while the examiner's input silently failed to persist.
        setState('error')
        setMessage("Couldn't save — check your connection, then re-enter the change.")
      }
    })
    chain.current = next
    return next
  }, [save])

  const schedule = useCallback(
    (value: T) => {
      latest.current = { value }
      setState('saving')
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        void flush()
      }, debounceMs)
    },
    [flush, debounceMs]
  )

  const saveNow = useCallback(
    async (value: T) => {
      latest.current = { value }
      if (timer.current) clearTimeout(timer.current)
      await flush()
    },
    [flush]
  )

  return { state, message, schedule, saveNow }
}
