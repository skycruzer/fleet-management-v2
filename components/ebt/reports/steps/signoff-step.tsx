'use client'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/ebt/cn'
import { SignaturePad } from '@/components/ebt/reports/signature-pad'
import {
  saveSignOffSignature,
  type SignOffKind,
} from '@/app/dashboard/ebt/reports/signature-actions'
import { signOffReport } from '@/app/dashboard/ebt/reports/signoff-actions'

interface Props {
  reportId: string
  status: 'draft' | 'submitted' | 'signed_off' | 'finalized'
  viewerIsFleetManager: boolean
  signed: {
    examiner: boolean
    trainee: boolean
    fleet_manager: boolean
    emfts: boolean
  }
}

// Wrapper that widens SignOffKind → string so it matches SignaturePad's save prop type.
function saveSignOff(reportId: string, kind: string, dataUrl: string) {
  return saveSignOffSignature(reportId, kind as SignOffKind, dataUrl)
}

export function SignoffStep({ reportId, status, viewerIsFleetManager, signed }: Props) {
  const [pending, startTransition] = useTransition()

  // Examiner + trainee pads are captured on draft; read-only afterwards.
  const draftPadsLocked = status !== 'draft'

  // Fleet-manager/EMFTS pads visible once submitted/signed_off/finalized.
  const showSignoffSection =
    status === 'submitted' || status === 'signed_off' || status === 'finalized'

  // Sign-off pads: only a fleet manager can write while status === "submitted".
  const signoffPadsLocked = !(status === 'submitted' && viewerIsFleetManager)

  // "Sign off report" button: only shown to fleet managers while submitted.
  const showSignOffButton = status === 'submitted' && viewerIsFleetManager

  function handleSignOff() {
    startTransition(async () => {
      const res = await signOffReport(reportId)
      if (res.ok) {
        toast.success(res.message ?? 'Report signed off.')
      } else {
        toast.error(res.message ?? 'Could not sign off the report.')
      }
    })
  }

  return (
    <div>
      <div className="rf-sigs">
        {/* Examiner */}
        <div className="rf-sig">
          <div className="rf-cap">Examiner</div>
          <SignaturePad
            reportId={reportId}
            kind="examiner"
            label="Examiner"
            signed={signed.examiner}
            locked={draftPadsLocked}
          />
          <div className={cn('rf-meta', !signed.examiner && 'wait')}>
            {signed.examiner ? 'Captured' : 'Awaiting signature'}
          </div>
        </div>

        {/* Trainee */}
        <div className="rf-sig">
          <div className="rf-cap">Trainee</div>
          <SignaturePad
            reportId={reportId}
            kind="trainee"
            label="Trainee"
            signed={signed.trainee}
            locked={draftPadsLocked}
          />
          <div className={cn('rf-meta', !signed.trainee && 'wait')}>
            {signed.trainee ? 'Captured' : 'Awaiting signature'}
          </div>
        </div>

        {/* Fleet Manager — only shown once submitted/signed_off/finalized */}
        {showSignoffSection && (
          <div className="rf-sig">
            <div className="rf-cap">Fleet Manager</div>
            <SignaturePad
              reportId={reportId}
              kind="fleet_manager"
              label="Fleet Manager"
              signed={signed.fleet_manager}
              locked={signoffPadsLocked}
              save={saveSignOff}
            />
            <div className={cn('rf-meta', !signed.fleet_manager && 'wait')}>
              {signed.fleet_manager ? 'Captured' : 'Awaiting signature'}
            </div>
          </div>
        )}

        {/* EMFTS — only shown once submitted/signed_off/finalized */}
        {showSignoffSection && (
          <div className="rf-sig">
            <div className="rf-cap">EMFTS</div>
            <SignaturePad
              reportId={reportId}
              kind="emfts"
              label="EMFTS"
              signed={signed.emfts}
              locked={signoffPadsLocked}
              save={saveSignOff}
            />
            <div className={cn('rf-meta', !signed.emfts && 'wait')}>
              {signed.emfts ? 'Captured' : 'Awaiting signature'}
            </div>
          </div>
        )}
      </div>

      {/* Sign-off button — only fleet managers while submitted */}
      {showSignOffButton && (
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            className="rf-btn primary"
            onClick={handleSignOff}
            disabled={pending || !signed.fleet_manager}
          >
            {pending ? 'Signing off…' : 'Sign off report'}
          </button>
          {!signed.fleet_manager && (
            <span style={{ fontSize: 12, color: 'var(--rf-faint, #a89fae)' }}>
              Capture the fleet-manager signature first.
            </span>
          )}
        </div>
      )}
    </div>
  )
}
