export const COMPETITION_V1_SCORING_RULES = Object.freeze({
  WINNER_HIT: 10,
  DRAW_HIT: 10,
  GOAL_DIFFERENCE_HIT: 20,
  EXACT_SCORE_HIT: 100,
})

export function resolveScoreOutcome(score = {}) {
  const home = Number(score.homeScore)
  const away = Number(score.awayScore)

  if (!Number.isInteger(home) || !Number.isInteger(away)) {
    return null
  }

  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}

export function calculateCompetitionV1Score(predictionScore = {}, officialScore = {}, rules = COMPETITION_V1_SCORING_RULES) {
  const predictedOutcome = resolveScoreOutcome(predictionScore)
  const officialOutcome = resolveScoreOutcome(officialScore)

  if (!predictedOutcome || !officialOutcome) {
    return { points: 0, hits: 0, exactScore: false, resultHit: false, goalDifferenceHit: false }
  }

  const exactScore =
    Number(predictionScore.homeScore) === Number(officialScore.homeScore) &&
    Number(predictionScore.awayScore) === Number(officialScore.awayScore)
  const resultHit = predictedOutcome === officialOutcome
  const goalDifferenceHit =
    Number(predictionScore.homeScore) - Number(predictionScore.awayScore) ===
    Number(officialScore.homeScore) - Number(officialScore.awayScore)

  let points = 0
  if (exactScore) points += rules.EXACT_SCORE_HIT
  else {
    if (resultHit && officialOutcome === 'draw') points += rules.DRAW_HIT
    else if (resultHit) points += rules.WINNER_HIT
    if (goalDifferenceHit) points += rules.GOAL_DIFFERENCE_HIT
  }

  return {
    points,
    hits: resultHit ? 1 : 0,
    exactScore,
    resultHit,
    goalDifferenceHit,
    situation: resultHit ? 'Acertou' : 'Errou',
  }
}
