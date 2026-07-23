import { useEffect, useMemo, useState } from 'react'
import { Button, Loading } from '../../../../design-system'
import { getSupabaseClient } from '../../../../core/database'
import { SYNC_INTEGRATIONS } from '../../../../core/sync'
import { syncAdminService } from '../../../../core/sync/admin'
import { FOOTBALL_DATA_SYNC_TYPES } from '../../../../core/sync/providers/footballData'
import {
  createBrazilDateWindow,
  formatBrazilFullDateTime,
  getUtcTimestamp,
  isFinishedStatus,
  isLiveStatus,
  isSameBrazilDay,
  nowUtcIso,
} from '../../../../core/time'

const footballSteps = [
  FOOTBALL_DATA_SYNC_TYPES.COMPETITIONS,
  FOOTBALL_DATA_SYNC_TYPES.TEAMS,
  FOOTBALL_DATA_SYNC_TYPES.UPCOMING_MATCHES,
  FOOTBALL_DATA_SYNC_TYPES.FINISHED_MATCHES,
  FOOTBALL_DATA_SYNC_TYPES.STANDINGS,
]

function formatTime(value) {
  return formatBrazilFullDateTime(value)
}

function createSummary(results, elapsedMs) {
  return {
    lastSyncAt: nowUtcIso(),
    records: results.reduce((total, item) => total + (item.records || 0), 0),
    elapsedMs,
    errors: results.filter((item) => item.error).map((item) => item.error.message),
  }
}

function getCurrentTimestamp() {
  return Date.now()
}

async function loadFootballStatusSummary() {
  const client = getSupabaseClient()
  if (!client) return null

  const now = nowUtcIso()
  const window = createBrazilDateWindow({ now })
  const { data, error } = await client
    .from('competition_matches')
    .select('status, standard_status, starts_at')
    .gte('starts_at', window.fromIso)
    .lte('starts_at', window.toIso)
    .is('deleted_at', null)

  if (error) return null

  return (data || []).reduce((summary, match) => {
    const status = match.standard_status || match.status

    if (isLiveStatus(status)) summary.live += 1
    else if (!isFinishedStatus(status) && isSameBrazilDay(match.starts_at, now)) summary.today += 1
    else if (!isFinishedStatus(status) && getUtcTimestamp(match.starts_at) > getUtcTimestamp(now)) summary.upcoming += 1
    else if (isFinishedStatus(status)) summary.finished += 1

    return summary
  }, {
    live: 0,
    today: 0,
    upcoming: 0,
    finished: 0,
  })
}

async function countRows(client, table) {
  const { count } = await client.from(table).select('id', { count: 'exact', head: true })
  return count || 0
}

async function loadIntegrationSnapshots() {
  const client = getSupabaseClient()
  if (!client) return {}

  const [footballStatus, competitions, teams, matches, stages, rounds, news] = await Promise.all([
    loadFootballStatusSummary(),
    countRows(client, 'competitions'),
    countRows(client, 'competition_teams'),
    countRows(client, 'competition_matches'),
    countRows(client, 'competition_stages'),
    countRows(client, 'competition_rounds'),
    countRows(client, 'news_articles'),
  ])
  const { data: latestMatch } = await client
    .from('competition_matches')
    .select('updated_at')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const { data: groupRows } = await client
    .from('competition_matches')
    .select('group_name')
    .is('deleted_at', null)
    .not('group_name', 'is', null)
    .limit(500)
  const { data: newsRows } = await client.from('news_articles').select('metadata').limit(100)
  const newsCategories = new Set((newsRows || []).map((item) => item.metadata?.category).filter(Boolean))
  const groups = new Set((groupRows || []).map((item) => item.group_name).filter(Boolean))

  return {
    [SYNC_INTEGRATIONS.FOOTBALL_DATA]: {
      lastSyncAt: nowUtcIso(),
      records: matches,
      elapsedMs: 0,
      errors: [],
      statusSummary: footballStatus,
      details: {
        competitions,
        stages,
        groups: groups.size,
        rounds,
        teams,
        matches,
        latestMatchUpdate: latestMatch?.updated_at,
      },
    },
    [SYNC_INTEGRATIONS.GNEWS]: {
      lastSyncAt: nowUtcIso(),
      records: news,
      elapsedMs: 0,
      errors: [],
      details: {
        news,
        categories: newsCategories.size,
      },
    },
  }
}

export function IntegrationsPanel() {
  const [running, setRunning] = useState('')
  const [summaries, setSummaries] = useState({})
  const integrations = useMemo(() => {
    const hasSupabase = Boolean(getSupabaseClient())

    return [
      {
        id: 'supabase',
        name: 'Supabase',
        status: hasSupabase ? 'Configurado' : 'Nao configurado',
        canSync: false,
      },
      {
        id: SYNC_INTEGRATIONS.FOOTBALL_DATA,
        name: 'Football-Data',
        status: 'Sync Engine configurado',
        canSync: true,
      },
      {
        id: SYNC_INTEGRATIONS.GNEWS,
        name: 'GNews',
        status: 'Cron protegido no servidor',
        canSync: false,
      },
      {
        id: 'hunter-fm',
        name: 'Hunter FM',
        status: 'Stream configurado',
        canSync: false,
      },
      {
        id: 'youtube',
        name: 'YouTube',
        status: 'Endpoint server-side',
        canSync: false,
      },
    ]
  }, [])

  useEffect(() => {
    let active = true

    loadIntegrationSnapshots().then((snapshot) => {
      if (active) setSummaries(snapshot)
    })

    return () => {
      active = false
    }
  }, [])

  async function syncFootballData() {
    const startedAt = getCurrentTimestamp()
    setRunning(SYNC_INTEGRATIONS.FOOTBALL_DATA)

    const results = []
    for (const type of footballSteps) {
      results.push(await syncAdminService.syncNow(SYNC_INTEGRATIONS.FOOTBALL_DATA, { type }))
    }
    const statusSummary = await loadFootballStatusSummary()

    setSummaries((current) => ({
      ...current,
      [SYNC_INTEGRATIONS.FOOTBALL_DATA]: {
        ...createSummary(results, getCurrentTimestamp() - startedAt),
        statusSummary,
      },
    }))
    setRunning('')
  }

  async function handleSync(id) {
    if (id === SYNC_INTEGRATIONS.FOOTBALL_DATA) {
      await syncFootballData()
    }
  }

  return (
    <section className="rounded-[18px] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-5">
      <div className="mb-4">
        <p className="text-sm font-bold uppercase tracking-wide text-[var(--bds-color-text-secondary)]">Admin</p>
        <h2 className="mt-1 text-xl font-black text-[var(--bds-color-primary-hover)]">Integracoes</h2>
        <p className="mt-2 text-sm text-[var(--bds-color-text-secondary)]">
          Status das integracoes externas e sincronizacao via Sync Engine.
        </p>
      </div>

      <div className="grid gap-3 xl:grid-cols-4">
        {integrations.map((integration) => {
          const summary = summaries[integration.id]
          const isRunning = running === integration.id

          return (
            <div key={integration.id} className="rounded-xl border border-[var(--bds-color-border)] bg-[var(--bds-color-background)] p-4">
              <div className="text-xs font-black uppercase text-[var(--bds-color-text-secondary)]">{integration.status}</div>
              <h3 className="mt-1 text-lg font-black">{integration.name}</h3>
              <div className="mt-3 space-y-1 text-sm text-[var(--bds-color-text-secondary)]">
                <div>Ultima sincronizacao: <strong>{formatTime(summary?.lastSyncAt)}</strong></div>
                <div>Registros: <strong>{summary?.records ?? '-'}</strong></div>
                <div>Tempo: <strong>{summary?.elapsedMs ? `${summary.elapsedMs}ms` : '-'}</strong></div>
                <div>Erros: <strong>{summary?.errors?.length || 'Nenhum'}</strong></div>
                {summary?.details && (
                  <div className="pt-2 text-xs uppercase">
                    {integration.id === SYNC_INTEGRATIONS.FOOTBALL_DATA
                      ? <>Competições: <strong>{summary.details.competitions}</strong> · Times: <strong>{summary.details.teams}</strong> · Partidas: <strong>{summary.details.matches}</strong></>
                      : <>Notícias: <strong>{summary.details.news}</strong> · Categorias: <strong>{summary.details.categories}</strong></>}
                  </div>
                )}
                {integration.id === SYNC_INTEGRATIONS.FOOTBALL_DATA && summary?.statusSummary && (
                  <div className="pt-2 text-xs uppercase">
                    Ao vivo: <strong>{summary.statusSummary.live}</strong> · Hoje: <strong>{summary.statusSummary.today}</strong> · Proximos: <strong>{summary.statusSummary.upcoming}</strong> · Finalizados: <strong>{summary.statusSummary.finished}</strong>
                  </div>
                )}
              </div>
              {integration.id === SYNC_INTEGRATIONS.FOOTBALL_DATA && summary?.details && (
                <div className="mt-3 rounded-lg border border-[var(--bds-color-border)] p-3 text-xs uppercase text-[var(--bds-color-text-secondary)]">
                  Fases: <strong>{summary.details.stages}</strong> · Grupos: <strong>{summary.details.groups}</strong> · Rodadas: <strong>{summary.details.rounds}</strong>
                  {summary.details.latestMatchUpdate && <> · Ultima atualizacao: <strong>{formatTime(summary.details.latestMatchUpdate)}</strong></>}
                </div>
              )}
              {integration.canSync && (
                <div className="mt-4">
                  <Button disabled={Boolean(running)} onClick={() => handleSync(integration.id)}>
                    {isRunning ? 'Sincronizando' : 'Sincronizar Agora'}
                  </Button>
                </div>
              )}
              {isRunning && (
                <div className="mt-3">
                  <Loading label="Sincronizando" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
