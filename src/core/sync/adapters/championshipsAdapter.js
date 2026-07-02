import { SYNC_INTEGRATIONS } from '../constants'
import { createSyncAdapter } from './createSyncAdapter'

export function createChampionshipsAdapter(options = {}) {
  return createSyncAdapter({
    integration: SYNC_INTEGRATIONS.CHAMPIONSHIPS,
    fetcher: options.fetcher,
  })
}
