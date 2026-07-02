import { getSupabaseClient, toCamelCase } from '../../../core/database'
import { nowUtcIso } from '../../../core/time'
import { calculateCompetitionV1Score } from '../scoring/competitionScoringRules'
import { prepareCompetitionReward } from './competitionRewardService'
import { recalculateCompetitionRankings } from './competitionRankingService'

function configError() {
  return new Error('Supabase nao esta configurado.')
}

export async function closeMatchWithOfficialResult({ matchId, homeScore, awayScore, notes = '' }) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: configError() }

  const officialResult = {
    homeScore: Number(homeScore),
    awayScore: Number(awayScore),
    notes,
  }

  const { data: matchRow, error: matchError } = await client
    .from('competition_matches')
    .update({ result: officialResult, status: 'finished', standard_status: 'FINALIZADO', metadata: { closedAt: nowUtcIso(), notes } })
    .eq('id', matchId)
    .select('*, competition_rounds(*, competition_stages(*, competition_seasons(*, competitions(*))))')
    .single()

  if (matchError) return { data: null, error: matchError }

  const match = toCamelCase(matchRow)
  const { data: predictionRows, error: predictionError } = await client
    .from('competition_predictions')
    .select('*')
    .eq('match_id', matchId)
    .is('deleted_at', null)

  if (predictionError) return { data: null, error: predictionError }

  const scoredPredictions = []
  const preparedRewards = []

  for (const row of predictionRows || []) {
    const prediction = toCamelCase(row)
    const score = calculateCompetitionV1Score(prediction.prediction, officialResult)
    const reward = prepareCompetitionReward({
      profileId: prediction.profileId,
      predictionId: prediction.id,
      points: score.points,
      reason: 'competition_prediction_scored',
    })

    const { data: updated } = await client
      .from('competition_predictions')
      .update({
        status: 'scored',
        points: score.points,
        locked_at: row.locked_at || nowUtcIso(),
        scored_at: nowUtcIso(),
        metadata: {
          ...(row.metadata || {}),
          ...score,
          rewardPrepared: reward,
        },
      })
      .eq('id', row.id)
      .select('*')
      .single()

    if (updated) scoredPredictions.push(toCamelCase(updated))
    preparedRewards.push(reward)
  }

  const season = match.competitionRounds?.competitionStages?.competitionSeasons
  const competitionId = season?.competitionId
  const seasonId = season?.id
  const rankings = await recalculateCompetitionRankings(client, { competitionId, seasonId })

  await client.from('audit_logs').insert({
    actor_type: 'system',
    action: 'COMPETITION_MATCH_CLOSED',
    entity_table: 'competition_matches',
    entity_id: matchId,
    after_data: {
      result: officialResult,
      scoredPredictions: scoredPredictions.length,
      rankingsRecalculated: !rankings.error,
    },
  })

  return {
    data: {
      match,
      scoredPredictions,
      rankings: rankings.data,
      preparedRewards,
    },
    error: rankings.error,
  }
}

export async function listMyScoredPredictions() {
  const client = getSupabaseClient()
  if (!client) return { data: [], error: configError(), authenticated: false }

  const { data: userData } = await client.auth.getUser()
  const user = userData?.user
  if (!user) return { data: [], error: null, authenticated: false }

  const { data, error } = await client
    .from('competition_predictions')
    .select('*, competition_matches(*, competition_rounds(*, competition_stages(*, competition_seasons(*, competitions(*)))))')
    .eq('profile_id', user.id)
    .eq('status', 'scored')
    .is('deleted_at', null)
    .order('scored_at', { ascending: false })

  return { data: toCamelCase(data || []), error, authenticated: true }
}
