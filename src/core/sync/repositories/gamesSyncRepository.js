import { DATABASE_TABLES } from '../../database'
import { createSyncRepository } from './createSyncRepository'

export function createGamesSyncRepository(client) {
  return createSyncRepository({
    client,
    table: DATABASE_TABLES.COMPETITION_MATCHES,
    validateRecord: (record) => Boolean(record.round_id && record.starts_at),
  })
}
