import { SYNC_INTEGRATIONS } from '../constants'
import { createSyncAdapter } from './createSyncAdapter'

export function createGamesAdapter(options = {}) {
  return createSyncAdapter({
    integration: SYNC_INTEGRATIONS.GAMES,
    fetcher: options.fetcher,
  })
}
