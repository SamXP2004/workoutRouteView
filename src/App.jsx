import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import MapCanvas from './components/MapCanvas'
import RouteDetails from './components/RouteDetails'
import Sidebar from './components/Sidebar'

const MapcnCanvas = lazy(() => import('./components/MapcnCanvas'))

export default function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('all')
  const [year, setYear] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [showAll, setShowAll] = useState(true)
  const [fitKey, setFitKey] = useState(0)
  const [mapEngine, setMapEngine] = useState('leaflet')

  useEffect(() => {
    fetch('/data/routes.json')
      .then((response) => {
        if (!response.ok) throw new Error('未找到路线数据')
        return response.json()
      })
      .then((payload) => {
        setData(payload)
        setSelectedId(payload.routes[0]?.id || null)
      })
      .catch((reason) => setError(reason.message))
  }, [])

  const routes = useMemo(() => {
    if (!data) return []
    const query = search.trim().toLowerCase()
    return data.routes.filter((route) => {
      const categoryMatch = category === 'all' || route.category === category
      const yearMatch = year === 'all' || String(route.year) === String(year)
      const searchMatch = !query || `${route.date} ${route.source}`.toLowerCase().includes(query)
      return categoryMatch && yearMatch && searchMatch
    })
  }, [data, category, year, search])

  useEffect(() => {
    if (routes.length && !routes.some((route) => route.id === selectedId)) {
      setSelectedId(routes[0].id)
    }
  }, [routes, selectedId])

  const selected = routes.find((route) => route.id === selectedId) || routes[0] || null

  if (error) {
    return (
      <main className="state-screen">
        <h1>路线数据还没准备好</h1>
        <p>{error}。请先运行 <code>npm run import-health</code>。</p>
      </main>
    )
  }
  if (!data) return <main className="state-screen"><p>正在载入运动路线…</p></main>

  return (
    <main className="app-shell">
      <Sidebar
        data={data}
        routes={routes}
        selectedId={selected?.id}
        onSelect={setSelectedId}
        category={category}
        onCategory={setCategory}
        year={year}
        onYear={setYear}
        search={search}
        onSearch={setSearch}
        showAll={showAll}
        onShowAll={setShowAll}
      />
      <section className="map-panel">
        <div className="map-engine-toggle" role="group" aria-label="地图引擎">
          <button
            className={mapEngine === 'leaflet' ? 'active' : ''}
            data-testid="map-engine-leaflet"
            aria-pressed={mapEngine === 'leaflet'}
            onClick={() => setMapEngine('leaflet')}
          >
            Leaflet
          </button>
          <button
            className={mapEngine === 'mapcn' ? 'active' : ''}
            data-testid="map-engine-mapcn"
            aria-pressed={mapEngine === 'mapcn'}
            onClick={() => setMapEngine('mapcn')}
          >
            mapcn
          </button>
        </div>
        {mapEngine === 'leaflet' ? (
          <MapCanvas key={`leaflet-${fitKey}`} routes={routes} selected={selected} showAll={showAll} />
        ) : (
          <Suspense fallback={<div className="map-engine-loading">正在加载 mapcn…</div>}>
            <MapcnCanvas key={`mapcn-${fitKey}`} routes={routes} selected={selected} showAll={showAll} />
          </Suspense>
        )}
        <RouteDetails
          route={selected}
          onFit={() => setFitKey((key) => key + 1)}
          onShowAll={() => {
            setCategory('all')
            setYear('all')
            setSearch('')
            setShowAll(true)
          }}
        />
      </section>
    </main>
  )
}
