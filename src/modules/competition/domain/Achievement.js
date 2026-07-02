import { createCompetitionId } from '../utils/idGenerator'
import { nowUtcIso } from '../../../core/time'

export function createAchievement(data = {}) {
  return {
    id: data.id || createCompetitionId('achievement'),
    userId: data.userId || '',
    title: data.title || 'Achievement',
    description: data.description || '',
    unlockedAt: data.unlockedAt || nowUtcIso(),
    metadata: data.metadata || {},
  }
}
