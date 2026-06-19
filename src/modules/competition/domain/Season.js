import { createCompetitionId } from '../utils/idGenerator'

export function createSeason(data = {}) {
  return {
    id: data.id || createCompetitionId('season'),
    competitionId: data.competitionId || '',
    name: data.name || 'Untitled Season',
    startsAt: data.startsAt || new Date().toISOString(),
    endsAt: data.endsAt || new Date().toISOString(),
    active: data.active ?? true,
    metadata: data.metadata || {},
  }
}
