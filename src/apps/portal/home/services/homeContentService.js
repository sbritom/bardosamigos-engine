import { createContentPersistenceService, getSupabaseClient, toCamelCase } from '../../../../core/database'
import {
  formatBrazilDate,
  getRelativeBrazilDayLabel,
  getUtcTimestamp,
  isFinishedStatus,
  nowUtcIso,
  normalizeMatchStatus,
} from '../../../../core/time'
import { getSportsStatusLabel, translateCompetition, translateCountry } from '../../../../core/sports'
import { listCurrentFootballMatches } from '../../../../modules/competition/services/footballMatchQueryService'
import {
  getLiveMatchCenter,
  getLiveMatchCenterStatus,
  getLiveMatchCenterPriority,
  sortLiveMatchCenterMatches,
} from '../../../../modules/competition/services/liveMatchCenterService'

const NEWS_LIMIT = 3
const MATCH_LIMIT = 3

function formatDate(value) {
  return value ? formatBrazilDate(value) : ''
}

function formatParticipant(value, fallback) {
  return value || fallback
}

function normalizeNewsArticle(article = {}) {
  const safeArticle = article && typeof article === 'object' ? article : {}
  const metadata = safeArticle.metadata && typeof safeArticle.metadata === 'object' ? safeArticle.metadata : {}

  return {
    id: safeArticle.id || safeArticle.slug || safeArticle.title || 'fallback-news',
    title: safeArticle.title || 'Noticia sem titulo',
    category: metadata.category || metadata.categoryName || 'Comunidade',
    date: formatDate(safeArticle.publishedAt || safeArticle.published_at || safeArticle.createdAt || safeArticle.created_at),
    image: safeArticle.coverUrl || safeArticle.cover_url || metadata.image || metadata.thumbnail || '',
    source: safeArticle.source || 'internal',
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
  const homeCrest = safeMatch.homeCrest || safeMatch.home_crest || metadata.homeShield || ''
  const awayCrest = safeMatch.awayCrest || safeMatch.away_crest || metadata.awayShield || ''
  const dateSource = safeMatch.utcDate || safeMatch.utc_date || startsAt

  return {
    id: safeMatch.id || `fallback-match-${index}`,
    championship: translateCompetition(safeMatch.competitionName || safeMatch.competition_name || competition.name || metadata.competition?.namePtBr || metadata.championship, competitionCode) || 'Competicao',
    competitionLogo,
    competitionCode,
    homeTeam: formatParticipant(safeMatch.homeParticipant || safeMatch.home_participant, 'Mandante'),
    awayTeam: formatParticipant(safeMatch.awayParticipant || safeMatch.away_participant, 'Visitante'),
    homeShield: metadata.homeShortName || 'BDA',
    awayShield: metadata.awayShortName || 'BDA',
    homeCrest,
    awayCrest,
    homeTeamCrest: homeCrest,
    awayTeamCrest: awayCrest,
    startsAt,
    utcDate: safeMatch.utcDate || safeMatch.utc_date || metadata.utcDate || startsAt,
    localDate: safeMatch.localDate || safeMatch.local_date || metadata.localDate || '',
    localDateIso: safeMatch.localDateIso || safeMatch.local_date_iso || metadata.localDateIso || '',
    localTime: safeMatch.localTime || safeMatch.local_time || metadata.localTime || '',
    lastSyncedAt: safeMatch.lastSyncedAt || safeMatch.last_synced_at || safeMatch.syncedAt || safeMatch.synced_at || metadata.lastSyncedAt || metadata.last_synced_at || metadata.syncedAt || metadata.synced_at || '',
    dateLabel: dateSource ? getRelativeBrazilDayLabel(dateSource) : '',
    standardStatus,
    status: getSportsStatusLabel(standardStatus),
    stadium: safeMatch.venue || metadata.venue || '',
    country: translateCountry(safeMatch.country || metadata.country || ''),
    city: safeMatch.city || metadata.city || '',
    stage: safeMatch.stage || metadata.stage || '',
    group: safeMatch.groupName || safeMatch.group_name || metadata.group || '',
    homeScore: safeMatch.homeScore ?? safeMatch.home_score ?? safeMatch.result?.homeScore ?? null,
    awayScore: safeMatch.awayScore ?? safeMatch.away_score ?? safeMatch.result?.awayScore ?? null,
    predictions: Number(metadata.predictionsCount || metadata.predictions || 0),
    closed: Boolean(safeMatch.closed),
    source: safeMatch.id ? 'competition' : 'fallback',
  }
}
function getMatchPriority(match, now = nowUtcIso()) {
  return getLiveMatchCenterPriority(match, now)
}

function sortCurrentMatches(matches = [], now = nowUtcIso()) {
  return sortLiveMatchCenterMatches(matches, now)
}

export async function listHybridNews({ limit = NEWS_LIMIT } = {}) {
  const client = getSupabaseClient()

  if (!client) {
    return { data: [], error: new Error('Supabase nao esta configurado.'), source: 'supabase' }
  }

  try {
    const contentService = createContentPersistenceService(client)
    const result = await contentService.listPublishedNews()

    if (result.error) {
      return { data: [], error: result.error, source: 'supabase' }
    }

    const rawNews = Array.isArray(result.data) ? result.data : []
    const internalNews = toCamelCase(rawNews)
      .filter((article) => !article.deletedAt)
      .sort((a, b) => getUtcTimestamp(b.publishedAt || b.createdAt || 0) - getUtcTimestamp(a.publishedAt || a.createdAt || 0))
      .map(normalizeNewsArticle)

    return {
      data: internalNews.slice(0, limit),
      error: null,
      source: 'supabase',
    }
  } catch (error) {
    return { data: [], error, source: 'supabase' }
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

    if (result.error) {
      return { data: [], next: null, results: [], error: result.error, source: 'supabase' }
    }

    const now = nowUtcIso()
    const matches = sortCurrentMatches(result.data?.matches || [], now)
    const liveMatchCenter = getLiveMatchCenter(matches, { now })
    const visibleMatches = matches
      .filter((match) => getMatchPriority(match, now) < 3)
      .slice(0, limit)
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
      error: null,
      source: 'competition',
    }
  } catch (error) {
    return { data: [], next: null, results: [], error, source: 'supabase' }
  }
}

export async function loadHomeDashboardContent() {
  const [news, competition] = await Promise.all([listHybridNews(), listHomeCompetitionMatches()])

  return {
    news: Array.isArray(news?.data) ? news.data : [],
    competitionMatches: Array.isArray(competition?.data) ? competition.data : [],
    nextMatch: competition?.next || null,
    liveMatchCenter: competition?.liveMatchCenter || getLiveMatchCenter([]),
    latestResults: Array.isArray(competition?.results) ? competition.results : [],
    errors: [news?.error, competition?.error].filter(Boolean),
  }
}
