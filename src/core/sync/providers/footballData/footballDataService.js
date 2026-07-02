import { SYNC_STATUS } from '../../constants.js'
import { createSyncLogRepository } from '../../repositories/syncLogRepository.js'
import { formatBrazilFullDateTime, getUtcTimestamp, isFinishedStatus, isLiveStatus, nowUtcIso, normalizeMatchStatus } from '../../../time/timeService.js'
import { createFootballDataAdapter } from './footballDataAdapter.js'
import { FOOTBALL_DATA_DEFAULT_COMPETITIONS, FOOTBALL_DATA_MATCH_STATUSES, FOOTBALL_DATA_SYNC_TYPES, createFootballDataDateWindow } from './footballDataConstants.js'
import {
  mapFootballDataCompetition,
  mapFootballDataMatch,
  mapFootballDataStanding,
  mapFootballDataTeam,
} from './footballDataMapper.js'
import { createFootballDataRepository } from './footballDataRepository.js'

function createResult({ type, status, records = 0, error = null, metadata = {} }) {
  const utcNow = nowUtcIso()

  return {
    integration: type,
    status,
    records,
    lastSyncAt: utcNow,
    error,
    metadata: {
      ...metadata,
      syncUtc: utcNow,
      syncBrazilTime: formatBrazilFullDateTime(utcNow),
    },
  }
}

function compareSyncMatchPriority(left = {}, right = {}) {
  const leftStatus = normalizeMatchStatus(left.standard_status || left.standardStatus || left.status)
  const rightStatus = normalizeMatchStatus(right.standard_status || right.standardStatus || right.status)
  const leftTime = getUtcTimestamp(left.starts_at || left.startsAt || left.utc_date || left.utcDate || 0)
  const rightTime = getUtcTimestamp(right.starts_at || right.startsAt || right.utc_date || right.utcDate || 0)

  if (isLiveStatus(leftStatus) !== isLiveStatus(rightStatus)) return isLiveStatus(leftStatus) ? -1 : 1
  if (isFinishedStatus(leftStatus) !== isFinishedStatus(rightStatus)) return isFinishedStatus(leftStatus) ? -1 : 1
  if (isFinishedStatus(leftStatus)) return rightTime - leftTime
  return leftTime - rightTime
}

function formatExternalError(error) {
  if (!error) return 'Unknown error'
  return [error.message, error.code, error.details, error.hint].filter(Boolean).join(' | ')
}

async function findOrCreate(client, table, match, payload) {
  let query = client.from(table).select('*').limit(1)
  Object.entries(match).forEach(([key, value]) => {
    query = query.eq(key, value)
  })

  const { data: existing, error: findError } = await query.maybeSingle()
  if (findError) throw new Error(`Supabase ${table} select failed: ${formatExternalError(findError)}`)
  if (existing) return existing

  const { data, error } = await client.from(table).insert(payload).select('*').single()
  if (error) throw new Error(`Supabase ${table} insert failed: ${formatExternalError(error)}`)
  return data
}

async function ensureCompetitionContext(client, competitionCode, seasonYear) {
  if (!client) return { competitionId: null, roundId: null }

  const slug = String(competitionCode || FOOTBALL_DATA_DEFAULT_COMPETITIONS[0]).toLowerCase()
  const competition = await findOrCreate(
    client,
    'competitions',
    { slug },
    {
      name: `Football-Data ${competitionCode}`,
      slug,
      type: 'football',
      status: 'published',
      metadata: { provider: 'football-data.org', code: competitionCode },
    },
  )
  const season = await findOrCreate(
    client,
    'competition_seasons',
    { slug: `${slug}-${seasonYear}` },
    {
      competition_id: competition.id,
      name: `${competition.name} ${seasonYear}`,
      slug: `${slug}-${seasonYear}`,
      status: 'published',
      metadata: { provider: 'football-data.org', code: competitionCode },
    },
  )
  const stage = await findOrCreate(
    client,
    'competition_stages',
    { season_id: season.id, name: 'Temporada Regular' },
    {
      season_id: season.id,
      name: 'Temporada Regular',
      stage_type: 'regular',
      stage_order: 1,
      status: 'published',
      settings: {},
      metadata: { provider: 'football-data.org', code: competitionCode },
    },
  )
  const round = await findOrCreate(
    client,
    'competition_rounds',
    { stage_id: stage.id, name: 'Sincronizacao Football-Data' },
    {
      stage_id: stage.id,
      name: 'Sincronizacao Football-Data',
      number: 1,
      status: 'published',
      metadata: { provider: 'football-data.org', code: competitionCode },
    },
  )

  return {
    competitionId: competition.id,
    roundId: round.id,
  }
}

async function saveLog(logRepository, result) {
  await logRepository.saveLog({
    ...result,
    error: result.error?.message,
  })

  return result
}

export function createFootballDataService(options = {}) {
  const adapter = options.adapter || createFootballDataAdapter(options)
  const repository = options.repository || createFootballDataRepository(options.client)
  const logRepository = options.logRepository || createSyncLogRepository(options.client)
  const client = options.client

  async function withFallback(type, apiCall, saveRecords, fallback) {
    const response = await apiCall()

    if (response.error) {
      const synced = fallback ? await fallback() : { data: [] }
      return saveLog(logRepository, createResult({
        type,
        status: SYNC_STATUS.ERROR,
        records: synced.data?.length || 0,
        error: response.error,
        metadata: { fallback: true },
      }))
    }

    const records = response.records || []
    const saved = await saveRecords(records)

    return saveLog(logRepository, createResult({
      type,
      status: saved.error ? SYNC_STATUS.ERROR : SYNC_STATUS.SUCCESS,
      records: saved.data?.length || 0,
      error: saved.error || null,
      metadata: {
        ...(response.metadata || {}),
        fallback: false,
        sourceRecords: records.length,
      },
    }))
  }

  return {
    async sync(request = {}) {
      const type = request.params?.type || FOOTBALL_DATA_SYNC_TYPES.COMPETITIONS

      if (type === FOOTBALL_DATA_SYNC_TYPES.TEAMS) return this.syncTeams(request.params)
      if (type === FOOTBALL_DATA_SYNC_TYPES.UPCOMING_MATCHES) return this.syncUpcomingMatches(request.params)
      if (type === FOOTBALL_DATA_SYNC_TYPES.FINISHED_MATCHES) return this.syncFinishedMatches(request.params)
      if (type === FOOTBALL_DATA_SYNC_TYPES.STANDINGS) return this.syncStandings(request.params)

      return this.syncCompetitions()
    },

    async syncCompetitions() {
      return withFallback(
        FOOTBALL_DATA_SYNC_TYPES.COMPETITIONS,
        async () => {
          const response = await adapter.fetchCompetitions()
          return {
            ...response,
            records: (response.data?.competitions || []).map(mapFootballDataCompetition),
          }
        },
        (records) => repository.saveCompetitions(records),
        () => repository.listSyncedCompetitions(),
      )
    },

    async syncTeams(params = {}) {
      const { competitionCode, competitionId, season } = params

      return withFallback(
        FOOTBALL_DATA_SYNC_TYPES.TEAMS,
        async () => {
          const response = await adapter.fetchTeams(competitionCode || FOOTBALL_DATA_DEFAULT_COMPETITIONS[0], season ? { season } : {})
          return {
            ...response,
            records: (response.data?.teams || []).map((team) => mapFootballDataTeam(team, competitionId)),
          }
        },
        (records) => repository.saveTeams(records),
      )
    },

    async syncCurrentMatches(params = {}) {
      const competitionCode = params.competitionCode || FOOTBALL_DATA_DEFAULT_COMPETITIONS[0]
      const context = params.roundId
        ? { roundId: params.roundId }
        : await ensureCompetitionContext(client, competitionCode, params.season || Number(new Date().getFullYear()))
      const dateWindow = params.dateFrom && params.dateTo
        ? { dateFrom: params.dateFrom, dateTo: params.dateTo }
        : createFootballDataDateWindow()
      const statuses = params.statuses || FOOTBALL_DATA_MATCH_STATUSES

      return withFallback(
        FOOTBALL_DATA_SYNC_TYPES.UPCOMING_MATCHES,
        async () => {
          const responses = params.fetchEachStatus === true
            ? await Promise.all(statuses.map((status) => adapter.fetchMatches(competitionCode, {
                ...dateWindow,
                status,
                ...(params.season ? { season: params.season } : {}),
              })))
            : [await adapter.fetchMatches(competitionCode, {
                ...dateWindow,
                ...(params.season ? { season: params.season } : {}),
              })]
          const errors = responses.filter((response) => response.error)
          const matches = responses.flatMap((response) => response.data?.matches || [])
          const uniqueMatches = Array.from(new Map(matches.map((match) => [match.id || `${match.utcDate}-${match.homeTeam?.name}-${match.awayTeam?.name}`, match])).values())

          return {
            data: { matches: uniqueMatches },
            error: errors.length === responses.length ? errors[0].error : null,
            records: uniqueMatches.map((match) => mapFootballDataMatch(match, context.roundId)).sort(compareSyncMatchPriority),
            metadata: {
              dateWindow,
              statuses,
              partialErrors: errors.map((response) => response.error?.message).filter(Boolean),
            },
          }
        },
        (records) => repository.saveMatches(records),
        () => repository.listSyncedMatches(),
      )
    },

    async syncUpcomingMatches(params = {}) {
      return withFallback(
        FOOTBALL_DATA_SYNC_TYPES.UPCOMING_MATCHES,
        async () => {
          const response = await adapter.fetchUpcomingMatches(params.competitionCode || FOOTBALL_DATA_DEFAULT_COMPETITIONS[0], params)
          return {
            ...response,
            records: (response.data?.matches || []).map((match) => mapFootballDataMatch(match, params.roundId)),
          }
        },
        (records) => repository.saveMatches(records),
        () => repository.listSyncedMatches(),
      )
    },

    async syncFinishedMatches(params = {}) {
      return withFallback(
        FOOTBALL_DATA_SYNC_TYPES.FINISHED_MATCHES,
        async () => {
          const response = await adapter.fetchFinishedMatches(params.competitionCode || FOOTBALL_DATA_DEFAULT_COMPETITIONS[0], params)
          return {
            ...response,
            records: (response.data?.matches || []).map((match) => mapFootballDataMatch(match, params.roundId)),
          }
        },
        (records) => repository.saveMatches(records),
        () => repository.listSyncedMatches(),
      )
    },

    async syncStandings(params = {}) {
      return withFallback(
        FOOTBALL_DATA_SYNC_TYPES.STANDINGS,
        async () => {
          const response = await adapter.fetchStandings(params.competitionCode || FOOTBALL_DATA_DEFAULT_COMPETITIONS[0], params.season ? { season: params.season } : {})
          const table = response.data?.standings?.flatMap((standing) => standing.table || []) || []
          return {
            ...response,
            records: table.map(mapFootballDataStanding),
          }
        },
        (records) => repository.saveStandings(records),
      )
    },
  }
}
