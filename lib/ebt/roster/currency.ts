export type CurrencyBucket = 'valid' | 'expiring' | 'expired' | 'unknown'

/** Mirror of the DB v_pilot_currency bucketing: <0 expired, 0..60 expiring, >60 valid. */
export function currencyBucket(daysToExpiry: number | null): CurrencyBucket {
  if (daysToExpiry === null || daysToExpiry === undefined) return 'unknown'
  if (daysToExpiry < 0) return 'expired'
  if (daysToExpiry <= 60) return 'expiring'
  return 'valid'
}

export function bucketLabel(b: CurrencyBucket): string {
  return b === 'valid' ? 'Valid' : b === 'expiring' ? 'Expiring' : b === 'expired' ? 'Expired' : '—'
}

/** Tailwind classes for a chip of the given bucket. */
export function bucketClasses(b: CurrencyBucket): string {
  switch (b) {
    case 'valid':
      return 'bg-green-100 text-green-700'
    case 'expiring':
      return 'bg-amber-100 text-amber-700'
    case 'expired':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-slate-100 text-slate-500'
  }
}
