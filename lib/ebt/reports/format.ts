export type GradeTone = 'below' | 'adequate' | 'good' | 'unassessed'

/** Grade colour bucket: 1-2 below standard, 3 adequate (min), 4-5 effective+, null not assessed. */
export function gradeTone(grade: number | null): GradeTone {
  if (grade == null) return 'unassessed'
  if (grade <= 2) return 'below'
  if (grade === 3) return 'adequate'
  return 'good'
}

const STATUS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  signed_off: 'Signed off',
  finalized: 'Finalized',
}
export function statusLabel(s: string): string {
  return STATUS[s] ?? s
}

const RESULT: Record<string, string> = { pass: 'Pass', fail: 'Fail', incomplete: 'Incomplete' }
export function resultLabel(r: string | null): string {
  return r ? (RESULT[r] ?? r) : '—'
}

/** Tailwind classes for a grade tone (matches the maroon brand + green/amber/red scale). */
export function toneClasses(tone: GradeTone): string {
  switch (tone) {
    case 'below':
      return 'bg-red-600 text-white'
    case 'adequate':
      return 'bg-amber-500 text-white'
    case 'good':
      return 'bg-green-600 text-white'
    default:
      return 'bg-slate-100 text-slate-500'
  }
}
