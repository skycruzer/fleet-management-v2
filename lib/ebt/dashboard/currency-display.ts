// Dashboard currency-card display policy — the one place that decides how a
// raw {expired, expiring, valid, noRecord} count becomes a card. Pure so it can
// be unit-tested and so the page stays dumb (mirrors lib/analytics/standing.ts).
import type { CurrencyKind } from './queries'

export type Tone = 'bad' | 'warn' | 'ok'

export interface CurrencyCardView {
  /** Card-level severity: bad if anything is expired OR a record is missing. */
  tone: Tone
  /** The single most-urgent bucket, rendered as the big number + its noun, so
   *  the headline is never a bare number whose meaning shifts between cards. */
  hero: { num: number; word: string; tone: Tone }
  /** The two non-hero buckets ("N noun"), in fixed severity order. */
  rest: string[]
  /** Active pilots with no record on file for this track (0 → hide the line). */
  noRecord: number
}

type Bucket = 'expired' | 'expiring' | 'valid'
const NOUN: Record<Bucket, string> = {
  expired: 'expired',
  expiring: 'expiring ≤60d',
  valid: 'current',
}
const BUCKET_TONE: Record<Bucket, Tone> = { expired: 'bad', expiring: 'warn', valid: 'ok' }
const ORDER: readonly Bucket[] = ['expired', 'expiring', 'valid']

/**
 * Pure: fold raw currency counts into a card display model.
 * Hero precedence is expired ▸ expiring ▸ current (most urgent non-zero bucket),
 * always paired with its noun. A missing record forces the card red even when
 * nothing is expired/expiring, because "no medical on file" can't fly either.
 */
export function currencyCardView(k: CurrencyKind): CurrencyCardView {
  const hero: Bucket = k.expired > 0 ? 'expired' : k.expiring > 0 ? 'expiring' : 'valid'
  const count: Record<Bucket, number> = {
    expired: k.expired,
    expiring: k.expiring,
    valid: k.valid,
  }
  const rest = ORDER.filter((b) => b !== hero).map((b) => `${count[b]} ${NOUN[b]}`)
  const tone: Tone = k.expired > 0 || k.noRecord > 0 ? 'bad' : k.expiring > 0 ? 'warn' : 'ok'
  return {
    tone,
    hero: { num: count[hero], word: NOUN[hero], tone: BUCKET_TONE[hero] },
    rest,
    noRecord: k.noRecord,
  }
}
