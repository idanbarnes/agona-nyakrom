export function formatIcsDate(value) {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    const dateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (dateMatch) {
      return `${dateMatch[1]}${dateMatch[2]}${dateMatch[3]}`
    }
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

function escapeIcsText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}

export function buildIcsEvent({
  title,
  description,
  date,
  uid,
  isAllDay = true,
  isComingSoon = false,
}) {
  const now = new Date()
  const dtStamp = formatIcsDate(now)
  const eventDate = date ? formatIcsDate(date) : ''
  const todayDate = formatLocalDate(now)
  const summaryText = isComingSoon
    ? `${title} (Coming Soon)`
    : title
  const descriptionText = isComingSoon
    ? `${description || ''}\nDate to be announced.`.trim()
    : description || ''

  const dtStart = eventDate || todayDate
  const dtEnd = (() => {
    if (!isAllDay) return dtStart
    if (eventDate && /^\d{8}$/.test(eventDate)) {
      const year = Number(eventDate.slice(0, 4))
      const month = Number(eventDate.slice(4, 6)) - 1
      const day = Number(eventDate.slice(6, 8))
      const nextDate = new Date(Date.UTC(year, month, day + 1))
      return formatIcsDate(nextDate)
    }
    const nextLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    return formatLocalDate(nextLocal)
  })()

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Agona Nyakrom//Events//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(uid)}`,
    `DTSTAMP:${dtStamp}T000000Z`,
    isAllDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`,
    isAllDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(summaryText)}`,
    descriptionText ? `DESCRIPTION:${escapeIcsText(descriptionText)}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\n')
}

export function downloadIcs({ filename, content }) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noreferrer'
  anchor.target = '_blank'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
