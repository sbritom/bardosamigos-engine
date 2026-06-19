import { isExactResult, resolveMatchWinner } from './matchResultResolver'

export function analyzePrediction(prediction, match) {
  const predictedWinner = resolveMatchWinner(prediction?.prediction)
  const actualWinner = resolveMatchWinner(match?.result)

  return {
    exactResult: isExactResult(prediction?.prediction, match?.result),
    resultHit: Boolean(predictedWinner && actualWinner && predictedWinner === actualWinner),
    predictedWinner,
    actualWinner,
  }
}
