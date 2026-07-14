/* global process */
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const TABLE = 'radio_music_requests'
const VALID_STATUSES = new Set(['pending', 'read'])
const REQUEST_WINDOW_SECONDS = 60

function setCors(response) {
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

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

function getIp(request) {
  const forwarded = request.headers['x-forwarded-for']
  if (Array.isArray(forwarded)) return forwarded[0]?.split(',')[0]?.trim() || ''
  if (forwarded) return String(forwarded).split(',')[0]?.trim()
  return request.socket?.remoteAddress || ''
}

function getUserAgent(request) {
  return cleanText(request.headers['user-agent'] || '', 500)
}

function createFingerprint(request) {
  return crypto
    .createHash('sha256')
    .update(`${getIp(request)}|${getUserAgent(request)}`)
    .digest('hex')
}

function isAdminUser(user) {
  const role = user?.app_metadata?.role || user?.user_metadata?.role
  return role === 'admin' || user?.app_metadata?.is_admin === true || user?.user_metadata?.is_admin === true
}

async function requireAdmin(request, supabase) {
  const header = request.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''

  if (!token) {
    return { ok: false, status: 401, error: 'Autenticacao administrativa obrigatoria.' }
  }

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !isAdminUser(data?.user)) {
    return { ok: false, status: 403, error: 'Acesso administrativo negado.' }
  }

  return { ok: true, user: data.user }
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

async function handlePost(request, response, supabase) {
  const body = await readBody(request)
  const songAndArtist = cleanText(body.songAndArtist, 180)
  const message = cleanText(body.message, 500)

  if (songAndArtist.length < 3) {
    response.status(400).json({
      ok: false,
      error: 'Informe a musica e o artista com pelo menos 3 caracteres.',
    })
    return
  }

  const fingerprint = createFingerprint(request)
  const since = new Date(Date.now() - REQUEST_WINDOW_SECONDS * 1000).toISOString()

  const { data: recent, error: recentError } = await supabase
    .from(TABLE)
    .select('id, created_at')
    .eq('request_fingerprint', fingerprint)
    .gte('created_at', since)
    .limit(1)

  if (recentError) {
    throw recentError
  }

  if (recent?.length) {
    response.status(429).json({
      ok: false,
      error: 'Aguarde um pouco antes de enviar outro pedido.',
    })
    return
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      song_and_artist: songAndArtist,
      message: message || null,
      status: 'pending',
      source: 'public_radio_page',
      request_fingerprint: fingerprint,
      requester_user_agent: getUserAgent(request) || null,
    })
    .select('id, status')
    .single()

  if (error) {
    throw error
  }

  response.status(201).json({
    ok: true,
    data,
  })
}

async function handleGet(request, response, supabase) {
  const admin = await requireAdmin(request, supabase)
  if (!admin.ok) {
    response.status(admin.status).json({ ok: false, error: admin.error })
    return
  }

  const status = cleanText(request.query?.status, 30)
  let query = supabase
    .from(TABLE)
    .select('id, song_and_artist, message, status, source, admin_note, handled_by, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status && VALID_STATUSES.has(status)) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  response.status(200).json({
    ok: true,
    data: data || [],
  })
}

async function handlePatch(request, response, supabase) {
  const admin = await requireAdmin(request, supabase)
  if (!admin.ok) {
    response.status(admin.status).json({ ok: false, error: admin.error })
    return
  }

  const body = await readBody(request)
  const id = cleanText(body.id, 80)
  const status = cleanText(body.status, 30)

  if (!id || status !== 'read') {
    response.status(400).json({
      ok: false,
      error: 'Pedido ou status invalido.',
    })
    return
  }

  const payload = {
    status,
    admin_note: cleanText(body.adminNote, 500) || null,
    handled_by: cleanText(body.handledBy, 120) || admin.user?.email || admin.user?.id || null,
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select('id, song_and_artist, message, status, source, admin_note, handled_by, created_at, updated_at')
    .single()

  if (error) {
    throw error
  }

  response.status(200).json({
    ok: true,
    data,
  })
}

async function handleDelete(request, response, supabase) {
  const admin = await requireAdmin(request, supabase)
  if (!admin.ok) {
    response.status(admin.status).json({ ok: false, error: admin.error })
    return
  }

  const body = await readBody(request)
  const id = cleanText(request.query?.id || body.id, 80)

  if (!id) {
    response.status(400).json({ ok: false, error: 'Pedido nao informado.' })
    return
  }

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }

  response.status(200).json({
    ok: true,
    data: { id, deleted: true },
  })
}

export default async function handler(request, response) {
  setCors(response)

  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  try {
    const supabase = getSupabaseAdmin()

    if (request.method === 'POST') {
      await handlePost(request, response, supabase)
      return
    }

    if (request.method === 'GET') {
      await handleGet(request, response, supabase)
      return
    }

    if (request.method === 'PATCH') {
      await handlePatch(request, response, supabase)
      return
    }

    if (request.method === 'DELETE') {
      await handleDelete(request, response, supabase)
      return
    }

    response.status(405).json({
      ok: false,
      error: 'Method not allowed',
    })
  } catch (error) {
    console.error('Radio music request API error:', error.message)
    response.status(500).json({
      ok: false,
      error: 'Nao foi possivel processar o pedido agora.',
    })
  }
}
