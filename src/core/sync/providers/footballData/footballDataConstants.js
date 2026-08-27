import { createBrazilDateWindow, nowUtcIso } from '../../../time/timeService.js'

export const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4'

export const FOOTBALL_DATA_ENDPOINTS = Object.freeze({
  COMPETITIONS: '/competitions',
  TEAMS: (competitionCode) => `/competitions/${competitionCode}/teams`,
  MATCHES: (competitionCode) => `/competitions/${competitionCode}/matches`,
  STANDINGS: (competitionCode) => `/competitions/${competitionCode}/standings`,
})

export const FOOTBALL_DATA_SYNC_TYPES = Object.freeze({
  COMPETITIONS: 'football-data.competitions',
  TEAMS: 'football-data.teams',
  UPCOMING_MATCHES: 'football-data.upcoming-matches',
  FINISHED_MATCHES: 'football-data.finished-matches',
  STANDINGS: 'football-data.standings',
})

export const FOOTBALL_DATA_MATCH_STATUSES = Object.freeze([
  'SCHEDULED',
  'TIMED',
  'LIVE',
  'IN_PLAY',
  'PAUSED',
  'FINISHED',
])

export const FOOTBALL_DATA_LIVE_STATUSES = Object.freeze(['LIVE', 'IN_PLAY', 'PAUSED'])

export const FOOTBALL_DATA_DEFAULT_COMPETITIONS = Object.freeze(['WC', 'BSA', 'CL', 'PL', 'CDB', 'CLI'])

export const FOOTBALL_DATA_WORLD_CUP_CODE = 'WC'
export const FOOTBALL_DATA_WORLD_CUP_SEASON = 2026

export function createFootballDataDateWindow(now = nowUtcIso()) {
  return createBrazilDateWindow({ now })
}
