import { getSupabaseClient, toCamelCase, toSnakeCase } from '../../../../core/database'
import { analyzePrediction } from '../../utils/predictionAnalyzer'
import { calculatePredictionScore } from '../../utils/scoreCalculator'

function getClient() {
  return getSupabaseClient()
}

function authError() {
  return new Error('Usuario nao autenticado. Entre para fazer palpites.')
}

function configError() {
  return new Error('Supabase nao esta configurado.')
}

function validateScore({ homeScore, awayScore }, { allowDraw = true } = {}) {
  const home = Number(homeScore)
  const away = Number(awayScore)

  if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
    return 'Placares devem ser numeros inteiros e nao negativos.'
  }

  if (!allowDraw && home === away) {
    return 'Esta competicao nao permite palpite de empate.'
  }

  return null
}

function isMatchClosed(match) {
  return new Date(match.startsAt || match.starts_at).getTime() <= Date.now()
}

async function getUser(client) {
  const { data, error } = await client.auth.getUser()
  return { user: data?.user || null, error }
}

export async function listAvailableMatches() {
  const client = getClient()
  if (!client) return { data: [], error: configError() }

  const { user } = await getUser(client)
  const { data, error } = await client
    .from('competition_matches')
    .select('*, competition_rounds(*, competition_stages(*, competition_seasons(*, competitions(*))))')
    .is('deleted_at', null)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })

  if (error) return { data: [], error }

  let predictions = []
  if (user) {
    const { data: predictionRows } = await client
      .from('competition_predictions')
      .select('*')
      .eq('profile_id', user.id)
      .is('deleted_at', null)

    predictions = predictionRows || []
  }

  return {
    data: toCamelCase(data || []).map((match) => ({
      ...match,
      myPrediction: toCamelCase(predictions.find((prediction) => prediction.match_id === match.id) || null),
    })),
    error: null,
  }
}

export async function listMyPredictions() {
  const client = getClient()
  if (!client) return { data: [], error: configError() }

  const { user, error: userError } = await getUser(client)
  if (userError || !user) return { data: [], error: authError() }

  const { data, error } = await client
    .from('competition_predictions')
    .select('*, competition_matches(*, competition_rounds(*, competition_stages(*, competition_seasons(*, competitions(*)))))')
    .eq('profile_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return { data: toCamelCase(data || []), error }
}

export async function createPrediction(match, score) {
  const client = getClient()
  if (!client) return { data: null, error: configError() }

  const { user, error: userError } = await getUser(client)
  if (userError || !user) return { data: null, error: authError() }
  if (isMatchClosed(match)) return { data: null, error: new Error('Palpites encerrados para este jogo.') }

  const allowDraw = match.metadata?.allowDraw !== false
  const scoreError = validateScore(score, { allowDraw })
  if (scoreError) return { data: null, error: new Error(scoreError) }

  const { data: existing } = await client
    .from('competition_predictions')
    .select('id')
    .eq('match_id', match.id)
    .eq('profile_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (existing) return { data: null, error: new Error('Voce ja possui um palpite para este jogo.') }

  const payload = {
    matchId: match.id,
    profileId: user.id,
    prediction: {
      homeScore: Number(score.homeScore),
      awayScore: Number(score.awayScore),
    },
    status: 'confirmed',
    points: 0,
  }

  const { data, error } = await client.from('competition_predictions').insert(toSnakeCase(payload)).select('*').single()
  return { data: data ? toCamelCase(data) : null, error }
}

export async function updatePrediction(prediction, match, score) {
  const client = getClient()
  if (!client) return { data: null, error: configError() }

  const { user, error: userError } = await getUser(client)
  if (userError || !user) return { data: null, error: authError() }
  if (prediction.profileId !== user.id) return { data: null, error: new Error('Este palpite nao pertence ao usuario atual.') }
  if (prediction.lockedAt || isMatchClosed(match)) return { data: null, error: new Error('Este palpite ja esta fechado.') }

  const scoreError = validateScore(score, { allowDraw: match.metadata?.allowDraw !== false })
  if (scoreError) return { data: null, error: new Error(scoreError) }

  const { data, error } = await client
    .from('competition_predictions')
    .update(toSnakeCase({ prediction: { homeScore: Number(score.homeScore), awayScore: Number(score.awayScore) } }))
    .eq('id', prediction.id)
    .select('*')
    .single()

  return { data: data ? toCamelCase(data) : null, error }
}

export async function deletePrediction(prediction, match) {
  const client = getClient()
  if (!client) return { data: null, error: configError() }

  const { user, error: userError } = await getUser(client)
  if (userError || !user) return { data: null, error: authError() }
  if (prediction.profileId !== user.id) return { data: null, error: new Error('Este palpite nao pertence ao usuario atual.') }
  if (prediction.lockedAt || isMatchClosed(match)) return { data: null, error: new Error('Este palpite ja esta fechado.') }

  const { data, error } = await client
    .from('competition_predictions')
    .update({ deleted_at: new Date().toISOString(), status: 'canceled' })
    .eq('id', prediction.id)
    .select('*')
    .single()

  return { data: data ? toCamelCase(data) : null, error }
}

export async function publishOfficialResultAndRecalculateRanking(matchId, officialResult) {
  const client = getClient()
  if (!client) return { data: null, error: configError() }

  const result = toSnakeCase({
    result: officialResult,
    status: 'finished',
  })
  const { data: match, error: matchError } = await client
    .from('competition_matches')
    .update(result)
    .eq('id', matchId)
    .select('*, competition_rounds(*, competition_stages(*, competition_seasons(*, competitions(*))))')
    .single()

  if (matchError) return { data: null, error: matchError }

  const { data: predictionRows, error: predictionsError } = await client
    .from('competition_predictions')
    .select('*')
    .eq('match_id', matchId)
    .is('deleted_at', null)

  if (predictionsError) return { data: null, error: predictionsError }

  const normalizedMatch = toCamelCase(match)
  const scoredPredictions = []

  for (const row of predictionRows || []) {
    const prediction = toCamelCase(row)
    const points = calculatePredictionScore(prediction, normalizedMatch)
    const analysis = analyzePrediction(prediction, normalizedMatch)
    const { data: updated } = await client
      .from('competition_predictions')
      .update({
        status: 'scored',
        points,
        locked_at: new Date().toISOString(),
        scored_at: new Date().toISOString(),
        metadata: { ...(row.metadata || {}), ...analysis, xpPrepared: true, barcoinsPrepared: true, medalsPrepared: true },
      })
      .eq('id', row.id)
      .select('*')
      .single()

    if (updated) scoredPredictions.push(toCamelCase(updated))
  }

  await client.from('audit_logs').insert({
    actor_type: 'system',
    action: 'MATCH_RESULT_PUBLISHED',
    entity_table: 'competition_matches',
    entity_id: matchId,
    after_data: { result: officialResult, scoredPredictions: scoredPredictions.length },
  })

  return {
    data: {
      match: normalizedMatch,
      scoredPredictions,
      integrationsPrepared: ['xp', 'barcoins', 'medals'],
    },
    error: null,
  }
}
