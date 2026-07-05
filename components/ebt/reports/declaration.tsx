'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { setDeclaration, type ReportActionState } from '@/app/dashboard/ebt/reports/report-actions'
import { useAutosave } from '@/lib/ebt/reports/use-autosave'
import { useFlowSave } from '@/components/ebt/reports/capture-flow'
import { cn } from '@/lib/ebt/cn'

const initialState: ReportActionState = { ok: false, message: '' }

type ReleasedValue = 'yes' | 'no' | ''

function seedReleased(released: boolean | null): ReleasedValue {
  if (released === true) return 'yes'
  if (released === false) return 'no'
  return ''
}

export function Declaration({
  reportId,
  released,
  additionalComments,
  hasOpenRemedial,
  remedialCodes,
  locked,
}: {
  reportId: string
  released: boolean | null
  additionalComments: string | null
  hasOpenRemedial: boolean
  remedialCodes: string[]
  locked: boolean
}) {
  const [releasedValue, setReleasedValue] = useState<ReleasedValue>(seedReleased(released))
  const [additionalCommentsValue, setAdditionalCommentsValue] = useState(additionalComments ?? '')

  const flowSave = useFlowSave()

  const buildFormData = useCallback(
    (
      overrides: Partial<{
        released: ReleasedValue
        additionalComments: string
      }> = {}
    ): FormData => {
      const fd = new FormData()
      fd.set(
        'declaration_released',
        overrides.released !== undefined ? overrides.released : releasedValue
      )
      fd.set(
        'additional_comments',
        overrides.additionalComments !== undefined
          ? overrides.additionalComments
          : additionalCommentsValue
      )
      return fd
    },
    [releasedValue, additionalCommentsValue]
  )

  const saveFn = useCallback(
    (fd: FormData) => setDeclaration(reportId, initialState, fd),
    [reportId]
  )

  const autosave = useAutosave<FormData>(saveFn, { debounceMs: 800 })

  useEffect(() => {
    flowSave(autosave.state, autosave.message)
  }, [autosave.state, autosave.message, flowSave])

  // Released radio — immediate save; revert to prior value + show toast on a failed "yes" selection
  async function handleReleasedChange(value: ReleasedValue) {
    const next = value
    const prev = releasedValue
    setReleasedValue(next)

    flowSave('saving', null)
    const result = await setDeclaration(reportId, initialState, buildFormData({ released: next }))

    if (result.ok) {
      flowSave('saved', null)
    } else {
      flowSave('error', result.message || "Couldn't save — retry.")
      toast.error(result.message || 'Could not save — please try again.')
      if (next === 'yes') {
        setReleasedValue(prev)
      }
    }
  }

  function handleAdditionalCommentsChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value
    setAdditionalCommentsValue(next)
    autosave.schedule(buildFormData({ additionalComments: next }))
  }

  const yesDisabled = locked || hasOpenRemedial

  return (
    <div>
      {/* Certification text */}
      <div className="rf-declbox rf-blockgap">
        I CERTIFY THAT THE TRAINEE HAS MET THE REQUIRED STANDARD, AS DOCUMENTED IN CHAPTER 15 OF THE
        AIR NIUGINI TCM VOLUME 1, IN ALL COMPETENCIES DETAILED IN THE PILOT COMPETENCY FRAMEWORK AND
        IS RELEASED FOR LINE OPERATIONS.
      </div>

      {/* Released YES / NO */}
      <label className="rf-lbl">Released for line operations?</label>
      <div
        className="rf-radios rf-blockgap inline"
        role="radiogroup"
        aria-label="Released for line operations?"
      >
        <label
          className={cn(
            'rf-radio',
            releasedValue === 'yes' && 'sel',
            yesDisabled && 'cursor-not-allowed opacity-40'
          )}
        >
          <input
            type="radio"
            className="sr-only"
            name={`released-${reportId}`}
            checked={releasedValue === 'yes'}
            disabled={yesDisabled}
            onChange={() => handleReleasedChange('yes')}
          />
          <span className="rf-rb" aria-hidden="true" />
          <span className="rf-rt">YES</span>
        </label>
        <label
          className={cn(
            'rf-radio',
            releasedValue === 'no' && 'sel',
            locked && 'cursor-not-allowed opacity-40'
          )}
        >
          <input
            type="radio"
            className="sr-only"
            name={`released-${reportId}`}
            checked={releasedValue === 'no'}
            disabled={locked}
            onChange={() => handleReleasedChange('no')}
          />
          <span className="rf-rb" aria-hidden="true" />
          <span className="rf-rt">NO</span>
        </label>
      </div>

      {/* Release-block warning */}
      {hasOpenRemedial && (
        <div
          className="rf-blockgap"
          style={{
            borderLeft: '4px solid #c0392b',
            background: '#fef2f2',
            borderRadius: '11px',
            padding: '12px 16px',
            fontSize: '13px',
            color: '#7f1d1d',
            lineHeight: '1.6',
          }}
        >
          Release blocked — open remedial requirement ({remedialCodes.join(', ') || '—'}). The pilot
          cannot be released for line operations until remedial training is completed and recorded.
        </div>
      )}

      {/* Additional Comments */}
      <label className="rf-lbl" htmlFor="additional-comments">
        Additional Comments
      </label>
      <textarea
        id="additional-comments"
        className="rf-ctl"
        value={additionalCommentsValue}
        onChange={handleAdditionalCommentsChange}
        disabled={locked}
        placeholder="Any additional notes…"
      />
    </div>
  )
}
