import { createClient } from '@supabase/supabase-js'
import { applyApiCors } from './_lib/security.js'

const PROFILE_FIELDS = 'id, display_name, username, avatar_url, bio, role, status, preferences, created_at, updated_at'

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
  const metadataName = String(user?.user_metadata?.display_name || user?.user_metadata?.name || '').trim()
  if (metadataName) return metadataName

  const email = String(user?.email || '')
  return email.includes('@') ? email.split('@')[0] : 'Amigo do Bar'
}

async function requireUser(request, supabase) {
  const token = getBearerToken(request)
  if (!token) {
    return { ok: false, status: 401, error: 'Autenticacao obrigatoria.' }
  }

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) {
    return { ok: false, status: 401, error: 'Sessao invalida ou expirada.' }
  }

  return { ok: true, user: data.user }
}

async function ensureProfile(supabase, user) {
  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', user.id)
    .maybeSingle()

  if (readError) throw readError
  if (existing) return existing

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      display_name: fallbackDisplayName(user),
    })
    .select(PROFILE_FIELDS)
    .single()

  if (error) throw error
  return data
}

export default async function handler(request, response) {
  if (!applyApiCors(request, response, {
    methods: 'GET, OPTIONS',
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

  if (request.method !== 'GET') {
    response.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  try {
    const supabase = getSupabaseAdmin()
    const authenticated = await requireUser(request, supabase)

    if (!authenticated.ok) {
      response.status(authenticated.status).json({ ok: false, error: authenticated.error })
      return
    }

    const profile = await ensureProfile(supabase, authenticated.user)
    response.status(200).json({ ok: true, data: profile })
  } catch (error) {
    console.error('Profile bootstrap API error:', error.message)
    response.status(500).json({
      ok: false,
      error: 'Nao foi possivel preparar seu perfil agora.',
    })
  }
}
