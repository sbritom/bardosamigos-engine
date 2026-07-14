import {
  getUtcTimestamp,
  isFinishedStatus,
  isLiveStatus,
  normalizeMatchStatus,
  STANDARD_MATCH_STATUS,
} from '../../../core/time/timeService.js'
import { translateCountry } from '../../../core/sports/sportsDictionary.js'

const RECENT_FINISHED_HOURS = 48
const LIVE_MATCH_STALE_HOURS = 3
const LIVE_SYNC_STALE_MINUTES = 45
export const LIVE_MATCH_CENTER_EMPTY_STATUS = 'EMPTY'

function normalizeMatchInput(match) {
  return match && typeof match === 'object' ? match : null
}

function getMatchDateValue(match) {
  const safeMatch = normalizeMatchInput(match)
  if (!safeMatch) return null
  return safeMatch.startsAt || safeMatch.starts_at || safeMatch.utcDate || safeMatch.utc_date || safeMatch.localDateIso || safeMatch.local_date_iso
}

function getMatchTimestamp(match) {
  const value = getMatchDateValue(match)
  return value ? getUtcTimestamp(value) : 0
}

function getLastSyncedAtValue(match) {
  const safeMatch = normalizeMatchInput(match)
  if (!safeMatch) return null

  return safeMatch.lastSyncedAt
    || safeMatch.last_synced_at
    || safeMatch.syncedAt
    || safeMatch.synced_at
    || safeMatch.metadata?.lastSyncedAt
    || safeMatch.metadata?.last_synced_at
    || safeMatch.metadata?.syncedAt
    || safeMatch.metadata?.synced_at
    || safeMatch.metadata?.sync?.lastSyncedAt
    || safeMatch.metadata?.sync?.last_synced_at
    || null
}

function getLastSyncedTimestamp(match) {
  const value = getLastSyncedAtValue(match)
  return value ? getUtcTimestamp(value) : 0
}

function getRawMatchStatus(match) {
  const safeMatch = normalizeMatchInput(match)
  if (!safeMatch) return LIVE_MATCH_CENTER_EMPTY_STATUS

  const statusValue = safeMatch.standardStatus || safeMatch.standard_status || safeMatch.metadata?.standardStatus || safeMatch.status
  const storedStatus = normalizeMatchStatus(statusValue)
  const displayStatus = safeMatch.status ? normalizeMatchStatus(safeMatch.status) : null
  const providerStatusValue = safeMatch.metadata?.providerStatus || safeMatch.metadata?.raw?.status
  const providerStatus = providerStatusValue ? normalizeMatchStatus(providerStatusValue) : null

  if (isLiveStatus(storedStatus) && displayStatus && isFinishedStatus(displayStatus)) return displayStatus
  if (isLiveStatus(storedStatus) && providerStatus && isFinishedStatus(providerStatus)) return providerStatus
  return storedStatus
}

export function isStaleLiveMatch(match, now = new Date()) {
  if (!normalizeMatchInput(match)) return false

  const status = getRawMatchStatus(match)
  if (!isLiveStatus(status)) return false

  const startsAt = getMatchTimestamp(match)
  if (!startsAt) return false

  const nowTimestamp = getUtcTimestamp(now)
  const elapsedMs = nowTimestamp - startsAt
  if (elapsedMs > LIVE_MATCH_STALE_HOURS * 60 * 60 * 1000) return true

  const lastSyncedAt = getLastSyncedTimestamp(match)
  if (!lastSyncedAt) return false

  const syncAgeMs = nowTimestamp - lastSyncedAt
  return elapsedMs > 0 && syncAgeMs > LIVE_SYNC_STALE_MINUTES * 60 * 1000
}

export function getLiveMatchCenterStatus(match, now = new Date()) {
  if (!normalizeMatchInput(match)) return LIVE_MATCH_CENTER_EMPTY_STATUS
  if (isStaleLiveMatch(match, now)) return STANDARD_MATCH_STATUS.FINALIZADO
  return getRawMatchStatus(match)
}

export function isRecentFinishedMatch(match, now = new Date()) {
  if (!normalizeMatchInput(match)) return false

  const status = getLiveMatchCenterStatus(match, now)
  if (!isFinishedStatus(status)) return false

  const elapsedMs = getUtcTimestamp(now) - getMatchTimestamp(match)
  return elapsedMs >= 0 && elapsedMs <= RECENT_FINISHED_HOURS * 60 * 60 * 1000
}

export function isLiveMatchCenterFinishedMatch(match, now = new Date()) {
  if (!normalizeMatchInput(match)) return false
  return isFinishedStatus(getLiveMatchCenterStatus(match, now))
}

export function getLiveMatchCenterPriority(match, now = new Date()) {
  if (!normalizeMatchInput(match)) return 4

  const status = getLiveMatchCenterStatus(match, now)
  const startsAt = getMatchTimestamp(match)
  const nowTimestamp = getUtcTimestamp(now)

  if (isLiveStatus(status)) return 0
  if (isRecentFinishedMatch(match, now)) return 1
  if (!isFinishedStatus(status) && startsAt > nowTimestamp) return 2
  if (isLiveMatchCenterFinishedMatch(match, now)) return 3
  return 3
}

export function compareLiveMatchCenterPriority(left, right, now = new Date()) {
  const leftPriority = getLiveMatchCenterPriority(left, now)
  const rightPriority = getLiveMatchCenterPriority(right, now)

  if (leftPriority !== rightPriority) return leftPriority - rightPriority

  const leftTime = getMatchTimestamp(left)
  const rightTime = getMatchTimestamp(right)

  if (leftPriority === 0 || leftPriority === 1) return rightTime - leftTime
  return leftTime - rightTime
}

export function sortLiveMatchCenterMatches(matches = [], now = new Date()) {
  return (Array.isArray(matches) ? matches : [])
    .filter(Boolean)
    .sort((left, right) => compareLiveMatchCenterPriority(left, right, now))
}

export function selectLiveMatchCenterMatch(matches = [], now = new Date()) {
  return sortLiveMatchCenterMatches(matches, now).find((match) => {
    const priority = getLiveMatchCenterPriority(match, now)
    const status = getLiveMatchCenterStatus(match, now)

    if (priority > 2) return false
    return ![STANDARD_MATCH_STATUS.ADIADO, STANDARD_MATCH_STATUS.CANCELADO].includes(status)
  }) || null
}

function getLiveMatchCenterScore(match) {
  const safeMatch = normalizeMatchInput(match)
  if (!safeMatch) return 'VS'

  const homeScore = safeMatch.homeScore ?? safeMatch.home_score ?? safeMatch.result?.homeScore ?? null
  const awayScore = safeMatch.awayScore ?? safeMatch.away_score ?? safeMatch.result?.awayScore ?? null

  if (homeScore === null || homeScore === undefined || awayScore === null || awayScore === undefined) return 'VS'
  return `${homeScore} x ${awayScore}`
}

function getLiveMatchCenterStatusPresentation(match, { countdownLabel = '' } = {}, now = new Date()) {
  const status = getLiveMatchCenterStatus(match, now)

  if (status === STANDARD_MATCH_STATUS.AO_VIVO) return { label: 'AO VIVO', tone: 'live', status }
  if (status === STANDARD_MATCH_STATUS.INTERVALO) return { label: 'INTERVALO', tone: 'warning', status }
  if (isFinishedStatus(status)) return { label: 'FINALIZADO', tone: 'neutral', status }
  if (status === LIVE_MATCH_CENTER_EMPTY_STATUS) return { label: 'SEM JOGO', tone: 'neutral', status }
  return { label: countdownLabel ? `COMECA EM ${countdownLabel}` : 'AGENDADO', tone: 'highlight', status }
}

function getLiveMatchCenterReason(match, now = new Date()) {
  const safeMatch = normalizeMatchInput(match)
  if (!safeMatch) return 'empty'

  const status = getLiveMatchCenterStatus(safeMatch, now)
  const priority = getLiveMatchCenterPriority(safeMatch, now)

  if (isLiveStatus(status)) return 'live_match'
  if (isFinishedStatus(status)) return 'recent_finished'
  if (priority === 2) return 'upcoming_match'
  return 'fallback'
}

export function createLiveMatchCenterHeroModel(match, options = {}) {
  const safeMatch = normalizeMatchInput(match)
  const now = options.now || new Date()

  if (!safeMatch) {
    return {
      isEmpty: true,
      status: LIVE_MATCH_CENTER_EMPTY_STATUS,
      statusLabel: 'SEM JOGO',
      statusTone: 'neutral',
      displayStatus: 'SEM JOGO',
      badge: { label: 'SEM JOGO', tone: 'neutral', status: LIVE_MATCH_CENTER_EMPTY_STATUS },
      priority: 4,
      reason: 'empty',
      match: null,
      score: 'VS',
      formattedTime: '',
      kickoff: null,
      stadium: '',
      city: '',
      country: '',
      canWatch: false,
      infoItems: [],
      showTvButton: true,
      showCompetitionButton: true,
    }
  }

  const statusPresentation = getLiveMatchCenterStatusPresentation(safeMatch, options, now)
  const timeLabel = safeMatch.dateLabel || options.formattedDateTime || safeMatch.localTime || ''
  const location = [safeMatch.stadium, safeMatch.city, safeMatch.country].filter(Boolean).join(' - ')
  const priority = getLiveMatchCenterPriority(safeMatch, now)
  const reason = getLiveMatchCenterReason(safeMatch, now)

  return {
    isEmpty: false,
    id: safeMatch.id,
    match: safeMatch,
    heroStatus: statusPresentation.status,
    status: statusPresentation.status,
    statusLabel: statusPresentation.label,
    statusTone: statusPresentation.tone,
    displayStatus: statusPresentation.label,
    badge: statusPresentation,
    priority,
    reason,
    competition: safeMatch.championship || safeMatch.competitionName || safeMatch.competition_name || 'Competicao',
    competitionLogo: safeMatch.competitionLogo || safeMatch.competition_logo || '',
    homeTeam: translateCountry(safeMatch.homeTeam || safeMatch.homeParticipant || safeMatch.home_participant || 'Mandante'),
    awayTeam: translateCountry(safeMatch.awayTeam || safeMatch.awayParticipant || safeMatch.away_participant || 'Visitante'),
    homeShield: safeMatch.homeShield || 'BDA',
    awayShield: safeMatch.awayShield || 'BDA',
    homeCrest: safeMatch.homeTeamCrest || safeMatch.homeCrest || safeMatch.home_crest || '',
    awayCrest: safeMatch.awayTeamCrest || safeMatch.awayCrest || safeMatch.away_crest || '',
    score: getLiveMatchCenterScore(safeMatch),
    timeLabel,
    formattedTime: timeLabel,
    kickoff: getMatchDateValue(safeMatch),
    stadium: safeMatch.stadium || safeMatch.venue || '',
    city: safeMatch.city || '',
    country: safeMatch.country || '',
    location,
    infoItems: [
      timeLabel,
      location,
    ].filter(Boolean),
    canWatch: true,
    showTvButton: true,
    showCompetitionButton: true,
  }
}

export function getLiveMatchCenter(matches = [], options = {}) {
  const now = options.now || new Date()
  const safeMatches = Array.isArray(matches) ? matches : []
  const match = options.match ? normalizeMatchInput(options.match) : selectLiveMatchCenterMatch(safeMatches, now)

  return createLiveMatchCenterHeroModel(match, { ...options, now })
}
