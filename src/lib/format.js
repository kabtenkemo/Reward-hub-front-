export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function formatNumber(value) {
  const n = Number(value) || 0
  return new Intl.NumberFormat('en-US').format(n)
}

export function formatSigned(value) {
  const n = Number(value) || 0
  return `${n > 0 ? '+' : ''}${formatNumber(n)}`
}

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function relativeTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(value)
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

const PALETTE = ['#e11d2a', '#f5364a', '#fb7185', '#f97316', '#a21caf', '#0ea5e9', '#14b8a6', '#eab308']

export function colorAt(index) {
  return PALETTE[index % PALETTE.length]
}

// Turn a flat list of reward logs into a per-day series for the last `days` days.
export function buildDailySeries(logs = [], days = 14) {
  const buckets = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    buckets.push({ date, added: 0, deducted: 0, net: 0 })
  }
  const index = new Map(buckets.map((b) => [b.date.toDateString(), b]))

  for (const log of logs) {
    if (!log?.logDate) continue
    const d = new Date(log.logDate)
    d.setHours(0, 0, 0, 0)
    const bucket = index.get(d.toDateString())
    if (!bucket) continue
    const points = Number(log.points) || 0
    if (points >= 0) bucket.added += points
    else bucket.deducted += Math.abs(points)
    bucket.net += points
  }

  return buckets.map((b) => ({
    label: b.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    added: b.added,
    deducted: b.deducted,
    net: b.net,
  }))
}
