import { createCompetitionId } from '../utils/idGenerator'

export function createStage(data = {}) {
  return {
    id: data.id || createCompetitionId('stage'),
    seasonId: data.seasonId || '',
    name: data.name || 'Untitled Stage',
    order: Number(data.order || 1),
    metadata: data.metadata || {},
  }
}
