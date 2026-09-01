import { listCachedNews } from './_lib/newsCacheService.js'

const GNEWS_BASE_URL = 'https://gnews.io/api/v4'
const REQUEST_TIMEOUT_MS = 8000
const QUERY = 'games OR esports OR videogames OR "Free Fire" OR Fortnite OR VALORANT OR "jogos gratis"'

function mapArticle(article = {}) {
  return {
    id: article.url || article.title,
    title: article.title || 'Notícia gamer',
    description: article.description || '',
    image: article.image || '',
    url: article.url || '',
    publishedAt: article.publishedAt || '',
    source: article.source?.name || 'GNews',
  }
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function classify(article = {}) {
  const text = normalize(`${article.title} ${article.description}`)
  if (/esport|campeonato|torneio|competitiv|free fire|valorant|fortnite|league of legends|lol|cs2|counter strike/.test(text)) return 'esports'
  if (/gratis|gratuito|free to play|free-to-play|de graca|epic games store/.test(text)) return 'free'
  if (/lancamento|lanca|lançado|release|estreia|chega|novo jogo|nova temporada|atualizacao|update/.test(text)) return 'releases'
  return 'news'
}

async function fetchGNews() {
  const apiKey = String(process.env.GNEWS_API_KEY || '').trim()
  if (!apiKey) throw new Error('GNEWS_API_KEY is not configured.')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const url = new URL(`${GNEWS_BASE_URL}/search`)
  url.searchParams.set('q', QUERY)
  url.searchParams.set('lang', 'pt')
  url.searchParams.set('country', 'br')
  url.searchParams.set('max', '12')
  url.searchParams.set('apikey', apiKey)

  try {
    const response = await fetch(url, { signal: controller.signal })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload?.errors?.join(', ') || `GNews request failed with status ${response.status}`)
    return (payload.articles || []).map(mapArticle)
  } finally {
    clearTimeout(timeout)
  }
}

async function getCachedFallback() {
  try {
    const payload = await listCachedNews({ limit: 30 })
    return (payload.articles || [])
      .filter((article) => article.category === 'Games')
      .map((article) => ({
        id: article.id,
        title: article.title,
        description: '',
        image: article.image || '',
        url: article.url || '',
        publishedAt: article.publishedAt || article.date || '',
        source: article.source || 'Fonte sincronizada',
      }))
  } catch {
    return []
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

  let articles = []
  let source = 'gnews'

  try {
    articles = await fetchGNews()
  } catch {
    source = 'supabase-cache'
    articles = await getCachedFallback()
  }

  const items = articles.map((article) => ({
    ...article,
    kind: classify(article),
  }))

  response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=180')
  response.status(200).json({
    source,
    items,
    featured: items[0] || null,
    esports: items.filter((item) => item.kind === 'esports').slice(0, 4),
    releases: items.filter((item) => item.kind === 'releases').slice(0, 4),
    free: items.filter((item) => item.kind === 'free').slice(0, 4),
  })
}
