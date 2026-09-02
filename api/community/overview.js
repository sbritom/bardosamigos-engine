import { createClient } from '@supabase/supabase-js'
import { applyApiCors, rejectOversizedBody } from '../_lib/security.js'

const WALL_TABLE = 'community_wall_posts'
const WALL_COOLDOWN_SECONDS = 20

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

function isBirthdayVisible(preferences) {
  if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) return false
  return preferences.community?.birthdayVisible === true
}

function mapBirthday(profile) {
  const value = String(profile.birth_date || '')
  const parts = value.split('-')
  const month = Number(parts[1])
  const day = Number(parts[2])

  return {
    id: profile.id,
    displayName: profile.display_name || '',
    username: profile.username || '',
    month,
    day,
  }
}

function mapWallPost(row = {}) {
  return {
    id: row.id,
    authorName: row.author_name || 'Imortal',
    xatId: row.xat_id || '',
    body: row.body || '',
    source: row.source || 'portal',
    createdAt: row.created_at || '',
  }
}

async function getBirthdays(supabase) {
  const month = new Date().getMonth() + 1

  const { data, error } = await supabase
    .from('profiles')
    .select('id,display_name,username,birth_date,preferences,status')
    .eq('status', 'active')
    .not('birth_date', 'is', null)
    .limit(500)

  if (error) throw error

  return (data || [])
    .filter((profile) => isBirthdayVisible(profile.preferences))
    .map(mapBirthday)
    .filter((profile) => profile.month === month && profile.day > 0)
    .sort((left, right) => left.day - right.day)
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
      xat: {
        connected: false,
        onlineCount: null,
      },
    },
  })
}

async function handleWallGet(response, supabase) {
  const { data, error } = await supabase
    .from(WALL_TABLE)
    .select('id,author_name,xat_id,body,source,created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) throw error

  response.setHeader('Cache-Control', 'private, no-store, max-age=0')
  response.status(200).json({
    ok: true,
    data: (data || []).map(mapWallPost),
  })
}

async function handleWallPost(request, response, supabase) {
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

  const since = new Date(Date.now() - WALL_COOLDOWN_SECONDS * 1000).toISOString()
  const { data: recent, error: recentError } = await supabase
    .from(WALL_TABLE)
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
    .from(WALL_TABLE)
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
    data: mapWallPost(data),
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

  const section = cleanText(request.query?.section, 30)

  if (request.method === 'POST' && rejectOversizedBody(request, response, 4 * 1024)) {
    return
  }

  try {
    const supabase = getSupabaseAdmin()

    if (section === 'wall') {
      if (request.method === 'GET') {
        await handleWallGet(response, supabase)
        return
      }

      if (request.method === 'POST') {
        await handleWallPost(request, response, supabase)
        return
      }

      response.status(405).json({ ok: false, error: 'Method not allowed' })
      return
    }

    if (request.method === 'GET') {
      await handleOverview(response, supabase)
      return
    }

    response.status(405).json({ ok: false, error: 'Method not allowed' })
  } catch (error) {
    console.error('Community API error:', error.message)
    response.status(500).json({
      ok: false,
      error: 'Não foi possível processar a comunidade agora.',
    })
  }
}
