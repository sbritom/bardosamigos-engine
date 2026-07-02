import { SYNC_STATUS } from '../constants'
import { createSyncCacheKey, getSyncCache, setSyncCache } from '../cache/syncCache'
import { formatBrazilFullDateTime, nowUtcIso } from '../../time'

export function createSyncService({ integration, adapter, repository, mapper, logRepository }) {
  return {
    integration,

    async sync(request = {}) {
      const cacheKey = createSyncCacheKey(integration, request.params || {})
      const cachedResult = !request.force ? getSyncCache(cacheKey) : null

      if (cachedResult) {
        return cachedResult
      }

      const lastSyncAt = nowUtcIso()
      const fetched = await adapter.fetch(request)

      if (fetched.error) {
        const result = {
          integration,
          status: SYNC_STATUS.ERROR,
          records: 0,
          lastSyncAt,
          error: fetched.error,
          metadata: {
            ...(fetched.metadata || {}),
            syncUtc: lastSyncAt,
            syncBrazilTime: formatBrazilFullDateTime(lastSyncAt),
          },
        }

        await logRepository.saveLog({
          ...result,
          error: fetched.error.message,
        })

        return result
      }

      const mappedRecords = (fetched.data || []).map(mapper)
      const saved = await repository.saveMany(mappedRecords)
      const records = saved.error ? 0 : saved.data.length
      const status = fetched.skipped ? SYNC_STATUS.SKIPPED : saved.error ? SYNC_STATUS.ERROR : SYNC_STATUS.SUCCESS
      const result = {
        integration,
        status,
        records,
        lastSyncAt,
        error: saved.error || null,
        metadata: {
          skipped: Boolean(fetched.skipped),
          sourceRecords: fetched.data?.length || 0,
          syncUtc: lastSyncAt,
          syncBrazilTime: formatBrazilFullDateTime(lastSyncAt),
        },
      }

      await logRepository.saveLog({
        ...result,
        error: result.error?.message,
      })

      return setSyncCache(cacheKey, result)
    },

    async listSynced(limit) {
      return repository.listSynced(limit)
    },
  }
}
