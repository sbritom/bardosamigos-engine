const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4'
const DEFAULT_COMPETITIONS = ['BSA', 'CLI', 'WC', 'CL', 'PL', 'PD']
const LIVE_STATUSES = new Set(['LIVE', 'IN_PLAY', 'PAUSED'])
const FINISHED_STATUSES = new Set(['FINISHED'])
const UPCOMING_STATUSES = new Set(['SCHEDULED', 'TIMED'])
const DISPLAY_LIMIT = 12
const WORLD_CUP_YEAR = 2026

function getApiKey() {
  return String(process.env.FOOTBALL_DATA_API_KEY || '').trim()
}

function toMaceioDateOnly(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Maceio',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value
    return acc
  }, {})

  return `${parts.year}-${parts.month}-${parts.day}`
}

function createDateWindow() {
  const now = new Date()
  const to = new Date(now)
  to.setDate(to.getDate() + 14)

  return {
    today: toMaceioDateOnly(now),
    dateFrom: toMaceioDateOnly(now),
    dateTo: toMaceioDateOnly(to),
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
    timeZone: 'America/Maceio',
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

function normalizeTeam(team = {}, fallbackName, fallbackTla) {
  const safeTeam = team && typeof team === 'object' ? team : {}
  const name = safeTeam.name || fallbackName
  const shortName = safeTeam.shortName || safeTeam.short_name || safeTeam.tla || name
  const tla = safeTeam.tla || fallbackTla || shortName

  return {
    id: safeTeam.id || null,
    name,
    shortName,
    tla,
    crest: safeTeam.crest || safeTeam.crestUrl || safeTeam.crest_url || safeTeam.logo || safeTeam.logoUrl || safeTeam.logo_url || '',
  }
}

function mapMatch(match = {}) {
  const date = createBrazilDatePayload(match.utcDate)
  const status = normalizeStatus(match.status)
  const homeScore = match.score?.fullTime?.home ?? match.score?.regularTime?.home ?? match.score?.halfTime?.home ?? null
  const awayScore = match.score?.fullTime?.away ?? match.score?.regularTime?.away ?? match.score?.halfTime?.away ?? null
  const homeTeam = normalizeTeam(match.homeTeam, 'Mandante', 'MAN')
  const awayTeam = normalizeTeam(match.awayTeam, 'Visitante', 'VIS')
  const competition = {
    id: match.competition?.id || null,
    name: match.competition?.name || 'Futebol',
    code: match.competition?.code || '',
    emblem: match.competition?.emblem || '',
  }

  return {
    id: `football-data-${match.id || `${match.utcDate}-${homeTeam.name}-${awayTeam.name}`}`,
    homeParticipant: homeTeam.name,
    awayParticipant: awayTeam.name,
    homeTeam,
    awayTeam,
    homeCrest: homeTeam.crest,
    awayCrest: awayTeam.crest,
    homeShield: homeTeam.tla,
    awayShield: awayTeam.tla,
    homeScore,
    awayScore,
    score: {
      home: homeScore,
      away: awayScore,
    },
    startsAt: date.utcDate,
    utcDate: date.utcDate,
    localDate: date.localDate,
    localDateIso: date.localDateIso,
    localTime: date.localTime,
    standardStatus: status,
    status,
    competition,
    competitionName: competition.name,
    championship: competition.name,
    competitionCode: competition.code,
    competitionLogo: competition.emblem,
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
        code: competition.code,
        namePtBr: competition.name,
        logoUrl: competition.emblem,
      },
      homeTeam,
      awayTeam,
      raw: match,
    },
  }
}

async function fetchCompetitionMatches({ competitionCode, apiKey, dateFrom, dateTo }) {
  const url = new URL(`${FOOTBALL_DATA_BASE_URL}/competitions/${competitionCode}/matches`)
  if (dateFrom) url.searchParams.set('dateFrom', dateFrom)
  if (dateTo) url.searchParams.set('dateTo', dateTo)
  if (!dateFrom && !dateTo) url.searchParams.set('season', String(WORLD_CUP_YEAR))

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

async function fetchCompetitions({ apiKey }) {
  const response = await fetch(`${FOOTBALL_DATA_BASE_URL}/competitions`, {
    headers: {
      'X-Auth-Token': apiKey,
    },
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || `Football-Data competitions request failed with status ${response.status}`)
  }

  return payload.competitions || []
}

function findWorldCupCompetition(competitions = []) {
  return competitions.find((competition) => {
    const season = competition.currentSeason || {}
    const startYear = Number(String(season.startDate || '').slice(0, 4))
    const endYear = Number(String(season.endDate || '').slice(0, 4))
    const name = String(competition.name || '').toLowerCase()
    const area = String(competition.area?.name || '').toLowerCase()

    return name.includes('fifa world cup')
      && area === 'world'
      && (startYear === WORLD_CUP_YEAR || endYear === WORLD_CUP_YEAR)
  }) || null
}

function getMatchStatus(match = {}) {
  return String(match.metadata?.providerStatus || match.standardStatus || match.status || '').toUpperCase()
}

function getMatchTime(match = {}) {
  const timestamp = new Date(match.startsAt || match.utcDate || 0).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function isMatchDay(match = {}, dateKey) {
  if (match.localDateIso) return match.localDateIso === dateKey

  const value = match.startsAt || match.utcDate
  if (!value) return false

  return toMaceioDateOnly(new Date(value)) === dateKey
}

function getMatchPriority(match = {}, today) {
  const status = getMatchStatus(match)
  const isToday = isMatchDay(match, today)

  if (LIVE_STATUSES.has(status) || ['AO_VIVO', 'INTERVALO'].includes(status)) return 0
  if (isToday && UPCOMING_STATUSES.has(status)) return 1
  if (isToday && FINISHED_STATUSES.has(status)) return 2
  if (!isToday && UPCOMING_STATUSES.has(status)) return 3
  return 4
}

function compareMatches(left, right, today) {
  const leftPriority = getMatchPriority(left, today)
  const rightPriority = getMatchPriority(right, today)

  if (leftPriority !== rightPriority) return leftPriority - rightPriority
  if (leftPriority === 0 || leftPriority === 2) return getMatchTime(right) - getMatchTime(left)
  return getMatchTime(left) - getMatchTime(right)
}

function selectRelevantMatches(matches = [], today, limit = DISPLAY_LIMIT) {
  const uniqueMatches = Array.from(new Map(matches.map((match) => [match.id, match])).values())
  const sortedMatches = uniqueMatches.sort((left, right) => compareMatches(left, right, today))
  const todayMatches = sortedMatches.filter((match) => getMatchPriority(match, today) < 3)
  const nextMatches = sortedMatches.filter((match) => getMatchPriority(match, today) === 3)

  return (todayMatches.length ? todayMatches : nextMatches).slice(0, limit)
}

function isWorldCupActive({ competition, matches = [], now = new Date() }) {
  const season = competition?.currentSeason || {}
  const seasonStart = season.startDate ? new Date(`${season.startDate}T00:00:00-03:00`).getTime() : 0
  const seasonEnd = season.endDate ? new Date(`${season.endDate}T23:59:59-03:00`).getTime() : 0
  const nowTime = now.getTime()
  const latestMatchTime = matches.reduce((latest, match) => Math.max(latest, getMatchTime(match)), 0)
  const finalGraceMs = 6 * 60 * 60 * 1000
  const hasPendingWorldCupMatch = matches.some((match) => {
    const status = getMatchStatus(match)
    return LIVE_STATUSES.has(status) || UPCOMING_STATUSES.has(status)
  })

  if (seasonStart && seasonEnd && nowTime >= seasonStart && nowTime <= seasonEnd) return true
  if (hasPendingWorldCupMatch) return true
  return latestMatchTime > 0 && nowTime <= latestMatchTime + finalGraceMs
}

function selectWorldCupMatches(matches = [], today, limit = DISPLAY_LIMIT) {
  const uniqueMatches = Array.from(new Map(matches.map((match) => [match.id, match])).values())
  const sortedMatches = uniqueMatches.sort((left, right) => compareMatches(left, right, today))
  const liveMatches = sortedMatches.filter((match) => getMatchPriority(match, today) === 0)
  const todayUpcoming = sortedMatches.filter((match) => getMatchPriority(match, today) === 1)
  const recentFinished = sortedMatches
    .filter((match) => FINISHED_STATUSES.has(getMatchStatus(match)) || ['FINALIZADO', 'ENCERRADO'].includes(getMatchStatus(match)))
    .sort((left, right) => getMatchTime(right) - getMatchTime(left))
  const nextMatches = sortedMatches.filter((match) => getMatchPriority(match, today) === 3)

  return [...liveMatches, ...todayUpcoming, ...recentFinished, ...nextMatches]
    .filter((match, index, list) => list.findIndex((item) => item.id === match.id) === index)
    .slice(0, limit)
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
    const competitionCatalog = await fetchCompetitions({ apiKey })
    const worldCupCompetition = findWorldCupCompetition(competitionCatalog)

    if (worldCupCompetition) {
      const worldCupMatches = await fetchCompetitionMatches({
        competitionCode: worldCupCompetition.code,
        apiKey,
      })

      if (isWorldCupActive({ competition: worldCupCompetition, matches: worldCupMatches })) {
        response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=120')
        response.status(worldCupMatches.length ? 200 : 502).json({
          source: 'football-data.org',
          mode: 'world-cup-2026',
          competitions: [worldCupCompetition.code],
          worldCup: {
            code: worldCupCompetition.code,
            name: worldCupCompetition.name,
            startDate: worldCupCompetition.currentSeason?.startDate || null,
            endDate: worldCupCompetition.currentSeason?.endDate || null,
          },
          dateWindow: {
            dateFrom: worldCupCompetition.currentSeason?.startDate || window.dateFrom,
            dateTo: worldCupCompetition.currentSeason?.endDate || window.dateTo,
          },
          matches: selectWorldCupMatches(worldCupMatches, String(request.query?.today || window.today)),
          errors: [],
        })
        return
      }
    }

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
      matches: selectRelevantMatches(matches, String(request.query?.today || window.today)),
      errors,
    })
  } catch (error) {
    response.status(502).json({ error: error.message || 'Football-Data request failed.' })
  }
}
