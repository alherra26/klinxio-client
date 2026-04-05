const DAY_MS = 24 * 60 * 60 * 1000

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

export function getStartOfWeek(date: Date): Date {
  const day = date.getDay()
  const diffFromMonday = day === 0 ? 6 : day - 1
  return addDays(new Date(date.getFullYear(), date.getMonth(), date.getDate()), -diffFromMonday)
}

export function formatWeekRange(start: Date): string {
  const end = addDays(start, 6)
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  return `${formatter.format(start)} - ${formatter.format(end)}`
}

export function formatAppointmentDate(isoDate: string): string {
  const date = new Date(isoDate)
  const formatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  return formatter.format(date)
}
