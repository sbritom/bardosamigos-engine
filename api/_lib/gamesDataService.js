const RAWG_BASE_URL = 'https://api.rawg.io/api'
const GAMERPOWER_URL = 'https://www.gamerpower.com/api/giveaways?sort-by=date'
const PANDASCORE_BASE_URL = 'https://api.pandascore.co'
const PROVIDER_TIMEOUT_MS = 6500
const PROVIDER_MAX_ATTEMPTS = 2
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504])

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getRetryDelay(response, attempt) {
  const retryAfter = Number(response?.headers?.get?.('retry-after'))
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter * 1000, 2000)
  }
  return Math.min(250 * (2 ** attempt), 1000)
}

async function fetchProvider(url, options = {}) {
  let lastError = null

  for (let attempt = 0; attempt < PROVIDER_MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      if (!RETRYABLE_STATUS.has(response.status) || attempt === PROVIDER_MAX_ATTEMPTS - 1) {
        return response
      }

      await sleep(getRetryDelay(response, attempt))
    } catch (error) {
      lastError = error
      if (attempt === PROVIDER_MAX_ATTEMPTS - 1) {
        if (error?.name === 'AbortError') {
          const timeoutError = new Error('Provedor de Games excedeu o tempo limite.')
          timeoutError.statusCode = 504
          throw timeoutError
        }
        throw error
      }

      await sleep(250 * (2 ** attempt))
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError || new Error('Provedor de Games indisponível.')
}

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

  const result = await fetchProvider(url, {
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

function dedupeMatches(items = [], seen = new Set()) {
  return items.filter((match) => {
    const key = match?.id ? String(match.id) : ''
    if (!key) return true
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
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

  const result = await fetchProvider(url, { headers: { Accept: 'application/json' } })
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
  const result = await fetchProvider(GAMERPOWER_URL, { headers: { Accept: 'application/json' } })

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
      .filter((item) => String(item.type || '').trim().toLowerCase() === 'game')
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

  const settled = await Promise.allSettled([
    fetchPandaMatches('/matches/running', token, 8),
    fetchPandaMatches('/matches/upcoming', token, 12, 'begin_at'),
    fetchPandaMatches('/matches/past', token, 12, '-begin_at'),
  ])

  const sectionNames = ['running', 'upcoming', 'past']
  const failures = settled
    .map((entry, index) => entry.status === 'rejected' ? sectionNames[index] : null)
    .filter(Boolean)

  if (failures.length === settled.length) {
    const firstFailure = settled.find((entry) => entry.status === 'rejected')
    throw firstFailure?.reason || new Error('PandaScore indisponível no momento.')
  }

  const rawRunning = settled[0].status === 'fulfilled' ? settled[0].value : []
  const rawUpcoming = settled[1].status === 'fulfilled' ? settled[1].value : []
  const rawPast = settled[2].status === 'fulfilled' ? settled[2].value : []
  const seen = new Set()

  return {
    source: 'pandascore',
    running: dedupeMatches(rawRunning, seen),
    upcoming: dedupeMatches(rawUpcoming, seen),
    past: dedupeMatches(rawPast, seen),
    partial: failures.length > 0,
    warnings: failures,
  }
}

// PandaScore env sync
