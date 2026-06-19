import { REWARD_TYPES } from '../constants'
import { createCompetitionId } from '../utils/idGenerator'

export function createReward(data = {}) {
  return {
    id: data.id || createCompetitionId('reward'),
    competitionId: data.competitionId || '',
    type: data.type || REWARD_TYPES.CUSTOM,
    title: data.title || 'Reward',
    description: data.description || '',
    payload: data.payload || {},
    metadata: data.metadata || {},
  }
}
