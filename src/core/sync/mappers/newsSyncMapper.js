import { nowUtcIso } from '../../time'

export function mapExternalNewsToArticle(item = {}) {
  return {
    title: item.title || 'Noticia sem titulo',
    slug: item.slug || item.externalId || item.id,
    summary: item.summary || item.description || '',
    content: item.content || item.summary || '',
    cover_url: item.image || item.coverUrl || item.cover_url || '',
    status: item.status || 'published',
    published_at: item.publishedAt || item.date || nowUtcIso(),
    metadata: {
      provider: item.provider || 'external',
      category: item.category || 'Comunidade',
      sourceUrl: item.url || '',
      raw: item,
    },
  }
}
