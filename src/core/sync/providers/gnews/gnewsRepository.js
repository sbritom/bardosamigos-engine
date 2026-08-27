import { DATABASE_TABLES } from '../../../database/constants/tables.js'
import { createSyncRepository } from '../../repositories/createSyncRepository.js'

export function createGNewsRepository(client) {
  const news = createSyncRepository({
    client,
    table: DATABASE_TABLES.NEWS_ARTICLES,
    validateRecord: (record) => Boolean(record.title && record.slug),
  })

  async function saveNewsBySlug(records = []) {
    const safeRecords = records.filter((record) => Boolean(record.title && record.slug))

    if (!client) return { data: [], error: new Error('Supabase client is not configured.') }
    if (!safeRecords.length) return { data: [], error: null }

    try {
      const { data: existingRows, error: findError } = await client
        .from(DATABASE_TABLES.NEWS_ARTICLES)
        .select('id, slug, metadata')
        .is('deleted_at', null)

      if (findError) return { data: [], error: findError }

      const existingBySlug = new Map((existingRows || []).map((row) => [row.slug, row.id]))
      const existingByUrl = new Map((existingRows || [])
        .map((row) => [row.metadata?.originalUrl || row.metadata?.sourceUrl, row.id])
        .filter(([url]) => Boolean(url)))
      const saved = []

      for (const record of safeRecords) {
        const originalUrl = record.metadata?.originalUrl || record.metadata?.sourceUrl
        const existingId = existingByUrl.get(originalUrl) || existingBySlug.get(record.slug)
        const query = existingId
          ? client.from(DATABASE_TABLES.NEWS_ARTICLES).update(record).eq('id', existingId)
          : client.from(DATABASE_TABLES.NEWS_ARTICLES).insert(record)
        const { data, error } = await query.select('*').single()

        if (error) return { data: saved, error }
        saved.push(data)
      }

      return { data: saved, error: null }
    } catch (error) {
      return { data: [], error }
    }
  }

  return {
    saveNews(records) {
      return saveNewsBySlug(records)
    },

    listSyncedNews(limit) {
      return news.listSynced(limit)
    },
  }
}
