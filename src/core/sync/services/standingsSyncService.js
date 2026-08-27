import { SYNC_INTEGRATIONS } from '../constants'
import { createStandingsAdapter } from '../adapters'
import { mapExternalStandingToRankingEntry } from '../mappers/standingSyncMapper'
import { createStandingsSyncRepository } from '../repositories'
import { createSyncService } from './createSyncService'

export function createStandingsSyncService({ client, logRepository, fetcher } = {}) {
  return createSyncService({
    integration: SYNC_INTEGRATIONS.STANDINGS,
    adapter: createStandingsAdapter({ fetcher }),
    repository: createStandingsSyncRepository(client),
    mapper: mapExternalStandingToRankingEntry,
    logRepository,
  })
}
