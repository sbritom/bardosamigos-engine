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

function isCommunityVisible(preferences) {
  if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) return false
  return preferences.community?.visible === true
}

function publicMember(profile) {
  return {
    id: profile.id,
    displayName: profile.display_name || 'Amigo do Bar',
    username: profile.username || '',
    avatarUrl: profile.avatar_url || '',
    bio: profile.bio || '',
  }
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
    const since = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString()

    const [membersCount, eventsCount, tvCount, requestsCount, profiles] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'published').is('deleted_at', null),
      supabase.from('tv_channels').select('id', { count: 'exact', head: true }).eq('enabled', true),
      supabase.from('radio_music_requests').select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabase
        .from('profiles')
        .select('id,display_name,username,avatar_url,bio,preferences,created_at,status')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(200),
    ])

    const failed = [membersCount, eventsCount, tvCount, requestsCount, profiles].find((item) => item.error)
    if (failed?.error) throw failed.error

    const visibleMembers = (profiles.data || [])
      .filter((profile) => isCommunityVisible(profile.preferences))
      .map(publicMember)
      .slice(0, 12)

    response.status(200).json({
      ok: true,
      data: {
        stats: {
          members: membersCount.count || 0,
          publishedEvents: eventsCount.count || 0,
          tvChannels: tvCount.count || 0,
          musicRequests7d: requestsCount.count || 0,
        },
        members: visibleMembers,
      },
    })
  } catch (error) {
    console.error('Community overview API error:', error.message)
    response.status(500).json({
      ok: false,
      error: 'Nao foi possivel carregar os dados da comunidade agora.',
    })
  }
}
