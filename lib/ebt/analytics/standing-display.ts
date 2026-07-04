import type { StandingTier } from './standing'

export type Tone = 'green' | 'amber' | 'orange' | 'red' | 'ok' | 'muted'

const TIER_LABELS: Record<StandingTier, string> = {
  effective: 'Effective',
  competent_monitor: 'Competent – monitor',
  additional_training: 'Additional training (3-mo)',
  not_competent: 'Not Competent',
}

const TIER_COLORS: Record<StandingTier, Tone> = {
  effective: 'green',
  competent_monitor: 'amber',
  additional_training: 'orange',
  not_competent: 'red',
}

export function tierLabel(t: StandingTier): string {
  return TIER_LABELS[t]
}

export function tierColor(t: StandingTier): Tone {
  return TIER_COLORS[t]
}

/** Cell tone for a latest-EVAL grade: 1 red, 2 amber, >=3 ok, null muted. */
export function gradeCellTone(grade: number | null): Tone {
  if (grade == null) return 'muted'
  if (grade === 1) return 'red'
  if (grade === 2) return 'amber'
  return 'ok'
}
