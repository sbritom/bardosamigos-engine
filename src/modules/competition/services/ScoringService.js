import { DEFAULT_SCORING_RULES } from '../constants'
import { createScoreRule } from '../domain/ScoreRule'
import { analyzePrediction } from '../utils/predictionAnalyzer'
import { calculatePredictionScore } from '../utils/scoreCalculator'

export function createScoringService(options = {}) {
  const repository = options.repository
  const rules = options.rules || DEFAULT_SCORING_RULES

  return {
    createRule(data = {}) {
      const rule = createScoreRule(data)
      return repository?.save('scoreRules', rule) || rule
    },

    listRules(competitionId) {
      return repository?.list(
        'scoreRules',
        (rule) => !competitionId || rule.competitionId === competitionId,
      ) || []
    },

    calculate(prediction, match) {
      return calculatePredictionScore(prediction, match, rules)
    },

    scorePrediction(prediction, match) {
      const analysis = analyzePrediction(prediction, match)
      const points = calculatePredictionScore(prediction, match, rules)

      return {
        ...prediction,
        points,
        status: 'scored',
        metadata: {
          ...prediction.metadata,
          ...analysis,
        },
      }
    },
  }
}
