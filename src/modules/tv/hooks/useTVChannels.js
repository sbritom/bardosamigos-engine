import { useCallback } from 'react'
import { useTVContext } from './useTVContext'

export function useTVChannels() {
  const { channels, filters, setFilters, loading, error, refresh } = useTVContext()
  const setSearch = useCallback((search) => setFilters((current) => ({ ...current, search })), [setFilters])
  const setCategory = useCallback((categoryId) => {
    setFilters((current) => ({ ...current, categoryId }))
  }, [setFilters])
  return { ...channels, filters, setSearch, setCategory, loading, error, refresh }
}
