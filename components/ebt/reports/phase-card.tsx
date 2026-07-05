'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAutosave } from '@/lib/ebt/reports/use-autosave'
import { useFlowSave } from '@/components/ebt/reports/capture-flow'
import { savePhase } from '@/app/dashboard/ebt/reports/report-actions'
import { cn } from '@/lib/ebt/cn'

const PROGRESS_OPTIONS = [
  { value: 'achieved', label: 'OBJECTIVE(S) ACHIEVED' },
  { value: 'achieved_with_practice', label: 'OBJECTIVE(S) ACHIEVED WITH ADDITIONAL PRACTICE' },
  { value: 'not_achieved', label: 'OBJECTIVE(S) NOT ACHIEVED' },
] as const

type ProgressCode = 'achieved' | 'achieved_with_practice' | 'not_achieved'

function seedProgress(raw: string | null): ProgressCode | '' {
  if (raw === 'achieved' || raw === 'achieved_with_practice' || raw === 'not_achieved') return raw
  return ''
}

interface PhasePatch {
  progress: string | null
  overall_comments: string | null
}

export function PhaseCard({
  reportId,
  phase,
  title,
  day,
  initialProgress,
  initialComments,
  commentsLabel,
  locked,
}: {
  reportId: string
  phase: 'MV' | 'SBT' | 'ISI'
  title: string
  day: string
  initialProgress: string | null
  initialComments: string | null
  commentsLabel: string
  locked: boolean
}) {
  const [progress, setProgress] = useState<ProgressCode | ''>(seedProgress(initialProgress))
  const [comments, setComments] = useState<string>(initialComments ?? '')

  const flowSave = useFlowSave()

  const saveFn = useCallback(
    (patch: PhasePatch) => {
      const fd = new FormData()
      fd.set('progress', patch.progress ?? '')
      fd.set('overall_comments', patch.overall_comments ?? '')
      fd.set('result', '')
      return savePhase(reportId, phase, { ok: false, message: '' }, fd)
    },
    [reportId, phase]
  )

  const autosave = useAutosave<PhasePatch>(saveFn, { debounceMs: 800 })

  useEffect(() => {
    flowSave(autosave.state, autosave.message)
  }, [autosave.state, autosave.message, flowSave])

  const buildPatch = useCallback(
    (overrides: Partial<PhasePatch> = {}): PhasePatch => ({
      progress: overrides.progress !== undefined ? overrides.progress : progress || null,
      overall_comments:
        overrides.overall_comments !== undefined ? overrides.overall_comments : comments || null,
    }),
    [progress, comments]
  )

  function handleProgressChange(value: ProgressCode) {
    setProgress(value)
    void autosave.saveNow(buildPatch({ progress: value || null }))
  }

  function handleCommentsChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value
    setComments(next)
    autosave.schedule(buildPatch({ overall_comments: next || null }))
  }

  return (
    <div>
      {/* Progress */}
      <label className="rf-lbl">Progress</label>
      <div className="rf-radios rf-blockgap">
        {PROGRESS_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={cn('rf-radio', progress === opt.value && 'sel')}
            onClick={() => !locked && handleProgressChange(opt.value)}
          >
            <span className="rf-rb" />
            <span className="rf-rt">{opt.label}</span>
          </label>
        ))}
      </div>

      {/* Comments */}
      <div className="rf-field">
        <label className="rf-lbl">{commentsLabel}</label>
        <textarea
          className="rf-ctl"
          value={comments}
          onChange={handleCommentsChange}
          disabled={locked}
        />
      </div>
    </div>
  )
}
