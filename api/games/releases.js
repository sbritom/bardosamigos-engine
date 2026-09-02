const RAWG_BASE_URL = 'https://api.rawg.io/api'

function isoDate(date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date, days) {
  const copy = new Date(date)
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

function normalizeGame(game = {}) {
  return {
    id: game.id,
    name: game.name || 'Jogo',
    slug: game.slug || '',
    released: game.released || '',
    image: game.background_image || '',
    rating: Number(game.rating || 0),
    metacritic: game.metacritic ?? null,
    platforms: (game.parent_platforms || [])
      .map((item) => item?.platform?.name)
      .filter(Boolean),
    genres: (game.genres || []).map((item) => item?.name).filter(Boolean),
    url: game.slug ? `https://rawg.io/games/${game.slug}` : 'https://rawg.io/',
  }
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

  const apiKey = String(process.env.RAWG_API_KEY || '').trim()
  if (!apiKey) {
    response.status(503).json({
      source: 'rawg',
      items: [],
      error: 'RAWG_API_KEY não está configurada.',
    })
    return
  }

  const now = new Date()
  const start = isoDate(now)
  const end = isoDate(addDays(now, 120))
  const url = new URL(`${RAWG_BASE_URL}/games`)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('dates', `${start},${end}`)
  url.searchParams.set('ordering', 'released')
  url.searchParams.set('page_size', '18')

  try {
    const rawgResponse = await fetch(url, {
      headers: { Accept: 'application/json' },
    })
    const payload = await rawgResponse.json().catch(() => ({}))

    if (!rawgResponse.ok) {
      response.status(rawgResponse.status).json({
        source: 'rawg',
        items: [],
        error: payload?.detail || 'RAWG indisponível.',
      })
      return
    }

    response.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')
    response.status(200).json({
      source: 'rawg',
      attribution: {
        label: 'Dados por RAWG',
        url: 'https://rawg.io/',
      },
      window: { start, end },
      items: (payload.results || []).map(normalizeGame),
    })
  } catch (error) {
    response.status(502).json({
      source: 'rawg',
      items: [],
      error: error?.message || 'Falha ao consultar RAWG.',
    })
  }
}
