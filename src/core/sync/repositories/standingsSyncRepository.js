import { DATABASE_TABLES } from '../../database'
import { createSyncRepository } from './createSyncRepository'

export function createStandingsSyncRepository(client) {
  return createSyncRepository({
    client,
    table: DATABASE_TABLES.RANKING_ENTRIES,
    validateRecord: (record) => Boolean(record.profile_id),
  })
}
