import { useTVContext } from './useTVContext'

export function useTVCategories() {
  const { categories, loading, error, refresh } = useTVContext()
  return { ...categories, loading, error, refresh }
}
