export function createCompetitionDto(data = {}) {
  return {
    id: data.id,
    name: data.name || '',
    slug: data.slug || '',
    type: data.type || 'custom',
    status: data.status || 'draft',
    settings: data.settings || {},
    metadata: data.metadata || {},
  }
}
