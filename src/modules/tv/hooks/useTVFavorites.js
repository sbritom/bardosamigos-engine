import { useTVContext } from './useTVContext'

export function useTVFavorites() {
  const { favorites, loading, error, refresh } = useTVContext()
  return { ...favorites, loading, error, refresh }
}
