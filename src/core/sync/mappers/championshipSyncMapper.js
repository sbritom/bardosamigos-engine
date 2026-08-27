export function mapExternalChampionshipToCompetition(item = {}) {
  return {
    name: item.name || item.title || 'Untitled Competition',
    slug: item.slug || item.externalId || item.id,
    type: item.type || 'football',
    status: item.status || 'published',
    description: item.description || '',
    external_ref: item.externalId || item.id || null,
    metadata: {
      provider: item.provider || 'external',
      raw: item,
    },
  }
}
