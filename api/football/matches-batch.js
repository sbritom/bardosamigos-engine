import { createClient } from '@supabase/supabase-js'
import legacyFootballHandler from './matches.js'
import { applyApiCors, getBearerToken, timingSafeEqualText } from '../_lib/security.js'

const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4'
const DEFAULT_COMPETITIONS = ['WC', 'CL', 'BL1', 'DED', 'BSA', 'PD', 'FL1', 'ELC', 'PPL', 'EC', 'SA', 'PL']
const COMPETITION_IDS = Object.freeze({
  WC: 2000,
  CL: 2001,
  BL1: 2002,
  DED: 2003,
  BSA: 2013,
  PD: 2014,
  FL1: 2015,
  ELC: 2016,
  PPL: 2017,
  EC: 2018,
  SA: 2019,
  PL: 2021,
})
const ALLOWED_COMPETITIONS = new Set(DEFAULT_COMPETITIONS)
const LIVE_STATUSES = new Set(['LIVE', 'IN_PLAY', 'PAUSED'])
const FINISHED_STATUSES = new Set(['FINISHED'])
const UPCOMING_STATUSES = new Set(['SCHEDULED', 'TIMED'])
const DISPLAY_LIMIT = 12
const MAX_COMPETITIONS = 12
const REQUEST_TIMEOUT_MS = 8000
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

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

function getApiKey() {
  return String(process.env.FOOTBALL_DATA_API_KEY || '').trim()
}

function isAuthorizedSettlementRequest(request) {
  const secret = String(process.env.CRON_SECRET || '').trim()
  if (!secret) return false
  return timingSafeEqualText(getBearerToken(request), secret)
}

function createSkippedSettlement(reason = 'cron-only') {
  return {
    enabled: false,
    reason,
    attempted: 0,
    settled: 0,
    scoredPredictions: 0,
    errors: [],
  }
}

async function settleFinishedMatches(matches = []) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return createSkippedSettlement('supabase-admin-unavailable')

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
    try {
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
    } catch (error) {
      errors.push(`${match.providerMatchId}: ${error?.message || 'settlement failed'}`)
    }
  }

  return {
    enabled: true,
    attempted: finished.length,
    settled,
    scoredPredictions,
    errors,
  }
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
    score: { home: homeScore, away: awayScore },
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

function isFinishedMatch(match = {}) {
  const status = getMatchStatus(match)
  return FINISHED_STATUSES.has(status) || ['FINALIZADO', 'ENCERRADO'].includes(status)
}

function selectRelevantMatches(matches = [], today, limit = DISPLAY_LIMIT) {
  const uniqueMatches = Array.from(new Map(matches.map((match) => [match.id, match])).values())
  const sortedMatches = uniqueMatches.sort((left, right) => compareMatches(left, right, today))
  const liveMatches = sortedMatches.filter((match) => getMatchPriority(match, today) === 0)
  const todayUpcoming = sortedMatches.filter((match) => getMatchPriority(match, today) === 1)
  const recentFinished = sortedMatches.filter(isFinishedMatch).sort((left, right) => getMatchTime(right) - getMatchTime(left))
  const nextMatches = sortedMatches.filter((match) => getMatchPriority(match, today) === 3)

  const selected = []
  const seen = new Set()
  const append = (items, maxItems = Infinity) => {
    for (const match of items) {
      if (selected.length >= limit || maxItems <= 0) break
      if (!match?.id || seen.has(match.id)) continue
      selected.push(match)
      seen.add(match.id)
      maxItems -= 1
    }
  }

  append(liveMatches)
  const availableAfterLive = Math.max(0, limit - selected.length)
  const reservedResults = Math.min(4, recentFinished.length, availableAfterLive)
  const todaySlots = Math.max(0, availableAfterLive - reservedResults)
  append(todayUpcoming, todaySlots)
  append(recentFinished, reservedResults)
  append(nextMatches)

  return selected.slice(0, limit)
}

async function fetchMatchesAcrossCompetitions({ competitionCodes, apiKey, dateFrom, dateTo }) {
  const competitionIds = competitionCodes
    .map((code) => COMPETITION_IDS[code])
    .filter(Boolean)

  if (!competitionIds.length) return []

  const url = new URL(`${FOOTBALL_DATA_BASE_URL}/matches`)
  url.searchParams.set('competitions', competitionIds.join(','))
  if (dateFrom) url.searchParams.set('dateFrom', dateFrom)
  if (dateTo) url.searchParams.set('dateTo', dateTo)

  const providerResponse = await fetch(url, {
    headers: { 'X-Auth-Token': apiKey },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  const payload = await providerResponse.json().catch(() => ({}))

  if (!providerResponse.ok) {
    const error = new Error(payload.message || `Football-Data request failed with status ${providerResponse.status}`)
    error.status = providerResponse.status
    error.retryAfter = providerResponse.headers.get('retry-after') || ''
    throw error
  }

  return (payload.matches || []).map(mapMatch)
}

export default async function handler(request, response) {
  const resource = String(request.query?.resource || 'matches').trim().toLowerCase()

  // Mantém os recursos detalhados (partida, classificação e artilharia)
  // no handler legado. Apenas a listagem geral é agregada para reduzir
  // o consumo do limite do Football-Data.
  if (resource !== 'matches') {
    return legacyFootballHandler(request, response)
  }

  const trustedOrigin = applyApiCors(request, response, {
    methods: 'GET, OPTIONS',
    headers: 'Content-Type, Authorization',
  })

  if (!trustedOrigin) {
    response.status(403).json({ error: 'Origin not allowed.' })
    return
  }

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
    response.setHeader('Cache-Control', 'no-store')
    response.status(503).json({ error: 'FOOTBALL_DATA_API_KEY is not configured.' })
    return
  }

  const dateWindow = createDateWindow()
  const competitions = String(request.query?.competitions || process.env.FOOTBALL_DATA_COMPETITION_CODE || DEFAULT_COMPETITIONS.join(','))
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter((item) => ALLOWED_COMPETITIONS.has(item))
    .slice(0, MAX_COMPETITIONS)
  const safeCompetitions = competitions.length ? competitions : DEFAULT_COMPETITIONS
  const dateRange = normalizeDateRange(
    request.query?.dateFrom,
    request.query?.dateTo,
    dateWindow.dateFrom,
    dateWindow.dateTo,
  )
  const today = normalizeDate(request.query?.today, dateWindow.today)
  const maySettle = isAuthorizedSettlementRequest(request)

  try {
    const matches = await fetchMatchesAcrossCompetitions({
      competitionCodes: safeCompetitions,
      apiKey,
      dateFrom: dateRange.dateFrom,
      dateTo: dateRange.dateTo,
    })

    const settlement = maySettle
      ? await settleFinishedMatches(matches)
      : createSkippedSettlement()

    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    response.status(200).json({
      source: 'football-data.org',
      mode: 'aggregated',
      competitions: safeCompetitions,
      dateWindow: {
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
      },
      matches: selectRelevantMatches(matches, today),
      settlement,
      errors: [],
    })
  } catch (error) {
    response.setHeader('Cache-Control', 'no-store')
    if (error?.retryAfter) response.setHeader('Retry-After', error.retryAfter)
    response.status(error?.status === 429 ? 429 : 502).json({
      source: 'football-data.org',
      mode: 'aggregated',
      competitions: safeCompetitions,
      dateWindow: {
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
      },
      matches: [],
      settlement: createSkippedSettlement('provider-unavailable'),
      errors: [error?.message || 'Football-Data request failed.'],
    })
  }
}
