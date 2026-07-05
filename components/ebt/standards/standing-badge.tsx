import { Badge } from '@/components/ebt/ui/badge'
import { classifyStanding, type StandingSignals } from '@/lib/ebt/analytics/standing'
import { tierLabel, tierColor, type Tone } from '@/lib/ebt/analytics/standing-display'

const TONE_CLASS: Record<Tone, string> = {
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  ok: '',
  muted: '',
}

export function StandingBadge({
  signals,
  notCompetentCount,
  belowEffectiveCount,
}: {
  signals: StandingSignals
  notCompetentCount: number
  belowEffectiveCount: number
}) {
  const tier = classifyStanding(signals)
  const tone = tierColor(tier)
  return (
    <div className="flex flex-wrap items-center gap-4" data-testid="standing-badge">
      <Badge className={`text-sm tracking-wide uppercase ${TONE_CLASS[tone]}`} data-tier={tier}>
        {tierLabel(tier)}
      </Badge>
      <span className="text-muted-foreground text-xs">
        Not competent (=1): <b className="text-foreground">{notCompetentCount}</b>
      </span>
      <span className="text-muted-foreground text-xs">
        Below effective (≤2): <b className="text-foreground">{belowEffectiveCount}</b>
      </span>
    </div>
  )
}
