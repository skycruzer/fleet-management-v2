/**
 * Escape PostgREST LIKE/ILIKE metacharacters so caller-supplied text is
 * matched literally rather than interpreted as a wildcard pattern.
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}
