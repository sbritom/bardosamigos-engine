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
