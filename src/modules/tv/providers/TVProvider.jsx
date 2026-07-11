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

const EMPTY_COLLECTION = { data: [], count: 0, error: null }

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
      TVChannelService.list(filters),
      TVFeaturedService.list(),
      userId ? TVFavoriteService.list(userId) : Promise.resolve(EMPTY_COLLECTION),
      userId ? TVRecentService.list(userId) : Promise.resolve(EMPTY_COLLECTION),
    ]
    const [categoryResult, channelResult, featuredResult, favoriteResult, recentResult] =
      await Promise.all(requests)
    setCategories(categoryResult)
    setChannels(channelResult)
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
  }, [filters, userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(() => ({
    categories,
    channels,
    featured,
    favorites,
    recent,
    filters,
    loading,
    error,
    setFilters,
    refresh,
  }), [categories, channels, featured, favorites, recent, filters, loading, error, refresh])

  return <TVContext.Provider value={value}>{children}</TVContext.Provider>
}
