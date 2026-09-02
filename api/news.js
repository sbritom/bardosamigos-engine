import { listCachedNews } from './_lib/newsCacheService.js'
import {
  listGamerPowerFreeGames,
  listPandaScoreMatches,
  listRawgReleases,
} from './_lib/gamesDataService.js'

function getStatusCode(error) {
  if (!error) return 200
  if (Number.isInteger(error.statusCode)) return error.statusCode
  if (/credentials|configured|configurada/i.test(error.message)) return 503
  return 500
}

async function getGamesPayload(type) {
  if (type === 'releases') return listRawgReleases()
  if (type === 'free') return listGamerPowerFreeGames()
  if (type === 'esports') return listPandaScoreMatches()

  const error = new Error('Tipo de Games inválido.')
  error.statusCode = 400
  throw error
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

  const gamesType = String(request.query?.games || '').trim().toLowerCase()

  if (gamesType) {
    try {
      const payload = await getGamesPayload(gamesType)
      const cache = gamesType === 'esports'
        ? 's-maxage=120, stale-while-revalidate=300'
        : gamesType === 'free'
          ? 's-maxage=900, stale-while-revalidate=1800'
          : 's-maxage=1800, stale-while-revalidate=3600'

      response.setHeader('Cache-Control', cache)
      response.status(200).json(payload)
    } catch (error) {
      response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
      response.status(getStatusCode(error)).json({
        source: gamesType === 'releases' ? 'rawg' : gamesType === 'free' ? 'gamerpower' : 'pandascore',
        items: [],
        running: [],
        upcoming: [],
        past: [],
        error: error.message || 'Não foi possível carregar dados de Games.',
      })
    }
    return
  }

  try {
    const payload = await listCachedNews({ limit: request.query?.limit, category: request.query?.category })

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
