export const SYNC_INTEGRATIONS = Object.freeze({
  CHAMPIONSHIPS: 'championships',
  GAMES: 'games',
  STANDINGS: 'standings',
  NEWS: 'news',
  FOOTBALL_DATA: 'football-data',
  GNEWS: 'gnews',
})

export const SYNC_STATUS = Object.freeze({
  IDLE: 'idle',
  RUNNING: 'running',
  SUCCESS: 'success',
  ERROR: 'error',
  SKIPPED: 'skipped',
})

export const SYNC_CACHE_TTL = 1000 * 60 * 10

export const SYNC_SOURCE_TYPES = Object.freeze({
  EXTERNAL_API: 'external_api',
  SUPABASE: 'supabase',
  MANUAL: 'manual',
})
