import { DATABASE_TABLES } from '../constants/tables'
import { mapCompetitionFromRow, mapCompetitionToRow } from '../mappers/competitionMapper'
import { createBaseRepository } from './baseRepository'

export function createCompetitionRepository(client) {
  const competitions = createBaseRepository({
    client,
    table: DATABASE_TABLES.COMPETITIONS,
    mapper: mapCompetitionFromRow,
  })
  const predictions = createBaseRepository({
    client,
    table: DATABASE_TABLES.COMPETITION_PREDICTIONS,
  })

  return {
    competitions,
    predictions,
    createCompetition(payload) {
      return competitions.insert(mapCompetitionToRow(payload))
    },
    listPublishedCompetitions() {
      return competitions.list({ status: 'published' })
    },
  }
}
