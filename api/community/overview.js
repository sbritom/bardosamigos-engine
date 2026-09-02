import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { applyApiCors, rejectOversizedBody } from '../_lib/security.js'

const WALL_TABLE = 'community_wall_posts'
const BIRTHDAY_TABLE = 'community_birthdays'
const WALL_COOLDOWN_SECONDS = 20
const BIRTHDAY_COOLDOWN_SECONDS = 60

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
  if (forwarded) return String(forwarded).split(',')[0]?.trim() || ''
  return request.socket?.remoteAddress || ''
}

function getUserAgent(request) {
  return cleanText(request.headers['user-agent'] || '', 500)
}

function createFingerprint(request, scope = '', userId = '') {
  return crypto
    .createHash('sha256')
    .update(scope + '|' + userId + '|' + getIp(request) + '|' + getUserAgent(request))
    .digest('hex')
}

function createEditToken() {
  return crypto.randomBytes(24).toString('base64url')
}

function hashEditToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex')
}

function safeHashEquals(left, right) {
  const a = Buffer.from(String(left || ''), 'hex')
  const b = Buffer.from(String(right || ''), 'hex')
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b)
}

function getBearerToken(request) {
  const header = request.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : ''
}

async function getOptionalUser(request, supabase) {
  const token = getBearerToken(request)
  if (!token) return { ok: true, user: null }

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) {
    return { ok: false, status: 401, error: 'Sua sessão expirou. Atualize a página.' }
  }

  return { ok: true, user: data.user }
}

function isAdminUser(user) {
  return user?.app_metadata?.role === 'admin' || user?.app_metadata?.is_admin === true
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

function mapBirthday(row = {}) {
  return {
    id: row.id,
    displayName: row.display_name || 'Imortal',
    day: Number(row.birth_day) || 0,
    month: Number(row.birth_month) || 0,
  }
}

function mapWallPost(row = {}, options = {}) {
  return {
    id: row.id,
    authorName: row.author_name || 'Imortal',
    xatId: row.xat_id || '',
    body: row.body || '',
    source: row.source || 'portal',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
    canEdit: Boolean(options.canEdit),
    canModerate: Boolean(options.canModerate),
  }
}

async function getBirthdays(supabase) {
  const month = new Date().getMonth() + 1
  const { data, error } = await supabase
    .from(BIRTHDAY_TABLE)
    .select('id,display_name,birth_day,birth_month')
    .eq('status', 'published')
    .eq('birth_month', month)
    .order('birth_day', { ascending: true })
    .order('display_name', { ascending: true })
    .limit(200)

  if (error) throw error
  return (data || []).map(mapBirthday)
}

async function getCommunityRanking(supabase) {
  const { data: board, error: boardError } = await supabase
    .from('ranking_boards')
    .select('id,name,slug,scope,status,metadata,updated_at')
    .eq('scope', 'community')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (boardError) throw boardError
  if (!board) return null

  const { data: entries, error: entriesError } = await supabase
    .from('ranking_entries')
    .select('id,position,score,metadata,profile_id,profiles(display_name,username)')
    .eq('ranking_board_id', board.id)
    .order('position', { ascending: true })
    .order('score', { ascending: false })
    .limit(20)

  if (entriesError) throw entriesError

  return {
    id: board.id,
    name: board.name,
    slug: board.slug,
    entries: (entries || []).map((entry) => ({
      id: entry.id,
      position: entry.position,
      score: entry.score,
      displayName: entry.profiles?.display_name || entry.metadata?.displayName || '',
      username: entry.profiles?.username || entry.metadata?.username || '',
    })),
  }
}

async function getCommunityAchievements(supabase) {
  const { data, error } = await supabase
    .from('competition_achievements')
    .select('id,name,slug,description,metadata')
    .eq('is_active', true)
    .is('deleted_at', null)
    .contains('metadata', { scope: 'community' })
    .order('created_at', { ascending: false })
    .limit(12)

  if (error) throw error
  return data || []
}

async function handleOverview(response, supabase) {
  const [birthdays, ranking, achievements] = await Promise.all([
    getBirthdays(supabase),
    getCommunityRanking(supabase),
    getCommunityAchievements(supabase),
  ])

  response.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
  response.status(200).json({
    ok: true,
    data: {
      birthdays,
      ranking,
      achievements,
      xat: { connected: false, onlineCount: null },
    },
  })
}

async function handleWallGet(request, response, supabase) {
  const viewer = await getOptionalUser(request, supabase)
  if (!viewer.ok) {
    response.status(viewer.status).json({ ok: false, error: viewer.error })
    return
  }

  const admin = isAdminUser(viewer.user)
  const { data, error } = await supabase
    .from(WALL_TABLE)
    .select('id,profile_id,author_name,xat_id,body,source,status,created_at,updated_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) throw error

  response.setHeader('Cache-Control', 'private, no-store, max-age=0')
  response.status(200).json({
    ok: true,
    data: (data || []).map((row) => mapWallPost(row, {
      canEdit: admin || Boolean(viewer.user?.id && row.profile_id === viewer.user.id),
      canModerate: admin,
    })),
  })
}

async function handleWallPost(request, response, supabase) {
  const viewer = await getOptionalUser(request, supabase)
  if (!viewer.ok) {
    response.status(viewer.status).json({ ok: false, error: viewer.error })
    return
  }

  const body = await readBody(request)
  const authorName = cleanText(body.authorName, 50)
  const text = cleanText(body.body, 280)

  if (authorName.length < 2) {
    response.status(400).json({ ok: false, error: 'Informe seu nome para deixar o recado.' })
    return
  }
  if (text.length < 2) {
    response.status(400).json({ ok: false, error: 'Escreva pelo menos 2 caracteres.' })
    return
  }

  const fingerprint = createFingerprint(request, 'wall', viewer.user?.id || '')
  const since = new Date(Date.now() - WALL_COOLDOWN_SECONDS * 1000).toISOString()
  const { data: recent, error: recentError } = await supabase
    .from(WALL_TABLE)
    .select('id')
    .eq('request_fingerprint', fingerprint)
    .gte('created_at', since)
    .limit(1)

  if (recentError) throw recentError
  if (recent?.length) {
    response.status(429).json({ ok: false, error: 'Aguarde alguns segundos antes de publicar outro recado.' })
    return
  }

  const editToken = createEditToken()
  const { data, error } = await supabase
    .from(WALL_TABLE)
    .insert({
      profile_id: viewer.user?.id || null,
      author_name: authorName,
      body: text,
      source: 'portal',
      status: 'published',
      edit_token_hash: hashEditToken(editToken),
      request_fingerprint: fingerprint,
    })
    .select('id,profile_id,author_name,xat_id,body,source,created_at,updated_at')
    .single()

  if (error) throw error

  response.status(201).json({
    ok: true,
    data: {
      post: mapWallPost(data, { canEdit: true, canModerate: isAdminUser(viewer.user) }),
      editToken,
    },
  })
}

async function requireWallPermission(request, response, supabase, row, body) {
  const viewer = await getOptionalUser(request, supabase)
  if (!viewer.ok) {
    response.status(viewer.status).json({ ok: false, error: viewer.error })
    return null
  }
  if (isAdminUser(viewer.user)) return { admin: true }
  if (viewer.user?.id && row.profile_id === viewer.user.id) return { admin: false }

  const suppliedHash = hashEditToken(body.editToken)
  if (row.edit_token_hash && safeHashEquals(row.edit_token_hash, suppliedHash)) {
    return { admin: false }
  }

  response.status(403).json({ ok: false, error: 'Você não pode alterar este recado.' })
  return null
}

async function handleWallPatch(request, response, supabase) {
  const body = await readBody(request)
  const id = cleanText(body.id, 80)
  const text = cleanText(body.body, 280)

  if (!id || text.length < 2) {
    response.status(400).json({ ok: false, error: 'Recado inválido.' })
    return
  }

  const { data: row, error: rowError } = await supabase
    .from(WALL_TABLE)
    .select('id,profile_id,edit_token_hash,status')
    .eq('id', id)
    .maybeSingle()

  if (rowError) throw rowError
  if (!row || row.status !== 'published') {
    response.status(404).json({ ok: false, error: 'Recado não encontrado.' })
    return
  }

  const permission = await requireWallPermission(request, response, supabase, row, body)
  if (!permission) return

  const { data, error } = await supabase
    .from(WALL_TABLE)
    .update({ body: text, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id,profile_id,author_name,xat_id,body,source,created_at,updated_at')
    .single()

  if (error) throw error
  response.status(200).json({
    ok: true,
    data: mapWallPost(data, { canEdit: true, canModerate: permission.admin }),
  })
}

async function handleWallDelete(request, response, supabase) {
  const body = await readBody(request)
  const id = cleanText(request.query?.id || body.id, 80)

  if (!id) {
    response.status(400).json({ ok: false, error: 'Recado não informado.' })
    return
  }

  const { data: row, error: rowError } = await supabase
    .from(WALL_TABLE)
    .select('id,profile_id,edit_token_hash,status')
    .eq('id', id)
    .maybeSingle()

  if (rowError) throw rowError
  if (!row) {
    response.status(404).json({ ok: false, error: 'Recado não encontrado.' })
    return
  }

  const permission = await requireWallPermission(request, response, supabase, row, body)
  if (!permission) return

  const { error } = await supabase.from(WALL_TABLE).delete().eq('id', id)
  if (error) throw error

  response.status(200).json({ ok: true, data: { id, deleted: true } })
}

function isValidBirthday(day, month) {
  if (!Number.isInteger(day) || !Number.isInteger(month)) return false
  if (day < 1 || day > 31 || month < 1 || month > 12) return false
  const date = new Date(Date.UTC(2024, month - 1, day))
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

async function handleBirthdayPost(request, response, supabase) {
  const body = await readBody(request)
  const displayName = cleanText(body.displayName, 50)
  const day = Number(body.day)
  const month = Number(body.month)

  if (displayName.length < 2) {
    response.status(400).json({ ok: false, error: 'Informe seu nome.' })
    return
  }
  if (!isValidBirthday(day, month)) {
    response.status(400).json({ ok: false, error: 'Informe uma data de aniversário válida.' })
    return
  }

  const fingerprint = createFingerprint(request, 'birthday')
  const since = new Date(Date.now() - BIRTHDAY_COOLDOWN_SECONDS * 1000).toISOString()
  const { data: recent, error: recentError } = await supabase
    .from(BIRTHDAY_TABLE)
    .select('id')
    .eq('submission_fingerprint', fingerprint)
    .gte('created_at', since)
    .limit(1)

  if (recentError) throw recentError
  if (recent?.length) {
    response.status(429).json({ ok: false, error: 'Aguarde um pouco antes de enviar novamente.' })
    return
  }

  const { data: existing, error: existingError } = await supabase
    .from(BIRTHDAY_TABLE)
    .select('id,display_name,birth_day,birth_month')
    .eq('birth_day', day)
    .eq('birth_month', month)
    .ilike('display_name', displayName)
    .eq('status', 'published')
    .limit(1)

  if (existingError) throw existingError
  if (existing?.length) {
    response.status(200).json({ ok: true, data: mapBirthday(existing[0]) })
    return
  }

  const { data, error } = await supabase
    .from(BIRTHDAY_TABLE)
    .insert({
      display_name: displayName,
      birth_day: day,
      birth_month: month,
      status: 'published',
      submission_fingerprint: fingerprint,
    })
    .select('id,display_name,birth_day,birth_month')
    .single()

  if (error) throw error
  response.status(201).json({ ok: true, data: mapBirthday(data) })
}

export default async function handler(request, response) {
  if (!applyApiCors(request, response, {
    methods: 'GET, POST, PATCH, DELETE, OPTIONS',
    headers: 'Content-Type, Authorization',
  })) {
    response.status(403).json({ ok: false, error: 'Origin not allowed.' })
    return
  }

  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  const section = cleanText(request.query?.section, 30)
  if (['POST', 'PATCH', 'DELETE'].includes(request.method)
      && rejectOversizedBody(request, response, 8 * 1024)) {
    return
  }

  try {
    const supabase = getSupabaseAdmin()

    if (section === 'wall') {
      if (request.method === 'GET') return handleWallGet(request, response, supabase)
      if (request.method === 'POST') return handleWallPost(request, response, supabase)
      if (request.method === 'PATCH') return handleWallPatch(request, response, supabase)
      if (request.method === 'DELETE') return handleWallDelete(request, response, supabase)
      response.status(405).json({ ok: false, error: 'Method not allowed' })
      return
    }

    if (section === 'birthday') {
      if (request.method === 'POST') return handleBirthdayPost(request, response, supabase)
      response.status(405).json({ ok: false, error: 'Method not allowed' })
      return
    }

    if (request.method === 'GET') return handleOverview(response, supabase)
    response.status(405).json({ ok: false, error: 'Method not allowed' })
  } catch (error) {
    console.error('Community API error:', error.message)
    response.status(error.status || 500).json({
      ok: false,
      error: error.message || 'Não foi possível processar a comunidade agora.',
    })
  }
}
