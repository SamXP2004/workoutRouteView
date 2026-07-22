import test from 'node:test'
import assert from 'node:assert/strict'

import { formatDuration, formatPace } from '../src/format.js'

test('formatDuration formats durations below and above one hour', () => {
  assert.equal(formatDuration(45.7), '45:42')
  assert.equal(formatDuration(148), '2:28:00')
})

test('formatPace calculates pace and normalizes rounded seconds', () => {
  assert.equal(formatPace({ durationMin: 148, distanceKm: 36.2 }), '4:05')
  assert.equal(formatPace({ durationMin: 4.999, distanceKm: 1 }), '5:00')
  assert.equal(formatPace({ durationMin: 0, distanceKm: 5 }), '—')
})
