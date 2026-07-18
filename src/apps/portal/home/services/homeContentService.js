import { createContentPersistenceService, getSupabaseClient, toCamelCase } from '../../../../core/database'
import {
  getBrazilDateKey,
  getBrazilTime,
  formatBrazilDate,
  getRelativeBrazilDayLabel,
  getUtcTimestamp,
  isFinishedStatus,
  isLiveStatus,
  nowUtcIso,
  normalizeMatchStatus,
} from '../../../../core/time'
import { getSportsStatusLabel, translateCompetition, translateCountry } from '../../../../core/sports'
import { listCurrentFootballMatches } from '../../../../modules/competition/services/footballMatchQueryService'
import { listHomeEvents } from '../../../../modules/events/services/eventsService'
import {
  hasDisplayableMatchTeams,
  selectHomeFootballMatchesByPriority,
} from './homeFootballSelection'
import {
  getLiveMatchCenter,
  getLiveMatchCenterStatus,
  sortLiveMatchCenterMatches,
} from '../../../../modules/competition/services/liveMatchCenterService'

const NEWS_LIMIT = 3
const NEWS_PROXY_ENDPOINT = '/api/news'
const NEWS_STALE_HOURS = 8
const YOUTUBE_HITS_LIMIT = 5
const YOUTUBE_HITS_ENDPOINT = '/api/youtube/hits'
const MATCH_LIMIT = 3
const FOOTBALL_PROXY_ENDPOINT = '/api/football/matches'
const WORLD_CUP_YEAR = 2026
const WORLD_CUP_START_DATE = '2026-06-11'
const WORLD_CUP_END_DATE = '2026-07-19'

function formatDate(value) {
  return value ? formatBrazilDate(value) : ''
}

function getTeamField(team, fields = []) {
  if (!team || typeof team !== 'object') return ''
  return fields.map((field) => team[field]).find(Boolean) || ''
}

function getTeamDisplayName(team, directValue, fallback) {
  return directValue
    || getTeamField(team, ['name', 'shortName', 'short_name', 'tla'])
    || fallback
}

function getTeamShortLabel(team, fallback) {
  return getTeamField(team, ['tla', 'shortName', 'short_name', 'name']) || fallback
}

function getTeamCrest(team, directValue, metadataValue) {
  return directValue || getTeamField(team, ['crest', 'crestUrl', 'crest_url', 'logo', 'logoUrl', 'logo_url']) || metadataValue || ''
}

function getMatchMinute(match = {}) {
  const metadata = match.metadata && typeof match.metadata === 'object' ? match.metadata : {}
  const raw = metadata.raw && typeof metadata.raw === 'object' ? metadata.raw : {}
  const value = match.minute
    || match.elapsed
    || match.currentMinute
    || match.current_minute
    || metadata.minute
    || metadata.elapsed
    || metadata.currentMinute
    || metadata.current_minute
    || raw.minute
    || raw.elapsed

  const minute = Number.parseInt(String(value || ''), 10)
  return Number.isFinite(minute) && minute > 0 ? minute : null
}

function getMatchStatusLabel(match = {}, standardStatus) {
  const label = getSportsStatusLabel(standardStatus)
  const minute = isLiveStatus(standardStatus) ? getMatchMinute(match) : null

  return minute ? `${label} ${minute}'` : label
}

function normalizeTeamModel(team, {
  directName,
  directCrest,
  metadataShortName,
  fallbackName,
  fallbackTla,
} = {}) {
  const name = getTeamDisplayName(team, directName, fallbackName)
  const shortName = getTeamField(team, ['shortName', 'short_name']) || metadataShortName || name
  const tla = getTeamField(team, ['tla']) || metadataShortName || fallbackTla || shortName

  return {
    id: getTeamField(team, ['id']) || null,
    name,
    shortName,
    tla,
    crest: getTeamCrest(team, directCrest, ''),
  }
}

function getFootballDateParts(value) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) {
    return { dateKey: '', time: '' }
  }

  return {
    dateKey: getBrazilDateKey(date),
    time: getBrazilTime(date),
  }
}

function getFootballDateKey(value) {
  return getFootballDateParts(value).dateKey
}

function normalizeNewsArticle(article = {}) {
  const safeArticle = article && typeof article === 'object' ? article : {}
  const metadata = safeArticle.metadata && typeof safeArticle.metadata === 'object' ? safeArticle.metadata : {}

  return {
    id: safeArticle.id || safeArticle.slug || safeArticle.title || 'fallback-news',
    title: safeArticle.title || 'Noticia sem titulo',
    category: safeArticle.category || metadata.category || metadata.categoryName || 'Comunidade',
    date: formatDate(safeArticle.publishedAt || safeArticle.published_at || safeArticle.createdAt || safeArticle.created_at),
    image: safeArticle.image || safeArticle.coverUrl || safeArticle.cover_url || metadata.image || metadata.thumbnail || '',
    source: safeArticle.source || metadata.source || 'internal',
  }
}

function normalizeYoutubeHit(hit = {}, index = 0) {
  const safeHit = hit && typeof hit === 'object' ? hit : {}

  return {
    id: safeHit.id || safeHit.videoId || safeHit.url || `youtube-hit-${index}`,
    position: Number(safeHit.position || index + 1),
    title: safeHit.title || 'Hit indisponivel',
    channelTitle: safeHit.channelTitle || safeHit.channel || safeHit.artist || 'YouTube',
    thumbnail: safeHit.thumbnail || safeHit.image || '',
    url: safeHit.url || (safeHit.id ? `https://www.youtube.com/watch?v=${safeHit.id}` : ''),
    publishedAt: safeHit.publishedAt || '',
  }
}

export async function listYoutubeHits({ limit = YOUTUBE_HITS_LIMIT } = {}) {
  if (typeof fetch !== 'function') return { data: [], error: new Error('YouTube proxy indisponivel.'), source: 'youtube-proxy' }

  try {
    const endpoint = `${YOUTUBE_HITS_ENDPOINT}?limit=${encodeURIComponent(String(limit))}`
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        data: [],
        error: new Error(payload.error || payload.errors?.map((item) => item.message).filter(Boolean).join(', ') || `YouTube proxy retornou ${response.status}.`),
        source: 'youtube-proxy',
      }
    }

    return {
      data: Array.isArray(payload.hits) ? payload.hits.map(normalizeYoutubeHit).slice(0, limit) : [],
      error: Array.isArray(payload.errors) && payload.errors.length ? new Error(payload.errors.map((item) => item.message).filter(Boolean).join(', ')) : null,
      source: 'youtube-proxy',
    }
  } catch (error) {
    return { data: [], error, source: 'youtube-proxy' }
  }
}

function getNewsTimestamp(article = {}) {
  return getUtcTimestamp(article.publishedAt || article.published_at || article.createdAt || article.created_at || 0)
}

function isNewsCollectionStale(articles = [], now = nowUtcIso()) {
  if (!articles.length) return true

  const newestTimestamp = Math.max(...articles.map(getNewsTimestamp))
  if (!newestTimestamp) return true

  return getUtcTimestamp(now) - newestTimestamp > NEWS_STALE_HOURS * 60 * 60 * 1000
}

async function listNewsProxyArticles({ limit = NEWS_LIMIT } = {}) {
  if (typeof fetch !== 'function') return { data: [], error: new Error('News proxy indisponivel.'), source: 'gnews-proxy' }

  try {
    const endpoint = `${NEWS_PROXY_ENDPOINT}?limit=${encodeURIComponent(String(limit))}`

    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        data: [],
        error: new Error(payload.error || payload.errors?.map((item) => item.message).filter(Boolean).join(', ') || `News proxy retornou ${response.status}.`),
        source: 'gnews-proxy',
      }
    }

    return {
      data: Array.isArray(payload.articles) ? payload.articles.map(normalizeNewsArticle) : [],
      error: null,
      source: 'gnews-proxy',
      categories: Array.isArray(payload.categories) ? payload.categories : [],
    }
  } catch (error) {
    return { data: [], error, source: 'gnews-proxy' }
  }
}

function normalizeCompetitionMatch(match = {}, index = 0) {
  const safeMatch = match && typeof match === 'object' ? match : {}
  const startsAt = safeMatch.startsAt || safeMatch.starts_at || null
  const metadata = safeMatch.metadata && typeof safeMatch.metadata === 'object' ? safeMatch.metadata : {}
  const rawStatus = safeMatch.standardStatus || safeMatch.standard_status || metadata.standardStatus || normalizeMatchStatus(safeMatch.status)
  const standardStatus = getLiveMatchCenterStatus({ ...safeMatch, startsAt, standardStatus: rawStatus })
  const round = safeMatch.competitionRounds || safeMatch.competition_rounds || {}
  const stage = round.competitionStages || round.competition_stages || {}
  const season = stage.competitionSeasons || stage.competition_seasons || {}
  const competition = season.competitions || {}
  const competitionCode = safeMatch.competitionCode || safeMatch.competition_code || metadata.competition?.code || competition.code
  const competitionLogo = safeMatch.competitionLogo || safeMatch.competition_logo || competition.logoUrl || competition.logo_url || metadata.competition?.logoUrl || ''
  const homeTeamData = safeMatch.homeTeam || safeMatch.home_team || metadata.homeTeam || metadata.home_team || null
  const awayTeamData = safeMatch.awayTeam || safeMatch.away_team || metadata.awayTeam || metadata.away_team || null
  const homeTeamModel = normalizeTeamModel(homeTeamData, {
    directName: safeMatch.homeParticipant || safeMatch.home_participant,
    directCrest: safeMatch.homeCrest || safeMatch.home_crest || metadata.homeShield,
    metadataShortName: metadata.homeShortName || safeMatch.homeShield || safeMatch.home_shield,
    fallbackName: '',
    fallbackTla: '',
  })
  const awayTeamModel = normalizeTeamModel(awayTeamData, {
    directName: safeMatch.awayParticipant || safeMatch.away_participant,
    directCrest: safeMatch.awayCrest || safeMatch.away_crest || metadata.awayShield,
    metadataShortName: metadata.awayShortName || safeMatch.awayShield || safeMatch.away_shield,
    fallbackName: '',
    fallbackTla: '',
  })
  const homeCrest = homeTeamModel.crest
  const awayCrest = awayTeamModel.crest
  const dateSource = safeMatch.utcDate || safeMatch.utc_date || startsAt
  const localDateParts = getFootballDateParts(dateSource)
  const statusForDisplay = standardStatus
  const isFutureMatch = !isLiveStatus(statusForDisplay) && !isFinishedStatus(statusForDisplay) && getUtcTimestamp(startsAt) >= getUtcTimestamp(nowUtcIso())
  const homeScore = safeMatch.homeScore ?? safeMatch.home_score ?? safeMatch.score?.home ?? safeMatch.result?.homeScore ?? null
  const awayScore = safeMatch.awayScore ?? safeMatch.away_score ?? safeMatch.score?.away ?? safeMatch.result?.awayScore ?? null
  const championship = translateCompetition(safeMatch.competitionName || safeMatch.competition_name || safeMatch.competition?.name || competition.name || metadata.competition?.namePtBr || metadata.championship, competitionCode) || 'Competicao'

  return {
    id: safeMatch.id || `fallback-match-${index}`,
    championship,
    competition: {
      id: safeMatch.competition?.id || competition.id || null,
      name: championship,
      code: competitionCode || '',
      logo: competitionLogo,
    },
    competitionLogo,
    competitionCode,
    homeTeam: homeTeamModel.name,
    awayTeam: awayTeamModel.name,
    homeTeamData: homeTeamModel,
    awayTeamData: awayTeamModel,
    homeParticipant: homeTeamModel.name,
    awayParticipant: awayTeamModel.name,
    homeShield: homeTeamModel.tla || getTeamShortLabel(homeTeamData, ''),
    awayShield: awayTeamModel.tla || getTeamShortLabel(awayTeamData, ''),
    homeCrest,
    awayCrest,
    homeTeamCrest: homeCrest,
    awayTeamCrest: awayCrest,
    startsAt,
    utcDate: safeMatch.utcDate || safeMatch.utc_date || metadata.utcDate || startsAt,
    localDate: safeMatch.localDate || safeMatch.local_date || metadata.localDate || '',
    localDateIso: localDateParts.dateKey || safeMatch.localDateIso || safeMatch.local_date_iso || metadata.localDateIso || '',
    localTime: localDateParts.time || safeMatch.localTime || safeMatch.local_time || metadata.localTime || '',
    lastSyncedAt: safeMatch.lastSyncedAt || safeMatch.last_synced_at || safeMatch.syncedAt || safeMatch.synced_at || metadata.lastSyncedAt || metadata.last_synced_at || metadata.syncedAt || metadata.synced_at || '',
    dateLabel: isFutureMatch && localDateParts.time ? localDateParts.time : dateSource ? getRelativeBrazilDayLabel(dateSource) : '',
    standardStatus,
    status: getMatchStatusLabel(safeMatch, standardStatus),
    stadium: safeMatch.venue || metadata.venue || '',
    country: translateCountry(safeMatch.country || metadata.country || ''),
    city: safeMatch.city || metadata.city || '',
    stage: safeMatch.stage || metadata.stage || '',
    group: safeMatch.groupName || safeMatch.group_name || metadata.group || '',
    homeScore,
    awayScore,
    score: {
      home: homeScore,
      away: awayScore,
    },
    predictions: Number(metadata.predictionsCount || metadata.predictions || 0),
    closed: Boolean(safeMatch.closed),
    source: safeMatch.id ? 'competition' : 'fallback',
  }
}
function sortCurrentMatches(matches = [], now = nowUtcIso()) {
  return sortLiveMatchCenterMatches(matches, now)
}

export function isHomeFootballMatchToday(match = {}, now = nowUtcIso()) {
  const matchDate = getFootballDateKey(match.startsAt || match.starts_at || match.utcDate || match.utc_date)
    || match.localDateIso
    || match.local_date_iso
    || match.localDate
    || match.local_date
  const today = getFootballDateKey(now)

  return Boolean(matchDate && today && matchDate === today)
}

function isWorldCupMatch(match = {}) {
  const metadata = match.metadata || {}
  const code = String(match.competitionCode || match.competition_code || metadata.competition?.code || '').toUpperCase()
  const name = String(match.championship || match.competitionName || match.competition_name || metadata.competition?.namePtBr || metadata.competition?.name || '').toLowerCase()
  const startsAt = match.startsAt || match.starts_at || match.utcDate || match.utc_date
  const year = Number(getFootballDateKey(startsAt).slice(0, 4))

  return year === WORLD_CUP_YEAR && (code === 'WC' || name.includes('fifa world cup') || name.includes('copa do mundo'))
}

function isWorldCupWindowActive(now = nowUtcIso()) {
  const today = getFootballDateKey(now)

  return Boolean(today && today >= WORLD_CUP_START_DATE && today <= WORLD_CUP_END_DATE)
}

function isWorldCupActive(matches = [], now = nowUtcIso()) {
  const worldCupMatches = matches.filter(isWorldCupMatch)
  if (!worldCupMatches.length) return false
  if (isWorldCupWindowActive(now)) return true

  const nowTime = getUtcTimestamp(now)
  const latestMatchTime = worldCupMatches.reduce((latest, match) => Math.max(latest, getUtcTimestamp(match.startsAt || match.utcDate)), 0)
  const finalGraceMs = 6 * 60 * 60 * 1000
  const hasPendingMatch = worldCupMatches.some((match) => {
    const status = match.standardStatus || match.status
    return isLiveStatus(status) || (!isFinishedStatus(status) && getUtcTimestamp(match.startsAt || match.utcDate) >= nowTime)
  })

  return hasPendingMatch || (latestMatchTime > 0 && nowTime <= latestMatchTime + finalGraceMs)
}

function selectWorldCupMatches(matches = [], now = nowUtcIso(), limit = MATCH_LIMIT) {
  const worldCupMatches = matches.filter(isWorldCupMatch).filter(hasDisplayableMatchTeams)
  return selectHomeFootballMatchesByPriority(worldCupMatches, now, limit)
}

async function listFootballProxyMatches() {
  if (typeof fetch !== 'function') return { data: [], error: new Error('Football proxy indisponivel.'), source: 'football-data-proxy' }

  try {
    const response = await fetch(FOOTBALL_PROXY_ENDPOINT, {
      headers: { Accept: 'application/json' },
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        data: [],
        error: new Error(payload.error || payload.errors?.join(', ') || `Football proxy retornou ${response.status}.`),
        source: 'football-data-proxy',
      }
    }

    return {
      data: Array.isArray(payload.matches) ? payload.matches.map(normalizeCompetitionMatch) : [],
      error: null,
      source: 'football-data-proxy',
    }
  } catch (error) {
    return { data: [], error, source: 'football-data-proxy' }
  }
}

export function selectVisibleFootballMatches(matches = [], now = nowUtcIso(), limit = MATCH_LIMIT) {
  const displayableMatches = matches.filter(hasDisplayableMatchTeams)

  if (isWorldCupActive(displayableMatches, now)) {
    const worldCupMatches = selectWorldCupMatches(displayableMatches, now, limit)
    if (worldCupMatches.length) return worldCupMatches
  }

  return selectHomeFootballMatchesByPriority(displayableMatches, now, limit)
}

function getHomeLiveMatchCenter(visibleMatches = [], now = nowUtcIso()) {
  const featuredMatch = visibleMatches[0] || null
  return featuredMatch
    ? getLiveMatchCenter(visibleMatches, { now, match: featuredMatch })
    : getLiveMatchCenter([], { now })
}

function shouldUseFootballProxy({ visibleMatches = [], now = nowUtcIso() } = {}) {
  if (!visibleMatches.length) return true
  if (!isWorldCupWindowActive(now)) return false

  return !visibleMatches.some(isWorldCupMatch)
}

export async function listHybridNews({ limit = NEWS_LIMIT } = {}) {
  const client = getSupabaseClient()

  if (!client) {
    const fallback = await listNewsProxyArticles({ limit })
    return fallback.data.length ? fallback : { data: [], error: fallback.error || new Error('Supabase nao esta configurado.'), source: 'supabase' }
  }

  try {
    const contentService = createContentPersistenceService(client)
    const result = await contentService.listPublishedNews()

    if (result.error) {
      const fallback = await listNewsProxyArticles({ limit })
      return fallback.data.length ? fallback : { data: [], error: fallback.error || result.error, source: 'supabase' }
    }

    const rawNews = Array.isArray(result.data) ? result.data : []
    const internalNews = toCamelCase(rawNews)
      .filter((article) => !article.deletedAt)
      .sort((a, b) => getUtcTimestamp(b.publishedAt || b.createdAt || 0) - getUtcTimestamp(a.publishedAt || a.createdAt || 0))

    if (!internalNews.length || isNewsCollectionStale(internalNews)) {
      const fallback = await listNewsProxyArticles({ limit })
      if (fallback.data.length) return fallback

      if (!internalNews.length) {
        return { data: [], error: fallback.error || new Error('Nenhuma noticia sincronizada encontrada.'), source: 'supabase' }
      }
    }

    return {
      data: internalNews.map(normalizeNewsArticle).slice(0, limit),
      error: null,
      source: 'supabase',
    }
  } catch (error) {
    const fallback = await listNewsProxyArticles({ limit })
    return fallback.data.length ? fallback : { data: [], error: fallback.error || error, source: 'supabase' }
  }
}

export async function listNewsPageContent() {
  const result = await listHybridNews({ limit: 30 })
  const news = Array.isArray(result.data) ? result.data : []
  const categories = ['Todas', ...new Set(news.map((item) => item?.category).filter(Boolean))]

  return {
    ...result,
    categories,
    syncEngineReady: true,
  }
}

export async function listHomeCompetitionMatches({ limit = MATCH_LIMIT } = {}) {
  try {
    const result = await listCurrentFootballMatches({ includePredictions: true })
    let matches = []
    let fallbackError = null
    let source = 'competition'

    if (result.error) {
      const fallback = await listFootballProxyMatches()
      matches = fallback.data || []
      fallbackError = fallback.error || result.error
      source = fallback.data?.length ? fallback.source : 'supabase'
    } else {
      matches = result.data?.matches || []
      if (!matches.length) {
        const fallback = await listFootballProxyMatches()
        matches = fallback.data || []
        fallbackError = fallback.error || null
        source = fallback.data?.length ? fallback.source : 'competition'
      }
    }

    const now = nowUtcIso()
    matches = sortCurrentMatches(matches, now).filter(hasDisplayableMatchTeams)
    let visibleMatches = selectVisibleFootballMatches(matches, now, limit)

    if (shouldUseFootballProxy({ matches, visibleMatches, now })) {
      const fallback = await listFootballProxyMatches()
      if (fallback.data?.length) {
        matches = sortCurrentMatches(fallback.data, now).filter(hasDisplayableMatchTeams)
        visibleMatches = selectVisibleFootballMatches(matches, now, limit)
        fallbackError = null
        source = fallback.source
      } else {
        fallbackError = fallback.error || fallbackError
      }
    }

    const liveMatchCenter = getHomeLiveMatchCenter(visibleMatches, now)
    const finished = matches
      .filter((match) => isFinishedStatus(match.standardStatus))
      .slice(0, 2)
      .map((match) => ({
        id: match.id,
        game: `${match.homeTeam} x ${match.awayTeam}`,
        championship: match.championship,
      }))
    return {
      data: visibleMatches,
      next: liveMatchCenter.match,
      liveMatchCenter,
      results: finished,
      error: visibleMatches.length ? null : fallbackError || result.error || null,
      source,
    }
  } catch (error) {
    const fallback = await listFootballProxyMatches()
    const now = nowUtcIso()
    const matches = sortCurrentMatches(fallback.data || [], now).filter(hasDisplayableMatchTeams)
    const visibleMatches = selectVisibleFootballMatches(matches, now, limit)
    const liveMatchCenter = getHomeLiveMatchCenter(visibleMatches, now)

    return {
      data: visibleMatches,
      next: liveMatchCenter.match,
      liveMatchCenter,
      results: [],
      error: visibleMatches.length ? null : fallback.error || error,
      source: visibleMatches.length ? fallback.source : 'supabase',
    }
  }
}

export async function loadHomeDashboardContent() {
  const [news, competition, events, youtubeHits] = await Promise.all([
    listHybridNews(),
    listHomeCompetitionMatches(),
    listHomeEvents().catch((error) => {
      console.warn('[homeContentService] Falha ao carregar eventos da Home', error)
      return { data: [], error }
    }),
    listYoutubeHits().catch((error) => {
      console.warn('[homeContentService] Falha ao carregar hits do YouTube', error)
      return { data: [], error }
    }),
  ])

  return {
    news: Array.isArray(news?.data) ? news.data : [],
    events: Array.isArray(events?.data) ? events.data : [],
    youtubeHits: Array.isArray(youtubeHits?.data) ? youtubeHits.data : [],
    competitionMatches: Array.isArray(competition?.data) ? competition.data : [],
    nextMatch: competition?.next || null,
    liveMatchCenter: competition?.liveMatchCenter || getLiveMatchCenter([]),
    latestResults: Array.isArray(competition?.results) ? competition.results : [],
    errors: [news?.error, competition?.error].filter(Boolean),
  }
}
