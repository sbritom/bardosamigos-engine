import { SYNC_CACHE_TTL } from '../constants.js'

const cache = new Map()

export function createSyncCacheKey(integration, params = {}) {
  return `${integration}:${JSON.stringify(params)}`
}

export function getSyncCache(key) {
  const entry = cache.get(key)
  if (!entry) return null

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key)
    return null
  }

  return entry.value
}

export function setSyncCache(key, value, ttl = SYNC_CACHE_TTL) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttl,
  })

  return value
}

export function clearSyncCache(key) {
  if (key) {
    cache.delete(key)
    return
  }

  cache.clear()
}
