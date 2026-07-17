import { createClient } from '@supabase/supabase-js'

const GNEWS_BASE_URL = 'https://gnews.io/api/v4'
const NEWS_LIMIT = 12
const MAX_NEWS_LIMIT = 30
const TOPIC_MAX = 5
const REQUEST_TIMEOUT_MS = 8000
const WORLD_CUP_YEAR = 2026
const KEEP_PER_CATEGORY = 50

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

let runningSync = null

export function getNewsRuntimeConfig() {
  return {
    gnewsApiKey: String(process.env.GNEWS_API_KEY || '').trim(),
    supabaseUrl: String(process.env.SUPABASE_URL || '').trim(),
    supabaseServiceRoleKey: String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
  }
}

export function createNewsSupabaseClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getNewsRuntimeConfig()

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase server credentials are not configured.')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
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
  return normalizeText(value).replace(/\s+/g, '-').slice(0, 90) || 'noticia'
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

function getTopicScore(article = {}, topic = {}) {
  const title = normalizeText(article.title)
  const description = normalizeText(article.description || article.content || article.summary)
  const text = `${title} ${description}`
  const worldCupBoost = /copa do mundo|fifa world cup|mundial/.test(text) ? 5 : 0

  return (topic.weight || 0) + worldCupBoost
}

function getTopics(now = new Date()) {
  if (!isWorldCupWindow(now)) return TOPICS
  return [WORLD_CUP_TOPIC, ...TOPICS.filter((topic) => topic.category !== 'Esportes')]
}

function mapGNewsArticle(article = {}, topic = {}) {
  const publishedAt = article.publishedAt || new Date().toISOString()
  const sourceName = article.source?.name || 'GNews'
  const canonicalUrl = normalizeUrl(article.url)
  const slug = createSlug(`${article.title || 'noticia'}-${publishedAt}`)

  return {
    title: article.title || 'Noticia sem titulo',
    slug,
    summary: article.description || '',
    content: article.content || article.description || '',
    cover_url: article.image || '',
    status: 'published',
    published_at: publishedAt,
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

function mapCachedArticle(row = {}) {
  const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : {}

  return {
    id: row.id,
    title: row.title || 'Noticia sem titulo',
    category: metadata.category || 'Brasil',
    date: row.published_at || row.created_at || '',
    image: row.cover_url || '',
    source: metadata.source || 'Fonte sincronizada',
    publishedAt: row.published_at || row.created_at || '',
    url: metadata.sourceUrl || metadata.originalUrl || '',
    coverUrl: row.cover_url || '',
    metadata: {
      provider: metadata.provider || 'supabase-cache',
      category: metadata.category || 'Brasil',
      source: metadata.source || 'Fonte sincronizada',
      sourceUrl: metadata.sourceUrl || metadata.originalUrl || '',
      originalUrl: metadata.originalUrl || metadata.sourceUrl || '',
      relevanceScore: metadata.relevanceScore || 0,
    },
  }
}

function dedupeRecords(records = []) {
  const seenUrls = new Set()
  const seenSlugs = new Set()
  const deduped = []
  let skipped = 0

  for (const record of records) {
    const urlKey = normalizeUrl(record.metadata?.originalUrl || record.metadata?.sourceUrl)
    const slugKey = record.slug

    if ((urlKey && seenUrls.has(urlKey)) || (slugKey && seenSlugs.has(slugKey))) {
      skipped += 1
      continue
    }

    if (urlKey) seenUrls.add(urlKey)
    if (slugKey) seenSlugs.add(slugKey)
    deduped.push(record)
  }

  return { records: deduped, skipped }
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
        records: [],
        error: {
          category: topic.category,
          status: response.status,
          message: payload?.errors?.join(', ') || payload?.message || `GNews request failed with status ${response.status}`,
        },
      }
    }

    return {
      records: (payload.articles || []).map((article) => mapGNewsArticle(article, topic)),
      error: null,
    }
  } catch (error) {
    return {
      records: [],
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

async function ensureCategories(client, categories = []) {
  const uniqueCategories = [...new Set(categories.filter(Boolean))]
  const categoryMap = new Map()

  if (!uniqueCategories.length) return categoryMap

  const { data: existing, error } = await client
    .from('news_categories')
    .select('id, name, slug')
    .is('deleted_at', null)

  if (error) throw error

  const existingBySlug = new Map((existing || []).map((row) => [row.slug, row]))

  for (const name of uniqueCategories) {
    const slug = createSlug(name)
    const current = existingBySlug.get(slug)

    if (current) {
      categoryMap.set(name, current.id)
      continue
    }

    const { data, error: insertError } = await client
      .from('news_categories')
      .insert({ name, slug, is_active: true })
      .select('id')
      .single()

    if (insertError) throw insertError
    categoryMap.set(name, data.id)
  }

  return categoryMap
}

async function listExistingNewsKeys(client) {
  const { data, error } = await client
    .from('news_articles')
    .select('id, slug, metadata')
    .is('deleted_at', null)
    .limit(2000)

  if (error) throw error

  return {
    bySlug: new Map((data || []).map((row) => [row.slug, row.id]).filter(([slug]) => Boolean(slug))),
    byUrl: new Map((data || [])
      .map((row) => [normalizeUrl(row.metadata?.originalUrl || row.metadata?.sourceUrl), row.id])
      .filter(([url]) => Boolean(url))),
  }
}

async function saveNewsRecords(client, records = [], categoryMap = new Map()) {
  const keys = await listExistingNewsKeys(client)
  const summary = { inserted: 0, updated: 0, errors: [] }

  for (const record of records) {
    const category = record.metadata?.category || 'Brasil'
    const originalUrl = normalizeUrl(record.metadata?.originalUrl || record.metadata?.sourceUrl)
    const existingId = keys.byUrl.get(originalUrl) || keys.bySlug.get(record.slug)
    const payload = {
      ...record,
      category_id: categoryMap.get(category) || null,
      metadata: {
        ...record.metadata,
        originalUrl,
        sourceUrl: originalUrl,
        syncedAt: new Date().toISOString(),
      },
    }

    const query = existingId
      ? client.from('news_articles').update(payload).eq('id', existingId)
      : client.from('news_articles').insert(payload)

    const { data, error } = await query.select('id, slug, metadata').single()

    if (error) {
      summary.errors.push({
        title: record.title,
        message: error.message,
      })
      continue
    }

    if (existingId) {
      summary.updated += 1
    } else {
      summary.inserted += 1
    }

    if (data?.slug) keys.bySlug.set(data.slug, data.id)
    if (originalUrl) keys.byUrl.set(originalUrl, data.id)
  }

  return summary
}

async function cleanupOldNews(client, keepPerCategory = KEEP_PER_CATEGORY) {
  const { data, error } = await client
    .from('news_articles')
    .select('id, published_at, metadata')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(2000)

  if (error) throw error

  const groups = (data || []).reduce((acc, row) => {
    const category = row.metadata?.category || 'Brasil'
    acc[category] = acc[category] || []
    acc[category].push(row)
    return acc
  }, {})
  const idsToDelete = Object.values(groups).flatMap((rows) => rows.slice(keepPerCategory).map((row) => row.id))

  if (!idsToDelete.length) return { softDeleted: 0 }

  const { error: updateError } = await client
    .from('news_articles')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', idsToDelete)

  if (updateError) throw updateError

  return { softDeleted: idsToDelete.length }
}

async function saveSyncLog(client, payload) {
  try {
    await client.from('analytics_events').insert({
      source_module: 'news_sync',
      event_name: payload.ok ? 'sync.gnews.success' : 'sync.gnews.error',
      payload,
      occurred_at: new Date().toISOString(),
    })
  } catch {
    // Logging must never break news availability.
  }
}

export async function syncGNewsToSupabase(options = {}) {
  if (runningSync) {
    return {
      ok: false,
      data: {
        fetched: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        cleanup: { softDeleted: 0 },
        errors: [{ message: 'News sync already running.' }],
      },
    }
  }

  runningSync = (async () => {
    const config = getNewsRuntimeConfig()
    if (!config.gnewsApiKey) throw new Error('GNEWS_API_KEY is not configured.')

    const client = options.client || createNewsSupabaseClient()
    const topics = getTopics(options.now ? new Date(options.now) : new Date())
    const results = []

    for (const topic of topics) {
      results.push(await fetchTopic({ apiKey: config.gnewsApiKey, topic }))
    }

    const errors = results.map((result) => result.error).filter(Boolean)
    const fetchedRecords = results.flatMap((result) => result.records)
    const deduped = dedupeRecords(fetchedRecords)
    const categories = deduped.records.map((record) => record.metadata?.category).filter(Boolean)
    const categoryMap = await ensureCategories(client, categories)
    const saved = deduped.records.length ? await saveNewsRecords(client, deduped.records, categoryMap) : { inserted: 0, updated: 0, errors: [] }
    const shouldCleanup = saved.inserted + saved.updated > 0
    const cleanup = shouldCleanup ? await cleanupOldNews(client, options.keepPerCategory || KEEP_PER_CATEGORY) : { softDeleted: 0 }
    const payload = {
      ok: saved.errors.length === 0 && errors.length < topics.length,
      data: {
        fetched: fetchedRecords.length,
        inserted: saved.inserted,
        updated: saved.updated,
        skipped: deduped.skipped,
        cleanup,
        errors: [
          ...errors.map((error) => ({
            category: error.category,
            status: error.status,
            message: error.message,
          })),
          ...saved.errors,
        ],
      },
    }

    await saveSyncLog(client, payload)
    return payload
  })()

  try {
    return await runningSync
  } finally {
    runningSync = null
  }
}

export async function listCachedNews({ limit = NEWS_LIMIT } = {}) {
  const requestedLimit = Math.min(Math.max(Number(limit || NEWS_LIMIT), 1), MAX_NEWS_LIMIT)
  const client = createNewsSupabaseClient()
  const { data, error } = await client
    .from('news_articles')
    .select('id, title, cover_url, published_at, created_at, metadata')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(requestedLimit)

  if (error) throw error

  const articles = (data || []).map(mapCachedArticle)
  const categories = [...new Set(articles.map((article) => article.category).filter(Boolean))]

  return {
    source: 'supabase-cache',
    articles,
    categories,
    errors: articles.length ? [] : [{ message: 'Nenhuma noticia sincronizada encontrada.' }],
  }
}
