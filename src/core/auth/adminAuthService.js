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
  INVALID_SESSION: 'Sua sessao administrativa expirou. Entre novamente.',
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

export function getAdminRole(user, { allowLegacyUserMetadata = false } = {}) {
  return user?.app_metadata?.role || (allowLegacyUserMetadata ? user?.user_metadata?.role : undefined) || ''
}

export function hasAllowedAdminRole(user, allowedRoles = [], options = {}) {
  const roles = new Set(allowedRoles)
  const role = getAdminRole(user, options)
  const isAdmin = role === ADMIN_ROLES.ADMIN || user?.app_metadata?.is_admin === true

  if (isAdmin) return roles.has(ADMIN_ROLES.ADMIN) || roles.has(role) || roles.has(ADMIN_ROLES.LOCUTOR)

  return roles.has(role)
    || (options.allowLegacyUserMetadata && user?.user_metadata?.is_admin === true && roles.has(ADMIN_ROLES.ADMIN))
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

export async function getVerifiedAdminSession() {
  const client = getSupabaseClient()
  if (!client) {
    return { session: null, user: null, error: new Error(ADMIN_AUTH_ERRORS.SUPABASE_NOT_CONFIGURED) }
  }

  const { data: sessionData, error: sessionError } = await client.auth.getSession()
  const session = sessionData?.session || null

  if (sessionError || !session?.access_token) {
    return { session: null, user: null, error: sessionError || null }
  }

  const { data: userData, error: userError } = await client.auth.getUser(session.access_token)

  if (userError || !userData?.user) {
    return { session: null, user: null, error: userError || new Error(ADMIN_AUTH_ERRORS.INVALID_SESSION) }
  }

  return {
    session,
    user: userData.user,
    error: null,
  }
}

export async function getAdminAccessToken() {
  const { session } = await getAdminSession()
  return session?.access_token || ''
}

export async function getAdminAccess({ allowedRoles = [ADMIN_ROLES.ADMIN], allowLegacyUserMetadata = false, noSessionReason = ADMIN_AUTH_ERRORS.NO_SESSION } = {}) {
  const { session, user, error } = await getVerifiedAdminSession()

  if (error?.message === ADMIN_AUTH_ERRORS.SUPABASE_NOT_CONFIGURED) {
    return { allowed: false, hasSession: false, reason: ADMIN_AUTH_ERRORS.SUPABASE_NOT_CONFIGURED, user: null, role: '' }
  }

  if (error || !session?.access_token || !user) {
    return {
      allowed: false,
      hasSession: false,
      reason: error ? ADMIN_AUTH_ERRORS.INVALID_SESSION : noSessionReason,
      user: null,
      role: '',
    }
  }

  const allowed = hasAllowedAdminRole(user, allowedRoles, { allowLegacyUserMetadata })
  const role = getAdminRole(user, { allowLegacyUserMetadata })

  return {
    allowed,
    hasSession: true,
    reason: allowed ? '' : ADMIN_AUTH_ERRORS.NOT_ALLOWED,
    user,
    role,
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

  const access = await getAdminAccess({ allowedRoles, allowLegacyUserMetadata })

  if (!access.allowed) {
    await client.auth.signOut()
    throw new Error(access.reason || ADMIN_AUTH_ERRORS.NOT_ALLOWED)
  }

  return access
}

export async function signOutAdmin() {
  const client = getSupabaseClient()
  if (!client) return

  await client.auth.signOut()
}
