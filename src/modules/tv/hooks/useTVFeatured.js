import { useTVContext } from './useTVContext'

export function useTVFeatured() {
  const { featured, loading, error, refresh } = useTVContext()
  return { ...featured, loading, error, refresh }
}
