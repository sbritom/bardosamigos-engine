import { createClient } from '@supabase/supabase-js'

const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4'
const DEFAULT_COMPETITIONS = ['WC', 'CL', 'BL1', 'DED', 'BSA', 'PD', 'FL1', 'ELC', 'PPL', 'EC', 'SA', 'PL']
const ALLOWED_COMPETITIONS = new Set(DEFAULT_COMPETITIONS)
const LIVE_STATUSES = new Set(['LIVE', 'IN_PLAY', 'PAUSED'])
const FINISHED_STATUSES = new Set(['FINISHED'])
const UPCOMING_STATUSES = new Set(['SCHEDULED', 'TIMED'])
const DISPLAY_LIMIT = 12
const WORLD_CUP_YEAR = 2026
const MAX_COMPETITIONS = 12
const REQUEST_TIMEOUT_MS = 8000
const COMPETITION_CODE_RE = /^[A-Z0-9]{2,6}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MATCH_ID_RE = /^\d{1,12}$/

function getSupabaseAdmin() {
  const url = String(process.env.SUPABASE_URL || '').trim()
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!url || !key) return null

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function settleFinishedMatches(matches = []) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return { enabled: false, attempted: 0, settled: 0, scoredPredictions: 0, errors: [] }
  }

  const finished = matches
    .filter((match) => (
      FINISHED_STATUSES.has(String(match.metadata?.providerStatus || '').toUpperCase())
      && match.providerMatchId
      && Number.isInteger(match.homeScore)
      && Number.isInteger(match.awayScore)
    ))
    .slice(0, 40)

  let settled = 0
  let scoredPredictions = 0
  const errors = []

  for (const match of finished) {
    const { data, error } = await supabase.rpc('imortal_settle_football_match', {
      p_external_ref: String(match.providerMatchId),
      p_home_score: match.homeScore,
      p_away_score: match.awayScore,
      p_provider_metadata: {
        footballDataStatus: match.metadata?.providerStatus || 'FINISHED',
        competitionCode: match.competitionCode || '',
        autoSettlementCheckedAt: new Date().toISOString(),
      },
    })

    if (error) {
      errors.push(`${match.providerMatchId}: ${error.message || 'settlement failed'}`)
      continue
    }

    if (data?.found && !data?.alreadySettled) settled += 1
    scoredPredictions += Number(data?.scoredPredictions || 0)
  }

  return {
    enabled: true,
    attempted: finished.length,
    settled,
    scoredPredictions,
    errors,
  }
}

function getApiKey() {
  return String(process.env.FOOTBALL_DATA_API_KEY || '').trim()
}

function normalizeDate(value, fallback) {
  const candidate = String(value || '').trim()
  if (!DATE_RE.test(candidate)) return fallback

  const parsed = new Date(`${candidate}T12:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? fallback : candidate
}

function normalizeDateRange(dateFrom, dateTo, fallbackFrom, fallbackTo) {
  const from = normalizeDate(dateFrom, fallbackFrom)
  const to = normalizeDate(dateTo, fallbackTo)
  const fromTime = new Date(`${from}T00:00:00Z`).getTime()
  const toTime = new Date(`${to}T00:00:00Z`).getTime()
  const maxRangeMs = 31 * 24 * 60 * 60 * 1000

  if (toTime < fromTime || toTime - fromTime > maxRangeMs) {
    return { dateFrom: fallbackFrom, dateTo: fallbackTo }
  }

  return { dateFrom: from, dateTo: to }
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
  const from = new Date(now)
  const to = new Date(now)
  from.setDate(from.getDate() - 2)
  to.setDate(to.getDate() + 14)

  return {
    today: toMaceioDateOnly(now),
    dateFrom: toMaceioDateOnly(from),
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
    providerMatchId: match.id ? String(match.id) : '',
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
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || `Football-Data competitions request failed with status ${response.status}`)
  }

  return payload.competitions || []
}

function mapStandingRow(row = {}) {
  const team = normalizeTeam(row.team, 'Time', '')
  return {
    position: Number(row.position) || 0,
    team,
    name: team.name,
    crest: team.crest,
    played: Number(row.playedGames) || 0,
    wins: Number(row.won) || 0,
    draws: Number(row.draw) || 0,
    losses: Number(row.lost) || 0,
    points: Number(row.points) || 0,
    goalsFor: Number(row.goalsFor) || 0,
    goalsAgainst: Number(row.goalsAgainst) || 0,
    goalDifference: Number(row.goalDifference) || 0,
  }
}

async function fetchCompetitionStandings({ competitionCode, apiKey }) {
  const response = await fetch(`${FOOTBALL_DATA_BASE_URL}/competitions/${competitionCode}/standings`, {
    headers: {
      'X-Auth-Token': apiKey,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || `Football-Data standings request failed with status ${response.status}`)
  }

  const competition = {
    id: payload.competition?.id || null,
    code: payload.competition?.code || competitionCode,
    name: payload.competition?.name || competitionCode,
    emblem: payload.competition?.emblem || '',
  }

  const standings = (payload.standings || []).map((standing) => ({
    stage: standing.stage || '',
    type: standing.type || 'TOTAL',
    group: standing.group || '',
    rows: (standing.table || []).map(mapStandingRow),
  }))

  return { competition, season: payload.season || null, standings }
}
function mapScorer(item = {}) {
  const player = item.player || {}
  const team = normalizeTeam(item.team, 'Time', '')
  return {
    player: {
      id: player.id || null,
      name: player.name || 'Jogador',
      firstName: player.firstName || '',
      lastName: player.lastName || '',
      nationality: player.nationality || '',
      position: player.position || '',
      dateOfBirth: player.dateOfBirth || '',
    },
    team,
    playedMatches: Number(item.playedMatches) || 0,
    goals: Number(item.goals) || 0,
    assists: item.assists == null ? null : Number(item.assists),
    penalties: item.penalties == null ? null : Number(item.penalties),
  }
}

async function fetchCompetitionScorers({ competitionCode, apiKey }) {
  const url = new URL(`${FOOTBALL_DATA_BASE_URL}/competitions/${competitionCode}/scorers`)
  url.searchParams.set('limit', '20')
  const response = await fetch(url, {
    headers: { 'X-Auth-Token': apiKey },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || `Football-Data scorers request failed with status ${response.status}`)
  }

  return {
    competition: {
      id: payload.competition?.id || null,
      code: payload.competition?.code || competitionCode,
      name: payload.competition?.name || competitionCode,
      emblem: payload.competition?.emblem || '',
    },
    season: payload.season || null,
    scorers: (payload.scorers || []).map(mapScorer),
  }
}
function eventMinute(item = {}) {
  return Number(item.minute ?? item.time ?? item.elapsed ?? 0) || 0
}

function eventTeamName(item = {}) {
  return item.team?.name || item.teamName || ''
}

function buildMatchEvents(match = {}) {
  const goals = (match.goals || []).map((item) => ({
    minute: eventMinute(item),
    type: 'GOAL',
    label: item.type === 'OWN' ? 'Gol contra' : item.type === 'PENALTY' ? 'Gol de pênalti' : 'Gol',
    playerName: item.scorer?.name || '',
    assistName: item.assist?.name || '',
    teamName: eventTeamName(item),
  }))
  const bookings = (match.bookings || []).map((item) => ({
    minute: eventMinute(item),
    type: item.card || 'CARD',
    label: item.card === 'RED_CARD' ? 'Cartão vermelho' : item.card === 'YELLOW_RED_CARD' ? 'Segundo amarelo' : 'Cartão amarelo',
    playerName: item.player?.name || '',
    teamName: eventTeamName(item),
  }))
  const substitutions = (match.substitutions || []).map((item) => ({
    minute: eventMinute(item),
    type: 'SUBSTITUTION',
    label: 'Substituição',
    playerName: [item.playerOut?.name, item.playerIn?.name].filter(Boolean).join(' → '),
    teamName: eventTeamName(item),
  }))

  return [...goals, ...bookings, ...substitutions].sort((left, right) => left.minute - right.minute)
}

function countEventsByTeam(items = [], teamId) {
  return items.filter((item) => item.team?.id === teamId).length
}

function mapDetailedMatch(match = {}) {
  const base = mapMatch(match)
  const homeId = match.homeTeam?.id
  const awayId = match.awayTeam?.id
  const mainReferee = (match.referees || []).find((item) => item.type === 'REFEREE') || (match.referees || [])[0] || null
  const fullTime = match.score?.fullTime || {}
  const halfTime = match.score?.halfTime || {}
  const bookings = Array.isArray(match.bookings) ? match.bookings : []
  const substitutions = Array.isArray(match.substitutions) ? match.substitutions : []
  const penalties = Array.isArray(match.penalties) ? match.penalties : []

  return {
    providerMatchId: match.id ? String(match.id) : '',
    homeTeam: base.homeParticipant,
    awayTeam: base.awayParticipant,
    homeCrest: base.homeCrest,
    awayCrest: base.awayCrest,
    homeScore: base.homeScore,
    awayScore: base.awayScore,
    startsAt: base.startsAt,
    utcDate: base.utcDate,
    localDate: base.localDate,
    localDateIso: base.localDateIso,
    localTime: base.localTime,
    standardStatus: base.standardStatus,
    status: base.status,
    competitionName: base.competitionName,
    competitionCode: base.competitionCode,
    competitionLogo: base.competitionLogo,
    country: base.country,
    venue: match.venue || '',
    attendance: match.attendance ?? null,
    matchday: match.matchday ?? null,
    stage: match.stage || '',
    groupName: match.group || '',
    minute: match.minute ?? null,
    injuryTime: match.injuryTime ?? null,
    referee: mainReferee?.name || '',
    referees: match.referees || [],
    scoreDetails: {
      winner: match.score?.winner || '',
      duration: match.score?.duration || '',
      fullTime,
      halfTime,
    },
    events: buildMatchEvents(match),
    lineups: {
      home: match.homeTeam?.lineup || [],
      away: match.awayTeam?.lineup || [],
      homeBench: match.homeTeam?.bench || [],
      awayBench: match.awayTeam?.bench || [],
      homeFormation: match.homeTeam?.formation || '',
      awayFormation: match.awayTeam?.formation || '',
      homeCoach: match.homeTeam?.coach || null,
      awayCoach: match.awayTeam?.coach || null,
    },
    statistics: {
      halfTime: (halfTime.home != null || halfTime.away != null) ? { home: halfTime.home, away: halfTime.away } : null,
      goals: (fullTime.home != null || fullTime.away != null) ? { home: fullTime.home, away: fullTime.away } : null,
      cards: { home: countEventsByTeam(bookings, homeId), away: countEventsByTeam(bookings, awayId) },
      substitutions: { home: countEventsByTeam(substitutions, homeId), away: countEventsByTeam(substitutions, awayId) },
      penalties: penalties.length ? { home: countEventsByTeam(penalties, homeId), away: countEventsByTeam(penalties, awayId) } : null,
      attendance: match.attendance ?? null,
      duration: match.score?.duration || '',
    },
    metadata: {
      provider: 'football-data.org',
      providerStatus: match.status || '',
      raw: match,
    },
  }
}

async function fetchMatchDetails({ matchId, apiKey }) {
  const response = await fetch(`${FOOTBALL_DATA_BASE_URL}/matches/${matchId}`, {
    headers: {
      'X-Auth-Token': apiKey,
      'X-Unfold-Goals': 'true',
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || `Football-Data match request failed with status ${response.status}`)
  }

  return mapDetailedMatch(payload)
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

  const resource = String(request.query?.resource || 'matches').trim().toLowerCase()
  const requestedCompetition = String(request.query?.competition || '').trim().toUpperCase()

  if (resource === 'match') {
    const requestedMatchId = String(request.query?.matchId || '').trim()
    if (!MATCH_ID_RE.test(requestedMatchId)) {
      response.status(400).json({ error: 'Invalid match id.' })
      return
    }

    try {
      const match = await fetchMatchDetails({ matchId: requestedMatchId, apiKey })
      response.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300')
      response.status(200).json({
        source: 'football-data.org',
        resource: 'match',
        match,
      })
    } catch (error) {
      response.status(502).json({
        source: 'football-data.org',
        resource: 'match',
        matchId: requestedMatchId,
        error: error.message || 'Football-Data match request failed.',
      })
    }
    return
  }
  if (resource === 'scorers') {
    if (!ALLOWED_COMPETITIONS.has(requestedCompetition)) {
      response.status(400).json({ error: 'Invalid or unsupported competition.' })
      return
    }

    try {
      const result = await fetchCompetitionScorers({ competitionCode: requestedCompetition, apiKey })
      response.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800')
      response.status(200).json({
        source: 'football-data.org',
        resource: 'scorers',
        ...result,
      })
    } catch (error) {
      response.status(502).json({
        source: 'football-data.org',
        resource: 'scorers',
        competition: requestedCompetition,
        error: error.message || 'Football-Data scorers request failed.',
      })
    }
    return
  }
  if (resource === 'standings') {
    if (!ALLOWED_COMPETITIONS.has(requestedCompetition)) {
      response.status(400).json({ error: 'Invalid or unsupported competition.' })
      return
    }

    try {
      const result = await fetchCompetitionStandings({ competitionCode: requestedCompetition, apiKey })
      response.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800')
      response.status(200).json({
        source: 'football-data.org',
        resource: 'standings',
        ...result,
      })
    } catch (error) {
      response.status(502).json({
        source: 'football-data.org',
        resource: 'standings',
        competition: requestedCompetition,
        error: error.message || 'Football-Data standings request failed.',
      })
    }
    return
  }
  const window = createDateWindow()
  const competitions = String(request.query?.competitions || process.env.FOOTBALL_DATA_COMPETITION_CODE || DEFAULT_COMPETITIONS.join(','))
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter((item) => COMPETITION_CODE_RE.test(item) && ALLOWED_COMPETITIONS.has(item))
    .slice(0, MAX_COMPETITIONS)

  const safeCompetitions = competitions.length ? competitions : DEFAULT_COMPETITIONS
  const dateRange = normalizeDateRange(
    request.query?.dateFrom,
    request.query?.dateTo,
    window.dateFrom,
    window.dateTo,
  )
  const today = normalizeDate(request.query?.today, window.today)

  try {
    const competitionCatalog = await fetchCompetitions({ apiKey })
    const worldCupCompetition = findWorldCupCompetition(competitionCatalog)

    if (worldCupCompetition) {
      const worldCupMatches = await fetchCompetitionMatches({
        competitionCode: worldCupCompetition.code,
        apiKey,
      })

      if (isWorldCupActive({ competition: worldCupCompetition, matches: worldCupMatches })) {
        const settlement = await settleFinishedMatches(worldCupMatches)
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
          matches: selectWorldCupMatches(worldCupMatches, today),
          settlement,
          errors: [],
        })
        return
      }
    }

    const results = await Promise.allSettled(
      safeCompetitions.map((competitionCode) => fetchCompetitionMatches({
        competitionCode,
        apiKey,
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
      })),
    )
    const matches = results.flatMap((item) => item.status === 'fulfilled' ? item.value : [])
    const errors = results
      .filter((item) => item.status === 'rejected')
      .map((item) => item.reason?.message || 'Unknown Football-Data error')
    const settlement = await settleFinishedMatches(matches)

    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=120')
    response.status(matches.length ? 200 : 502).json({
      source: 'football-data.org',
      competitions: safeCompetitions,
      dateWindow: {
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
      },
      matches: selectRelevantMatches(matches, today),
      settlement,
      errors,
    })
  } catch (error) {
    response.status(502).json({ error: error.message || 'Football-Data request failed.' })
  }
}

// Football env sync
