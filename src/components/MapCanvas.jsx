import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { ACTIVITY } from '../constants'

const DEFAULT_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const DEFAULT_TILE_ATTRIBUTION = '&copy; OpenStreetMap contributors &copy; CARTO'

function marker(color, label) {
  return L.divIcon({
    className: 'route-marker',
    html: `<span style="--marker-color:${color}">${label}</span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

export default function MapCanvas({ routes, selected, showAll }) {
  const mapNode = useRef(null)
  const mapRef = useRef(null)
  const routeLayerRef = useRef(null)

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return
    const map = L.map(mapNode.current, { zoomControl: false })
    L.control.zoom({ position: 'topright' }).addTo(map)
    L.tileLayer(import.meta.env.VITE_TILE_URL || DEFAULT_TILE_URL, {
      attribution: import.meta.env.VITE_TILE_ATTRIBUTION || DEFAULT_TILE_ATTRIBUTION,
      subdomains: import.meta.env.VITE_TILE_SUBDOMAINS || 'abcd',
      maxZoom: Number(import.meta.env.VITE_TILE_MAX_ZOOM || 20),
    }).addTo(map)
    map.setView([31.23, 121.47], 10)
    mapRef.current = map
    routeLayerRef.current = L.layerGroup().addTo(map)
    return () => {
      routeLayerRef.current = null
      mapRef.current = null
      map.remove()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = routeLayerRef.current
    if (!map || !layer) return
    layer.clearLayers()

    const visibleRoutes = showAll
      ? [...routes.filter((route) => route.id !== selected?.id), ...(selected ? [selected] : [])]
      : selected ? [selected] : []
    const bounds = []
    visibleRoutes.forEach((route) => {
      const isSelected = selected?.id === route.id
      const color = (ACTIVITY[route.category] || ACTIVITY.other).color
      const latLngs = route.points.map((point) => [point[0], point[1]])
      L.polyline(latLngs, {
        color,
        opacity: isSelected ? 1 : 0.38,
        weight: isSelected ? 5 : 1.6,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(layer)
      bounds.push(...latLngs)
    })

    if (selected) {
      const color = (ACTIVITY[selected.category] || ACTIVITY.other).color
      const first = selected.points[0]
      const last = selected.points[selected.points.length - 1]
      L.marker([first[0], first[1]], { icon: marker(color, '起') }).addTo(layer)
      L.marker([last[0], last[1]], { icon: marker(color, '终') }).addTo(layer)
      map.fitBounds(selected.bounds, { padding: [90, 90], maxZoom: 15 })
    } else if (bounds.length) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 11 })
    }
  }, [routes, selected, showAll])

  return <div className="map" ref={mapNode} aria-label="运动轨迹地图" />
}
