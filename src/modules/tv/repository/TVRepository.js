import { getSupabaseClient } from '../../../core/database'
import { toCamelCase, toSnakeCase } from '../../../core/database/mappers'

const CHANNEL_SELECT = '*, category:tv_categories(*)'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function unavailable(defaultValue) {
  return {
    data: defaultValue,
    count: Array.isArray(defaultValue) ? defaultValue.length : 0,
    error: null,
    source: 'unavailable',
  }
}

function adminUnavailable(defaultValue) {
  return {
    data: defaultValue,
    count: Array.isArray(defaultValue) ? defaultValue.length : 0,
    error: new Error('Supabase nao configurado para o TV Manager.'),
    source: 'unavailable',
  }
}

function result(data, error, count) {
  return {
    data: toCamelCase(data || []),
    count: count ?? (Array.isArray(data) ? data.length : 0),
    error,
    source: 'supabase',
  }
}

export class TVRepository {
  constructor(client = null) {
    this.client = client
  }

  getClient() {
    return this.client || getSupabaseClient()
  }

  async listCategories() {
    const client = this.getClient()
    if (!client) return unavailable([])
    const { data, error } = await client
      .from('tv_categories')
      .select('*')
      .eq('enabled', true)
      .order('display_order')
      .order('name')
    return result(data, error)
  }

  async listChannels({ categoryId, search, page = 1, pageSize = 48 } = {}) {
    const client = this.getClient()
    if (!client) return unavailable([])
    const from = (page - 1) * pageSize
    let query = client
      .from('tv_channels')
      .select(CHANNEL_SELECT, { count: 'exact' })
      .eq('enabled', true)

    if (categoryId) query = query.eq('category_id', categoryId)
    if (search?.trim()) {
      const term = search.trim().replaceAll(',', ' ')
      query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`)
    }

    const { data, error, count } = await query
      .order('display_order')
      .order('name')
      .range(from, from + pageSize - 1)
    return result(data, error, count)
  }

  async findChannel(idOrSlug) {
    const client = this.getClient()
    if (!client || !idOrSlug) return unavailable(null)
    const value = String(idOrSlug)
    const filter = UUID_PATTERN.test(value)
      ? `id.eq.${value},slug.eq.${value}`
      : `slug.eq.${value}`
    const { data, error } = await client
      .from('tv_channels')
      .select(CHANNEL_SELECT)
      .eq('enabled', true)
      .or(filter)
      .maybeSingle()
    return { ...result(data ? toCamelCase(data) : null, error), data: data ? toCamelCase(data) : null }
  }

  async listFeatured() {
    const client = this.getClient()
    if (!client) return unavailable([])
    const now = new Date().toISOString()
    const { data, error } = await client
      .from('tv_featured')
      .select('*, channel:tv_channels!inner(*)')
      .or(`start_at.is.null,start_at.lte.${now}`)
      .or(`end_at.is.null,end_at.gte.${now}`)
      .eq('channel.enabled', true)
      .order('priority')
    return result(data, error)
  }

  async listFavorites(userId) {
    const client = this.getClient()
    if (!client || !userId) return unavailable([])
    const { data, error } = await client
      .from('tv_favorites')
      .select('*, channel:tv_channels!inner(*)')
      .eq('user_id', userId)
      .eq('channel.enabled', true)
      .order('created_at', { ascending: false })
    return result(data, error)
  }

  async addFavorite(userId, channelId) {
    const client = this.getClient()
    if (!client) return unavailable(null)
    const { data, error } = await client
      .from('tv_favorites')
      .upsert({ user_id: userId, channel_id: channelId })
      .select('*')
      .single()
    return { ...result(data ? toCamelCase(data) : null, error), data: data ? toCamelCase(data) : null }
  }

  async removeFavorite(userId, channelId) {
    const client = this.getClient()
    if (!client) return unavailable(null)
    const { error } = await client
      .from('tv_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('channel_id', channelId)
    return { data: !error, error, source: 'supabase' }
  }

  async listRecent(userId, limit = 20) {
    const client = this.getClient()
    if (!client || !userId) return unavailable([])
    const { data, error } = await client
      .from('tv_recent')
      .select('*, channel:tv_channels!inner(*)')
      .eq('user_id', userId)
      .eq('channel.enabled', true)
      .order('last_watch', { ascending: false })
      .limit(limit)
    return result(data, error)
  }

  async saveRecent(userId, channelId, watchTime = 0) {
    const client = this.getClient()
    if (!client) return unavailable(null)
    const { data, error } = await client
      .from('tv_recent')
      .upsert({
        user_id: userId,
        channel_id: channelId,
        last_watch: new Date().toISOString(),
        watch_time: Math.max(0, Math.floor(watchTime)),
      })
      .select('*')
      .single()
    return { ...result(data ? toCamelCase(data) : null, error), data: data ? toCamelCase(data) : null }
  }

  async listAdminCategories() {
    const client = this.getClient()
    if (!client) return adminUnavailable([])
    const { data, error } = await client
      .from('tv_categories')
      .select('*, channels:tv_channels(count)')
      .order('display_order')
      .order('name')
    const mapped = (data || []).map((item) => ({
      ...toCamelCase(item),
      channelCount: item.channels?.[0]?.count || 0,
    }))
    return { data: mapped, count: mapped.length, error, source: 'supabase' }
  }

  async createCategory(payload) {
    return this.createRecord('tv_categories', payload)
  }

  async updateCategory(id, payload) {
    return this.updateRecord('tv_categories', id, payload)
  }

  async deleteCategory(id, moveToCategoryId = null) {
    const client = this.getClient()
    if (!client) return adminUnavailable(null)
    const { count, error: countError } = await client
      .from('tv_channels')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)
    if (countError) return { data: null, error: countError, source: 'supabase' }
    if (count > 0 && !moveToCategoryId) {
      return {
        data: null,
        error: new Error(`A categoria possui ${count} canal(is). Escolha uma categoria de destino.`),
        linkedChannels: count,
        source: 'supabase',
      }
    }
    if (count > 0) {
      const { error: moveError } = await client
        .from('tv_channels')
        .update({ category_id: moveToCategoryId })
        .eq('category_id', id)
      if (moveError) return { data: null, error: moveError, linkedChannels: count, source: 'supabase' }
    }
    const { error } = await client.from('tv_categories').delete().eq('id', id)
    return { data: !error, error, linkedChannels: count || 0, source: 'supabase' }
  }

  async reorderCategories(items) {
    return this.updateOrder('tv_categories', items, 'display_order')
  }

  async listAdminChannels({
    categoryId,
    provider,
    status,
    featured,
    verified,
    search,
    page = 1,
    pageSize = 20,
    sortBy = 'display_order',
    ascending = true,
  } = {}) {
    const client = this.getClient()
    if (!client) return adminUnavailable([])
    const allowedSorts = new Set(['display_order', 'name', 'updated_at', 'views', 'created_at'])
    const from = (page - 1) * pageSize
    let query = client.from('tv_channels').select(CHANNEL_SELECT, { count: 'exact' })
    if (categoryId) query = query.eq('category_id', categoryId)
    if (provider) query = query.eq('provider', provider)
    if (status === 'active') query = query.eq('enabled', true)
    if (status === 'inactive') query = query.eq('enabled', false)
    if (featured !== '') query = query.eq('featured', featured === true || featured === 'true')
    if (verified !== '') query = query.eq('verified', verified === true || verified === 'true')
    if (search?.trim()) {
      const term = search.trim().replaceAll(',', ' ')
      query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,slug.ilike.%${term}%`)
    }
    const { data, error, count } = await query
      .order(allowedSorts.has(sortBy) ? sortBy : 'display_order', { ascending })
      .order('name')
      .range(from, from + pageSize - 1)
    return result(data, error, count)
  }

  async findAdminChannel(id) {
    const client = this.getClient()
    if (!client) return adminUnavailable(null)
    const { data, error } = await client
      .from('tv_channels')
      .select(CHANNEL_SELECT)
      .eq('id', id)
      .maybeSingle()
    return { data: data ? toCamelCase(data) : null, error, source: 'supabase' }
  }

  async createChannel(payload) {
    return this.createRecord('tv_channels', payload)
  }

  async updateChannel(id, payload) {
    return this.updateRecord('tv_channels', id, payload)
  }

  async patchChannel(id, payload) {
    const allowed = new Set(['enabled', 'featured', 'verified', 'categoryId', 'displayOrder'])
    const safePayload = Object.fromEntries(
      Object.entries(payload).filter(([key]) => allowed.has(key)),
    )
    if (!Object.keys(safePayload).length) {
      return { data: null, error: new Error('Nenhuma alteracao permitida foi informada.'), source: 'validation' }
    }
    return this.updateRecord('tv_channels', id, safePayload)
  }

  async deleteChannel(id) {
    const client = this.getClient()
    if (!client) return adminUnavailable(null)
    const { error } = await client.from('tv_channels').delete().eq('id', id)
    return { data: !error, error, source: 'supabase' }
  }

  async bulkUpdateChannels(ids, payload) {
    const client = this.getClient()
    if (!client) return adminUnavailable([])
    const { data, error } = await client
      .from('tv_channels')
      .update(toSnakeCase(payload))
      .in('id', ids)
      .select('*')
    return result(data, error)
  }

  async reorderChannels(items) {
    return this.updateOrder('tv_channels', items, 'display_order')
  }

  async listAdminFeatured() {
    const client = this.getClient()
    if (!client) return adminUnavailable([])
    const { data, error } = await client
      .from('tv_featured')
      .select('*, channel:tv_channels!inner(*, category:tv_categories(*))')
      .order('priority')
    return result(data, error)
  }

  async setFeatured(channelId, payload = {}) {
    const client = this.getClient()
    if (!client) return adminUnavailable(null)
    const record = toSnakeCase({
      channelId,
      priority: payload.priority ?? 0,
      startAt: payload.startAt || null,
      endAt: payload.endAt || null,
    })
    const { data, error } = await client
      .from('tv_featured')
      .upsert(record, { onConflict: 'channel_id' })
      .select('*')
      .single()
    let finalError = error
    if (!error) {
      const channelUpdate = await client.from('tv_channels').update({ featured: true }).eq('id', channelId)
      finalError = channelUpdate.error
    }
    return { data: data ? toCamelCase(data) : null, error: finalError, source: 'supabase' }
  }

  async removeFeatured(channelId) {
    const client = this.getClient()
    if (!client) return adminUnavailable(null)
    const { error } = await client.from('tv_featured').delete().eq('channel_id', channelId)
    let finalError = error
    if (!error) {
      const channelUpdate = await client.from('tv_channels').update({ featured: false }).eq('id', channelId)
      finalError = channelUpdate.error
    }
    return { data: !finalError, error: finalError, source: 'supabase' }
  }

  async reorderFeatured(items) {
    return this.updateOrder('tv_featured', items, 'priority')
  }

  async getDashboardMetrics() {
    const client = this.getClient()
    if (!client) return adminUnavailable({
      totalCategories: 0,
      activeCategories: 0,
      totalChannels: 0,
      activeChannels: 0,
      inactiveChannels: 0,
      featuredChannels: 0,
      verifiedChannels: 0,
      channelsWithoutLogo: 0,
      channelsWithoutCategory: 0,
      totalViews: 0,
    })
    const count = async (table, apply = (query) => query) => {
      const response = await apply(client.from(table).select('id', { count: 'exact', head: true }))
      return response
    }
    const responses = await Promise.all([
      count('tv_categories'),
      count('tv_categories', (query) => query.eq('enabled', true)),
      count('tv_channels'),
      count('tv_channels', (query) => query.eq('enabled', true)),
      count('tv_channels', (query) => query.eq('enabled', false)),
      count('tv_channels', (query) => query.eq('featured', true)),
      count('tv_channels', (query) => query.eq('verified', true)),
      client.from('tv_channels').select('logo, category_id, views'),
    ])
    const error = responses.find((response) => response.error)?.error || null
    const channelDetails = responses[7].data || []
    const views = channelDetails.reduce((sum, channel) => sum + Number(channel.views || 0), 0)
    return {
      data: {
        totalCategories: responses[0].count || 0,
        activeCategories: responses[1].count || 0,
        totalChannels: responses[2].count || 0,
        activeChannels: responses[3].count || 0,
        inactiveChannels: responses[4].count || 0,
        featuredChannels: responses[5].count || 0,
        verifiedChannels: responses[6].count || 0,
        channelsWithoutLogo: channelDetails.filter((channel) => !channel.logo).length,
        channelsWithoutCategory: channelDetails.filter((channel) => !channel.category_id).length,
        totalViews: views,
      },
      error,
      source: 'supabase',
    }
  }

  async slugExists(table, slug, excludeId = null) {
    const client = this.getClient()
    if (!client) return { exists: false, error: adminUnavailable(null).error }
    let query = client.from(table).select('id', { count: 'exact', head: true }).eq('slug', slug)
    if (excludeId) query = query.neq('id', excludeId)
    const { count, error } = await query
    return { exists: (count || 0) > 0, error }
  }

  async createRecord(table, payload) {
    const client = this.getClient()
    if (!client) return adminUnavailable(null)
    const { data, error } = await client
      .from(table)
      .insert(toSnakeCase(payload))
      .select('*')
      .single()
    return { data: data ? toCamelCase(data) : null, error, source: 'supabase' }
  }

  async updateRecord(table, id, payload) {
    const client = this.getClient()
    if (!client) return adminUnavailable(null)
    const { data, error } = await client
      .from(table)
      .update(toSnakeCase(payload))
      .eq('id', id)
      .select('*')
      .single()
    return { data: data ? toCamelCase(data) : null, error, source: 'supabase' }
  }

  async updateOrder(table, items, column) {
    const client = this.getClient()
    if (!client) return adminUnavailable([])
    const updates = await Promise.all(items.map(({ id, order }) => (
      client.from(table).update({ [column]: order }).eq('id', id)
    )))
    const error = updates.find((response) => response.error)?.error || null
    return { data: !error, error, source: 'supabase' }
  }
}

export const tvRepository = new TVRepository()
