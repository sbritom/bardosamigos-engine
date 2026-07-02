import { SYNC_STATUS } from '../../constants.js'
import { createSyncLogRepository } from '../../repositories/syncLogRepository.js'
import { formatBrazilFullDateTime, nowUtcIso } from '../../../time/timeService.js'
import { createGNewsAdapter } from './gnewsAdapter.js'
import { GNEWS_CATEGORIES, GNEWS_QUERIES } from './gnewsConstants.js'
import { mapGNewsArticleToNewsArticle } from './gnewsMapper.js'
import { createGNewsRepository } from './gnewsRepository.js'

function createResult({ status, records = 0, error = null, metadata = {} }) {
  const utcNow = nowUtcIso()

  return {
    integration: 'gnews',
    status,
    records,
    lastSyncAt: utcNow,
    error,
    metadata: {
      ...metadata,
      syncUtc: utcNow,
      syncBrazilTime: formatBrazilFullDateTime(utcNow),
    },
  }
}

async function saveLog(logRepository, result) {
  await logRepository.saveLog({
    ...result,
    error: result.error?.message,
  })

  return result
}

export function createGNewsService(options = {}) {
  const adapter = options.adapter || createGNewsAdapter(options)
  const repository = options.repository || createGNewsRepository(options.client)
  const logRepository = options.logRepository || createSyncLogRepository(options.client)

  return {
    async sync(request = {}) {
      const categories = request.params?.categories || Object.values(GNEWS_CATEGORIES)
      const max = request.params?.max
      const records = []
      const errors = []

      for (const category of categories) {
        const response = await adapter.fetchNews({
          query: GNEWS_QUERIES[category] || category,
          max,
        })

        if (response.error) {
          errors.push(response.error)
          continue
        }

        records.push(...(response.data?.articles || []).map((article) => mapGNewsArticleToNewsArticle(article, category)))
      }

      if (errors.length === categories.length) {
        const fallback = await repository.listSyncedNews()
        return saveLog(logRepository, createResult({
          status: SYNC_STATUS.ERROR,
          records: fallback.data?.length || 0,
          error: errors[0],
          metadata: { fallback: true, errors: errors.map((error) => error.message) },
        }))
      }

      const saved = await repository.saveNews(records)
      return saveLog(logRepository, createResult({
        status: saved.error ? SYNC_STATUS.ERROR : SYNC_STATUS.SUCCESS,
        records: saved.data?.length || 0,
        error: saved.error || null,
        metadata: {
          fallback: false,
          categories,
          sourceRecords: records.length,
          errors: errors.map((error) => error.message),
        },
      }))
    },

    listSynced(limit) {
      return repository.listSyncedNews(limit)
    },
  }
}
