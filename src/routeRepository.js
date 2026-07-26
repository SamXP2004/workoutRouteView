const DATA_ROOT = '/data/'

async function readJson(path, missingMessage) {
  const response = await fetch(path)
  if (!response.ok) throw new Error(missingMessage)
  return response.json()
}

export const localRouteRepository = {
  listRoutes() {
    return readJson(`${DATA_ROOT}routes.json`, '未找到路线数据')
  },

  getRouteMetrics(route) {
    if (!route?.metricsFile) return Promise.resolve(null)
    return readJson(`${DATA_ROOT}${route.metricsFile}`, '未找到路线指标数据')
  },
}
