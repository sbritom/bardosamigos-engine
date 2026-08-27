import { tvRepository } from '../repository'

export const TVFeaturedService = {
  list: () => tvRepository.listFeatured(),
  listAdmin: () => tvRepository.listAdminFeatured(),
  setFeatured: (channelId, payload) => tvRepository.setFeatured(channelId, payload),
  removeFeatured: (channelId) => tvRepository.removeFeatured(channelId),
  reorderFeatured: (items) => tvRepository.reorderFeatured(items),
}
