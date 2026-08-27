import { tvRepository } from '../repository'

export const TVRecentService = {
  list: (userId, limit) => tvRepository.listRecent(userId, limit),
  save: (userId, channelId, watchTime) => tvRepository.saveRecent(userId, channelId, watchTime),
}
