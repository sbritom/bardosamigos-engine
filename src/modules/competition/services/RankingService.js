import { createRanking } from '../domain/Ranking'
import { calculateRankingItems } from '../utils/rankingCalculator'

export function createRankingService(options = {}) {
  const repository = options.repository

  return {
    generateRanking({ competitionId, seasonId, predictions = [] } = {}) {
      return createRanking({
        competitionId,
        seasonId,
        items: calculateRankingItems(predictions),
      })
    },

    saveRanking(ranking) {
      return repository?.save('rankings', ranking) || ranking
    },

    listRankings(competitionId) {
      return repository?.list(
        'rankings',
        (ranking) => !competitionId || ranking.competitionId === competitionId,
      ) || []
    },
  }
}
