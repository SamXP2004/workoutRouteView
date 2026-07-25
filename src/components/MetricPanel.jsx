import { useMemo } from 'react'
import { X } from 'lucide-react'
import {
  buildLineGeometry,
  formatElapsedSeconds,
  nearestSampleByElapsed,
} from '../metrics'

const CHART_WIDTH = 1000
const CHART_HEIGHT = 96
const EMPTY_SAMPLES = []

function displayValue(value, digits = 0) {
  return Number.isFinite(value) ? Number(value).toFixed(digits) : '—'
}

function MetricChart({
  label,
  unit,
  samples,
  elapsedIndex,
  valueIndex,
  durationSec,
  elapsedSec,
  color,
  summaryText,
  onElapsedSec,
}) {
  const geometry = useMemo(
    () => buildLineGeometry(
      samples,
      elapsedIndex,
      valueIndex,
      durationSec,
      CHART_WIDTH,
      CHART_HEIGHT,
    ),
    [samples, elapsedIndex, valueIndex, durationSec],
  )
  const current = nearestSampleByElapsed(samples, elapsedIndex, elapsedSec)
  const updateFromPointer = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width))
    onElapsedSec(Math.round(ratio * durationSec))
  }
  const moveByKeyboard = (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
    event.preventDefault()
    const step = Math.max(1, Math.round(durationSec / 100))
    onElapsedSec(Math.max(0, Math.min(durationSec, elapsedSec + (event.key === 'ArrowRight' ? step : -step))))
  }

  return (
    <section className="metric-chart">
      <div className="metric-chart-heading">
        <strong>{label}</strong>
        {geometry ? (
          <span>{summaryText || `${displayValue(geometry.minimum)}–${displayValue(geometry.maximum)} ${unit}`}</span>
        ) : <span>无数据</span>}
      </div>
      {geometry ? (
        <div
          className="metric-chart-interaction"
          role="slider"
          tabIndex="0"
          aria-label={`${label}时间位置`}
          aria-valuemin="0"
          aria-valuemax={Math.round(durationSec)}
          aria-valuenow={Math.round(elapsedSec)}
          onPointerDown={updateFromPointer}
          onPointerMove={updateFromPointer}
          onKeyDown={moveByKeyboard}
        >
          <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
            <line className="metric-gridline" x1="8" y1="48" x2="992" y2="48" />
            <path className="metric-line" d={geometry.path} style={{ '--metric-color': color }} />
            <line
              className="metric-cursor"
              x1={geometry.x(elapsedSec)}
              x2={geometry.x(elapsedSec)}
              y1="4"
              y2="92"
            />
            {current && (
              <circle
                className="metric-focus-dot"
                cx={geometry.x(current[elapsedIndex])}
                cy={geometry.y(current[valueIndex])}
                r="7"
                style={{ '--metric-color': color }}
              />
            )}
          </svg>
        </div>
      ) : (
        <div className="metric-empty">这次运动没有可用的{label}采样。</div>
      )}
    </section>
  )
}

export default function MetricPanel({
  route,
  metrics,
  status,
  elapsedSec,
  onElapsedSec,
  onClose,
}) {
  const heartRateSamples = metrics?.heartRate?.samples || EMPTY_SAMPLES
  const elevationSamples = metrics?.elevation?.samples || EMPTY_SAMPLES
  const durationSec = Math.max(
    1,
    Math.round((route?.durationMin || 0) * 60),
    heartRateSamples[heartRateSamples.length - 1]?.[0] || 0,
    elevationSamples[elevationSamples.length - 1]?.[1] || 0,
  )
  const heartRateSample = nearestSampleByElapsed(metrics?.heartRate?.samples, 0, elapsedSec)
  const elevationSample = nearestSampleByElapsed(metrics?.elevation?.samples, 1, elapsedSec)

  return (
    <section className="metric-panel" aria-label="运动指标联动面板">
      <header className="metric-panel-header">
        <div>
          <small>运动指标联动</small>
          <strong>沿运动时间查看心率、海拔与地图位置</strong>
        </div>
        <button onClick={onClose} aria-label="关闭指标面板"><X size={18} /></button>
      </header>

      {status === 'loading' && <p className="metric-status">正在载入本机指标数据…</p>}
      {status === 'error' && <p className="metric-status error">指标数据载入失败。</p>}
      {status === 'ready' && metrics && (
        <>
          <div className="metric-current" aria-live="polite">
            <div><span>经过时间</span><strong>{formatElapsedSeconds(elapsedSec)}</strong></div>
            <div><span>距离</span><strong>{displayValue(elevationSample?.[0] / 1000, 2)} <small>km</small></strong></div>
            <div><span>心率</span><strong>{displayValue(heartRateSample?.[1])} <small>bpm</small></strong></div>
            <div><span>海拔</span><strong>{displayValue(elevationSample?.[2], 1)} <small>m</small></strong></div>
          </div>
          <div className="metric-charts">
            <MetricChart
              label="心率"
              unit="bpm"
              samples={metrics.heartRate?.samples}
              elapsedIndex={0}
              valueIndex={1}
              durationSec={durationSec}
              elapsedSec={elapsedSec}
              color="#ff6b6b"
              summaryText={[
                Number.isFinite(metrics.heartRate?.averageBpm)
                  ? `平均 ${displayValue(metrics.heartRate.averageBpm)}`
                  : null,
                Number.isFinite(metrics.heartRate?.minimumBpm) && Number.isFinite(metrics.heartRate?.maximumBpm)
                  ? `${displayValue(metrics.heartRate.minimumBpm)}–${displayValue(metrics.heartRate.maximumBpm)} bpm`
                  : null,
              ].filter(Boolean).join(' · ')}
              onElapsedSec={onElapsedSec}
            />
            <MetricChart
              label="海拔"
              unit="m"
              samples={metrics.elevation?.samples}
              elapsedIndex={1}
              valueIndex={2}
              durationSec={durationSec}
              elapsedSec={elapsedSec}
              color="#d2f05a"
              summaryText={[
                Number.isFinite(metrics.elevation?.minimumM) && Number.isFinite(metrics.elevation?.maximumM)
                  ? `${displayValue(metrics.elevation.minimumM)}–${displayValue(metrics.elevation.maximumM)} m`
                  : null,
                Number.isFinite(metrics.elevation?.ascentM)
                  ? `↑ ${displayValue(metrics.elevation.ascentM)}`
                  : null,
                Number.isFinite(metrics.elevation?.descentM)
                  ? `↓ ${displayValue(metrics.elevation.descentM)}`
                  : null,
              ].filter(Boolean).join(' · ')}
              onElapsedSec={onElapsedSec}
            />
          </div>
          <p className="metric-note">海拔为设备测量值；缺失的心率或海拔不会以 0 补齐。</p>
        </>
      )}
      {status === 'ready' && !metrics && <p className="metric-status">这条路线没有可用的指标数据。</p>}
    </section>
  )
}
