import { PREDICTION_STATUS } from '../constants'
import { MatchValidator } from './MatchValidator'
import { nowUtcIso } from '../../../core/time'

function hasValidScoreValue(value) {
  return value == null || (Number.isInteger(Number(value)) && Number(value) >= 0)
}

export const PredictionValidator = {
  validate({ prediction, match, user, existingPredictions = [], now = nowUtcIso() } = {}) {
    const errors = []

    if (!user?.id && !user?.userId) {
      errors.push('Eligible user is required.')
    }

    if (user?.blocked === true) {
      errors.push('User is not eligible for predictions.')
    }

    if (!prediction?.matchId) {
      errors.push('Prediction matchId is required.')
    }

    if (!hasValidScoreValue(prediction?.prediction?.homeScore)) {
      errors.push('Prediction homeScore must be a non-negative integer.')
    }

    if (!hasValidScoreValue(prediction?.prediction?.awayScore)) {
      errors.push('Prediction awayScore must be a non-negative integer.')
    }

    if (!Object.values(PREDICTION_STATUS).includes(prediction?.status)) {
      errors.push('Prediction status is invalid.')
    }

    if (match && !MatchValidator.isPredictionOpen(match, now)) {
      errors.push('Prediction window is closed for this match.')
    }

    const duplicated = existingPredictions.some(
      (item) => item.userId === prediction?.userId && item.matchId === prediction?.matchId,
    )

    if (duplicated) {
      errors.push('User already has a prediction for this match.')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  },
}
