/**
 * Match a route prefix on a path-segment boundary.
 *
 * Plain startsWith() would make `/api/pilot` also match `/api/pilots`.
 */
export function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}
