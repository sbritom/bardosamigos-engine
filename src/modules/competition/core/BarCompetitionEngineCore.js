import { createInMemoryCompetitionRepository } from '../repositories/competitionRepository'
import { createCompetitionService } from '../services/CompetitionService'
import { createPredictionService } from '../services/PredictionService'
import { createRankingService } from '../services/RankingService'
import { createRewardService } from '../services/RewardService'
import { createScoringService } from '../services/ScoringService'

export function createBarCompetitionEngineCore(options = {}) {
  const repository = options.repository || createInMemoryCompetitionRepository()
  const scoringService = options.scoringService || createScoringService({ repository })
  const competitionService = options.competitionService || createCompetitionService({ repository })
  const predictionService = options.predictionService || createPredictionService({ repository })
  const rankingService = options.rankingService || createRankingService({ repository })
  const rewardService = options.rewardService || createRewardService({ repository })

  return {
    name: 'Bar Competition Engine Core',
    repository,
    competitionService,
    predictionService,
    rankingService,
    rewardService,
    scoringService,

    getFutureIntegrations() {
      return {
        barAi: { prepared: true, enabled: false },
        barCoins: { prepared: true, enabled: false },
        profile: { prepared: true, enabled: false },
        store: { prepared: true, enabled: false },
        rankings: { prepared: true, enabled: false },
      }
    },

    healthCheck() {
      return {
        ok: true,
        name: 'Bar Competition Engine Core',
        integrationsEnabled: false,
      }
    },
  }
}

export const barCompetitionEngineCore = createBarCompetitionEngineCore()
