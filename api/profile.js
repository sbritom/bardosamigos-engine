import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { applyApiCors, rejectOversizedBody } from './_lib/security.js'

const PROFILE_FIELDS = 'id, display_name, username, avatar_url, bio, role, status, preferences, created_at, updated_at'
const USERNAME_RE = /^[a-z0-9_]{3,20}$/
const MIN_PASSWORD_LENGTH = 6
const MANAGEABLE_ROLES = new Set(['user', 'locutor'])

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase server credentials are not configured.')
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function getBearerToken(request) {
  const header = request.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : ''
}

function fallbackDisplayName(user) {
  const metadataName = String(user?.user_metadata?.display_name || user?.user_metadata?.username || user?.user_metadata?.name || '').trim()
  if (metadataName) return metadataName

  return 'Usuário IMORTAL0800'
}

function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function validateUsername(value) {
  const username = normalizeUsername(value)
  if (!USERNAME_RE.test(username)) {
    throw new Error('Use de 3 a 20 caracteres: letras, números e underline.')
  }
  return username
}

function validatePassword(value) {
  const password = String(value || '')
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error('A senha precisa ter pelo menos 6 caracteres.')
  }
  if (password.length > 72) {
    throw new Error('A senha é muito longa.')
  }
  return password
}

function normalizeRecoveryCode(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function generateRecoveryCode() {
  const raw = randomBytes(9).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
  return raw.match(/.{1,4}/g)?.join('-') || raw
}

function hashRecoveryCode(code) {
  return createHash('sha256').update(normalizeRecoveryCode(code)).digest('hex')
}

function safeHashEquals(left, right) {
  const a = Buffer.from(String(left || ''), 'hex')
  const b = Buffer.from(String(right || ''), 'hex')
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b)
}

function getSyntheticEmail(username) {
  return `${username}@auth.imortal0800.com.br`
}

function getSessionPayload(session) {
  if (!session?.access_token || !session?.refresh_token) return null
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at || null,
  }
}

async function requireUser(request, supabase) {
  const token = getBearerToken(request)
  if (!token) {
    return { ok: false, status: 401, error: 'Autenticação obrigatória.' }
  }

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) {
    return { ok: false, status: 401, error: 'Sessão inválida ou expirada.' }
  }

  return { ok: true, user: data.user }
}

async function requirePortalAdmin(request, supabase) {
  const authenticated = await requireUser(request, supabase)
  if (!authenticated.ok) return authenticated

  const user = authenticated.user
  const isAdmin = user?.app_metadata?.role === 'admin' || user?.app_metadata?.is_admin === true

  if (!isAdmin) {
    return { ok: false, status: 403, error: 'Apenas administradores podem gerenciar cargos.' }
  }

  return { ok: true, user }
}

async function listPortalUsers(supabase) {
  const [{ data: authData, error: authError }, { data: profiles, error: profileError }] = await Promise.all([
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase
      .from('profiles')
      .select('id,username,display_name,avatar_url,role,status,created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ])

  if (authError) throw authError
  if (profileError) throw profileError

  const authById = new Map((authData?.users || []).map((user) => [user.id, user]))

  return (profiles || []).map((profile) => {
    const authUser = authById.get(profile.id)
    const appRole = String(authUser?.app_metadata?.role || '').trim().toLowerCase()
    const isAdmin = appRole === 'admin' || authUser?.app_metadata?.is_admin === true
    const role = isAdmin ? 'admin' : appRole === 'locutor' ? 'locutor' : 'user'

    return {
      id: profile.id,
      username: profile.username || '',
      displayName: profile.display_name || profile.username || 'Usuário',
      avatarUrl: profile.avatar_url || '',
      role,
      status: profile.status || 'active',
      createdAt: profile.created_at || null,
      lastSignInAt: authUser?.last_sign_in_at || null,
      manageable: !isAdmin,
    }
  })
}

async function updatePortalUserRole(request, supabase, adminUser) {
  const userId = String(request.body?.userId || '').trim().slice(0, 80)
  const nextRole = String(request.body?.role || '').trim().toLowerCase().slice(0, 30)

  if (!userId || !MANAGEABLE_ROLES.has(nextRole)) {
    return { ok: false, status: 400, error: 'Usuário ou cargo inválido.' }
  }

  if (userId === adminUser.id) {
    return { ok: false, status: 403, error: 'A conta administradora atual não pode ter o cargo alterado por esta tela.' }
  }

  const { data: targetData, error: targetError } = await supabase.auth.admin.getUserById(userId)
  const target = targetData?.user

  if (targetError || !target) {
    return { ok: false, status: 404, error: 'Usuário não encontrado.' }
  }

  const targetIsAdmin = target.app_metadata?.role === 'admin' || target.app_metadata?.is_admin === true
  if (targetIsAdmin) {
    return { ok: false, status: 403, error: 'Contas administradoras não podem ser alteradas por esta tela.' }
  }

  const previousMetadata = target.app_metadata || {}
  const nextAppMetadata = {
    ...previousMetadata,
    role: nextRole,
  }
  delete nextAppMetadata.is_admin

  const { error: authUpdateError } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: nextAppMetadata,
  })
  if (authUpdateError) throw authUpdateError

  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({
      role: nextRole,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (profileUpdateError) {
    await supabase.auth.admin.updateUserById(userId, { app_metadata: previousMetadata }).catch(() => {})
    throw profileUpdateError
  }

  return {
    ok: true,
    data: {
      id: userId,
      role: nextRole,
      requiresRelogin: true,
    },
  }
}

async function ensureProfile(supabase, user) {
  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', user.id)
    .maybeSingle()

  if (readError) throw readError
  if (existing) return existing

  const username = normalizeUsername(user?.user_metadata?.username)

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      display_name: fallbackDisplayName(user),
      username: USERNAME_RE.test(username) ? username : null,
    })
    .select(PROFILE_FIELDS)
    .single()

  if (error) throw error
  return data
}

async function findProfileByUsername(supabase, username) {
  const normalized = validateUsername(username)
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username, metadata')
    .eq('username', normalized)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  return data || null
}

async function saveRecoveryCode(supabase, profile, recoveryCode) {
  const metadata = {
    ...(profile?.metadata || {}),
    authRecoveryHash: hashRecoveryCode(recoveryCode),
    authRecoveryUpdatedAt: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('profiles')
    .update({ metadata })
    .eq('id', profile.id)

  if (error) throw error
  return metadata
}

async function loginWithUsername(supabase, usernameValue, passwordValue) {
  const username = validateUsername(usernameValue)
  const password = validatePassword(passwordValue)
  const profile = await findProfileByUsername(supabase, username)

  if (!profile) {
    return { ok: false, status: 401, error: 'Usuário ou senha incorretos.' }
  }

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id)
  if (userError || !userData?.user?.email) {
    return { ok: false, status: 401, error: 'Usuário ou senha incorretos.' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password,
  })

  if (error || !data?.session) {
    return { ok: false, status: 401, error: 'Usuário ou senha incorretos.' }
  }

  let recoveryCode = ''
  if (!profile.metadata?.authRecoveryHash) {
    recoveryCode = generateRecoveryCode()
    await saveRecoveryCode(supabase, profile, recoveryCode)
  }

  return {
    ok: true,
    session: getSessionPayload(data.session),
    recoveryCode,
  }
}

async function createUsernameAccount(supabase, usernameValue, passwordValue) {
  const username = validateUsername(usernameValue)
  const password = validatePassword(passwordValue)
  const existing = await findProfileByUsername(supabase, username)

  if (existing) {
    return { ok: false, status: 409, error: 'Esse usuário já está em uso.' }
  }

  const displayName = String(usernameValue || '').trim()
  const email = getSyntheticEmail(username)

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      username,
    },
  })

  if (createError || !created?.user) {
    if (/already|registered|exists/i.test(createError?.message || '')) {
      return { ok: false, status: 409, error: 'Esse usuário já está em uso.' }
    }
    throw createError || new Error('Não foi possível criar a conta.')
  }

  const recoveryCode = generateRecoveryCode()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: created.user.id,
      display_name: displayName,
      username,
    })
    .select('id, display_name, username, metadata')
    .single()

  if (profileError) throw profileError
  await saveRecoveryCode(supabase, profile, recoveryCode)

  const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError || !signedIn?.session) {
    throw signInError || new Error('Conta criada, mas não foi possível iniciar a sessão.')
  }

  return {
    ok: true,
    session: getSessionPayload(signedIn.session),
    recoveryCode,
  }
}

async function recoverUsernameAccount(supabase, usernameValue, recoveryCodeValue, passwordValue) {
  const username = validateUsername(usernameValue)
  const password = validatePassword(passwordValue)
  const recoveryCode = normalizeRecoveryCode(recoveryCodeValue)

  if (recoveryCode.length < 8) {
    return { ok: false, status: 400, error: 'Código de recuperação inválido.' }
  }

  const profile = await findProfileByUsername(supabase, username)
  const storedHash = profile?.metadata?.authRecoveryHash || ''

  if (!profile || !storedHash || !safeHashEquals(storedHash, hashRecoveryCode(recoveryCode))) {
    return { ok: false, status: 401, error: 'Usuário ou código de recuperação incorretos.' }
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(profile.id, {
    password,
  })
  if (updateError) throw updateError

  const newRecoveryCode = generateRecoveryCode()
  await saveRecoveryCode(supabase, profile, newRecoveryCode)

  return {
    ok: true,
    recoveryCode: newRecoveryCode,
  }
}

export default async function handler(request, response) {
  if (!applyApiCors(request, response, {
    methods: 'GET, POST, PATCH, OPTIONS',
    headers: 'Authorization, Content-Type',
  })) {
    response.status(403).json({ ok: false, error: 'Origin not allowed.' })
    return
  }

  response.setHeader('Cache-Control', 'private, no-store, max-age=0')

  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  if (request.method === 'PATCH' && rejectOversizedBody(request, response, 8 * 1024)) {
    return
  }

  try {
    const supabase = getSupabaseAdmin()

    if (request.method === 'POST') {
      const action = String(request.body?.action || '').trim()

      let result
      if (action === 'username-login') {
        result = await loginWithUsername(supabase, request.body?.username, request.body?.password)
      } else if (action === 'username-signup') {
        result = await createUsernameAccount(supabase, request.body?.username, request.body?.password)
      } else if (action === 'username-recover') {
        result = await recoverUsernameAccount(
          supabase,
          request.body?.username,
          request.body?.recoveryCode,
          request.body?.password,
        )
      } else {
        response.status(400).json({ ok: false, error: 'Ação inválida.' })
        return
      }

      response.status(result.status || (result.ok ? 200 : 400)).json(result)
      return
    }

    const section = String(request.query?.section || '').trim()

    if (section === 'admin-users') {
      const admin = await requirePortalAdmin(request, supabase)
      if (!admin.ok) {
        response.status(admin.status).json({ ok: false, error: admin.error })
        return
      }

      if (request.method === 'GET') {
        const users = await listPortalUsers(supabase)
        response.status(200).json({ ok: true, data: users })
        return
      }

      if (request.method === 'PATCH') {
        const result = await updatePortalUserRole(request, supabase, admin.user)
        response.status(result.status || (result.ok ? 200 : 400)).json(result)
        return
      }

      response.status(405).json({ ok: false, error: 'Method not allowed' })
      return
    }

    if (request.method !== 'GET') {
      response.status(405).json({ ok: false, error: 'Method not allowed' })
      return
    }

    const authenticated = await requireUser(request, supabase)
    if (!authenticated.ok) {
      response.status(authenticated.status).json({ ok: false, error: authenticated.error })
      return
    }

    const profile = await ensureProfile(supabase, authenticated.user)
    response.status(200).json({ ok: true, data: profile })
  } catch (error) {
    console.error('Profile/auth API error:', error.message)
    response.status(500).json({
      ok: false,
      error: error.message || 'Não foi possível concluir a operação agora.',
    })
  }
}
