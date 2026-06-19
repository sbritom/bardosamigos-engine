import { createCompetitionId } from '../utils/idGenerator'

export function createAchievement(data = {}) {
  return {
    id: data.id || createCompetitionId('achievement'),
    userId: data.userId || '',
    title: data.title || 'Achievement',
    description: data.description || '',
    unlockedAt: data.unlockedAt || new Date().toISOString(),
    metadata: data.metadata || {},
  }
}
