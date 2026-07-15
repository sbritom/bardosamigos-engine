import { getSupabaseClient } from '../database/client/supabaseClient.js'

export const ADMIN_AUTH_DOMAIN = 'auth.bardosamigos.local'
export const ADMIN_USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/
export const ADMIN_ROLES = Object.freeze({
  ADMIN: 'admin',
  LOCUTOR: 'locutor',
})

export const ADMIN_AUTH_ERRORS = Object.freeze({
  INVALID_USERNAME: 'Informe um nome de usuário válido.',
  INVALID_LOGIN: 'Usuário ou senha inválidos.',
  SUPABASE_NOT_CONFIGURED: 'Supabase nao configurado.',
  NO_SESSION: 'Entre para acessar o painel administrativo.',
  NOT_ALLOWED: 'Acesso nao autorizado para este usuario.',
})

export function normalizeUsername(username) {
  return String(username || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function validateUsername(username) {
  const rawUsername = String(username || '').trim()
  const normalized = normalizeUsername(rawUsername)

  if (!rawUsername || rawUsername.includes('@') || /\s/.test(rawUsername) || !ADMIN_USERNAME_PATTERN.test(normalized)) {
    throw new Error(ADMIN_AUTH_ERRORS.INVALID_USERNAME)
  }

  return normalized
}

export function usernameToAuthEmail(username) {
  return `${validateUsername(username)}@${ADMIN_AUTH_DOMAIN}`
}

function getRoleFromUser(user, { allowLegacyUserMetadata = false } = {}) {
  return user?.app_metadata?.role || (allowLegacyUserMetadata ? user?.user_metadata?.role : undefined) || ''
}

export function hasAllowedAdminRole(user, allowedRoles = [], options = {}) {
  const roles = new Set(allowedRoles)
  const role = getRoleFromUser(user, options)

  return roles.has(role)
    || user?.app_metadata?.is_admin === true
    || (options.allowLegacyUserMetadata && user?.user_metadata?.is_admin === true)
}

export async function getAdminSession() {
  const client = getSupabaseClient()
  if (!client) {
    return { session: null, user: null, error: new Error(ADMIN_AUTH_ERRORS.SUPABASE_NOT_CONFIGURED) }
  }

  const { data, error } = await client.auth.getSession()
  const session = data?.session || null

  return {
    session,
    user: session?.user || null,
    error,
  }
}

export async function getAdminAccessToken() {
  const { session } = await getAdminSession()
  return session?.access_token || ''
}

export async function getAdminAccess({ allowedRoles = [ADMIN_ROLES.ADMIN], allowLegacyUserMetadata = false, noSessionReason = ADMIN_AUTH_ERRORS.NO_SESSION } = {}) {
  const { session, user, error } = await getAdminSession()

  if (error?.message === ADMIN_AUTH_ERRORS.SUPABASE_NOT_CONFIGURED) {
    return { allowed: false, hasSession: false, reason: ADMIN_AUTH_ERRORS.SUPABASE_NOT_CONFIGURED, user: null }
  }

  if (error || !session?.access_token) {
    return { allowed: false, hasSession: false, reason: noSessionReason, user: null }
  }

  const allowed = hasAllowedAdminRole(user, allowedRoles, { allowLegacyUserMetadata })

  return {
    allowed,
    hasSession: true,
    reason: allowed ? '' : ADMIN_AUTH_ERRORS.NOT_ALLOWED,
    user,
  }
}

export async function signInAdminWithUsername({ username, password, allowedRoles = [ADMIN_ROLES.ADMIN], allowLegacyUserMetadata = false } = {}) {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error(ADMIN_AUTH_ERRORS.SUPABASE_NOT_CONFIGURED)
  }

  const email = usernameToAuthEmail(username)
  const { error } = await client.auth.signInWithPassword({
    email,
    password: String(password || ''),
  })

  if (error) {
    throw new Error(ADMIN_AUTH_ERRORS.INVALID_LOGIN)
  }

  return getAdminAccess({ allowedRoles, allowLegacyUserMetadata })
}

export async function signOutAdmin() {
  const client = getSupabaseClient()
  if (!client) return

  await client.auth.signOut()
}
