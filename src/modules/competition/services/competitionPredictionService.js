import { getSupabaseClient, toCamelCase, toSnakeCase } from '../../../core/database'
import { getUtcTimestamp, isFinishedStatus, nowUtcIso } from '../../../core/time'
import { listCurrentFootballMatches } from './footballMatchQueryService'

function configError() {
  return new Error('Supabase nao esta configurado.')
}

async function getUser(client) {
  const { data, error } = await client.auth.getUser()
  return { user: data?.user || null, error }
}

function isClosed(match) {
  return isFinishedStatus(match?.standardStatus || match?.standard_status || match?.status)
    || getUtcTimestamp(match?.startsAt || match?.starts_at || match?.utc_date) <= getUtcTimestamp(nowUtcIso())
}

function validateScore(score = {}, match = {}) {
  const homeScore = Number(score.homeScore)
  const awayScore = Number(score.awayScore)

  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
    return 'Informe placares inteiros e nao negativos.'
  }

  if (match.metadata?.allowDraw === false && homeScore === awayScore) {
    return 'Esta competicao nao permite empate.'
  }

  return null
}

export async function listCompetitionMatchesWithPredictions() {
  const result = await listCurrentFootballMatches({ includePredictions: true })

  return {
    data: result.data?.matches || [],
    error: result.error || null,
    authenticated: Boolean(result.data?.authenticated),
  }
}

export async function listMyCompetitionPredictions() {
  const client = getSupabaseClient()
  if (!client) return { data: [], error: configError(), authenticated: false }

  const { user } = await getUser(client)
  if (!user) return { data: [], error: null, authenticated: false }

  const { data, error } = await client
    .from('competition_predictions')
    .select('*, competition_matches(*, competition_rounds(*, competition_stages(*, competition_seasons(*, competitions(*)))))')
    .eq('profile_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return { data: toCamelCase(data || []), error, authenticated: true }
}

export async function saveCompetitionPrediction(match, score, existingPrediction = null) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: configError(), authenticated: false }

  const { user } = await getUser(client)
  if (!user) return { data: null, error: new Error('Entre para fazer seu palpite.'), authenticated: false }
  if (isClosed(match) || existingPrediction?.lockedAt) {
    return { data: null, error: new Error('Palpites encerrados para este jogo.'), authenticated: true }
  }

  const scoreError = validateScore(score, match)
  if (scoreError) return { data: null, error: new Error(scoreError), authenticated: true }

  if (!existingPrediction) {
    const { data: duplicate } = await client
      .from('competition_predictions')
      .select('id')
      .eq('match_id', match.id)
      .eq('profile_id', user.id)
      .is('deleted_at', null)
      .maybeSingle()

    if (duplicate) return { data: null, error: new Error('Voce ja possui um palpite para este jogo.'), authenticated: true }
  }

  const payload = toSnakeCase({
    matchId: match.id,
    profileId: user.id,
    prediction: {
      homeScore: Number(score.homeScore),
      awayScore: Number(score.awayScore),
    },
    status: 'confirmed',
  })

  const request = existingPrediction
    ? client.from('competition_predictions').update({ prediction: payload.prediction }).eq('id', existingPrediction.id)
    : client.from('competition_predictions').insert(payload)

  const { data, error } = await request.select('*').single()
  return { data: data ? toCamelCase(data) : null, error, authenticated: true }
}

export async function removeCompetitionPrediction(prediction, match) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: configError(), authenticated: false }

  const { user } = await getUser(client)
  if (!user) return { data: null, error: new Error('Entre para excluir seu palpite.'), authenticated: false }
  if (prediction.profileId !== user.id) return { data: null, error: new Error('Este palpite nao pertence ao usuario atual.'), authenticated: true }
  if (isClosed(match) || prediction.lockedAt) return { data: null, error: new Error('Este palpite ja esta fechado.'), authenticated: true }

  const { data, error } = await client
    .from('competition_predictions')
    .update({ deleted_at: nowUtcIso(), status: 'canceled' })
    .eq('id', prediction.id)
    .select('*')
    .single()

  return { data: data ? toCamelCase(data) : null, error, authenticated: true }
}

export async function listLatestCompetitionRanking(scope = 'general') {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: configError() }

  const { data: ranking, error } = await client
    .from('competition_rankings')
    .select('*, competition_ranking_items(*, profiles(display_name, username, avatar_url))')
    .eq('scope', scope)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return { data: ranking ? toCamelCase(ranking) : null, error }
}
