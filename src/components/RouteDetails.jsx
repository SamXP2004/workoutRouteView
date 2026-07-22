import { LocateFixed } from 'lucide-react'
import { ACTIVITY } from '../constants'
import { formatDate, formatDuration, formatPace } from '../format'
import ActivityIcon from './ActivityIcon'

export default function RouteDetails({ route, onFit, onShowAll }) {
  if (!route) return null
  const meta = ACTIVITY[route.category] || ACTIVITY.other
  return (
    <section className="route-details" style={{ '--activity-color': meta.color }}>
      <div className="route-detail-title">
        <span className="detail-icon"><ActivityIcon category={route.category} size={26} /></span>
        <div>
          <small>{meta.label}</small>
          <strong>{formatDate(route.date)}</strong>
          <span>{route.source}</span>
        </div>
      </div>
      <dl>
        <div><dt>距离</dt><dd>{route.distanceKm?.toFixed(2) || '—'} <small>km</small></dd></div>
        <div><dt>时长</dt><dd>{formatDuration(route.durationMin)}</dd></div>
        <div><dt>爬升</dt><dd>{route.ascentM} <small>m</small></dd></div>
        <div><dt>配速</dt><dd>{formatPace(route)} <small>/km</small></dd></div>
      </dl>
      <div className="detail-actions">
        <button onClick={onFit}><LocateFixed size={17} />适应路线</button>
        <button className="primary" onClick={onShowAll}>查看全部</button>
      </div>
    </section>
  )
}
