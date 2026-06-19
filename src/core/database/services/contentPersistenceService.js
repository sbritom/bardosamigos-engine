import { createContentRepository } from '../repositories/contentRepository'

export function createContentPersistenceService(client) {
  const repository = createContentRepository(client)

  return {
    listPublishedNews() {
      return repository.newsArticles.list({ status: 'published' })
    },
    listPublishedTvChannels() {
      return repository.tvChannels.list({ status: 'published' })
    },
    listPublishedRadioStations() {
      return repository.radioStations.list({ status: 'published' })
    },
    listPublishedEvents() {
      return repository.events.list({ status: 'published' })
    },
    listPublishedProducts() {
      return repository.products.list({ status: 'published' })
    },
  }
}
