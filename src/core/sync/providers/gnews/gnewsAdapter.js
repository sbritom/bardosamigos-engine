import { createSyncCacheKey, getSyncCache, setSyncCache } from '../../cache/syncCache.js'
import { GNEWS_BASE_URL, GNEWS_DEFAULT_COUNTRY, GNEWS_DEFAULT_LANG, GNEWS_DEFAULT_MAX, GNEWS_ENDPOINTS } from './gnewsConstants.js'

function createConfigError() {
  return new Error('GNews API key is not configured. Set VITE_GNEWS_API_KEY in the sync runtime.')
}

export function createGNewsAdapter(options = {}) {
  const baseUrl = options.baseUrl || GNEWS_BASE_URL
  const apiKey = options.apiKey || import.meta.env?.VITE_GNEWS_API_KEY
  const fetcher = options.fetcher || fetch

  async function request(path, params = {}) {
    const cacheKey = createSyncCacheKey(`gnews:${path}`, params)
    const cached = getSyncCache(cacheKey)
    if (cached) return cached

    if (!apiKey) {
      return { data: null, error: createConfigError(), fromCache: false }
    }

    const url = new URL(`${baseUrl}${path}`)
    Object.entries({
      lang: GNEWS_DEFAULT_LANG,
      country: GNEWS_DEFAULT_COUNTRY,
      max: GNEWS_DEFAULT_MAX,
      ...params,
      apikey: apiKey,
    }).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value)
      }
    })

    try {
      const response = await fetcher(url.toString())
      if (!response.ok) {
        let detail = ''
        try {
          const body = await response.json()
          detail = body?.errors?.join(', ') || body?.message || ''
        } catch {
          detail = ''
        }

        return {
          data: null,
          error: new Error(`GNews request failed with status ${response.status}${detail ? `: ${detail}` : ''}`),
          fromCache: false,
        }
      }

      const result = { data: await response.json(), error: null, fromCache: false }
      return setSyncCache(cacheKey, result)
    } catch (error) {
      return { data: null, error, fromCache: false }
    }
  }

  return {
    fetchNews({ query, max, lang, country } = {}) {
      return request(GNEWS_ENDPOINTS.SEARCH, {
        q: query,
        max,
        lang,
        country,
      })
    },
  }
}
