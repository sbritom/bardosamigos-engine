import { SYNC_INTEGRATIONS } from '../constants'
import { createSyncAdapter } from './createSyncAdapter'

export function createStandingsAdapter(options = {}) {
  return createSyncAdapter({
    integration: SYNC_INTEGRATIONS.STANDINGS,
    fetcher: options.fetcher,
  })
}
