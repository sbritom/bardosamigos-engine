import { getBrazilDatePayload, nowUtcIso } from '../../../time/timeService.js'

function createSlug(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 90)
}

export function mapGNewsArticleToNewsArticle(article = {}, category = 'Comunidade') {
  const sourceName = article.source?.name || 'GNews'
  const publishedAt = article.publishedAt || nowUtcIso()
  const brazilDate = getBrazilDatePayload(publishedAt)
  const baseSlug = createSlug(`${article.title}-${publishedAt}`)

  return {
    title: article.title || 'Noticia sem titulo',
    slug: baseSlug,
    summary: article.description || '',
    content: article.content || article.description || '',
    cover_url: article.image || '',
    status: 'published',
    published_at: publishedAt,
    metadata: {
      provider: 'gnews.io',
      category,
      source: sourceName,
      sourceUrl: article.url || '',
      originalUrl: article.url || '',
      utcDate: brazilDate.utc_date,
      localDate: brazilDate.local_date,
      localDateIso: brazilDate.local_date_iso,
      localTime: brazilDate.local_time,
      raw: article,
    },
  }
}
