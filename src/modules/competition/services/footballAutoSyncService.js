import { SYNC_INTEGRATIONS } from '../../../core/sync'
import { syncAdminService } from '../../../core/sync/admin'
import { FOOTBALL_DATA_SYNC_TYPES } from '../../../core/sync/providers/footballData'
import { isLiveStatus } from '../../../core/time'

export const FOOTBALL_AUTO_SYNC_INTERVALS = Object.freeze({
  live: 30 * 1000,
  idle: 5 * 60 * 1000,
})

let lastSyncAt = 0
let runningSync = null

export function hasLiveFootballMatch(data) {
  const liveMatches = data?.live || data?.matches?.filter((match) => isLiveStatus(match.status || match.standardStatus)) || []
  const featuredStatus = data?.featured?.status || data?.featured?.standardStatus || data?.liveMatchCenter?.status || data?.liveMatchCenter?.heroStatus

  return liveMatches.length > 0 || isLiveStatus(featuredStatus)
}

export function getFootballAutoSyncInterval(hasLiveMatch = false) {
  return hasLiveMatch ? FOOTBALL_AUTO_SYNC_INTERVALS.live : FOOTBALL_AUTO_SYNC_INTERVALS.idle
}

export async function syncFootballBeforeRead({ hasLiveMatch = false, force = false } = {}) {
  const interval = getFootballAutoSyncInterval(hasLiveMatch)
  const now = Date.now()

  if (!force && lastSyncAt && now - lastSyncAt < interval) {
    return { skipped: true, reason: 'interval_not_elapsed', interval }
  }

  if (runningSync) return runningSync

  runningSync = syncAdminService
    .syncNow(SYNC_INTEGRATIONS.FOOTBALL_DATA, {
      type: FOOTBALL_DATA_SYNC_TYPES.UPCOMING_MATCHES,
      fetchEachStatus: hasLiveMatch,
    })
    .then((result) => {
      lastSyncAt = Date.now()
      return result
    })
    .finally(() => {
      runningSync = null
    })

  return runningSync
}
