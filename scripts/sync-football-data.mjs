const startedAt = Date.now()
let timeService = null

function normalizeEnvValue(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '').trim()
}

function maskSecret(value) {
  const safeValue = normalizeEnvValue(value)

  return {
    length: safeValue.length,
    first4: safeValue.slice(0, 4),
    last4: safeValue.slice(-4),
  }
}

async function loadEnvLocal() {
  const { existsSync, readFileSync } = await import('node:fs')

  if (!existsSync('.env.local')) return

  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!match) return

      const [, key, rawValue] = match
      if (!process.env[key]) {
        process.env[key] = normalizeEnvValue(rawValue)
      }
    })
}

function requiredEnv(name) {
  const value = normalizeEnvValue(process.env[name])
  if (!value) {
    throw new Error(`${name} is required to run Football-Data sync.`)
  }
  return value
}

function optionalEnv(...names) {
  for (const name of names) {
    const value = normalizeEnvValue(process.env[name])
    if (value) return value
  }

  return ''
}

function formatExternalError(error) {
  if (!error) return 'Unknown error'
  return [error.message, error.code, error.details, error.hint].filter(Boolean).join(' | ')
}

function assertSupabaseAnonKey(value) {
  const normalizedValue = normalizeEnvValue(value)
  const looksLikeJwt = normalizedValue.split('.').length === 3
  const looksLikePlaceholder = normalizedValue.toUpperCase().includes('SEU_')

  if (!looksLikeJwt || looksLikePlaceholder) {
    throw new Error('Supabase config error: VITE_SUPABASE_ANON_KEY is missing or is not a valid Supabase anon JWT.')
  }
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
  const slug = competitionCode.toLowerCase()
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

function toDateOnly(value) {
  return timeService.getBrazilDateKey(value)
}

function createStatusSummary(matches = [], now = timeService.nowUtcIso()) {
  const today = toDateOnly(now)

  return matches.reduce((summary, match) => {
    const startsAt = match.starts_at || match.startsAt || match.utc_date
    const matchDay = toDateOnly(startsAt)
    const status = match.standard_status || match.standardStatus || match.status

    if (timeService.isLiveStatus(status)) summary.live += 1
    else if (matchDay === today && !timeService.isFinishedStatus(status)) summary.today += 1
    else if (timeService.getUtcTimestamp(startsAt) > timeService.getUtcTimestamp(now) && !timeService.isFinishedStatus(status)) summary.upcoming += 1
    else if (timeService.isFinishedStatus(status)) summary.finished += 1

    if (match.metadata?.competition?.code === 'WC' || match.metadata?.competition?.id === 2000) {
      summary.worldCup2026 += 1
    }

    return summary
  }, {
    live: 0,
    today: 0,
    upcoming: 0,
    finished: 0,
    worldCup2026: 0,
  })
}

async function listWindowMatches(client, dateWindow) {
  const { data, error } = await client
    .from('competition_matches')
    .select('id, status, standard_status, starts_at, utc_date, metadata')
    .gte('starts_at', dateWindow.fromIso)
    .lte('starts_at', dateWindow.toIso)
    .is('deleted_at', null)

  if (error) throw new Error(`Supabase competition_matches summary failed: ${formatExternalError(error)}`)

  return data || []
}

async function main() {
  await loadEnvLocal()

  const [
    { createClient },
    { createFootballDataAdapter },
    { createFootballDataService },
    {
      FOOTBALL_DATA_BASE_URL,
      FOOTBALL_DATA_DEFAULT_COMPETITIONS,
      FOOTBALL_DATA_MATCH_STATUSES,
      FOOTBALL_DATA_SYNC_TYPES,
      FOOTBALL_DATA_WORLD_CUP_CODE,
      FOOTBALL_DATA_WORLD_CUP_SEASON,
      createFootballDataDateWindow,
    },
    timeModule,
  ] = await Promise.all([
    import('@supabase/supabase-js'),
    import('../src/core/sync/providers/footballData/footballDataAdapter.js'),
    import('../src/core/sync/providers/footballData/footballDataService.js'),
    import('../src/core/sync/providers/footballData/footballDataConstants.js'),
    import('../src/core/time/timeService.js'),
  ])
  timeService = timeModule

  const supabaseUrl = requiredEnv('VITE_SUPABASE_URL')
  const supabaseAnonKey = requiredEnv('VITE_SUPABASE_ANON_KEY')
  const footballDataApiKey = optionalEnv('FOOTBALL_DATA_API_KEY')
  if (!footballDataApiKey) {
    throw new Error('FOOTBALL_DATA_API_KEY is required to run Football-Data sync.')
  }
  const footballDataAdapter = createFootballDataAdapter({ apiKey: footballDataApiKey })
  const footballDataPreflight = await footballDataAdapter.fetchCompetitions()
  const availableCompetitionCodes = new Set((footballDataPreflight.data?.competitions || []).map((competition) => competition.code).filter(Boolean))
  const configuredCompetitionCode = process.env.FOOTBALL_DATA_COMPETITION_CODE
  const targetCompetitionCodes = configuredCompetitionCode
    ? [configuredCompetitionCode]
    : FOOTBALL_DATA_DEFAULT_COMPETITIONS.filter((code) => availableCompetitionCodes.has(code))
  const skippedCompetitionCodes = configuredCompetitionCode
    ? []
    : FOOTBALL_DATA_DEFAULT_COMPETITIONS.filter((code) => !availableCompetitionCodes.has(code))
  const dateWindow = createFootballDataDateWindow()

  console.log(JSON.stringify({
    footballDataApiKey: maskSecret(footballDataApiKey),
    footballDataBaseUrl: FOOTBALL_DATA_BASE_URL,
    footballDataHeader: 'X-Auth-Token',
    footballDataPreflight: {
      status: footballDataPreflight.error ? 'error' : 'ok',
      competitions: footballDataPreflight.data?.competitions?.length || 0,
      error: footballDataPreflight.error?.message,
    },
    dateWindow,
    targetCompetitionCodes,
    skippedCompetitionCodes,
  }, null, 2))

  if (footballDataPreflight.error) {
    throw new Error(`Football-Data preflight failed: ${footballDataPreflight.error.message}`)
  }

  assertSupabaseAnonKey(supabaseAnonKey)

  const client = createClient(supabaseUrl, supabaseAnonKey)
  const service = createFootballDataService({ client, adapter: footballDataAdapter })

  const competitions = await service.syncCompetitions()
  const competitionReports = []

  for (const competitionCode of targetCompetitionCodes) {
    const season = competitionCode === FOOTBALL_DATA_WORLD_CUP_CODE ? FOOTBALL_DATA_WORLD_CUP_SEASON : undefined
    const shouldSyncTeams = [FOOTBALL_DATA_WORLD_CUP_CODE, 'BSA'].includes(competitionCode)
    const shouldSyncStandings = competitionCode === FOOTBALL_DATA_WORLD_CUP_CODE
    const context = await ensureCompetitionContext(client, competitionCode, season || Number(timeService.getBrazilDateKey().slice(0, 4)))
    const teams = shouldSyncTeams
      ? await service.syncTeams({ competitionCode, competitionId: context.competitionId, season })
      : { records: 0, error: null, integration: FOOTBALL_DATA_SYNC_TYPES.TEAMS }
    const matches = await service.syncCurrentMatches({
      competitionCode,
      roundId: context.roundId,
      dateFrom: dateWindow.dateFrom,
      dateTo: dateWindow.dateTo,
      statuses: FOOTBALL_DATA_MATCH_STATUSES,
      season,
    })
    const standings = shouldSyncStandings
      ? await service.syncStandings({ competitionCode, season, type: FOOTBALL_DATA_SYNC_TYPES.STANDINGS })
      : { records: 0, error: null, integration: FOOTBALL_DATA_SYNC_TYPES.STANDINGS }

    competitionReports.push({
      competitionCode,
      season: season || null,
      teamsSynced: shouldSyncTeams,
      standingsSynced: shouldSyncStandings,
      teams: teams.records,
      matches: matches.records,
      standings: standings.records,
      errors: [teams, matches, standings]
        .filter((item) => item.error)
        .map((item) => ({
          integration: item.integration,
          error: item.error.message,
          records: item.records || 0,
          fatal: item.integration === FOOTBALL_DATA_SYNC_TYPES.UPCOMING_MATCHES && !item.records,
        })),
    })
  }

  const windowMatches = await listWindowMatches(client, dateWindow)
  const statusSummary = createStatusSummary(windowMatches)
  const elapsedMs = Date.now() - startedAt
  const reportIssues = [
    competitions.error ? { integration: competitions.integration, error: competitions.error.message, fatal: true } : null,
    ...competitionReports.flatMap((item) => item.errors),
  ].filter(Boolean)
  const reportErrors = reportIssues.filter((item) => item.fatal)
  const reportWarnings = reportIssues.filter((item) => !item.fatal)
  const report = {
    competitions: competitions.records,
    competitionReports,
    teams: competitionReports.reduce((total, item) => total + item.teams, 0),
    matches: competitionReports.reduce((total, item) => total + item.matches, 0),
    standings: competitionReports.reduce((total, item) => total + item.standings, 0),
    statusSummary,
    elapsedMs,
    errors: reportErrors,
    warnings: reportWarnings,
  }

  console.log(JSON.stringify(report, null, 2))

  if (report.errors.length) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
