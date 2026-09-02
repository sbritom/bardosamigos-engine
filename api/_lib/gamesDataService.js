const RAWG_BASE_URL = 'https://api.rawg.io/api'
const GAMERPOWER_URL = 'https://www.gamerpower.com/api/giveaways?type=game&sort-by=date'
const PANDASCORE_BASE_URL = 'https://api.pandascore.co'

function isoDate(date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date, days) {
  const copy = new Date(date)
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

function normalizeRawgGame(game = {}) {
  return {
    id: game.id,
    name: game.name || 'Jogo',
    slug: game.slug || '',
    released: game.released || '',
    image: game.background_image || '',
    rating: Number(game.rating || 0),
    metacritic: game.metacritic ?? null,
    platforms: (game.parent_platforms || []).map((item) => item?.platform?.name).filter(Boolean),
    genres: (game.genres || []).map((item) => item?.name).filter(Boolean),
    url: game.slug ? `https://rawg.io/games/${game.slug}` : 'https://rawg.io/',
  }
}

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
    platforms: String(item.platforms || '').split(',').map((value) => value.trim()).filter(Boolean),
    type: item.type || 'Game',
    status: item.status || 'Active',
  }
}

function normalizeOpponent(opponent = {}) {
  const entity = opponent?.opponent || opponent || {}
  return {
    id: entity.id || null,
    name: entity.name || 'A definir',
    acronym: entity.acronym || '',
    image: entity.image_url || '',
  }
}

function normalizeEsportsMatch(match = {}) {
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
    results: (match.results || []).map((result) => ({ teamId: result.team_id, score: result.score })),
    winnerId: match.winner_id || null,
  }
}

async function fetchPandaMatches(path, token, perPage, sort = '') {
  const url = new URL(`${PANDASCORE_BASE_URL}${path}`)
  url.searchParams.set('per_page', String(perPage))
  if (sort) url.searchParams.set('sort', sort)

  const result = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  const payload = await result.json().catch(() => [])

  if (!result.ok) {
    const error = new Error(payload?.error || payload?.message || `PandaScore retornou ${result.status}.`)
    error.statusCode = result.status
    throw error
  }

  return (Array.isArray(payload) ? payload : []).map(normalizeEsportsMatch)
}

export async function listRawgReleases() {
  const apiKey = String(process.env.RAWG_API_KEY || '').trim()
  if (!apiKey) {
    const error = new Error('RAWG_API_KEY não está configurada.')
    error.statusCode = 503
    throw error
  }

  const now = new Date()
  const start = isoDate(now)
  const end = isoDate(addDays(now, 120))
  const url = new URL(`${RAWG_BASE_URL}/games`)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('dates', `${start},${end}`)
  url.searchParams.set('ordering', 'released')
  url.searchParams.set('page_size', '18')

  const result = await fetch(url, { headers: { Accept: 'application/json' } })
  const payload = await result.json().catch(() => ({}))

  if (!result.ok) {
    const error = new Error(payload?.detail || `RAWG retornou ${result.status}.`)
    error.statusCode = result.status
    throw error
  }

  return {
    source: 'rawg',
    attribution: { label: 'Dados por RAWG', url: 'https://rawg.io/' },
    window: { start, end },
    items: (payload.results || []).map(normalizeRawgGame),
  }
}

export async function listGamerPowerFreeGames() {
  const result = await fetch(GAMERPOWER_URL, { headers: { Accept: 'application/json' } })

  if (result.status === 201) {
    return {
      source: 'gamerpower',
      attribution: { label: 'Ofertas por GamerPower', url: 'https://www.gamerpower.com/' },
      items: [],
    }
  }

  const payload = await result.json().catch(() => [])

  if (!result.ok) {
    const error = new Error(`GamerPower retornou ${result.status}.`)
    error.statusCode = result.status
    throw error
  }

  return {
    source: 'gamerpower',
    attribution: { label: 'Ofertas por GamerPower', url: 'https://www.gamerpower.com/' },
    items: (Array.isArray(payload) ? payload : [])
      .filter((item) => String(item.status || 'Active').toLowerCase() === 'active')
      .slice(0, 18)
      .map(normalizeGiveaway),
  }
}

export async function listPandaScoreMatches() {
  const token = String(process.env.PANDASCORE_TOKEN || '').trim()
  if (!token) {
    const error = new Error('PANDASCORE_TOKEN não está configurado.')
    error.statusCode = 503
    throw error
  }

  const [running, upcoming, past] = await Promise.all([
    fetchPandaMatches('/matches/running', token, 8),
    fetchPandaMatches('/matches/upcoming', token, 12, 'begin_at'),
    fetchPandaMatches('/matches/past', token, 12, '-begin_at'),
  ])

  return {
    source: 'pandascore',
    running,
    upcoming,
    past,
  }
}

// PandaScore env sync
