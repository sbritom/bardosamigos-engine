import { SCORING_TYPES } from '../constants'
import { createCompetitionId } from '../utils/idGenerator'

export function createScoreRule(data = {}) {
  return {
    id: data.id || createCompetitionId('score-rule'),
    competitionId: data.competitionId || '',
    type: data.type || SCORING_TYPES.CUSTOM,
    points: Number(data.points || 0),
    active: data.active ?? true,
    metadata: data.metadata || {},
  }
}
