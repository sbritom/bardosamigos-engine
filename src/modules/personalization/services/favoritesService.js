import { getSupabaseClient } from '../../../core/database'
import { TVFavoriteService } from '../../tv/services/TVFavoriteService'

function mapFootballFavorite(row = {}) {
  return {
    id: row.id,
    type: row.favorite_type || '',
    favoriteId: row.favorite_id || '',
    metadata: row.metadata || {},
    createdAt: row.created_at || '',
  }
}

export async function listFootballFavorites(userId) {
  if (!userId) return { data: [], error: null }
  const client = getSupabaseClient()
  if (!client) return { data: [], error: new Error('Supabase nao configurado.') }

  const { data, error } = await client
    .from('football_favorites')
    .select('id, favorite_type, favorite_id, metadata, created_at')
    .eq('profile_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return {
    data: (data || []).map(mapFootballFavorite),
    error,
  }
}

export async function listTVFavorites(userId) {
  if (!userId) return { data: [], error: null }
  return TVFavoriteService.list(userId)
}

export async function loadPersonalFavorites(userId) {
  if (!userId) {
    return {
      football: [],
      tv: [],
      errors: [],
    }
  }

  const [footballResult, tvResult] = await Promise.all([
    listFootballFavorites(userId),
    listTVFavorites(userId),
  ])

  return {
    football: footballResult.data || [],
    tv: tvResult.data || [],
    errors: [footballResult.error, tvResult.error].filter(Boolean),
  }
}
