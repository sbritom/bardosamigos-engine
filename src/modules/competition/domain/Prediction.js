import { PREDICTION_STATUS } from '../constants'
import { createCompetitionId } from '../utils/idGenerator'

export function createPrediction(data = {}) {
  return {
    id: data.id || createCompetitionId('prediction'),
    matchId: data.matchId || '',
    userId: data.userId || '',
    prediction: {
      homeScore: data.prediction?.homeScore ?? null,
      awayScore: data.prediction?.awayScore ?? null,
      winnerId: data.prediction?.winnerId ?? null,
      position: data.prediction?.position ?? null,
      raw: data.prediction?.raw || {},
    },
    status: data.status || PREDICTION_STATUS.CONFIRMED,
    points: Number(data.points || 0),
    createdAt: data.createdAt || new Date().toISOString(),
    metadata: data.metadata || {},
  }
}
