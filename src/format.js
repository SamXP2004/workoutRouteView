const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

export function formatDate(value) {
  return dateFormatter.format(new Date(value))
}

export function formatDuration(minutes) {
  const totalSeconds = Math.round((minutes || 0) * 60)
  const hours = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return hours > 0
    ? `${hours}:${String(mins).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${mins}:${String(seconds).padStart(2, '0')}`
}

export function formatPace(route) {
  if (!route?.distanceKm || !route?.durationMin) return '—'
  const totalSeconds = Math.round((route.durationMin / route.distanceKm) * 60)
  const mins = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${mins}:${String(seconds).padStart(2, '0')}`
}
