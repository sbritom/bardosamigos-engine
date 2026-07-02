import { getSupabaseClient } from '../../database'
import { SYNC_INTEGRATIONS } from '../constants'
import { createSyncLogRepository } from '../repositories'
import { createChampionshipsSyncService } from './championshipsSyncService'
import { createGamesSyncService } from './gamesSyncService'
import { createStandingsSyncService } from './standingsSyncService'
import { createNewsSyncService } from './newsSyncService'
import { createFootballDataService } from '../providers/footballData'
import { createGNewsService } from '../providers/gnews'
import { formatBrazilFullDateTime, nowUtcIso } from '../../time'

export function createSyncEngine(options = {}) {
  const client = options.client || getSupabaseClient()
  const fetchers = options.fetchers || {}
  const logRepository = options.logRepository || createSyncLogRepository(client)

  const services = {
    [SYNC_INTEGRATIONS.CHAMPIONSHIPS]: createChampionshipsSyncService({
      client,
      logRepository,
      fetcher: fetchers[SYNC_INTEGRATIONS.CHAMPIONSHIPS],
    }),
    [SYNC_INTEGRATIONS.GAMES]: createGamesSyncService({
      client,
      logRepository,
      fetcher: fetchers[SYNC_INTEGRATIONS.GAMES],
    }),
    [SYNC_INTEGRATIONS.STANDINGS]: createStandingsSyncService({
      client,
      logRepository,
      fetcher: fetchers[SYNC_INTEGRATIONS.STANDINGS],
    }),
    [SYNC_INTEGRATIONS.NEWS]: createNewsSyncService({
      client,
      logRepository,
      fetcher: fetchers[SYNC_INTEGRATIONS.NEWS],
    }),
    [SYNC_INTEGRATIONS.FOOTBALL_DATA]: createFootballDataService({
      client,
      logRepository,
      apiKey: options.footballDataApiKey,
      fetcher: options.footballDataFetcher,
    }),
    [SYNC_INTEGRATIONS.GNEWS]: createGNewsService({
      client,
      logRepository,
      apiKey: options.gnewsApiKey,
      fetcher: options.gnewsFetcher,
    }),
  }

  return {
    services,

    async sync(integration, request = {}) {
      const service = services[integration]
      if (!service) {
        const syncUtc = nowUtcIso()

        return {
          integration,
          status: 'error',
          records: 0,
          lastSyncAt: syncUtc,
          error: new Error(`Unknown sync integration: ${integration}`),
          metadata: {
            syncUtc,
            syncBrazilTime: formatBrazilFullDateTime(syncUtc),
          },
        }
      }

      return service.sync({ ...request, integration })
    },

    async syncAll(request = {}) {
      const results = []

      for (const integration of Object.values(SYNC_INTEGRATIONS)) {
        results.push(await this.sync(integration, request))
      }

      return results
    },

    listIntegrations() {
      return Object.values(SYNC_INTEGRATIONS).map((integration) => ({
        integration,
        enabled: Boolean(services[integration]),
      }))
    },

    listLogs(limit) {
      return logRepository.listLogs(limit)
    },
  }
}

export const syncEngine = createSyncEngine()
