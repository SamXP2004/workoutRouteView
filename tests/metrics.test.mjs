import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildLineGeometry,
  formatElapsedSeconds,
  nearestRoutePoint,
  nearestSampleByElapsed,
} from '../src/metrics.js'

test('nearestSampleByElapsed returns the closest sample on either side', () => {
  const samples = [[0, 100], [30, 120], [60, 140]]
  assert.deepEqual(nearestSampleByElapsed(samples, 0, 18), [30, 120])
  assert.deepEqual(nearestSampleByElapsed(samples, 0, 5), [0, 100])
  assert.deepEqual(nearestSampleByElapsed(samples, 0, 100), [60, 140])
})

test('nearestRoutePoint ignores route points without elapsed time', () => {
  const points = [
    [31, 121, 2, 0],
    [31.1, 121.1, 3, null],
    [31.2, 121.2, 4, 60],
  ]
  assert.deepEqual(nearestRoutePoint(points, 45), [31.2, 121.2, 4, 60])
})

test('buildLineGeometry uses the shared elapsed domain and observed value range', () => {
  const geometry = buildLineGeometry([[0, 100], [60, 140]], 0, 1, 120)
  assert.equal(geometry.minimum, 100)
  assert.equal(geometry.maximum, 140)
  assert.equal(geometry.x(60), 500)
  assert.match(geometry.path, /^M8\.00,88\.00 L500\.00,8\.00$/)
})

test('heart rate and elevation geometries share the same elapsed position', () => {
  const heartRate = buildLineGeometry([[0, 100], [60, 140]], 0, 1, 120, 1000, 128)
  const elevation = buildLineGeometry([[0, 0, 8], [3, 60, 18]], 1, 2, 120, 1000, 128)
  assert.equal(heartRate.x(60), elevation.x(60))
  assert.notEqual(heartRate.y(100), elevation.y(18))
})

test('formatElapsedSeconds formats short and long workouts', () => {
  assert.equal(formatElapsedSeconds(125), '2:05')
  assert.equal(formatElapsedSeconds(3723), '1:02:03')
})
