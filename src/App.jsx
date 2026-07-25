import { useEffect, useMemo, useState } from 'react'
import MapCanvas from './components/MapCanvas'
import RouteDetails from './components/RouteDetails'
import Sidebar from './components/Sidebar'

export default function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('all')
  const [year, setYear] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [showAll, setShowAll] = useState(true)
  const [fitKey, setFitKey] = useState(0)

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
        <MapCanvas key={fitKey} routes={routes} selected={selected} showAll={showAll} />
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
