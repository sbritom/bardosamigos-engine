import { createSyncCacheKey, getSyncCache, setSyncCache } from '../../cache/syncCache.js'
import { FOOTBALL_DATA_BASE_URL, FOOTBALL_DATA_ENDPOINTS } from './footballDataConstants.js'

function createConfigError() {
  return new Error('Football-Data API key is not configured. Set VITE_FOOTBALL_DATA_API_KEY in the sync runtime.')
}

function normalizeApiKey(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '').trim()
}

export function createFootballDataAdapter(options = {}) {
  const baseUrl = options.baseUrl || FOOTBALL_DATA_BASE_URL
  const apiKey = normalizeApiKey(options.apiKey || import.meta.env?.VITE_FOOTBALL_DATA_API_KEY)
  const fetcher = options.fetcher || fetch

  async function request(path, params = {}) {
    const cacheKey = createSyncCacheKey(`football-data:${path}`, params)
    const cached = getSyncCache(cacheKey)
    if (cached) return cached

    if (!apiKey) {
      return { data: null, error: createConfigError(), fromCache: false }
    }

    const url = new URL(`${baseUrl}${path}`)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value)
      }
    })

    try {
      const response = await fetcher(url.toString(), {
        headers: {
          'X-Auth-Token': apiKey,
        },
      })

      if (!response.ok) {
        return { data: null, error: new Error(`Football-Data request failed with status ${response.status}`), fromCache: false }
      }

      const result = { data: await response.json(), error: null, fromCache: false }
      return setSyncCache(cacheKey, result)
    } catch (error) {
      return { data: null, error, fromCache: false }
    }
  }

  return {
    fetchCompetitions() {
      return request(FOOTBALL_DATA_ENDPOINTS.COMPETITIONS)
    },

    fetchTeams(competitionCode, params = {}) {
      return request(FOOTBALL_DATA_ENDPOINTS.TEAMS(competitionCode), params)
    },

    fetchMatches(competitionCode, params = {}) {
      return request(FOOTBALL_DATA_ENDPOINTS.MATCHES(competitionCode), params)
    },

    fetchUpcomingMatches(competitionCode, params = {}) {
      return request(FOOTBALL_DATA_ENDPOINTS.MATCHES(competitionCode), {
        status: 'SCHEDULED',
        ...params,
      })
    },

    fetchFinishedMatches(competitionCode, params = {}) {
      return request(FOOTBALL_DATA_ENDPOINTS.MATCHES(competitionCode), {
        status: 'FINISHED',
        ...params,
      })
    },

    fetchStandings(competitionCode, params = {}) {
      return request(FOOTBALL_DATA_ENDPOINTS.STANDINGS(competitionCode), params)
    },
  }
}
