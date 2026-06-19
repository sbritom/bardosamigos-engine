import { createCompetitionId } from '../utils/idGenerator'

export function createRound(data = {}) {
  return {
    id: data.id || createCompetitionId('round'),
    stageId: data.stageId || '',
    name: data.name || `Round ${data.number || 1}`,
    number: Number(data.number || 1),
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    metadata: data.metadata || {},
  }
}
