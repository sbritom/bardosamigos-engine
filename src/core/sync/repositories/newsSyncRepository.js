import { DATABASE_TABLES } from '../../database'
import { createSyncRepository } from './createSyncRepository'

export function createNewsSyncRepository(client) {
  return createSyncRepository({
    client,
    table: DATABASE_TABLES.NEWS_ARTICLES,
    validateRecord: (record) => Boolean(record.title && record.slug),
  })
}
