/** Presentation helpers for the roster list. Pure + framework-free so the count/sort/badge logic
 *  is unit-testable instead of buried in the server-component page. */

/** Map an employment status to a roster badge. Active reads as the current/positive state; any
 *  non-active status renders as a neutral "Inactive" chip so it stands out without alarming. */
export function pilotStatusBadge(status: string): { label: string; cls: string } {
  if (status === 'active') return { label: 'Active', cls: 'ok' }
  return { label: 'Inactive', cls: '' }
}

/** Partition a staff-no-ordered pilot list into display rows and report the counts.
 *  By default only active pilots are shown; pass showInactive to append inactive pilots after the
 *  active ones (active-first, stable within each group). Counts always reflect the full list so a
 *  "Show inactive" toggle can report how many are hidden. */
export function buildRosterView<T extends { employment_status: string }>(
  pilots: T[],
  showInactive = false
): { rows: T[]; activeCount: number; inactiveCount: number } {
  const active = pilots.filter((p) => p.employment_status === 'active')
  const inactive = pilots.filter((p) => p.employment_status !== 'active')
  const rows = showInactive ? [...active, ...inactive] : active
  return { rows, activeCount: active.length, inactiveCount: inactive.length }
}
