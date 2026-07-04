import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a stored date string (YYYY-MM-DD, or an ISO timestamp) as Australian DD/MM/YYYY.
 *  Pure string transform — no Date()/timezone shift. Returns an em dash for null/empty,
 *  and passes through anything that isn't a YYYY-MM-DD date unchanged. */
export function formatAuDate(value: string | null | undefined): string {
  if (!value) return '—'
  const m = value.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value
}
