import { TVChannelService } from './TVChannelService'
import { getLocalTVHomeCatalog } from '../data/tvFallbackCatalog'

function toHomeChannel(channel) {
  return {
    id: channel.slug || channel.id,
    name: channel.name,
    category: channel.category?.name || channel.language || 'TV',
    src: channel.embedUrl,
  }
}

function buildCategories(channels) {
  return [
    'Todos',
    ...Array.from(new Set(channels.map((channel) => channel.category).filter(Boolean))),
  ]
}

export function getLocalTVChannelsForHome() {
  return getLocalTVHomeCatalog()
}

export async function loadHomeTVChannels() {
  const fallback = getLocalTVHomeCatalog()

  try {
    const response = await TVChannelService.list({ page: 1, pageSize: 500 })
    const channels = (response.data || [])
      .filter((channel) => channel?.embedUrl)
      .map(toHomeChannel)

    if (response.error || channels.length === 0) {
      return {
        ...fallback,
        error: response.error || null,
        fallbackReason: response.error ? 'supabase-error' : 'supabase-empty',
      }
    }

    return {
      channels,
      categories: buildCategories(channels),
      duplicates: [],
      source: 'supabase',
      error: null,
      fallbackReason: null,
    }
  } catch (error) {
    return {
      ...fallback,
      error,
      fallbackReason: 'supabase-exception',
    }
  }
}
