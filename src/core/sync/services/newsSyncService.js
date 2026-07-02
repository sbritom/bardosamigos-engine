import { SYNC_INTEGRATIONS } from '../constants'
import { createNewsAdapter } from '../adapters'
import { mapExternalNewsToArticle } from '../mappers/newsSyncMapper'
import { createNewsSyncRepository } from '../repositories'
import { createSyncService } from './createSyncService'

export function createNewsSyncService({ client, logRepository, fetcher } = {}) {
  return createSyncService({
    integration: SYNC_INTEGRATIONS.NEWS,
    adapter: createNewsAdapter({ fetcher }),
    repository: createNewsSyncRepository(client),
    mapper: mapExternalNewsToArticle,
    logRepository,
  })
}
