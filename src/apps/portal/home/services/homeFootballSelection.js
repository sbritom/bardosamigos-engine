import {
  getBrazilDateKey,
  getUtcTimestamp,
  isFinishedStatus,
  isLiveStatus,
  nowUtcIso,
} from '../../../../core/time/timeService.js'

const TEAM_PLACEHOLDER_NAMES = new Set([
  'mandante',
  'visitante',
  'man',
  'vis',
  'bda',
  'unknown',
  'desconhecido',
  'a definir',
  'tbd',
  'time',
  'team',
  'placeholder',
  'a confirmar',
  'definir',
])

function getMatchDateValue(match = {}) {
  return match.startsAt || match.starts_at || match.utcDate || match.utc_date
}

function byMatchTimeAscending(left, right) {
  return getUtcTimestamp(getMatchDateValue(left)) - getUtcTimestamp(getMatchDateValue(right))
}

function byMatchTimeDescending(left, right) {
  return getUtcTimestamp(getMatchDateValue(right)) - getUtcTimestamp(getMatchDateValue(left))
}

function getPreviousBrazilDateKey(now = nowUtcIso()) {
  const today = getBrazilDateKey(now)
  if (!today) return ''

  const timestamp = Date.parse(`${today}T00:00:00Z`)
  if (!Number.isFinite(timestamp)) return ''

  return new Date(timestamp - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function getMatchBrazilDateKey(match = {}) {
  return getBrazilDateKey(getMatchDateValue(match))
    || match.localDateIso
    || match.local_date_iso
    || match.localDate
    || match.local_date
    || ''
}

export function hasDisplayableTeamName(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return Boolean(normalized && !TEAM_PLACEHOLDER_NAMES.has(normalized))
}

export function hasDisplayableMatchTeams(match = {}) {
  return hasDisplayableTeamName(match.homeTeam || match.homeParticipant || match.home_participant)
    && hasDisplayableTeamName(match.awayTeam || match.awayParticipant || match.away_participant)
}

export function isHomeFootballMatchToday(match = {}, now = nowUtcIso()) {
  const matchDate = getMatchBrazilDateKey(match)
  const today = getBrazilDateKey(now)

  return Boolean(matchDate && today && matchDate === today)
}

function isHomeFootballMatchYesterday(match = {}, now = nowUtcIso()) {
  const matchDate = getMatchBrazilDateKey(match)
  const yesterday = getPreviousBrazilDateKey(now)

  return Boolean(matchDate && yesterday && matchDate === yesterday)
}

export function selectHomeFootballMatchesByPriority(matches = [], now = nowUtcIso(), limit = 3) {
  const displayableMatches = matches.filter(hasDisplayableMatchTeams)
  const selected = []
  const pushGroup = (group) => {
    group.forEach((match) => {
      if (selected.length < limit && !selected.some((item) => item.id === match.id)) {
        selected.push(match)
      }
    })
  }

  // 1. Sempre prioriza uma partida realmente ao vivo.
  pushGroup(displayableMatches
    .filter((match) => isLiveStatus(match.standardStatus || match.status))
    .sort(byMatchTimeDescending))

  // 2. Se nao houver ao vivo suficiente, mostra o placar final mais recente de hoje.
  pushGroup(displayableMatches
    .filter((match) => isHomeFootballMatchToday(match, now) && isFinishedStatus(match.standardStatus || match.status))
    .sort(byMatchTimeDescending))

  // 3. Depois, o placar final mais recente de ontem.
  pushGroup(displayableMatches
    .filter((match) => isHomeFootballMatchYesterday(match, now) && isFinishedStatus(match.standardStatus || match.status))
    .sort(byMatchTimeDescending))

  // 4. Apenas se nao houver resultado recente, usa uma partida de hoje ainda nao iniciada.
  pushGroup(displayableMatches
    .filter((match) => {
      const status = match.standardStatus || match.status
      return isHomeFootballMatchToday(match, now) && !isLiveStatus(status) && !isFinishedStatus(status)
    })
    .sort(byMatchTimeAscending))

  // 5. Ultimo fallback: proxima partida futura disponivel.
  pushGroup(displayableMatches
    .filter((match) => {
      const status = match.standardStatus || match.status
      return !isLiveStatus(status) && !isFinishedStatus(status) && getUtcTimestamp(getMatchDateValue(match)) >= getUtcTimestamp(now)
    })
    .sort(byMatchTimeAscending))

  return selected
}
