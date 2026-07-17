const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3/videos'
const DEFAULT_LIMIT = 3
const MAX_LIMIT = 6
const REQUEST_TIMEOUT_MS = 8000

function getApiKey() {
  return String(process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY || '').trim()
}

function getLimit(value) {
  const limit = Number.parseInt(String(value || DEFAULT_LIMIT), 10)
  if (!Number.isFinite(limit) || limit <= 0) return DEFAULT_LIMIT
  return Math.min(limit, MAX_LIMIT)
}

function getThumbnail(thumbnails = {}) {
  return thumbnails.maxres?.url
    || thumbnails.high?.url
    || thumbnails.medium?.url
    || thumbnails.standard?.url
    || thumbnails.default?.url
    || ''
}

function normalizeVideo(video = {}, index = 0) {
  const snippet = video.snippet || {}
  const id = video.id || ''

  return {
    id,
    position: index + 1,
    title: snippet.title || 'Hit indisponivel',
    channelTitle: snippet.channelTitle || 'YouTube',
    thumbnail: getThumbnail(snippet.thumbnails),
    url: id ? `https://www.youtube.com/watch?v=${id}` : '',
    publishedAt: snippet.publishedAt || '',
  }
}

async function fetchYoutubeHits({ limit }) {
  const apiKey = getApiKey()
  if (!apiKey) {
    return {
      hits: [],
      errors: [{ message: 'YouTube API key nao configurada.' }],
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const params = new URLSearchParams({
      part: 'snippet,statistics',
      chart: 'mostPopular',
      regionCode: 'BR',
      videoCategoryId: '10',
      maxResults: String(limit),
      key: apiKey,
    })
    const response = await fetch(`${YOUTUBE_API_BASE_URL}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        hits: [],
        errors: [{ message: payload.error?.message || `YouTube retornou ${response.status}.` }],
      }
    }

    return {
      hits: Array.isArray(payload.items) ? payload.items.map(normalizeVideo) : [],
      errors: [],
    }
  } catch (error) {
    return {
      hits: [],
      errors: [{ message: error.name === 'AbortError' ? 'Timeout ao consultar YouTube.' : error.message || 'Falha ao consultar YouTube.' }],
    }
  } finally {
    clearTimeout(timeout)
  }
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const limit = getLimit(request.query?.limit)
  const payload = await fetchYoutubeHits({ limit })

  response.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=600')
  response.status(200).json({
    source: 'youtube',
    region: 'BR',
    category: 'music',
    hits: payload.hits,
    errors: payload.errors,
  })
}
