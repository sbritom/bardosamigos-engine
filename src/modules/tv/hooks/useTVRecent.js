import { useTVContext } from './useTVContext'

export function useTVRecent() {
  const { recent, loading, error, refresh } = useTVContext()
  return { ...recent, loading, error, refresh }
}
