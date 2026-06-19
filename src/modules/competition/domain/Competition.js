import { COMPETITION_TYPES } from '../constants'
import { createCompetitionId } from '../utils/idGenerator'

export function createCompetition(data = {}) {
  return {
    id: data.id || createCompetitionId('competition'),
    name: data.name || 'Untitled Competition',
    type: data.type || COMPETITION_TYPES.CUSTOM,
    active: data.active ?? true,
    settings: data.settings || {},
    metadata: data.metadata || {},
  }
}
