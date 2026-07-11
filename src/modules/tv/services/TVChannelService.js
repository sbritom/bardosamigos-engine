import { tvRepository } from '../repository'
import { normalizeTVEmbedUrl, slugifyTVValue } from '../utils'

function normalizeChannel(payload) {
  const embed = normalizeTVEmbedUrl(payload.embedUrl)
  return {
    data: {
      name: String(payload.name || '').trim(),
      slug: slugifyTVValue(payload.slug || payload.name),
      description: String(payload.description || '').trim() || null,
      categoryId: payload.categoryId || null,
      logo: String(payload.logo || '').trim() || null,
      provider: payload.provider || 'other',
      embedUrl: embed.url,
      country: String(payload.country || '').trim() || null,
      language: String(payload.language || '').trim() || null,
      featured: Boolean(payload.featured),
      verified: Boolean(payload.verified),
      enabled: payload.enabled !== false,
      displayOrder: Math.max(0, Number(payload.displayOrder) || 0),
    },
    embed,
  }
}

async function validate(payload, excludeId) {
  const normalized = normalizeChannel(payload)
  if (!normalized.data.name) return { data: normalized.data, error: new Error('Informe o nome do canal.') }
  if (!normalized.data.categoryId) return { data: normalized.data, error: new Error('Selecione uma categoria.') }
  if (!normalized.data.slug) return { data: normalized.data, error: new Error('Informe um slug valido.') }
  if (!normalized.embed.valid) return { data: normalized.data, error: new Error(normalized.embed.error) }
  const duplicate = await tvRepository.slugExists('tv_channels', normalized.data.slug, excludeId)
  if (duplicate.error) return { data: normalized.data, error: duplicate.error }
  if (duplicate.exists) return { data: normalized.data, error: new Error('Este slug ja esta em uso.') }
  return { data: normalized.data, error: null }
}

export const TVChannelService = {
  list: (query) => tvRepository.listChannels(query),
  find: (idOrSlug) => tvRepository.findChannel(idOrSlug),
  search: (search, options = {}) => tvRepository.listChannels({ ...options, search }),
  listByCategory: (categoryId, options = {}) => tvRepository.listChannels({ ...options, categoryId }),
  listAdmin: (query) => tvRepository.listAdminChannels(query),
  findAdmin: (id) => tvRepository.findAdminChannel(id),
  async createChannel(payload) {
    const validation = await validate(payload)
    return validation.error ? validation : tvRepository.createChannel(validation.data)
  },
  async updateChannel(id, payload) {
    const validation = await validate(payload, id)
    return validation.error ? validation : tvRepository.updateChannel(id, validation.data)
  },
  updateChannelState: (id, payload) => tvRepository.patchChannel(id, payload),
  async duplicateChannel(channel) {
    const copy = {
      ...channel,
      name: `${channel.name} - copia`,
      slug: `${channel.slug}-copia-${Date.now().toString().slice(-5)}`,
      featured: false,
      enabled: false,
    }
    delete copy.id
    delete copy.category
    delete copy.createdAt
    delete copy.updatedAt
    return this.createChannel(copy)
  },
  deleteChannel: (id) => tvRepository.deleteChannel(id),
  bulkUpdateChannels: (ids, payload) => tvRepository.bulkUpdateChannels(ids, payload),
  reorderChannels: (items) => tvRepository.reorderChannels(items),
  getDashboardMetrics: () => tvRepository.getDashboardMetrics(),
}
