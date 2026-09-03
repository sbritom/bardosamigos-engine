import { getAdminAccessToken } from '../../../core/auth/adminAuthService.js'

const ENDPOINT = '/api/profile?section=admin-users'

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload?.error || `Admin users API ${response.status}`)
    error.status = response.status
    throw error
  }

  return payload?.data ?? payload
}

async function getHeaders(includeBody = false) {
  const token = await getAdminAccessToken()
  if (!token) throw new Error('Entre com uma conta administradora para gerenciar usuários.')

  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...(includeBody ? { 'Content-Type': 'application/json' } : {}),
  }
}

export async function listAdminUsers() {
  const response = await fetch(ENDPOINT, {
    headers: await getHeaders(),
    cache: 'no-store',
  })

  const data = await parseResponse(response)
  return Array.isArray(data) ? data : []
}

export async function changeAdminUserRole(userId, role) {
  const response = await fetch(ENDPOINT, {
    method: 'PATCH',
    headers: await getHeaders(true),
    body: JSON.stringify({ userId, role }),
  })

  return parseResponse(response)
}
