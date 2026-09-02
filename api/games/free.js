const GAMERPOWER_URL = 'https://www.gamerpower.com/api/giveaways?type=game&sort-by=date'

function normalizeGiveaway(item = {}) {
  return {
    id: item.id,
    title: item.title || 'Jogo grátis',
    worth: item.worth || '',
    thumbnail: item.thumbnail || '',
    image: item.image || item.thumbnail || '',
    description: item.description || '',
    instructions: item.instructions || '',
    openGiveawayUrl: item.open_giveaway_url || item.open_giveaway || '',
    gamerPowerUrl: item.gamerpower_url || 'https://www.gamerpower.com/',
    publishedDate: item.published_date || '',
    endDate: item.end_date || '',
    platforms: String(item.platforms || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    type: item.type || 'Game',
    status: item.status || 'Active',
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

  try {
    const gpResponse = await fetch(GAMERPOWER_URL, {
      headers: { Accept: 'application/json' },
    })

    if (gpResponse.status === 201) {
      response.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800')
      response.status(200).json({
        source: 'gamerpower',
        attribution: { label: 'Ofertas por GamerPower', url: 'https://www.gamerpower.com/' },
        items: [],
      })
      return
    }

    const payload = await gpResponse.json().catch(() => [])

    if (!gpResponse.ok) {
      response.status(gpResponse.status).json({
        source: 'gamerpower',
        items: [],
        error: 'GamerPower indisponível.',
      })
      return
    }

    const items = (Array.isArray(payload) ? payload : [])
      .filter((item) => String(item.status || 'Active').toLowerCase() === 'active')
      .slice(0, 18)
      .map(normalizeGiveaway)

    response.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800')
    response.status(200).json({
      source: 'gamerpower',
      attribution: {
        label: 'Ofertas por GamerPower',
        url: 'https://www.gamerpower.com/',
      },
      items,
    })
  } catch (error) {
    response.status(502).json({
      source: 'gamerpower',
      items: [],
      error: error?.message || 'Falha ao consultar GamerPower.',
    })
  }
}
