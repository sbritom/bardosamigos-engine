const aiCache = new Map()

export function createCacheKey(parts = {}) {
  return JSON.stringify(parts, Object.keys(parts).sort())
}

export function getCache(key) {
  const entry = aiCache.get(key)

  if (!entry) {
    return null
  }

  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    aiCache.delete(key)
    return null
  }

  return entry.value
}

export function setCache(key, value, ttlMs = 5 * 60 * 1000) {
  aiCache.set(key, {
    value,
    expiresAt: ttlMs > 0 ? Date.now() + ttlMs : null,
  })

  return value
}

export function clearCache(key) {
  if (key) {
    aiCache.delete(key)
    return
  }

  aiCache.clear()
}
