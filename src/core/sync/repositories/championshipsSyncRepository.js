import { DATABASE_TABLES } from '../../database'
import { createSyncRepository } from './createSyncRepository'

export function createChampionshipsSyncRepository(client) {
  return createSyncRepository({
    client,
    table: DATABASE_TABLES.COMPETITIONS,
    validateRecord: (record) => Boolean(record.name && record.slug),
  })
}
