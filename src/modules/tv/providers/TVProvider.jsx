import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  TVCategoryService,
  TVChannelService,
  TVFavoriteService,
  TVFeaturedService,
  TVRecentService,
} from '../services'
import { TVContext } from '../runtime'
import { normalizeTVError } from '../utils'
import { getLocalTVPlatformCatalog } from '../data/tvFallbackCatalog'

const EMPTY_COLLECTION = { data: [], count: 0, error: null }

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function filterCatalogChannels(channels, filters) {
  const search = normalizeSearchText(filters.search)

  return channels.filter((channel) => {
    const matchesCategory = !filters.categoryId
      || channel.categoryId === filters.categoryId
      || channel.category?.id === filters.categoryId

    if (!matchesCategory) return false
    if (!search) return true

    const searchable = normalizeSearchText([
      channel.name,
      channel.slug,
      channel.description,
      channel.category?.name,
      channel.language,
    ].filter(Boolean).join(' '))

    return searchable.includes(search)
  })
}

export function TVProvider({ children, userId = null }) {
  const [categories, setCategories] = useState(EMPTY_COLLECTION)
  const [channels, setChannels] = useState(EMPTY_COLLECTION)
  const [featured, setFeatured] = useState(EMPTY_COLLECTION)
  const [favorites, setFavorites] = useState(EMPTY_COLLECTION)
  const [recent, setRecent] = useState(EMPTY_COLLECTION)
  const [filters, setFilters] = useState({ categoryId: '', search: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    const requests = [
      TVCategoryService.list(),
      TVChannelService.list(),
      TVFeaturedService.list(),
      userId ? TVFavoriteService.list(userId) : Promise.resolve(EMPTY_COLLECTION),
      userId ? TVRecentService.list(userId) : Promise.resolve(EMPTY_COLLECTION),
    ]

    const [categoryResult, channelResult, featuredResult, favoriteResult, recentResult] =
      await Promise.all(requests)

    const fallback = getLocalTVPlatformCatalog()
    const shouldFallbackChannels = Boolean(channelResult.error) || !channelResult.data?.length
    const shouldFallbackCategories = shouldFallbackChannels
      || Boolean(categoryResult.error)
      || !categoryResult.data?.length

    const finalCategories = shouldFallbackCategories
      ? {
        data: fallback.categories,
        count: fallback.categories.length,
        error: categoryResult.error || channelResult.error || null,
        source: 'local-fallback',
      }
      : categoryResult

    const finalChannels = shouldFallbackChannels
      ? {
        data: fallback.channels,
        count: fallback.channels.length,
        error: channelResult.error || null,
        source: 'local-fallback',
      }
      : channelResult

    setCategories(finalCategories)
    setChannels(finalChannels)
    setFeatured(featuredResult)
    setFavorites(favoriteResult)
    setRecent(recentResult)
    setError(normalizeTVError(
      categoryResult.error
      || channelResult.error
      || featuredResult.error
      || favoriteResult.error
      || recentResult.error,
    ))
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const filteredChannelData = useMemo(
    () => filterCatalogChannels(channels.data || [], filters),
    [channels.data, filters],
  )

  const filteredChannels = useMemo(() => ({
    ...channels,
    data: filteredChannelData,
    filteredCount: filteredChannelData.length,
    allData: channels.data || [],
  }), [channels, filteredChannelData])

  const value = useMemo(() => ({
    categories,
    channels: filteredChannels,
    featured,
    favorites,
    recent,
    filters,
    loading,
    error,
    setFilters,
    refresh,
  }), [categories, filteredChannels, featured, favorites, recent, filters, loading, error, refresh])

  return <TVContext.Provider value={value}>{children}</TVContext.Provider>
}
