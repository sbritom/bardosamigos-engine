import { createClient } from '@supabase/supabase-js'
import { applyApiCors, getBearerToken, rejectOversizedBody } from '../_lib/security.js'

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

function cleanText(value, maxLength = 120) {
  return String(value || '').trim().slice(0, maxLength)
}

async function requirePortalAdmin(request, supabase) {
  const token = getBearerToken(request)
  if (!token) {
    return { ok: false, status: 401, error: 'Autenticação administrativa obrigatória.' }
  }

  const { data, error } = await supabase.auth.getUser(token)
  const user = data?.user
  const isAdmin = user?.app_metadata?.role === 'admin' || user?.app_metadata?.is_admin === true

  if (error || !user) {
    return { ok: false, status: 401, error: 'Sessão administrativa inválida ou expirada.' }
  }

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
    const appRole = cleanText(authUser?.app_metadata?.role, 30)
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

async function updatePortalUserRole(request, response, supabase, admin) {
  const userId = cleanText(request.body?.userId, 80)
  const nextRole = cleanText(request.body?.role, 30).toLowerCase()

  if (!userId || !MANAGEABLE_ROLES.has(nextRole)) {
    response.status(400).json({ ok: false, error: 'Usuário ou cargo inválido.' })
    return
  }

  if (userId === admin.user.id) {
    response.status(403).json({ ok: false, error: 'A conta administradora atual não pode ter o cargo alterado por esta tela.' })
    return
  }

  const { data: targetData, error: targetError } = await supabase.auth.admin.getUserById(userId)
  const target = targetData?.user

  if (targetError || !target) {
    response.status(404).json({ ok: false, error: 'Usuário não encontrado.' })
    return
  }

  const targetIsAdmin = target.app_metadata?.role === 'admin' || target.app_metadata?.is_admin === true
  if (targetIsAdmin) {
    response.status(403).json({ ok: false, error: 'Contas administradoras não podem ser alteradas por esta tela.' })
    return
  }

  const nextAppMetadata = {
    ...(target.app_metadata || {}),
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
    await supabase.auth.admin.updateUserById(userId, {
      app_metadata: target.app_metadata || {},
    }).catch(() => {})
    throw profileUpdateError
  }

  response.status(200).json({
    ok: true,
    data: {
      id: userId,
      role: nextRole,
      requiresRelogin: true,
    },
  })
}

export default async function handler(request, response) {
  if (!applyApiCors(request, response, {
    methods: 'GET, PATCH, OPTIONS',
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
      await updatePortalUserRole(request, response, supabase, admin)
      return
    }

    response.status(405).json({ ok: false, error: 'Method not allowed' })
  } catch (error) {
    console.error('Admin users API error:', error.message)
    response.status(500).json({
      ok: false,
      error: error.message || 'Não foi possível gerenciar os usuários agora.',
    })
  }
}
