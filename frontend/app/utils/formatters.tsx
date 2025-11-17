const pad = (value: number) => String(value).padStart(2, "0")

const toUtcParts = (date: Date) => ({
  year: date.getUTCFullYear(),
  month: date.getUTCMonth() + 1,
  day: date.getUTCDate(),
  hours: date.getUTCHours(),
  minutes: date.getUTCMinutes(),
})

export const formatDate = (date: Date, displayYear: boolean = true) => {
  const { year, month, day, hours, minutes } = toUtcParts(date)

  if (!displayYear) {
    const currentYear = new Date().getUTCFullYear()
    if (year === currentYear) {
      return `${pad(day)}.${pad(month)} ${pad(hours)}:${pad(minutes)}`
    }
  }

  return `${pad(day)}.${pad(month)}.${year} ${pad(hours)}:${pad(minutes)}`
}

export const formatDateStr = (dateString: string | null) => {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  const { day, month, year } = toUtcParts(date)
  return `${pad(day)}.${pad(month)}.${year}`
}


const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" })

const applyOffset = (dateString: string, userPreferredOffset: number) => {
  const base = new Date(dateString)
  return new Date(base.getTime() + userPreferredOffset * 60 * 60 * 1000)
}

export const formatDateWithUserOffset = (
  dateString: string,
  userPreferredOffset: number,
  displayYear: boolean = true,
) => {
  if (!dateString) return "N/A"
  const offsetDate = applyOffset(dateString, userPreferredOffset)
  return formatDate(offsetDate, displayYear)
}

export const formatWeekday = (dateString: string | null, userPreferredOffset: number = 0) => {
  if (!dateString) return "N/A"
  const offsetDate = applyOffset(dateString, userPreferredOffset)
  return WEEKDAY_FORMATTER.format(offsetDate)
}
