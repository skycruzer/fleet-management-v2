import { notFound } from 'next/navigation'
import { getReport, getFormRefs, getOpenRemedials, getDisplayName } from '@/lib/ebt/reports/queries'
import type { GradeMap } from '@/lib/ebt/reports/rule'
import { CarryoverBanner, type CarryoverItem } from '@/components/ebt/reports/carryover-banner'
import { GradeMatrix } from '@/components/ebt/reports/grade-matrix'
import { PhaseCard } from '@/components/ebt/reports/phase-card'
import { ReportLists } from '@/components/ebt/reports/report-lists'
import { Declaration } from '@/components/ebt/reports/declaration'
import { SubmitBar } from '@/components/ebt/reports/submit-bar'
import { CaptureFlow } from '@/components/ebt/reports/capture-flow'
import { PhaseCompetency } from '@/components/ebt/reports/steps/phase-competency'
import { SignoffStep } from '@/components/ebt/reports/steps/signoff-step'
import { ReportHeader } from '@/components/ebt/reports/report-header'
import { EvalHeader } from '@/components/ebt/reports/steps/eval-header'
import { ExaminerDetails } from '@/components/ebt/reports/steps/examiner-details'
import type { ReportSnapshot, SectionKey } from '@/lib/ebt/reports/sections'
import { getSessionUser, hasRole } from '@/lib/ebt/auth/roles'
import { formatAuDate } from '@/lib/ebt/utils'
import { DeleteReportButton } from '@/components/ebt/reports/delete-report-button'

export default async function CapturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // getFormRefs has no dependency on the report — start it now so the catalog fetch overlaps
  // the session + report reads instead of running as a serial fourth round-trip.
  const refsPromise = getFormRefs()
  const [sessionUser, reportRaw] = await Promise.all([getSessionUser(), getReport(id)])
  const viewerIsFleetManager = hasRole(sessionUser?.role ?? null, 'fleet_manager')
  const report = reportRaw as unknown as
    | (Record<string, unknown> & {
        id: string
        pilot_id: string
        examiner_id: string
        status: string
        snap_name: string | null
        snap_staff_no: string | null
        snap_rank: string | null
        snap_licence: string | null
        snap_medical_class: string | null
        snap_medical_expiry: string | null
        snap_aircraft_type: string | null
        snap_next_ir_expiry: string | null
        snap_next_proficiency_expiry: string | null
        module_no: number | null
        form_version: string | null
        check_type_id: string | null
        training_date: string | null
        is_resit: boolean | null
        declaration_released: boolean | null
        additional_comments: string | null
        ioa_number: string | null
        sim_hours: string | null
        if_hours: string | null
        sim_location: string | null
        sim_level: string | null
        sign_off_date: string | null
        report_phases?: unknown[]
        report_competency_grades?: unknown[]
        report_carryover_focus?: unknown[]
        report_qualifications?: unknown[]
        report_specialised_training?: unknown[]
        report_signatures?: unknown[]
        report_observed_behaviours?: unknown[]
      })
    | null
  if (!report) notFound()
  // Examiner name = the report's actual examiner (examiner_id -> profiles.full_name), NOT the viewer.
  const [refs, openRemedials, examinerName] = await Promise.all([
    refsPromise,
    getOpenRemedials(report.pilot_id),
    getDisplayName(report.examiner_id),
  ])

  const locked = report.status !== 'draft'
  const phases = (report.report_phases ?? []) as {
    phase: string
    progress: string | null
    result: 'pass' | 'fail' | 'incomplete' | null
    technical_events: string | null
    non_technical_events: string | null
    overall_comments: string | null
  }[]
  const evalPhase = phases.find((p) => p.phase === 'EVAL')
  const phaseBy = (k: string) => phases.find((p) => p.phase === k)

  const carryover = (report.report_carryover_focus ?? []) as CarryoverItem[]
  const grades: GradeMap = {}
  for (const g of (report.report_competency_grades ?? []) as {
    phase: string
    competency_code: string
    grade: number | null
  }[]) {
    if (g.phase === 'EVAL') grades[g.competency_code] = g.grade
  }
  const initialObs: Record<string, string[]> = {}
  for (const o of (report.report_observed_behaviours ?? []) as {
    phase: string
    competency_code: string
    observable_behaviour_id: string
  }[]) {
    if (o.phase === 'EVAL') (initialObs[o.competency_code] ??= []).push(o.observable_behaviour_id)
  }

  const mvCodes = (
    (report.report_competency_grades ?? []) as { phase: string; competency_code: string }[]
  )
    .filter((g) => g.phase === 'MV')
    .map((g) => g.competency_code)
  const sbtCodes = (
    (report.report_competency_grades ?? []) as { phase: string; competency_code: string }[]
  )
    .filter((g) => g.phase === 'SBT')
    .map((g) => g.competency_code)

  const selectedQuals = (
    (report.report_qualifications ?? []) as { qualification_id: string }[]
  ).map((r) => r.qualification_id)
  const selectedSpecs = (
    (report.report_specialised_training ?? []) as { specialised_training_id: string }[]
  ).map((r) => r.specialised_training_id)
  const sigKinds = new Set(
    ((report.report_signatures ?? []) as { kind: string }[]).map((s) => s.kind)
  )

  // ── Derive ReportSnapshot for the section-rail status dots ──────────────────
  const snapshot: ReportSnapshot = {
    carryoverAcknowledged:
      carryover.length === 0 ||
      carryover.every(
        (c) => (c as unknown as { acknowledged_at: string | null }).acknowledged_at != null
      ),
    moduleSet: report.module_no != null,
    evalGraded: Object.values(grades).some((v) => v != null),
    evalResult: evalPhase?.result ?? null,
    mvProgressSet: phaseBy('MV')?.progress != null,
    sbtProgressSet: phaseBy('SBT')?.progress != null,
    isiProgressSet: phaseBy('ISI')?.progress != null,
    declarationReleased: report.declaration_released,
    qualsCount: selectedQuals.length,
    specsCount: selectedSpecs.length,
    ioaSet: report.ioa_number != null,
    examinerSigned: sigKinds.has('examiner'),
    traineeSigned: sigKinds.has('trainee'),
  }

  // Split snap_licence "TYPE · NO" into its parts
  const licenceParts = (report.snap_licence ?? '').split(' · ')
  const licenceType = licenceParts[0] || null
  const licenceNo = licenceParts[1] || null

  // ── Snapline for masthead subline ────────────────────────────────────────────
  const snaplineParts = [
    report.snap_name,
    report.snap_staff_no ? `Staff ${report.snap_staff_no}` : null,
    report.snap_rank,
    report.snap_aircraft_type,
  ].filter(Boolean)
  const snapline = snaplineParts.join(' · ')

  // ── Status label ─────────────────────────────────────────────────────────────
  const statusLabel =
    report.status.charAt(0).toUpperCase() + report.status.slice(1).replace(/_/g, ' ')

  // Admins + fleet managers may delete (archive) a report while it is still a draft or submitted;
  // signed-off and finalized reports are immutable compliance records.
  const canDelete =
    viewerIsFleetManager && (report.status === 'draft' || report.status === 'submitted')

  // ── Build step nodes ─────────────────────────────────────────────────────────
  const steps: Record<SectionKey, React.ReactNode> = {
    trainee: (
      <Section tag="Section A" title="Trainee Details" note="Frozen from roster">
        <dl className="rf-snap">
          <div>
            <dt>NAME</dt>
            <dd>{report.snap_name ?? '—'}</dd>
          </div>
          <div>
            <dt>STAFF NO.</dt>
            <dd>{report.snap_staff_no ?? '—'}</dd>
          </div>
          <div>
            <dt>TYPE OF LICENSE</dt>
            <dd>{licenceType ?? '—'}</dd>
          </div>
          <div>
            <dt>LICENSE NO.</dt>
            <dd>{licenceNo ?? '—'}</dd>
          </div>
          <div>
            <dt>CLASS OF MEDICAL</dt>
            <dd>{report.snap_medical_class ?? '—'}</dd>
          </div>
          <div>
            <dt>MEDICAL EXPIRY DATE</dt>
            <dd>{formatAuDate(report.snap_medical_expiry)}</dd>
          </div>
          <div>
            <dt>PILOT RANK</dt>
            <dd>{report.snap_rank ?? '—'}</dd>
          </div>
          <div>
            <dt>NEXT IR EXPIRY DATE</dt>
            <dd>{formatAuDate(report.snap_next_ir_expiry)}</dd>
          </div>
          <div>
            <dt>NEXT PROFICIENCY EXPIRY DATE</dt>
            <dd>{formatAuDate(report.snap_next_proficiency_expiry)}</dd>
          </div>
          <div>
            <dt>AIRCRAFT TYPE</dt>
            <dd>{report.snap_aircraft_type ?? '—'}</dd>
          </div>
        </dl>
        <div className="mt-4">
          <CarryoverBanner
            reportId={report.id}
            items={carryover}
            pilotName={report.snap_name}
            locked={locked}
          />
        </div>
      </Section>
    ),

    eval: (
      <Section tag="Section B" title="Evaluation">
        <div className="space-y-4">
          <EvalHeader
            reportId={report.id}
            initial={{
              is_resit: !!report.is_resit,
              module_no: report.module_no ?? null,
            }}
            locked={locked}
          />
          <GradeMatrix
            reportId={report.id}
            competencies={refs.competencies}
            carryover={carryover.map((c) => ({
              competency_code: c.competency_code,
              previous_grade: c.previous_grade,
            }))}
            initialGrades={grades}
            initialResult={evalPhase?.result ?? null}
            events={{
              technical: evalPhase?.technical_events ?? null,
              nonTechnical: evalPhase?.non_technical_events ?? null,
              comments: evalPhase?.overall_comments ?? null,
            }}
            locked={locked}
            observableBehaviours={refs.observableBehaviours}
            initialObs={initialObs}
          />
        </div>
      </Section>
    ),

    mv: (
      <Section tag="Section C" title="Manoeuvres Validation – Objectives">
        <div className="space-y-4">
          <PhaseCard
            reportId={report.id}
            phase="MV"
            title="Manoeuvres Validation"
            day="Day 1"
            initialProgress={phaseBy('MV')?.progress ?? null}
            initialComments={phaseBy('MV')?.overall_comments ?? null}
            commentsLabel="OVERALL COMMENTS FROM EXAMINER"
            locked={locked}
          />
          <PhaseCompetency
            reportId={report.id}
            phase="MV"
            competencies={refs.competencies}
            initialCodes={mvCodes}
            locked={locked}
          />
        </div>
      </Section>
    ),

    sbt: (
      <Section tag="Section D" title="Scenario-Based Training – Objectives">
        <div className="space-y-4">
          <PhaseCard
            reportId={report.id}
            phase="SBT"
            title="Scenario-Based Training"
            day="Day 2"
            initialProgress={phaseBy('SBT')?.progress ?? null}
            initialComments={phaseBy('SBT')?.overall_comments ?? null}
            commentsLabel="SBT TRAINING OVERALL COMMENTS FROM EXAMINER"
            locked={locked}
          />
          <PhaseCompetency
            reportId={report.id}
            phase="SBT"
            competencies={refs.competencies}
            initialCodes={sbtCodes}
            locked={locked}
          />
        </div>
      </Section>
    ),

    isi: (
      <Section tag="Section E" title="In-Seat Instruction Training – Objectives">
        <PhaseCard
          reportId={report.id}
          phase="ISI"
          title="In-Seat Instruction"
          day="Day 2"
          initialProgress={phaseBy('ISI')?.progress ?? null}
          initialComments={phaseBy('ISI')?.overall_comments ?? null}
          commentsLabel="IN-SEAT INSTRUCTION TRAINING OVERALL COMMENTS FROM EXAMINER"
          locked={locked}
        />
      </Section>
    ),

    declaration: (
      <Section tag="Certification" title="Examiner Declaration">
        <Declaration
          reportId={report.id}
          released={report.declaration_released}
          additionalComments={report.additional_comments}
          hasOpenRemedial={openRemedials.length > 0}
          remedialCodes={openRemedials.map((r) => r.competency_code)}
          locked={locked}
        />
      </Section>
    ),

    quals: (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ReportLists
          reportId={report.id}
          kind="qualifications"
          title="Qualifications"
          options={refs.qualifications}
          initialSelected={selectedQuals}
          locked={locked}
        />
        <ReportLists
          reportId={report.id}
          kind="specialised"
          title="Specialised Training"
          options={refs.specialisedTraining}
          initialSelected={selectedSpecs}
          locked={locked}
        />
      </div>
    ),

    examiner: (
      <Section tag="Certification" title="Examiner Details">
        <ExaminerDetails
          reportId={report.id}
          name={examinerName}
          signOffDate={formatAuDate(report.sign_off_date as string | null)}
          initial={{
            ioa_number: report.ioa_number,
            sim_hours: report.sim_hours,
            if_hours: report.if_hours,
            sim_location: report.sim_location,
            sim_level: report.sim_level,
          }}
          locked={locked}
        />
      </Section>
    ),

    signoff: (
      <div className="space-y-4">
        <SignoffStep
          reportId={report.id}
          status={report.status as 'draft' | 'submitted' | 'signed_off' | 'finalized'}
          viewerIsFleetManager={viewerIsFleetManager}
          signed={{
            examiner: sigKinds.has('examiner'),
            trainee: sigKinds.has('trainee'),
            fleet_manager: sigKinds.has('fleet_manager'),
            emfts: sigKinds.has('emfts'),
          }}
        />
        <SubmitBar reportId={report.id} status={report.status} />
      </div>
    ),
  }

  const footerNode = (
    <>
      <div className="rf-note-foot">
        <span className="ni">i</span>
        <div>
          <b>NOTE:</b> If a pilot passes Section B and C, then the Scenario Based Training (SBT) and
          In-seat Instruction Training (ISI) may be postponed to a later date within the currency of
          the corresponding cyclic. This allows crew to be available for flying duties instead of
          DAY 2 Training.
        </div>
      </div>
      <div className="rf-ver">
        <span className="mono">ANG Training and Evaluation Report · ANGTER RF-293</span>
        <span>Version 1.1 — Aug 06, 2024</span>
      </div>
    </>
  )

  return (
    <div className="rf-shell">
      <div className="rf-wrap">
        {/* Masthead */}
        <header className="rf-masthead">
          <div className="rf-mast-top">
            <div className="rf-brandmark">
              <span className="rf-bird">
                <svg width="24" height="16" viewBox="0 0 24 16" aria-hidden="true">
                  <path d="M1.5 10 L13 2.5 L8.5 13.5 L6.7 10 L3.4 9.2 Z" fill="#fff" />
                </svg>
              </span>
              <div className="rf-who">Air Niugini</div>
            </div>
            <div>
              <h1 className="rf-title">Training &amp; Evaluation Report</h1>
              <div className="rf-subline">{snapline || '—'}</div>
            </div>
            <div className="rf-mast-right">
              <span className="rf-statuschip">
                <span className="d" />
                {statusLabel}
              </span>
              <span className="rf-refno">{report.form_version ?? 'ANGTER RF-293'}</span>
              {canDelete && <DeleteReportButton reportId={report.id} />}
            </div>
          </div>
          <div className="rf-mast-fields">
            <ReportHeader
              reportId={report.id}
              checkTypes={refs.checkTypes}
              initial={{
                check_type_id: report.check_type_id ?? null,
                training_date: report.training_date ?? null,
              }}
              locked={locked}
            />
          </div>
        </header>

        <CaptureFlow
          reportId={report.id}
          locked={locked}
          snapshot={snapshot}
          steps={steps}
          footer={footerNode}
        />
      </div>
    </div>
  )
}

function Section({
  tag,
  title,
  note,
  children,
}: {
  tag: string
  title: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <section className="rf-sec">
      <header>
        <div>
          <div className="rf-eyebrow">{tag}</div>
          <h3>{title}</h3>
        </div>
        {note && <span className="rf-right rf-notepill">{note}</span>}
      </header>
      <div className="rf-body">{children}</div>
    </section>
  )
}
