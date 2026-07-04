export type SectionKey =
  | 'trainee'
  | 'eval'
  | 'mv'
  | 'sbt'
  | 'isi'
  | 'declaration'
  | 'quals'
  | 'examiner'
  | 'signoff'
export type SectionState = 'complete' | 'incomplete' | 'attention'

export interface ReportSnapshot {
  carryoverAcknowledged: boolean
  moduleSet: boolean
  evalGraded: boolean
  evalResult: 'pass' | 'fail' | 'incomplete' | null
  mvProgressSet: boolean
  sbtProgressSet: boolean
  isiProgressSet: boolean
  declarationReleased: boolean | null
  qualsCount: number
  specsCount: number
  ioaSet: boolean
  examinerSigned: boolean
  traineeSigned: boolean
}

export const SECTION_ORDER: {
  key: SectionKey
  label: string
  tag: string
  day: string
  group: string
  badge: string
}[] = [
  {
    key: 'trainee',
    label: 'Trainee Details',
    tag: 'Section A',
    day: '',
    group: 'Trainee',
    badge: 'A',
  },
  { key: 'eval', label: 'Evaluation', tag: 'Section B', day: 'Day 1', group: 'Day 1', badge: 'B' },
  {
    key: 'mv',
    label: 'Manoeuvres Validation',
    tag: 'Section C',
    day: 'Day 1',
    group: 'Day 1',
    badge: 'C',
  },
  {
    key: 'sbt',
    label: 'Scenario-Based Training',
    tag: 'Section D',
    day: 'Day 2',
    group: 'Day 2',
    badge: 'D',
  },
  {
    key: 'isi',
    label: 'In-Seat Instruction',
    tag: 'Section E',
    day: 'Day 2',
    group: 'Day 2',
    badge: 'E',
  },
  {
    key: 'declaration',
    label: 'Examiner Declaration',
    tag: '',
    day: '',
    group: 'Certification',
    badge: '✓',
  },
  {
    key: 'quals',
    label: 'Qualifications & Specialised Training',
    tag: '',
    day: '',
    group: 'Certification',
    badge: '◆',
  },
  {
    key: 'examiner',
    label: 'Examiner Details',
    tag: '',
    day: '',
    group: 'Certification',
    badge: '✦',
  },
  { key: 'signoff', label: 'Signatures', tag: '', day: '', group: 'Certification', badge: '✎' },
]

/** Completion is DERIVED from the data so the rail can't lie. */
export function sectionStatus(key: SectionKey, s: ReportSnapshot): SectionState {
  switch (key) {
    case 'trainee':
      return s.carryoverAcknowledged ? 'complete' : 'attention'
    case 'eval':
      return s.moduleSet && s.evalGraded && s.evalResult != null ? 'complete' : 'incomplete'
    case 'mv':
      return s.mvProgressSet ? 'complete' : 'incomplete'
    case 'sbt':
      return s.sbtProgressSet ? 'complete' : 'incomplete'
    case 'isi':
      return s.isiProgressSet ? 'complete' : 'incomplete'
    case 'declaration':
      return s.declarationReleased != null ? 'complete' : 'incomplete'
    case 'quals':
      return s.qualsCount > 0 || s.specsCount > 0 ? 'complete' : 'incomplete'
    case 'examiner':
      return s.ioaSet ? 'complete' : 'incomplete'
    case 'signoff':
      return s.examinerSigned && s.traineeSigned ? 'complete' : 'incomplete'
  }
}
