import { SYNC_INTEGRATIONS } from '../constants'
import { createGamesAdapter } from '../adapters'
import { mapExternalGameToMatch } from '../mappers/gameSyncMapper'
import { createGamesSyncRepository } from '../repositories'
import { createSyncService } from './createSyncService'

export function createGamesSyncService({ client, logRepository, fetcher } = {}) {
  return createSyncService({
    integration: SYNC_INTEGRATIONS.GAMES,
    adapter: createGamesAdapter({ fetcher }),
    repository: createGamesSyncRepository(client),
    mapper: mapExternalGameToMatch,
    logRepository,
  })
}
