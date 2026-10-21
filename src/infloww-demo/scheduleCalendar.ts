export function calendarDays(year: number, month: number): Date[] {
  const offset = new Date(year, month, 1).getDay()
  return Array.from({ length: 42 }, (_, index) => new Date(year, month, index - offset + 1))
}

export function scheduleTimestamp(day: Date, hour: number, minute: number): number {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) return NaN
  const date = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0)
  // Reject local times that roll forward through a daylight-saving gap.
  return date.getHours() === hour && date.getMinutes() === minute ? date.getTime() : NaN
}

export function isPastScheduleDay(day: Date, now: number): boolean {
  const today = new Date(now)
  return new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
}
