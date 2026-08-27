import { calculateCompetitionV1Score, COMPETITION_V1_SCORING_RULES } from '../scoring/competitionScoringRules'

export function createCompetitionScoringService(rules = COMPETITION_V1_SCORING_RULES) {
  return {
    rules,
    calculate(predictionScore, officialScore) {
      return calculateCompetitionV1Score(predictionScore, officialScore, rules)
    },
  }
}

export const CompetitionScoringService = createCompetitionScoringService()
