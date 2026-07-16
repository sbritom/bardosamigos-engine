import { getAdminAccessToken } from '../../../../core/auth/adminAuthService.js'
import { normalizeEvent } from '../../services/eventsService.js'

const EVENTS_ADMIN_ENDPOINT = '/api/events/admin'

function getErrorMessage(payload, fallback) {
  if (payload && typeof payload.error === 'string') return payload.error
  return fallback
}

export async function listAdminEvents() {
  const token = await getAdminAccessToken()

  if (!token) {
    throw new Error('Entre com uma conta administradora para gerenciar eventos.')
  }

  const response = await fetch(EVENTS_ADMIN_ENDPOINT, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok || payload?.ok === false) {
    throw new Error(getErrorMessage(payload, 'Nao foi possivel carregar os eventos.'))
  }

  return (payload?.data || []).map(normalizeEvent)
}

export async function createAdminEvent(eventPayload) {
  const token = await getAdminAccessToken()

  if (!token) {
    throw new Error('Entre com uma conta administradora para criar eventos.')
  }

  const response = await fetch(EVENTS_ADMIN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok || payload?.ok === false) {
    throw new Error(getErrorMessage(payload, 'Nao foi possivel criar o evento.'))
  }

  return normalizeEvent(payload?.data || {})
}

export async function updateAdminEvent(eventPayload) {
  const token = await getAdminAccessToken()

  if (!token) {
    throw new Error('Entre com uma conta administradora para editar eventos.')
  }

  const response = await fetch(EVENTS_ADMIN_ENDPOINT, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok || payload?.ok === false) {
    throw new Error(getErrorMessage(payload, 'Nao foi possivel atualizar o evento.'))
  }

  return normalizeEvent(payload?.data || {})
}
