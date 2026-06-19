import { createAchievement } from '../domain/Achievement'
import { createReward } from '../domain/Reward'

export function createRewardService(options = {}) {
  const repository = options.repository

  return {
    createReward(data = {}) {
      const reward = createReward(data)
      return repository?.save('rewards', reward) || reward
    },

    listRewards(competitionId) {
      return repository?.list(
        'rewards',
        (reward) => !competitionId || reward.competitionId === competitionId,
      ) || []
    },

    unlockAchievement(data = {}) {
      const achievement = createAchievement(data)
      return repository?.save('achievements', achievement) || achievement
    },

    listAchievements(userId) {
      return repository?.list(
        'achievements',
        (achievement) => !userId || achievement.userId === userId,
      ) || []
    },
  }
}
