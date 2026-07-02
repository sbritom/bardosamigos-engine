import { getSupabaseClient, toCamelCase } from '../../../core/database'
import {
  createBrazilDateWindow,
  formatBrazilFullDateTime,
  getUtcTimestamp,
  getRelativeBrazilDayLabel,
  isFinishedStatus,
  isLiveStatus,
  normalizeMatchStatus,
  nowUtcIso,
} from '../../../core/time'
import { getSportsStatusLabel, translateCompetition, translateCountry, translateStage } from '../../../core/sports'
import { getLiveMatchCenterStatus, selectLiveMatchCenterMatch, sortLiveMatchCenterMatches } from './liveMatchCenterService'

export const FOOTBALL_CURRENT_MATCH_WINDOW = Object.freeze({
  pastDays: 2,
  futureDays: 14,
})

const MATCH_SELECT = '*, competition_rounds(*, competition_stages(*, competition_seasons(*, competitions(*))))'
const MATCH_LIMIT = 160

function configError() {
  return new Error('Supabase nao esta configurado.')
}

async function getUser(client) {
  const { data } = await client.auth.getUser()
  return data?.user || null
}

function getCompetition(match = {}) {
  return match.competitionRounds?.competitionStages?.competitionSeasons?.competitions || {}
}

function getSeason(match = {}) {
  return match.competitionRounds?.competitionStages?.competitionSeasons || {}
}

function getStage(match = {}) {
  return match.competitionRounds?.competitionStages || {}
}

function getMatchTeams(match = {}) {
  return [
    {
      name: match.homeTeam,
      crest: match.homeCrest,
      goals: match.homeScore,
      opponentGoals: match.awayScore,
    },
    {
      name: match.awayTeam,
      crest: match.awayCrest,
      goals: match.awayScore,
      opponentGoals: match.homeScore,
    },
  ]
}

function addStandingResult(table, team, result) {
  if (!team.name || result.goals === null || result.goals === undefined || result.opponentGoals === null || result.opponentGoals === undefined) return

  const key = team.name
  const row = table.get(key) || {
    position: 0,
    crest: team.crest,
    name: team.name,
    points: 0,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    lastFive: [],
  }

  row.crest = row.crest || team.crest
  row.played += 1
  row.goalsFor += Number(result.goals)
  row.goalsAgainst += Number(result.opponentGoals)
  row.goalDifference = row.goalsFor - row.goalsAgainst

  if (result.goals > result.opponentGoals) {
    row.wins += 1
    row.points += 3
    row.lastFive.push('V')
  } else if (result.goals === result.opponentGoals) {
    row.draws += 1
    row.points += 1
    row.lastFive.push('E')
  } else {
    row.losses += 1
    row.lastFive.push('D')
  }

  row.lastFive = row.lastFive.slice(-5)
  table.set(key, row)
}

export function calculateFootballStandings(matches = []) {
  const table = new Map()

  matches
    .filter((match) => isFinishedStatus(match.status) && match.hasScore)
    .sort((left, right) => getUtcTimestamp(left.startsAt) - getUtcTimestamp(right.startsAt))
    .forEach((match) => {
      const [home, away] = getMatchTeams(match)
      addStandingResult(table, home, { goals: home.goals, opponentGoals: home.opponentGoals })
      addStandingResult(table, away, { goals: away.goals, opponentGoals: away.opponentGoals })
    })

  return [...table.values()]
    .sort((left, right) => (
      right.points - left.points
      || right.goalDifference - left.goalDifference
      || right.goalsFor - left.goalsFor
      || left.name.localeCompare(right.name, 'pt-BR')
    ))
    .map((row, index) => ({ ...row, position: index + 1 }))
}

function groupBy(items = [], keyGetter) {
  return items.reduce((groups, item) => {
    const key = keyGetter(item) || 'Geral'
    groups[key] = groups[key] || []
    groups[key].push(item)
    return groups
  }, {})
}

export function normalizeFootballMatch(match = {}) {
  const metadata = match.metadata || {}
  const competition = getCompetition(match)
  const competitionCode = match.competitionCode || match.competition_code || competition.code || metadata.competition?.code || ''
  const homeScore = match.homeScore ?? match.home_score ?? match.result?.homeScore ?? null
  const awayScore = match.awayScore ?? match.away_score ?? match.result?.awayScore ?? null
  const startsAt = match.startsAt || match.starts_at
  const rawStatus = match.standardStatus || match.standard_status || metadata.standardStatus || normalizeMatchStatus(match.status)
  const status = getLiveMatchCenterStatus({ ...match, startsAt, standardStatus: rawStatus })

  return {
    ...match,
    competition,
    season: getSeason(match),
    stageObject: getStage(match),
    round: match.competitionRounds || match.competition_rounds || {},
    competitionId: competition.id || match.competitionId || match.competition_id || null,
    competitionCode,
    competitionName: translateCompetition(match.competitionName || match.competition_name || competition.name || metadata.competition?.namePtBr, competitionCode) || 'Competicao',
    championship: translateCompetition(match.competitionName || match.competition_name || competition.name || metadata.competition?.namePtBr, competitionCode) || 'Competicao',
    competitionLogo: match.competitionLogo || match.competition_logo || competition.logoUrl || competition.logo_url || metadata.competition?.logoUrl || '',
    homeTeam: match.homeParticipant || match.home_participant || 'Mandante',
    awayTeam: match.awayParticipant || match.away_participant || 'Visitante',
    homeParticipant: match.homeParticipant || match.home_participant || 'Mandante',
    awayParticipant: match.awayParticipant || match.away_participant || 'Visitante',
    homeShield: metadata.homeShortName || 'BDA',
    awayShield: metadata.awayShortName || 'BDA',
    homeCrest: match.homeCrest || match.home_crest || metadata.homeShield || '',
    awayCrest: match.awayCrest || match.away_crest || metadata.awayShield || '',
    homeTeamCrest: match.homeCrest || match.home_crest || metadata.homeShield || '',
    awayTeamCrest: match.awayCrest || match.away_crest || metadata.awayShield || '',
    homeScore,
    awayScore,
    startsAt,
    utcDate: match.utcDate || match.utc_date || metadata.utcDate || startsAt,
    localDate: match.localDate || match.local_date || metadata.localDate || '',
    localTime: match.localTime || match.local_time || metadata.localTime || '',
    localDateIso: match.localDateIso || match.local_date_iso || metadata.localDateIso || '',
    lastSyncedAt: match.lastSyncedAt || match.last_synced_at || match.syncedAt || match.synced_at || metadata.lastSyncedAt || metadata.last_synced_at || '',
    standardStatus: status,
    status,
    statusLabel: getSportsStatusLabel(status),
    dateLabel: startsAt ? getRelativeBrazilDayLabel(startsAt) : '',
    venue: match.venue || metadata.venue || '',
    stadium: match.venue || metadata.venue || '',
    city: match.city || metadata.city || '',
    country: translateCountry(match.country || metadata.country || ''),
    stage: translateStage(match.stage || metadata.stage || ''),
    groupName: translateStage(match.groupName || match.group_name || metadata.group || '') || '',
    group: translateStage(match.groupName || match.group_name || metadata.group || '') || '',
    referee: metadata.referee || metadata.raw?.referees?.[0]?.name || '',
    predictions: Number(metadata.predictionsCount || metadata.predictions || 0),
    closed: isFinishedStatus(status) || getUtcTimestamp(startsAt) <= getUtcTimestamp(nowUtcIso()),
    hasScore: homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined,
    source: match.id ? 'competition' : 'fallback',
    statistics: {
      possession: metadata.statistics?.possession || null,
      shots: metadata.statistics?.shots || null,
      cards: metadata.statistics?.cards || null,
      corners: metadata.statistics?.corners || null,
      offsides: metadata.statistics?.offsides || null,
      substitutions: metadata.statistics?.substitutions || null,
      attendance: metadata.attendance || metadata.raw?.attendance || null,
      referee: metadata.referee || metadata.raw?.referees?.[0]?.name || null,
    },
  }
}

async function listUserPredictions(client, user) {
  if (!user) return []

  const { data } = await client
    .from('competition_predictions')
    .select('*')
    .eq('profile_id', user.id)
    .is('deleted_at', null)

  return toCamelCase(data || [])
}

async function listFootballTeams(client) {
  const { data } = await client
    .from('competition_teams')
    .select('*, competitions(*)')
    .is('deleted_at', null)
    .order('name', { ascending: true })
    .limit(240)

  return toCamelCase(data || []).map((team) => ({
    ...team,
    name: team.name,
    crest: team.crestUrl || team.crest_url || team.logoUrl || team.logo_url || team.metadata?.crest || '',
    country: translateCountry(team.country || team.metadata?.country || ''),
    competitionName: team.competitions?.name || team.competitions?.officialName || '',
  }))
}

export async function listCurrentFootballMatches(options = {}) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: configError() }

  const window = createBrazilDateWindow(FOOTBALL_CURRENT_MATCH_WINDOW)
  const user = options.includePredictions ? await getUser(client) : null
  const [{ data, error }, predictions, teams] = await Promise.all([
    client
      .from('competition_matches')
      .select(MATCH_SELECT)
      .is('deleted_at', null)
      .gte('starts_at', window.fromIso)
      .lte('starts_at', window.toIso)
      .order('starts_at', { ascending: true })
      .limit(options.limit || MATCH_LIMIT),
    options.includePredictions ? listUserPredictions(client, user) : Promise.resolve([]),
    options.includeTeams ? listFootballTeams(client) : Promise.resolve([]),
  ])

  if (error) return { data: null, error }

  const now = nowUtcIso()
  const matches = sortLiveMatchCenterMatches(toCamelCase(data || []).map(normalizeFootballMatch), now)
    .map((match) => ({
      ...match,
      myPrediction: predictions.find((prediction) => prediction.matchId === match.id) || null,
    }))
  const live = matches.filter((match) => isLiveStatus(match.status))
  const finished = matches.filter((match) => isFinishedStatus(match.status)).sort((a, b) => getUtcTimestamp(b.startsAt) - getUtcTimestamp(a.startsAt))
  const upcoming = matches.filter((match) => !isLiveStatus(match.status) && !isFinishedStatus(match.status) && getUtcTimestamp(match.startsAt) >= getUtcTimestamp(now))
  const standings = calculateFootballStandings(matches)
  const groups = groupBy(matches, (match) => match.groupName)
  const rounds = groupBy(matches, (match) => match.round?.name)
  const knockout = matches.filter((match) => /oitavas|quartas|semifinal|final/i.test(`${match.stage} ${match.round?.name || ''}`))
  const competitions = Object.values(matches.reduce((acc, match) => {
    if (!match.competitionId) return acc
    acc[match.competitionId] = acc[match.competitionId] || {
      id: match.competitionId,
      code: match.competitionCode,
      name: match.competitionName,
      logo: match.competitionLogo,
      country: match.country,
      matches: 0,
    }
    acc[match.competitionId].matches += 1
    return acc
  }, {}))

  return {
    data: {
      window,
      matches,
      featured: selectLiveMatchCenterMatch(matches, now),
      live,
      upcoming,
      finished,
      standings,
      groups,
      rounds,
      knockout,
      competitions,
      teams,
      authenticated: Boolean(user),
      lastUpdatedAt: formatBrazilFullDateTime(now),
    },
    error: null,
  }
}
