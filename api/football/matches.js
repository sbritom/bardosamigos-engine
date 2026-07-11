const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4'
const DEFAULT_COMPETITIONS = ['BSA']

function getApiKey() {
  return String(process.env.FOOTBALL_DATA_API_KEY || process.env.VITE_FOOTBALL_DATA_API_KEY || '').trim()
}

function toDateOnly(date) {
  return date.toISOString().slice(0, 10)
}

function createDateWindow() {
  const now = new Date()
  const from = new Date(now)
  const to = new Date(now)
  from.setDate(from.getDate() - 1)
  to.setDate(to.getDate() + 14)

  return {
    dateFrom: toDateOnly(from),
    dateTo: toDateOnly(to),
  }
}

function normalizeStatus(status) {
  const value = String(status || '').toUpperCase()
  if (['LIVE', 'IN_PLAY'].includes(value)) return 'AO_VIVO'
  if (value === 'PAUSED') return 'INTERVALO'
  if (value === 'FINISHED') return 'FINALIZADO'
  if (value === 'POSTPONED') return 'ADIADO'
  if (value === 'CANCELLED') return 'CANCELADO'
  return 'AGENDADO'
}

function createBrazilDatePayload(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return {
      utcDate: value || '',
      localDate: '',
      localDateIso: '',
      localTime: '',
    }
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value
    return acc
  }, {})

  return {
    utcDate: date.toISOString(),
    localDate: `${parts.day}/${parts.month}/${parts.year}`,
    localDateIso: `${parts.year}-${parts.month}-${parts.day}`,
    localTime: `${parts.hour}:${parts.minute}`,
  }
}

function mapMatch(match = {}) {
  const date = createBrazilDatePayload(match.utcDate)
  const status = normalizeStatus(match.status)
  const homeScore = match.score?.fullTime?.home ?? null
  const awayScore = match.score?.fullTime?.away ?? null

  return {
    id: `football-data-${match.id || `${match.utcDate}-${match.homeTeam?.name}-${match.awayTeam?.name}`}`,
    homeParticipant: match.homeTeam?.name || 'Mandante',
    awayParticipant: match.awayTeam?.name || 'Visitante',
    homeTeam: match.homeTeam?.name || 'Mandante',
    awayTeam: match.awayTeam?.name || 'Visitante',
    homeCrest: match.homeTeam?.crest || '',
    awayCrest: match.awayTeam?.crest || '',
    homeScore,
    awayScore,
    startsAt: date.utcDate,
    utcDate: date.utcDate,
    localDate: date.localDate,
    localDateIso: date.localDateIso,
    localTime: date.localTime,
    standardStatus: status,
    status,
    competitionName: match.competition?.name || 'Futebol',
    championship: match.competition?.name || 'Futebol',
    competitionCode: match.competition?.code || '',
    competitionLogo: match.competition?.emblem || '',
    stage: match.stage || '',
    groupName: match.group || '',
    country: match.area?.name || match.competition?.area?.name || '',
    metadata: {
      provider: 'football-data.org',
      providerStatus: match.status || '',
      standardStatus: status,
      utcDate: date.utcDate,
      localDate: date.localDate,
      localDateIso: date.localDateIso,
      localTime: date.localTime,
      competition: {
        code: match.competition?.code || '',
        namePtBr: match.competition?.name || 'Futebol',
        logoUrl: match.competition?.emblem || '',
      },
      raw: match,
    },
  }
}

async function fetchCompetitionMatches({ competitionCode, apiKey, dateFrom, dateTo }) {
  const url = new URL(`${FOOTBALL_DATA_BASE_URL}/competitions/${competitionCode}/matches`)
  url.searchParams.set('dateFrom', dateFrom)
  url.searchParams.set('dateTo', dateTo)

  const response = await fetch(url, {
    headers: {
      'X-Auth-Token': apiKey,
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.message || `Football-Data request failed with status ${response.status}`)
  }

  return (payload.matches || []).map(mapMatch)
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

  const apiKey = getApiKey()
  if (!apiKey) {
    response.status(503).json({ error: 'FOOTBALL_DATA_API_KEY is not configured.' })
    return
  }

  const window = createDateWindow()
  const competitions = String(request.query?.competitions || process.env.FOOTBALL_DATA_COMPETITION_CODE || DEFAULT_COMPETITIONS.join(','))
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean)

  try {
    const results = await Promise.allSettled(
      competitions.map((competitionCode) => fetchCompetitionMatches({
        competitionCode,
        apiKey,
        dateFrom: String(request.query?.dateFrom || window.dateFrom),
        dateTo: String(request.query?.dateTo || window.dateTo),
      })),
    )
    const matches = results.flatMap((item) => item.status === 'fulfilled' ? item.value : [])
    const errors = results
      .filter((item) => item.status === 'rejected')
      .map((item) => item.reason?.message || 'Unknown Football-Data error')

    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=120')
    response.status(matches.length ? 200 : 502).json({
      source: 'football-data.org',
      competitions,
      dateWindow: {
        dateFrom: String(request.query?.dateFrom || window.dateFrom),
        dateTo: String(request.query?.dateTo || window.dateTo),
      },
      matches,
      errors,
    })
  } catch (error) {
    response.status(502).json({ error: error.message || 'Football-Data request failed.' })
  }
}
