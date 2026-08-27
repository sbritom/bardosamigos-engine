import { getBrazilDatePayload, normalizeMatchStatus, nowUtcIso, toLegacyMatchStatus } from '../../../time/timeService.js'
import { getSportsStatusLabel, translateCompetition, translateCountry, translateStage } from '../../../sports/sportsDictionary.js'

function createSlug(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function mapFootballDataCompetition(item = {}) {
  const translatedName = translateCompetition(item.name, item.code)
  const translatedCountry = translateCountry(item.area?.name)
  const currentSeason = item.currentSeason || {}

  return {
    name: translatedName || item.name || item.code || 'Competição de Futebol',
    slug: createSlug(item.code || item.name),
    type: 'football',
    status: 'published',
    description: translatedCountry ? `Competição de ${translatedCountry}` : '',
    external_ref: item.id ? String(item.id) : item.code,
    official_name: item.name || translatedName,
    code: item.code,
    logo_url: item.emblem || item.logo || '',
    country: translatedCountry,
    season: currentSeason.startDate && currentSeason.endDate ? `${currentSeason.startDate} - ${currentSeason.endDate}` : '',
    area: translatedCountry,
    metadata: {
      provider: 'football-data.org',
      code: item.code,
      country: translatedCountry,
      officialName: item.name,
      translatedName,
      logoUrl: item.emblem || item.logo || '',
      season: currentSeason,
      area: {
        ...item.area,
        namePtBr: translatedCountry,
      },
      plan: item.plan,
      raw: item,
    },
  }
}

export function mapFootballDataTeam(item = {}, competitionId = null) {
  const country = translateCountry(item.area?.name || item.country)
  const translatedName = translateCountry(item.name)
  const translatedShortName = translateCountry(item.shortName)

  return {
    competition_id: competitionId,
    name: translatedName || item.name || item.shortName || 'Time',
    short_name: item.tla || translatedShortName || item.shortName || '',
    logo_url: item.crest || '',
    crest_url: item.crest || '',
    tla: item.tla || '',
    country,
    founded: item.founded || null,
    venue: item.venue || '',
    website: item.website || '',
    club_colors: item.clubColors || '',
    status: 'published',
    metadata: {
      provider: 'football-data.org',
      externalRef: item.id ? String(item.id) : null,
      crest: item.crest || '',
      country,
      officialName: item.name,
      translatedName,
      founded: item.founded || null,
      tla: item.tla || '',
      website: item.website,
      venue: item.venue,
      clubColors: item.clubColors || '',
      raw: item,
    },
  }
}

export function mapFootballDataMatch(item = {}, roundId = null) {
  const homeScore = item.score?.fullTime?.home
  const awayScore = item.score?.fullTime?.away
  const providerStatus = item.status
  const standardStatus = normalizeMatchStatus(providerStatus)
  const status = toLegacyMatchStatus(standardStatus)
  const matchDate = item.utcDate || nowUtcIso()
  const brazilDate = getBrazilDatePayload(matchDate)
  const competitionCode = item.competition?.code || ''
  const competitionName = translateCompetition(item.competition?.name, competitionCode)
  const country = translateCountry(item.area?.name || item.competition?.area?.name)
  const translatedStage = translateStage(item.stage)
  const homeParticipant = translateCountry(item.homeTeam?.name) || item.homeTeam?.name || ''
  const awayParticipant = translateCountry(item.awayTeam?.name) || item.awayTeam?.name || ''
  const syncedAt = nowUtcIso()

  return {
    round_id: roundId,
    home_participant: homeParticipant,
    away_participant: awayParticipant,
    starts_at: brazilDate.utc_date,
    utc_date: brazilDate.utc_date,
    local_date: brazilDate.local_date,
    local_date_iso: brazilDate.local_date_iso,
    local_time: brazilDate.local_time,
    standard_status: standardStatus,
    status,
    result: homeScore === null || homeScore === undefined ? {} : { homeScore, awayScore },
    home_crest: item.homeTeam?.crest || '',
    away_crest: item.awayTeam?.crest || '',
    competition_name: competitionName,
    competition_code: competitionCode,
    competition_logo: item.competition?.emblem || '',
    matchday: item.matchday || null,
    stage: translatedStage,
    group_name: translateStage(item.group) || item.group || '',
    venue: item.venue || item.stadium || '',
    city: item.city || '',
    country,
    home_score: homeScore ?? null,
    away_score: awayScore ?? null,
    timezone: 'America/Sao_Paulo',
    external_ref: item.id ? String(item.id) : null,
    updated_at: syncedAt,
    metadata: {
      provider: 'football-data.org',
      syncedAt,
      providerStatus,
      standardStatus,
      statusLabel: getSportsStatusLabel(standardStatus),
      utcDate: brazilDate.utc_date,
      localDate: brazilDate.local_date,
      localDateIso: brazilDate.local_date_iso,
      localTime: brazilDate.local_time,
      timezone: 'America/Sao_Paulo',
      competition: {
        ...item.competition,
        code: competitionCode,
        namePtBr: competitionName,
        logoUrl: item.competition?.emblem || '',
      },
      matchday: item.matchday,
      stage: translatedStage,
      rawStage: item.stage,
      group: translateStage(item.group) || item.group,
      venue: item.venue || item.stadium || '',
      city: item.city || '',
      country,
      homeShield: item.homeTeam?.crest || item.homeTeam?.tla,
      awayShield: item.awayTeam?.crest || item.awayTeam?.tla,
      homeShortName: item.homeTeam?.tla,
      awayShortName: item.awayTeam?.tla,
      homeOfficialName: item.homeTeam?.name || '',
      awayOfficialName: item.awayTeam?.name || '',
      raw: item,
    },
  }
}

export function mapFootballDataStanding(item = {}) {
  return {
    profile_id: item.profileId || null,
    position: Number(item.position || 0),
    score: Number(item.points || 0),
    metadata: {
      provider: 'football-data.org',
      team: item.team,
      playedGames: item.playedGames,
      won: item.won,
      draw: item.draw,
      lost: item.lost,
      goalsFor: item.goalsFor,
      goalsAgainst: item.goalsAgainst,
      goalDifference: item.goalDifference,
      raw: item,
    },
  }
}
