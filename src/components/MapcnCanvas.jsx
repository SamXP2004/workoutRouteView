import { useEffect } from 'react'
import {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  useMap,
} from './ui/map'
import { ACTIVITY } from '../constants'

function MapViewportSync({ routes, selected }) {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map || !isLoaded) return

    if (selected?.bounds) {
      const [[minLat, minLon], [maxLat, maxLon]] = selected.bounds
      map.fitBounds(
        [[minLon, minLat], [maxLon, maxLat]],
        { padding: 90, maxZoom: 15, duration: 0 },
      )
      return
    }

    if (!routes.length) return
    const bounds = routes.reduce(
      (result, route) => {
        const [[minLat, minLon], [maxLat, maxLon]] = route.bounds
        return [
          [Math.min(result[0][0], minLon), Math.min(result[0][1], minLat)],
          [Math.max(result[1][0], maxLon), Math.max(result[1][1], maxLat)],
        ]
      },
      [[Infinity, Infinity], [-Infinity, -Infinity]],
    )
    map.fitBounds(bounds, { padding: 60, maxZoom: 11, duration: 0 })
  }, [isLoaded, map, routes, selected])

  return null
}

function EndpointMarker({ point, color, label }) {
  return (
    <MapMarker longitude={point[1]} latitude={point[0]}>
      <MarkerContent>
        <span className="mapcn-route-marker" style={{ '--marker-color': color }}>{label}</span>
      </MarkerContent>
    </MapMarker>
  )
}

export default function MapcnCanvas({ routes, selected, showAll }) {
  const visibleRoutes = showAll
    ? [...routes.filter((route) => route.id !== selected?.id), ...(selected ? [selected] : [])]
    : selected ? [selected] : []
  const selectedColor = selected
    ? (ACTIVITY[selected.category] || ACTIVITY.other).color
    : ACTIVITY.all.color

  return (
    <div className="map mapcn-map" aria-label="mapcn 运动轨迹地图">
      <Map theme="dark" center={[121.47, 31.23]} zoom={10} maxZoom={20}>
        <MapViewportSync routes={routes} selected={selected} />
        {visibleRoutes.map((route) => {
          const isSelected = route.id === selected?.id
          const color = (ACTIVITY[route.category] || ACTIVITY.other).color
          return (
            <MapRoute
              key={route.id}
              id={`activity-${route.id}`}
              coordinates={route.points.map((point) => [point[1], point[0]])}
              color={color}
              opacity={isSelected ? 1 : 0.38}
              width={isSelected ? 5 : 1.6}
              interactive={false}
            />
          )
        })}
        {selected && (
          <>
            <EndpointMarker point={selected.points[0]} color={selectedColor} label="起" />
            <EndpointMarker point={selected.points[selected.points.length - 1]} color={selectedColor} label="终" />
          </>
        )}
        <MapControls position="top-right" showZoom showCompass />
      </Map>
    </div>
  )
}
