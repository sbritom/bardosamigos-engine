/* global process */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const EVENT_SELECT_FIELDS = [
  'id',
  'title',
  'slug',
  'description',
  'location',
  'starts_at',
  'ends_at',
  'status',
  'capacity',
  'metadata',
  'created_at',
  'updated_at',
  'deleted_at',
  'version',
].join(',')

let supabaseAdmin

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase admin environment is not configured.')
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return supabaseAdmin
}

function setCors(response) {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

function getBearerToken(request) {
  const header = request.headers.authorization || request.headers.Authorization || ''
  const match = String(header).match(/^Bearer\s+(.+)$/i)
  return match?.[1] || ''
}

function isAdminUser(user) {
  return user?.app_metadata?.role === 'admin' || user?.app_metadata?.is_admin === true
}

async function requireAdminUser(request, supabase) {
  const token = getBearerToken(request)

  if (!token) {
    return { user: null, error: 'Token administrativo ausente.', status: 401 }
  }

  const { data, error } = await supabase.auth.getUser(token)
  const user = data?.user || null

  if (error || !user) {
    return { user: null, error: 'Sessao administrativa invalida.', status: 401 }
  }

  if (!isAdminUser(user)) {
    return { user: null, error: 'Acesso restrito a administradores.', status: 403 }
  }

  return { user, error: null, status: 200 }
}

export default async function handler(request, response) {
  setCors(response)

  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET, OPTIONS')
    response.status(405).json({ ok: false, error: 'Metodo nao permitido.' })
    return
  }

  try {
    const supabase = getSupabaseAdmin()
    const access = await requireAdminUser(request, supabase)

    if (!access.user) {
      response.status(access.status).json({ ok: false, error: access.error })
      return
    }

    const { data, error } = await supabase
      .from('events')
      .select(EVENT_SELECT_FIELDS)
      .order('created_at', { ascending: false })

    if (error) {
      response.status(500).json({ ok: false, error: 'Nao foi possivel listar os eventos.' })
      return
    }

    response.status(200).json({
      ok: true,
      data: data || [],
    })
  } catch (error) {
    response.status(500).json({
      ok: false,
      error: error?.message || 'Erro inesperado ao listar eventos.',
    })
  }
}
