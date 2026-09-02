import { createClient } from '@supabase/supabase-js'
import { applyApiCors, rejectOversizedBody } from '../_lib/security.js'

const TABLE = 'community_wall_posts'
const POST_COOLDOWN_SECONDS = 20

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

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function getBearerToken(request) {
  const header = request.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : ''
}

async function readBody(request) {
  if (request.body && typeof request.body === 'object') return request.body

  if (typeof request.body === 'string') {
    try {
      return JSON.parse(request.body)
    } catch {
      return {}
    }
  }

  return {}
}

function mapPost(row = {}) {
  return {
    id: row.id,
    authorName: row.author_name || 'Imortal',
    xatId: row.xat_id || '',
    body: row.body || '',
    source: row.source || 'portal',
    createdAt: row.created_at || '',
  }
}

async function handleGet(response, supabase) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id,author_name,xat_id,body,source,created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) throw error

  response.status(200).json({
    ok: true,
    data: (data || []).map(mapPost),
  })
}

async function handlePost(request, response, supabase) {
  const token = getBearerToken(request)

  if (!token) {
    response.status(401).json({ ok: false, error: 'Entre para publicar um recado.' })
    return
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  const user = authData?.user

  if (authError || !user?.id) {
    response.status(401).json({ ok: false, error: 'Sua sessão expirou. Entre novamente.' })
    return
  }

  const body = await readBody(request)
  const text = cleanText(body.body, 280)

  if (text.length < 2) {
    response.status(400).json({ ok: false, error: 'Escreva pelo menos 2 caracteres.' })
    return
  }

  const since = new Date(Date.now() - POST_COOLDOWN_SECONDS * 1000).toISOString()
  const { data: recent, error: recentError } = await supabase
    .from(TABLE)
    .select('id')
    .eq('profile_id', user.id)
    .gte('created_at', since)
    .limit(1)

  if (recentError) throw recentError

  if (recent?.length) {
    response.status(429).json({
      ok: false,
      error: 'Aguarde alguns segundos antes de publicar outro recado.',
    })
    return
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('display_name,username')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) throw profileError

  const authorName = cleanText(profile?.display_name || profile?.username || 'Imortal', 80)

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      profile_id: user.id,
      author_name: authorName,
      body: text,
      source: 'portal',
      status: 'published',
    })
    .select('id,author_name,xat_id,body,source,created_at')
    .single()

  if (error) throw error

  response.status(201).json({
    ok: true,
    data: mapPost(data),
  })
}

export default async function handler(request, response) {
  if (!applyApiCors(request, response, {
    methods: 'GET, POST, OPTIONS',
    headers: 'Content-Type, Authorization',
  })) {
    response.status(403).json({ ok: false, error: 'Origin not allowed.' })
    return
  }

  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  response.setHeader('Cache-Control', 'private, no-store, max-age=0')

  if (request.method === 'POST' && rejectOversizedBody(request, response, 4 * 1024)) {
    return
  }

  try {
    const supabase = getSupabaseAdmin()

    if (request.method === 'GET') {
      await handleGet(response, supabase)
      return
    }

    if (request.method === 'POST') {
      await handlePost(request, response, supabase)
      return
    }

    response.status(405).json({ ok: false, error: 'Method not allowed' })
  } catch (error) {
    console.error('Community wall API error:', error.message)
    response.status(500).json({
      ok: false,
      error: 'Não foi possível processar o mural agora.',
    })
  }
}
