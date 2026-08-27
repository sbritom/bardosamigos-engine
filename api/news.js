import { listCachedNews } from './_lib/newsCacheService.js'

function getStatusCode(error) {
  if (!error) return 200
  if (/credentials|configured/i.test(error.message)) return 503
  return 500
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const payload = await listCachedNews({ limit: request.query?.limit })

    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=120')
    response.status(200).json(payload)
  } catch (error) {
    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    response.status(getStatusCode(error)).json({
      source: 'supabase-cache',
      articles: [],
      categories: [],
      errors: [{ message: error.message || 'Nao foi possivel carregar noticias sincronizadas.' }],
    })
  }
}
