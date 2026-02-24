// Maurice Rondeau — Published Rosters date utility functions

export function isToday(startDate: string, dayNumber: number): boolean {
  const d = new Date(startDate + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + dayNumber - 1)
  const today = new Date()
  return (
    d.getUTCFullYear() === today.getUTCFullYear() &&
    d.getUTCMonth() === today.getUTCMonth() &&
    d.getUTCDate() === today.getUTCDate()
  )
}

export function getDateLabel(startDate: string, dayNumber: number): string {
  const d = new Date(startDate + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + dayNumber - 1)
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', timeZone: 'UTC' })
}

export function getDateLabelWithWeekday(startDate: string, dayNumber: number): string {
  const d = new Date(startDate + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + dayNumber - 1)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  })
}

export function getDayOfWeek(startDate: string, dayNumber: number): string {
  const d = new Date(startDate + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + dayNumber - 1)
  return d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
}

export function isWeekend(startDate: string, dayNumber: number): boolean {
  const d = new Date(startDate + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + dayNumber - 1)
  const dow = d.getUTCDay()
  return dow === 0 || dow === 6
}
