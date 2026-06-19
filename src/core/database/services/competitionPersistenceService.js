import { createCompetitionDto } from '../dtos/competition.dto'
import { createCompetitionRepository } from '../repositories/competitionRepository'

export function createCompetitionPersistenceService(client) {
  const repository = createCompetitionRepository(client)

  return {
    async listPublishedCompetitions() {
      const result = await repository.listPublishedCompetitions()
      return {
        ...result,
        data: result.data.map(createCompetitionDto),
      }
    },

    createCompetition(payload) {
      return repository.createCompetition(payload)
    },
  }
}
