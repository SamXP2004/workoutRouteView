export function nearestSampleByElapsed(samples, elapsedIndex, elapsedSec) {
  if (!samples?.length || !Number.isFinite(elapsedSec)) return null
  let low = 0
  let high = samples.length - 1
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (samples[middle][elapsedIndex] < elapsedSec) low = middle + 1
    else high = middle
  }
  if (low === 0) return samples[0]
  const before = samples[low - 1]
  const after = samples[low]
  return elapsedSec - before[elapsedIndex] <= after[elapsedIndex] - elapsedSec
    ? before
    : after
}

export function nearestRoutePoint(points, elapsedSec) {
  const timedPoints = points?.filter((point) => Number.isFinite(point[3])) || []
  return nearestSampleByElapsed(timedPoints, 3, elapsedSec)
}

export function buildLineGeometry(
  samples,
  elapsedIndex,
  valueIndex,
  durationSec,
  width = 1000,
  height = 96,
  padding = 8,
) {
  const rows = (samples || []).filter(
    (sample) => Number.isFinite(sample[elapsedIndex]) && Number.isFinite(sample[valueIndex]),
  )
  if (!rows.length || !Number.isFinite(durationSec) || durationSec <= 0) return null
  const values = rows.map((sample) => sample[valueIndex])
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const valueSpan = maximum - minimum || 1
  const plotWidth = width - padding * 2
  const plotHeight = height - padding * 2
  const x = (elapsed) => padding + (Math.max(0, Math.min(durationSec, elapsed)) / durationSec) * plotWidth
  const y = (value) => height - padding - ((value - minimum) / valueSpan) * plotHeight
  const path = rows
    .map((sample, index) => `${index ? 'L' : 'M'}${x(sample[elapsedIndex]).toFixed(2)},${y(sample[valueIndex]).toFixed(2)}`)
    .join(' ')
  return { path, minimum, maximum, x, y }
}

export function formatElapsedSeconds(value) {
  const totalSeconds = Math.max(0, Math.round(value || 0))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`
}
