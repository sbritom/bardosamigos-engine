const PANDASCORE_BASE_URL = 'https://api.pandascore.co'

function normalizeOpponent(opponent = {}) {
  const entity = opponent?.opponent || opponent || {}
  return {
    id: entity.id || null,
    name: entity.name || 'A definir',
    acronym: entity.acronym || '',
    image: entity.image_url || '',
  }
}

function normalizeMatch(match = {}) {
  return {
    id: match.id,
    name: match.name || '',
    status: match.status || '',
    scheduledAt: match.scheduled_at || match.begin_at || '',
    beginAt: match.begin_at || '',
    endAt: match.end_at || '',
    numberOfGames: match.number_of_games || null,
    matchType: match.match_type || '',
    videogame: match.videogame?.name || '',
    league: match.league?.name || '',
    leagueImage: match.league?.image_url || '',
    serie: match.serie?.full_name || match.serie?.name || '',
    tournament: match.tournament?.name || '',
    opponents: (match.opponents || []).map(normalizeOpponent).slice(0, 2),
    results: (match.results || []).map((result) => ({
      teamId: result.team_id,
      score: result.score,
    })),
    winnerId: match.winner_id || null,
  }
}

async function fetchMatches(path, token, perPage) {
  const url = new URL(`${PANDASCORE_BASE_URL}${path}`)
  url.searchParams.set('per_page', String(perPage))

  const result = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  const payload = await result.json().catch(() => [])

  if (!result.ok) {
    const message = payload?.error || payload?.message || `PandaScore retornou ${result.status}.`
    throw new Error(message)
  }

  return (Array.isArray(payload) ? payload : []).map(normalizeMatch)
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

  const token = String(process.env.PANDASCORE_TOKEN || '').trim()

  if (!token) {
    response.status(503).json({
      source: 'pandascore',
      running: [],
      upcoming: [],
      past: [],
      error: 'PANDASCORE_TOKEN não está configurado.',
    })
    return
  }

  try {
    const [running, upcoming, past] = await Promise.all([
      fetchMatches('/matches/running', token, 8),
      fetchMatches('/matches/upcoming', token, 12),
      fetchMatches('/matches/past', token, 12),
    ])

    response.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300')
    response.status(200).json({
      source: 'pandascore',
      running,
      upcoming,
      past,
    })
  } catch (error) {
    response.status(502).json({
      source: 'pandascore',
      running: [],
      upcoming: [],
      past: [],
      error: error?.message || 'Falha ao consultar PandaScore.',
    })
  }
}
