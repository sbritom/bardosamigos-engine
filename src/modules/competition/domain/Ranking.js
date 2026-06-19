import { createCompetitionId } from '../utils/idGenerator'

export function createRanking(data = {}) {
  return {
    id: data.id || createCompetitionId('ranking'),
    competitionId: data.competitionId || '',
    seasonId: data.seasonId,
    items: data.items || [],
    updatedAt: data.updatedAt || new Date().toISOString(),
  }
}
