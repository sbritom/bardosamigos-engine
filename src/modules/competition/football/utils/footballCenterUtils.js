import { getSportsStatusLabel } from '../../../../core/sports'
import {
  getBrazilDateKey,
  getUtcTimestamp,
  isFinishedStatus,
  isLiveStatus,
} from '../../../../core/time'
import { FOOTBALL_COMPETITION_NAV } from '../constants/footballCenterConstants'

export function formatFootballScore(match) {
  return match?.hasScore ? `${match.homeScore} × ${match.awayScore}` : 'VS'
}

export function getFootballMatchTime(match) {
  if (match?.localTime) return match.localTime
  if (!match?.startsAt) return 'Horário a definir'
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(match.startsAt))
}

export function isFootballMatchToday(match, now) {
  return Boolean(match?.startsAt) && getBrazilDateKey(match.startsAt) === getBrazilDateKey(now)
}

export function isFootballMatchTomorrow(match, now) {
  if (!match?.startsAt) return false
  const tomorrow = new Date(getUtcTimestamp(now) + 24 * 60 * 60 * 1000).toISOString()
  return getBrazilDateKey(match.startsAt) === getBrazilDateKey(tomorrow)
}

export function isFootballMatchThisWeek(match, now) {
  const startsAt = getUtcTimestamp(match?.startsAt)
  const start = getUtcTimestamp(now)
  return startsAt >= start && startsAt <= start + 7 * 24 * 60 * 60 * 1000
}

export function normalizeFootballSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

export function footballMatchIncludesSearch(match, query) {
  if (!query) return true
  return normalizeFootballSearch([
    match.homeTeam,
    match.awayTeam,
    match.competitionName,
    match.competitionCode,
    match.stage,
    match.venue,
    match.city,
    match.country,
  ].filter(Boolean).join(' ')).includes(query)
}

export function getFootballRecentResults(matches) {
  return matches
    .filter((match) => isFinishedStatus(match.status))
    .sort((left, right) => getUtcTimestamp(right.startsAt) - getUtcTimestamp(left.startsAt))
}

export function getFootballTodayMatches(matches, now) {
  return matches
    .filter((match) => isFootballMatchToday(match, now) && !isLiveStatus(match.status))
    .sort((left, right) => getUtcTimestamp(left.startsAt) - getUtcTimestamp(right.startsAt))
}

export function getFootballUpcomingMatches(matches, now) {
  return matches
    .filter((match) => !isLiveStatus(match.status) && !isFinishedStatus(match.status) && getUtcTimestamp(match.startsAt) >= getUtcTimestamp(now))
    .sort((left, right) => getUtcTimestamp(left.startsAt) - getUtcTimestamp(right.startsAt))
}

export function selectFootballHeroMatch(data, now) {
  const matches = data?.matches || []
  const live = matches.filter((match) => isLiveStatus(match.status))
  const today = getFootballTodayMatches(matches, now)
  const results = getFootballRecentResults(matches)
  const upcoming = getFootballUpcomingMatches(matches, now)
  return live[0] || today[0] || results[0] || upcoming[0] || data?.featured || matches[0] || null
}

export function footballMatchBelongsToCompetition(match, item) {
  const code = String(match.competitionCode || '').toLocaleLowerCase('pt-BR')
  const name = String(match.competitionName || '').toLocaleLowerCase('pt-BR')
  return item.codes.includes(code) || item.patterns.some((pattern) => name.includes(pattern))
}

export function isFootballWorldCupMatch(match) {
  return footballMatchBelongsToCompetition(match, FOOTBALL_COMPETITION_NAV[0])
}

export function getFootballFavoriteKeys(favorites = []) {
  return new Set(favorites.map((item) => `${item.favoriteType}:${item.favoriteId}`))
}

export function isFootballFavoriteMatch(match, favoriteKeys) {
  return favoriteKeys.has(`match:${match.id}`)
    || favoriteKeys.has(`competition:${match.competitionId}`)
    || favoriteKeys.has(`team:${match.homeTeamId}`)
    || favoriteKeys.has(`team:${match.awayTeamId}`)
}

export function getFootballStatusTone(status) {
  const value = String(status || '').toUpperCase()
  if (value.includes('CANCEL')) return 'border-[var(--bds-color-text-muted)] text-[var(--bds-color-text-muted)]'
  if (value.includes('ADIADO') || value.includes('POSTPON')) return 'border-[var(--bds-color-warning)] text-[var(--bds-color-warning)]'
  if (value.includes('PENALT') || value.includes('SHOOTOUT')) return 'border-[var(--bds-color-danger)] text-[var(--bds-color-danger)]'
  if (value.includes('PRORROG') || value.includes('EXTRA')) return 'border-[var(--bds-color-info)] text-[var(--bds-color-info)]'
  if (value.includes('INTERVAL') || value.includes('HALF')) return 'border-[var(--bds-color-warning)] text-[var(--bds-color-warning)]'
  if (isLiveStatus(status)) return 'border-[var(--bds-color-danger)] text-[var(--bds-color-danger)]'
  if (isFinishedStatus(status)) return 'border-[var(--bds-color-success)] text-[var(--bds-color-success)]'
  return 'border-[var(--bds-color-primary-hover)] text-[var(--bds-color-primary-hover)]'
}

export function getFootballMatchDisplayStatus(match) {
  const providerStatus = match?.metadata?.providerStatus || match?.metadata?.raw?.status || match?.status
  const value = String(providerStatus || '').toUpperCase()
  if (['IN_PLAY', 'LIVE', 'AO_VIVO'].includes(value)) return { value, label: 'AO VIVO' }
  if (['HALF_TIME', 'HALFTIME', 'PAUSED', 'INTERVALO'].includes(value)) return { value, label: 'INTERVALO' }
  if (['EXTRA_TIME', 'IN_EXTRA_TIME', 'PRORROGACAO'].includes(value)) return { value, label: 'PRORROGAÇÃO' }
  if (['PENALTY_SHOOTOUT', 'PENALTIES', 'PENALTIS'].includes(value)) return { value, label: 'PÊNALTIS' }
  if (['POSTPONED', 'SUSPENDED', 'ADIADO'].includes(value)) return { value, label: 'ADIADO' }
  if (['CANCELED', 'CANCELLED', 'CANCELADO'].includes(value)) return { value, label: 'CANCELADO' }
  if (isFinishedStatus(match?.status)) return { value: match.status, label: 'FINALIZADO' }
  return { value: match?.status, label: getSportsStatusLabel(match?.status) }
}

export function getFootballStageLabel(value) {
  const stage = String(value || '').trim()
  const labels = {
    GROUP_STAGE: 'Fase de grupos',
    LAST_32: '16 avos',
    LAST_16: 'Oitavas de final',
    QUARTER_FINALS: 'Quartas de final',
    SEMI_FINALS: 'Semifinais',
    THIRD_PLACE: 'Disputa do 3º lugar',
    FINAL: 'Final',
    REGULAR_SEASON: 'Temporada regular',
  }
  return labels[stage.toUpperCase()] || stage.replaceAll('_', ' ')
}

export function getFootballWorldCupStageIndex(value) {
  const stage = String(value || '').toLocaleLowerCase('pt-BR')
  if (/final/.test(stage) && !/semi|quarter|quarta/.test(stage)) return 5
  if (/third|terceiro|3º|semi/.test(stage)) return 4
  if (/quarter|quarta/.test(stage)) return 3
  if (/last_16|oitava/.test(stage)) return 2
  if (/last_32|16 avos/.test(stage)) return 1
  return 0
}
