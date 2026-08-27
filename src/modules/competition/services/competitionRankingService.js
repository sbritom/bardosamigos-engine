import { toCamelCase } from '../../../core/database'

function createRankingRows(predictions = []) {
  const map = new Map()

  predictions.forEach((prediction) => {
    const item = map.get(prediction.profileId) || {
      profileId: prediction.profileId,
      points: 0,
      hits: 0,
      exactScores: 0,
      predictions: 0,
    }

    item.points += Number(prediction.points || 0)
    item.hits += prediction.metadata?.resultHit ? 1 : 0
    item.exactScores += prediction.metadata?.exactScore ? 1 : 0
    item.predictions += 1
    map.set(prediction.profileId, item)
  })

  return Array.from(map.values())
    .sort((a, b) => b.points - a.points || b.exactScores - a.exactScores || b.hits - a.hits)
    .map((item, index) => ({ ...item, position: index + 1 }))
}

async function saveRanking(client, { competitionId, seasonId, scope, predictions }) {
  const rankingRows = createRankingRows(predictions)
  const { data: ranking, error } = await client
    .from('competition_rankings')
    .insert({ competition_id: competitionId, season_id: seasonId, scope, metadata: { generatedBy: 'competition-v1' } })
    .select('*')
    .single()

  if (error) return { data: null, error }

  if (rankingRows.length > 0) {
    const { error: itemsError } = await client.from('competition_ranking_items').insert(
      rankingRows.map((item) => ({
        ranking_id: ranking.id,
        profile_id: item.profileId,
        position: item.position,
        points: item.points,
        exact_hits: item.exactScores,
        result_hits: item.hits,
        predictions_count: item.predictions,
      })),
    )

    if (itemsError) return { data: null, error: itemsError }
  }

  return { data: toCamelCase({ ...ranking, items: rankingRows }), error: null }
}

export async function recalculateCompetitionRankings(client, { competitionId, seasonId }) {
  const { data, error } = await client
    .from('competition_predictions')
    .select('*, competition_matches(*, competition_rounds(*, competition_stages(*, competition_seasons(*, competitions(*)))))')
    .eq('status', 'scored')
    .is('deleted_at', null)

  if (error) return { data: null, error }

  const predictions = toCamelCase(data || [])
  const general = await saveRanking(client, { competitionId, seasonId: null, scope: 'general', predictions })
  if (general.error) return general

  const byCompetition = await saveRanking(client, {
    competitionId,
    seasonId: null,
    scope: 'competition',
    predictions: predictions.filter(
      (prediction) => prediction.competitionMatches?.competitionRounds?.competitionStages?.competitionSeasons?.competitionId === competitionId,
    ),
  })
  if (byCompetition.error) return byCompetition

  const bySeason = await saveRanking(client, {
    competitionId,
    seasonId,
    scope: 'season',
    predictions: predictions.filter(
      (prediction) => prediction.competitionMatches?.competitionRounds?.competitionStages?.seasonId === seasonId,
    ),
  })

  return {
    data: {
      general: general.data,
      competition: byCompetition.data,
      season: bySeason.data,
    },
    error: bySeason.error,
  }
}
