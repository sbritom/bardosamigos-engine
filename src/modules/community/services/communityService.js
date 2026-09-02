import { getSupabaseClient } from '../../../core/database/client/supabaseClient.js'
import { listPublishedEvents } from '../../events/services/eventsService'

const COMMUNITY_ENDPOINT = '/api/community/overview'

async function parseResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload?.error || fallbackMessage)
    error.status = response.status
    throw error
  }

  return payload?.data ?? payload
}

async function loadOverview() {
  const response = await fetch(COMMUNITY_ENDPOINT, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  return parseResponse(response, 'Não foi possível carregar a comunidade agora.')
}

async function loadWall() {
  const response = await fetch(COMMUNITY_ENDPOINT + '?section=wall', {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  const data = await parseResponse(response, 'Não foi possível carregar o mural agora.')
  return Array.isArray(data) ? data : []
}

export async function submitCommunityWallPost({ body }) {
  const client = getSupabaseClient()
  if (!client) throw new Error('A autenticação não está configurada neste ambiente.')

  const { data, error } = await client.auth.getSession()
  if (error) throw error

  const token = data?.session?.access_token || ''
  if (!token) throw new Error('Entre na sua conta para publicar um recado.')

  const response = await fetch(COMMUNITY_ENDPOINT + '?section=wall', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify({ body }),
  })

  return parseResponse(response, 'Não foi possível publicar o recado agora.')
}

export async function loadCommunityPageData() {
  const [overviewResult, eventsResult, wallResult] = await Promise.allSettled([
    loadOverview(),
    listPublishedEvents({ limit: 6 }),
    loadWall(),
  ])

  const overview = overviewResult.status === 'fulfilled'
    ? overviewResult.value
    : {}

  const events = eventsResult.status === 'fulfilled'
    ? (eventsResult.value?.data || [])
    : []

  const wall = wallResult.status === 'fulfilled'
    ? wallResult.value
    : []

  const errors = []
  if (overviewResult.status === 'rejected') errors.push(overviewResult.reason)
  if (eventsResult.status === 'rejected' || eventsResult.value?.error) {
    errors.push(eventsResult.reason || eventsResult.value.error)
  }
  if (wallResult.status === 'rejected') errors.push(wallResult.reason)

  return {
    events,
    birthdays: Array.isArray(overview.birthdays) ? overview.birthdays : [],
    ranking: overview.ranking || null,
    achievements: Array.isArray(overview.achievements) ? overview.achievements : [],
    xat: overview.xat || { connected: false, onlineCount: null },
    wall,
    errors,
  }
}
