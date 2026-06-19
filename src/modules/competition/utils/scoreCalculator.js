import { DEFAULT_SCORING_RULES, SCORING_TYPES } from '../constants'
import { isExactResult, resolveMatchWinner } from './matchResultResolver'

export function calculatePredictionScore(prediction, match, rules = DEFAULT_SCORING_RULES) {
  if (!prediction?.prediction || !match?.result) {
    return 0
  }

  const predictedWinner = resolveMatchWinner(prediction.prediction)
  const actualWinner = resolveMatchWinner(match.result)

  if (!actualWinner || !predictedWinner) {
    return 0
  }

  if (isExactResult(prediction.prediction, match.result)) {
    return rules[SCORING_TYPES.EXACT_SCORE]
  }

  if (predictedWinner === actualWinner && actualWinner === 'draw') {
    return rules[SCORING_TYPES.DRAW]
  }

  if (predictedWinner === actualWinner) {
    return rules[SCORING_TYPES.WINNER]
  }

  if (
    prediction.prediction.position != null &&
    Number(prediction.prediction.position) === Number(match.result.position)
  ) {
    return rules[SCORING_TYPES.POSITION]
  }

  return rules[SCORING_TYPES.PARTICIPATION]
}
