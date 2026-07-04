import { currencyBucket, bucketLabel, bucketClasses } from '@/lib/ebt/roster/currency'

export function CurrencyChip({
  code,
  daysToExpiry,
  validTo,
}: {
  code: string
  daysToExpiry: number | null
  validTo: string | null
}) {
  const bucket = currencyBucket(daysToExpiry)
  const label =
    code === 'INSTRUMENT_RATING'
      ? 'IR'
      : code === 'MEDICAL'
        ? 'Medical'
        : code === 'PROFICIENCY'
          ? 'Proficiency'
          : code.replace(/_/g, ' ')
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div>
        <div className="text-xs text-slate-500 uppercase">{label}</div>
        <div className="text-sm font-semibold">{validTo ?? '—'}</div>
      </div>
      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${bucketClasses(bucket)}`}>
        {bucketLabel(bucket)}
        {daysToExpiry !== null ? ` · ${daysToExpiry}d` : ''}
      </span>
    </div>
  )
}
