import { PREDICTION_STATUS } from '../constants'
import { createPrediction } from '../domain/Prediction'
import { PredictionValidator } from '../validators/PredictionValidator'
import { nowUtcIso } from '../../../core/time'

export function createPredictionService(options = {}) {
  const repository = options.repository

  return {
    createPrediction({ match, user, prediction: predictionInput, now = nowUtcIso() } = {}) {
      const prediction = createPrediction({
        ...predictionInput,
        matchId: match?.id || predictionInput?.matchId,
        userId: user?.id || user?.userId || predictionInput?.userId,
      })
      const existingPredictions = repository?.list(
        'predictions',
        (item) => item.matchId === prediction.matchId,
      ) || []
      const validation = PredictionValidator.validate({
        prediction,
        match,
        user,
        existingPredictions,
        now,
      })

      if (!validation.valid) {
        return {
          ok: false,
          prediction: {
            ...prediction,
            status: PREDICTION_STATUS.LOCKED,
          },
          errors: validation.errors,
        }
      }

      return {
        ok: true,
        prediction: repository?.save('predictions', prediction) || prediction,
        errors: [],
      }
    },

    listByMatch(matchId) {
      return repository?.list('predictions', (prediction) => prediction.matchId === matchId) || []
    },

    listByUser(userId) {
      return repository?.list('predictions', (prediction) => prediction.userId === userId) || []
    },
  }
}
