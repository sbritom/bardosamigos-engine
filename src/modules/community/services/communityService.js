import { getSupabaseClient } from '../../../core/database/client/supabaseClient.js'
import { listPublishedEvents } from '../../events/services/eventsService'

const COMMUNITY_ENDPOINT = '/api/community/overview'
const WALL_TOKEN_STORAGE_KEY = 'imortal0800.community.wall-edit-tokens'
const BIRTHDAY_TOKEN_STORAGE_KEY = 'imortal0800.community.birthday-edit-tokens'

async function parseResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload?.error || fallbackMessage)
    error.status = response.status
    throw error
  }
  return payload?.data ?? payload
}

async function getOptionalAccessToken() {
  const client = getSupabaseClient()
  if (!client) return ''
  const { data } = await client.auth.getSession()
  return data?.session?.access_token || ''
}

function getStoredMap(key) {
  if (typeof window === 'undefined') return {}
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function saveStoredToken(key, id, token) {
  if (typeof window === 'undefined' || !id || !token) return
  try {
    const current = getStoredMap(key)
    current[id] = token
    window.localStorage.setItem(key, JSON.stringify(current))
  } catch {}
}

function removeStoredToken(key, id) {
  if (typeof window === 'undefined' || !id) return
  try {
    const current = getStoredMap(key)
    delete current[id]
    window.localStorage.setItem(key, JSON.stringify(current))
  } catch {}
}

function getStoredToken(key, id) {
  return getStoredMap(key)[id] || ''
}

function decorateBirthday(item = {}) {
  return {
    ...item,
    canEdit: Boolean(item.canEdit || getStoredToken(BIRTHDAY_TOKEN_STORAGE_KEY, item.id)),
  }
}

async function loadOverview() {
  const response = await fetch(COMMUNITY_ENDPOINT, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  return parseResponse(response, 'Não foi possível carregar a comunidade agora.')
}

async function loadWall() {
  const token = await getOptionalAccessToken()
  const headers = { Accept: 'application/json' }
  if (token) headers.Authorization = 'Bearer ' + token

  const response = await fetch(COMMUNITY_ENDPOINT + '?section=wall', {
    headers,
    cache: 'no-store',
  })

  const data = await parseResponse(response, 'Não foi possível carregar o mural agora.')
  const rows = Array.isArray(data) ? data : []
  return rows.map((post) => ({
    ...post,
    canEdit: Boolean(post.canEdit || getStoredToken(WALL_TOKEN_STORAGE_KEY, post.id)),
  }))
}

export async function submitCommunityWallPost({ body, authorName }) {
  const token = await getOptionalAccessToken()
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' }
  if (token) headers.Authorization = 'Bearer ' + token

  const response = await fetch(COMMUNITY_ENDPOINT + '?section=wall', {
    method: 'POST',
    headers,
    body: JSON.stringify({ body, authorName }),
  })

  const data = await parseResponse(response, 'Não foi possível publicar o recado agora.')
  if (data?.post?.id && data?.editToken) {
    saveStoredToken(WALL_TOKEN_STORAGE_KEY, data.post.id, data.editToken)
  }
  return data?.post || data
}

export async function updateCommunityWallPost({ id, body }) {
  const token = await getOptionalAccessToken()
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' }
  if (token) headers.Authorization = 'Bearer ' + token

  const response = await fetch(COMMUNITY_ENDPOINT + '?section=wall', {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      id,
      body,
      editToken: getStoredToken(WALL_TOKEN_STORAGE_KEY, id),
    }),
  })
  return parseResponse(response, 'Não foi possível editar o recado agora.')
}

export async function deleteCommunityWallPost(id) {
  const token = await getOptionalAccessToken()
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' }
  if (token) headers.Authorization = 'Bearer ' + token

  const response = await fetch(COMMUNITY_ENDPOINT + '?section=wall', {
    method: 'DELETE',
    headers,
    body: JSON.stringify({
      id,
      editToken: getStoredToken(WALL_TOKEN_STORAGE_KEY, id),
    }),
  })

  const data = await parseResponse(response, 'Não foi possível excluir o recado agora.')
  removeStoredToken(WALL_TOKEN_STORAGE_KEY, id)
  return data
}

export async function submitCommunityBirthday({ displayName, day, month }) {
  const response = await fetch(COMMUNITY_ENDPOINT + '?section=birthday', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName, day, month }),
  })

  const data = await parseResponse(response, 'Não foi possível cadastrar o aniversário agora.')
  if (data?.birthday?.id && data?.editToken) {
    saveStoredToken(BIRTHDAY_TOKEN_STORAGE_KEY, data.birthday.id, data.editToken)
  }
  return data?.birthday || data
}

export async function updateCommunityBirthday({ id, displayName, day, month }) {
  const response = await fetch(COMMUNITY_ENDPOINT + '?section=birthday', {
    method: 'PATCH',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id,
      displayName,
      day,
      month,
      editToken: getStoredToken(BIRTHDAY_TOKEN_STORAGE_KEY, id),
    }),
  })

  return parseResponse(response, 'Não foi possível atualizar o aniversário agora.')
}

export async function deleteCommunityBirthday(id) {
  const response = await fetch(COMMUNITY_ENDPOINT + '?section=birthday', {
    method: 'DELETE',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id,
      editToken: getStoredToken(BIRTHDAY_TOKEN_STORAGE_KEY, id),
    }),
  })

  const data = await parseResponse(response, 'Não foi possível excluir o aniversário agora.')
  removeStoredToken(BIRTHDAY_TOKEN_STORAGE_KEY, id)
  return data
}

export async function loadCommunityModeration() {
  const token = await getOptionalAccessToken()
  if (!token) throw new Error('Sessão administrativa obrigatória.')

  const response = await fetch(COMMUNITY_ENDPOINT + '?section=moderation', {
    headers: { Accept: 'application/json', Authorization: 'Bearer ' + token },
    cache: 'no-store',
  })
  return parseResponse(response, 'Não foi possível carregar a moderação da comunidade.')
}

export async function moderateCommunityItem({ resource, id, action }) {
  const token = await getOptionalAccessToken()
  if (!token) throw new Error('Sessão administrativa obrigatória.')

  const response = await fetch(COMMUNITY_ENDPOINT + '?section=moderation', {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify({ resource, id, action }),
  })
  return parseResponse(response, 'Não foi possível moderar este item.')
}

export async function deleteCommunityModerationItem({ resource, id }) {
  const token = await getOptionalAccessToken()
  if (!token) throw new Error('Sessão administrativa obrigatória.')

  const response = await fetch(COMMUNITY_ENDPOINT + '?section=moderation', {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify({ resource, id }),
  })
  return parseResponse(response, 'Não foi possível excluir este item.')
}

export async function loadCommunityPageData() {
  const [overviewResult, eventsResult, wallResult] = await Promise.allSettled([
    loadOverview(),
    listPublishedEvents({ limit: 6 }),
    loadWall(),
  ])

  const overview = overviewResult.status === 'fulfilled' ? overviewResult.value : {}
  const events = eventsResult.status === 'fulfilled' ? (eventsResult.value?.data || []) : []
  const wall = wallResult.status === 'fulfilled' ? wallResult.value : []

  const errors = []
  if (overviewResult.status === 'rejected') errors.push(overviewResult.reason)
  if (eventsResult.status === 'rejected' || eventsResult.value?.error) {
    errors.push(eventsResult.reason || eventsResult.value.error)
  }
  if (wallResult.status === 'rejected') errors.push(wallResult.reason)

  return {
    events,
    birthdays: Array.isArray(overview.birthdays) ? overview.birthdays.map(decorateBirthday) : [],
    birthdaysUpcoming: Array.isArray(overview.birthdaysUpcoming)
      ? overview.birthdaysUpcoming.map(decorateBirthday)
      : [],
    ranking: overview.ranking || null,
    achievements: Array.isArray(overview.achievements) ? overview.achievements : [],
    xat: overview.xat || { connected: false, onlineCount: null },
    wall,
    errors,
  }
}
