import { createProfileDto } from '../dtos/profile.dto'
import { createProfileRepository } from '../repositories/profileRepository'

export function createProfilePersistenceService(client) {
  const repository = createProfileRepository(client)

  return {
    async getProfile(profileId) {
      const result = await repository.findById(profileId)
      return {
        ...result,
        data: result.data ? createProfileDto(result.data) : null,
      }
    },

    updateProfile(profileId, profile) {
      return repository.updateProfile(profileId, profile)
    },
  }
}
