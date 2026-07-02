import { getSupabaseClient, toCamelCase } from '../../../core/database'
import {
  createBrazilDateWindow,
  formatBrazilFullDateTime,
  getUtcTimestamp,
  normalizeMatchStatus,
  isFinishedStatus,
  isLiveStatus,
  nowUtcIso,
} from '../../../core/time'
import { getSportsStatusLabel, translateCompetition, translateCountry, translateStage } from '../../../core/sports'
import { getLiveMatchCenterStatus, selectLiveMatchCenterMatch, sortLiveMatchCenterMatches } from './liveMatchCenterService'
import { FOOTBALL_CURRENT_MATCH_WINDOW, calculateFootballStandings, listCurrentFootballMatches, normalizeFootballMatch } from './footballMatchQueryService'

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

function normalizeMatch(match = {}) {
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
    competitionName: translateCompetition(match.competitionName || match.competition_name || competition.name || metadata.competition?.namePtBr, competitionCode) || 'Competição',
    competitionLogo: match.competitionLogo || match.competition_logo || competition.logoUrl || competition.logo_url || metadata.competition?.logoUrl || '',
    homeTeam: match.homeParticipant || match.home_participant || 'Mandante',
    awayTeam: match.awayParticipant || match.away_participant || 'Visitante',
    homeCrest: match.homeCrest || match.home_crest || metadata.homeShield || '',
    awayCrest: match.awayCrest || match.away_crest || metadata.awayShield || '',
    homeScore,
    awayScore,
    startsAt,
    localTime: match.localTime || match.local_time || metadata.localTime || '',
    localDateIso: match.localDateIso || match.local_date_iso || metadata.localDateIso || '',
    status,
    statusLabel: getSportsStatusLabel(status),
    venue: match.venue || metadata.venue || '',
    city: match.city || metadata.city || '',
    country: translateCountry(match.country || metadata.country || ''),
    stage: translateStage(match.stage || metadata.stage || ''),
    groupName: translateStage(match.groupName || match.group_name || metadata.group || '') || '',
    referee: metadata.referee || metadata.raw?.referees?.[0]?.name || '',
    hasScore: homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined,
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

export function calculateStandings(matches = []) {
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

async function listFavorites(client, user) {
  if (!user) return []

  const { data } = await client
    .from('football_favorites')
    .select('*')
    .eq('profile_id', user.id)
    .is('deleted_at', null)

  return toCamelCase(data || [])
}

export async function listFootballCenterData() {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: configError() }

  const user = await getUser(client)
  const result = await listCurrentFootballMatches({ includeTeams: true })

  if (result.error) return { data: null, error: result.error }

  const football = result.data
  const matches = football.matches
  const teams = football.teams
  const favorites = await listFavorites(client, user)

  return {
    data: {
      featured: football.featured,
      matches,
      live: football.live,
      upcoming: football.upcoming,
      finished: football.finished,
      standings: football.standings,
      groups: football.groups,
      rounds: football.rounds,
      knockout: football.knockout,
      competitions: football.competitions,
      teams,
      favorites,
      authenticated: Boolean(user),
      lastUpdatedAt: football.lastUpdatedAt,
    },
    error: null,
  }
}

export async function getFootballMatchDetails(matchId) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: configError() }

  const { data, error } = await client
    .from('competition_matches')
    .select(MATCH_SELECT)
    .eq('id', matchId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) return { data: null, error }
  return { data: data ? normalizeFootballMatch(toCamelCase(data)) : null, error: null }
}

export async function getFootballTeamDetails(teamId) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: configError() }

  const { data: teamRow, error: teamError } = await client
    .from('competition_teams')
    .select('*, competitions(*)')
    .eq('id', teamId)
    .is('deleted_at', null)
    .maybeSingle()

  if (teamError) return { data: null, error: teamError }
  if (!teamRow) return { data: null, error: null }

  const team = toCamelCase(teamRow)
  const names = [team.name, team.shortName, team.tla].filter(Boolean)
  const window = createBrazilDateWindow(FOOTBALL_CURRENT_MATCH_WINDOW)
  const { data: matchRows, error: matchError } = await client
    .from('competition_matches')
    .select(MATCH_SELECT)
    .is('deleted_at', null)
    .gte('starts_at', window.fromIso)
    .lte('starts_at', window.toIso)
    .order('starts_at', { ascending: true })
    .limit(240)

  if (matchError) return { data: null, error: matchError }

  const matches = sortLiveMatchCenterMatches(
    toCamelCase(matchRows || [])
      .map(normalizeFootballMatch)
      .filter((match) => names.includes(match.homeTeam) || names.includes(match.awayTeam)),
  )
  return {
    data: {
      team,
      matches,
      upcoming: matches.filter((match) => !isFinishedStatus(match.status) && getUtcTimestamp(match.startsAt) >= getUtcTimestamp(nowUtcIso())),
      finished: matches.filter((match) => isFinishedStatus(match.status)).slice(0, 8),
      standings: calculateFootballStandings(matches),
    },
    error: null,
  }
}

export async function toggleFootballFavorite({ type, id, metadata = {} }) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: configError(), authenticated: false }

  const user = await getUser(client)
  if (!user) return { data: null, error: new Error('Entre para favoritar.'), authenticated: false }

  const { data: existing, error: findError } = await client
    .from('football_favorites')
    .select('*')
    .eq('profile_id', user.id)
    .eq('favorite_type', type)
    .eq('favorite_id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (findError) return { data: null, error: findError, authenticated: true }

  if (existing) {
    const { data, error } = await client
      .from('football_favorites')
      .update({ deleted_at: nowUtcIso() })
      .eq('id', existing.id)
      .select('*')
      .single()
    return { data: data ? toCamelCase(data) : null, error, authenticated: true, favorited: false }
  }

  const { data, error } = await client
    .from('football_favorites')
    .insert({
      profile_id: user.id,
      favorite_type: type,
      favorite_id: id,
      metadata,
    })
    .select('*')
    .single()

  return { data: data ? toCamelCase(data) : null, error, authenticated: true, favorited: true }
}
