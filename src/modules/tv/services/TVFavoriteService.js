import { tvRepository } from '../repository'

export const TVFavoriteService = {
  list: (userId) => tvRepository.listFavorites(userId),
  add: (userId, channelId) => tvRepository.addFavorite(userId, channelId),
  remove: (userId, channelId) => tvRepository.removeFavorite(userId, channelId),
}
