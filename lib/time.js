// Small, dependency-free time helpers shared by the app screens.

const UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

/** "just now", "4 min ago", "3 h ago", "2 d ago". Returns "Never" for empty input. */
export function timeAgo(input, now = Date.now()) {
  if (!input) return 'Never'
  const t = new Date(input).getTime()
  if (Number.isNaN(t)) return 'Never'
  const s = Math.max(0, Math.round((now - t) / 1000))
  if (s < 45) return 'just now'
  for (const [unit, secs] of UNITS) {
    if (s >= secs) {
      const n = Math.floor(s / secs)
      const short = { year: 'y', month: 'mo', day: 'd', hour: 'h', minute: 'min' }[unit]
      return `${n} ${short} ago`
    }
  }
  return 'just now'
}

/** "2 h 14 min" style span between a past instant and now. */
export function durationSince(input, now = Date.now()) {
  if (!input) return ''
  const s = Math.max(0, Math.round((now - new Date(input).getTime()) / 1000))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d) return `${d} d ${h} h`
  if (h) return `${h} h ${m} min`
  return `${Math.max(1, m)} min`
}

/** Locale date and time, e.g. "24 Oct, 09:41". */
export function formatDateTime(input) {
  if (!input) return '—'
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/** Strip protocol and trailing slash for display. */
export function displayUrl(url = '') {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

/** Ensure an href has a protocol. */
export function toHref(url = '') {
  return /^https?:\/\//.test(url) ? url : `https://${url}`
}

/** Phone numbers are stored as digits. 10 digits read as "(123) 456-7890"; longer numbers keep their country code. */
export function formatPhone(phone = '') {
  const digits = String(phone).replace(/\D/g, '')
  if (digits.length === 10) return digits.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
  return digits ? `+${digits}` : ''
}

/** A length of time as "4 min", "2 h 5 min" or "3 h". At least one minute. */
export function formatSpan(ms) {
  const minutes = Math.max(1, Math.round(ms / 60000))
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}
