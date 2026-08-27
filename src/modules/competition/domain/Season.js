import { createCompetitionId } from '../utils/idGenerator'
import { nowUtcIso } from '../../../core/time'

export function createSeason(data = {}) {
  return {
    id: data.id || createCompetitionId('season'),
    competitionId: data.competitionId || '',
    name: data.name || 'Untitled Season',
    startsAt: data.startsAt || nowUtcIso(),
    endsAt: data.endsAt || nowUtcIso(),
    active: data.active ?? true,
    metadata: data.metadata || {},
  }
}
