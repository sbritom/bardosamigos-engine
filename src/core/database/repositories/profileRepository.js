import { DATABASE_TABLES } from '../constants/tables'
import { mapProfileFromRow, mapProfileToRow } from '../mappers/profileMapper'
import { createBaseRepository } from './baseRepository'

export function createProfileRepository(client) {
  const repository = createBaseRepository({
    client,
    table: DATABASE_TABLES.PROFILES,
    mapper: mapProfileFromRow,
  })

  return {
    ...repository,
    async updateProfile(id, profile) {
      return repository.update(id, mapProfileToRow(profile))
    },
  }
}
