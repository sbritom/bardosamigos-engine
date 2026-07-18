const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3/videos'
const DEFAULT_LIMIT = 5
const MAX_LIMIT = 5
const FETCH_LIMIT = 25
const REQUEST_TIMEOUT_MS = 8000
const BLOCKED_TITLE_PATTERNS = [
  /\bcover\b/i,
  /\bkaraoke\b/i,
  /\bkaraokê\b/i,
  /\bplayback\b/i,
  /\binstrumental\b/i,
  /\bslowed\b/i,
  /\bspeed\s+up\b/i,
  /\bsped\s+up\b/i,
  /\bremix\b/i,
  /\bfan\s+made\b/i,
  /\bunofficial\b/i,
  /\breupload\b/i,
  /\bshorts\b/i,
]
const OFFICIAL_CHANNEL_PATTERNS = [
  /\bvevo\b/i,
  /\bofficial\b/i,
  /\boficial\b/i,
  /\brecords\b/i,
  /\brecordings\b/i,
  /\bmusic\b/i,
  /\bsony\b/i,
  /\bwarner\b/i,
  /\buniversal\b/i,
  /\bsom\s+livre\b/i,
  /\btratore\b/i,
  /\bdeck\b/i,
  /\bmk\s+music\b/i,
]

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

function hasBlockedTitle(title = '') {
  return BLOCKED_TITLE_PATTERNS.some((pattern) => pattern.test(title))
}

function getOfficialChannelScore(channelTitle = '') {
  return OFFICIAL_CHANNEL_PATTERNS.reduce((score, pattern) => score + (pattern.test(channelTitle) ? 1 : 0), 0)
}

function getVideoScore(video = {}) {
  const snippet = video.snippet || {}
  const statistics = video.statistics || {}
  const officialScore = getOfficialChannelScore(snippet.channelTitle)
  const viewCount = Number(statistics.viewCount || 0)
  const likeCount = Number(statistics.likeCount || 0)

  return officialScore * 1_000_000_000 + viewCount + likeCount
}

function selectBestVideos(videos = [], limit = DEFAULT_LIMIT) {
  return videos
    .filter((video) => !hasBlockedTitle(video.snippet?.title || ''))
    .map((video, index) => ({
      video,
      index,
      score: getVideoScore(video),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      return left.index - right.index
    })
    .slice(0, limit)
    .map((item, index) => normalizeVideo(item.video, index))
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
      maxResults: String(FETCH_LIMIT),
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
      hits: Array.isArray(payload.items) ? selectBestVideos(payload.items, limit) : [],
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
