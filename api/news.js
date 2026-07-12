const GNEWS_BASE_URL = 'https://gnews.io/api/v4'
const NEWS_LIMIT = 12
const MAX_NEWS_LIMIT = 30
const TOPIC_MAX = 5
const REQUEST_TIMEOUT_MS = 8000
const WORLD_CUP_YEAR = 2026

const TOPICS = Object.freeze([
  { category: 'Brasil', query: 'brasil', weight: 16 },
  { category: 'Esportes', query: 'futebol OR esportes', weight: 14 },
  { category: 'Entretenimento', query: 'entretenimento', weight: 10 },
  { category: 'Tecnologia', query: 'tecnologia', weight: 10 },
])

const WORLD_CUP_TOPIC = Object.freeze({
  category: 'Esportes',
  query: '"Copa do Mundo" OR futebol OR esportes',
  weight: 15,
})

function getApiKey() {
  return String(process.env.GNEWS_API_KEY || '').trim()
}

function isWorldCupWindow(now = new Date()) {
  const start = new Date(`${WORLD_CUP_YEAR}-06-11T00:00:00-03:00`).getTime()
  const end = new Date(`${WORLD_CUP_YEAR}-07-19T23:59:59-03:00`).getTime()
  const time = now.getTime()

  return time >= start && time <= end
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function createSlug(value) {
  return normalizeText(value).replace(/\s+/g, '-').slice(0, 90)
}

function normalizeUrl(value) {
  try {
    const url = new URL(value)
    url.hash = ''
    ;['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => url.searchParams.delete(key))
    return url.toString()
  } catch {
    return String(value || '').trim()
  }
}

function getPublishedTime(article = {}) {
  const timestamp = new Date(article.publishedAt || article.published_at || 0).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function getTopicScore(article = {}, topic = {}) {
  const title = normalizeText(article.title)
  const description = normalizeText(article.description || article.content)
  const text = `${title} ${description}`
  const worldCupBoost = /copa do mundo|fifa world cup|mundial/.test(text) ? 5 : 0

  return (topic.weight || 0) + worldCupBoost
}

function mapArticle(article = {}, topic = {}) {
  const publishedAt = article.publishedAt || new Date().toISOString()
  const sourceName = article.source?.name || 'GNews'
  const canonicalUrl = normalizeUrl(article.url)
  const idSource = canonicalUrl || `${article.title || 'noticia'}-${publishedAt}`

  return {
    id: `gnews-${createSlug(idSource)}`,
    title: article.title || 'Noticia sem titulo',
    category: topic.category || 'Brasil',
    date: publishedAt,
    image: article.image || '',
    source: sourceName,
    publishedAt,
    url: canonicalUrl,
    coverUrl: article.image || '',
    metadata: {
      provider: 'gnews.io',
      category: topic.category || 'Brasil',
      source: sourceName,
      sourceUrl: canonicalUrl,
      originalUrl: canonicalUrl,
      relevanceScore: getTopicScore(article, topic),
    },
  }
}

function dedupeArticles(articles = []) {
  const seenUrls = new Set()
  const seenTitles = new Set()
  const deduped = []

  for (const article of articles) {
    const urlKey = normalizeUrl(article.url || article.metadata?.originalUrl || article.metadata?.sourceUrl)
    const titleKey = normalizeText(article.title)

    if (urlKey && seenUrls.has(urlKey)) continue
    if (titleKey && seenTitles.has(titleKey)) continue

    if (urlKey) seenUrls.add(urlKey)
    if (titleKey) seenTitles.add(titleKey)
    deduped.push(article)
  }

  return deduped
}

function sortArticles(articles = []) {
  return [...articles].sort((left, right) => {
    const scoreDiff = (right.metadata?.relevanceScore || 0) - (left.metadata?.relevanceScore || 0)
    const timeDiff = getPublishedTime(right) - getPublishedTime(left)

    return scoreDiff || timeDiff
  })
}

function balanceArticlesByCategory(articles = []) {
  const groups = articles.reduce((acc, article) => {
    const category = article.category || 'Brasil'
    acc[category] = acc[category] || []
    acc[category].push(article)
    return acc
  }, {})
  const categories = Object.keys(groups)
  const balanced = []

  while (categories.some((category) => groups[category].length)) {
    for (const category of categories) {
      const next = groups[category].shift()
      if (next) balanced.push(next)
    }
  }

  return balanced
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchTopic({ apiKey, topic }) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const url = new URL(`${GNEWS_BASE_URL}/search`)
  url.searchParams.set('q', topic.query)
  url.searchParams.set('lang', 'pt')
  url.searchParams.set('country', 'br')
  url.searchParams.set('max', String(TOPIC_MAX))
  url.searchParams.set('apikey', apiKey)

  try {
    const response = await fetch(url, { signal: controller.signal })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        articles: [],
        error: {
          category: topic.category,
          status: response.status,
          message: payload?.errors?.join(', ') || payload?.message || `GNews request failed with status ${response.status}`,
        },
      }
    }

    return {
      articles: (payload.articles || []).map((article) => mapArticle(article, topic)),
      error: null,
    }
  } catch (error) {
    return {
      articles: [],
      error: {
        category: topic.category,
        status: error.name === 'AbortError' ? 504 : 502,
        message: error.name === 'AbortError' ? 'GNews request timeout.' : 'GNews request failed.',
      },
    }
  } finally {
    clearTimeout(timeout)
  }
}

function getStatusCode(errors = [], articles = []) {
  if (articles.length) return 200
  if (errors.some((error) => error.status === 401 || error.status === 403)) return 401
  if (errors.some((error) => error.status === 429)) return 429
  if (errors.some((error) => error.status === 504)) return 504
  return 502
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

  const apiKey = getApiKey()
  if (!apiKey) {
    response.status(503).json({ error: 'GNEWS_API_KEY is not configured.' })
    return
  }

  const topics = isWorldCupWindow()
    ? [WORLD_CUP_TOPIC, ...TOPICS.filter((topic) => topic.category !== 'Esportes')]
    : TOPICS

  const results = []
  for (const topic of topics) {
    results.push(await fetchTopic({ apiKey, topic }))
    if (topic !== topics[topics.length - 1]) await delay(250)
  }

  const errors = results.map((result) => result.error).filter(Boolean)
  const requestedLimit = Math.min(Math.max(Number(request.query?.limit || NEWS_LIMIT), 1), MAX_NEWS_LIMIT)
  const articles = balanceArticlesByCategory(sortArticles(dedupeArticles(results.flatMap((result) => result.articles)))).slice(0, requestedLimit)
  const categories = [...new Set(articles.map((article) => article.category).filter(Boolean))]

  response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=120')
  response.status(getStatusCode(errors, articles)).json({
    source: 'gnews.io',
    articles,
    categories,
    errors: errors.map((error) => ({
      category: error.category,
      status: error.status,
      message: error.message,
    })),
  })
}
