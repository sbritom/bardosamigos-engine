import { SYNC_INTEGRATIONS } from '../constants'
import { createChampionshipsAdapter } from '../adapters'
import { mapExternalChampionshipToCompetition } from '../mappers/championshipSyncMapper'
import { createChampionshipsSyncRepository } from '../repositories'
import { createSyncService } from './createSyncService'

export function createChampionshipsSyncService({ client, logRepository, fetcher } = {}) {
  return createSyncService({
    integration: SYNC_INTEGRATIONS.CHAMPIONSHIPS,
    adapter: createChampionshipsAdapter({ fetcher }),
    repository: createChampionshipsSyncRepository(client),
    mapper: mapExternalChampionshipToCompetition,
    logRepository,
  })
}
