import { createClient } from '@supabase/supabase-js'
import { applyApiCors } from '../_lib/security.js'

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

export default async function handler(request, response) {
  if (!applyApiCors(request, response, {
    methods: 'GET, OPTIONS',
    headers: 'Content-Type',
  })) {
    response.status(403).json({ ok: false, error: 'Origin not allowed.' })
    return
  }

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
  } catch (error) {
    console.error('Community overview API error:', error.message)
    response.status(500).json({
      ok: false,
      error: 'Não foi possível carregar os dados da comunidade agora.',
    })
  }
}
