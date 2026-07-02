import { SYNC_INTEGRATIONS } from '../constants'
import { createSyncAdapter } from './createSyncAdapter'

export function createNewsAdapter(options = {}) {
  return createSyncAdapter({
    integration: SYNC_INTEGRATIONS.NEWS,
    fetcher: options.fetcher,
  })
}
