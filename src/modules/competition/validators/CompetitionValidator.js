import { COMPETITION_TYPES } from '../constants'

export const CompetitionValidator = {
  validate(competition = {}) {
    const errors = []

    if (!competition.name) {
      errors.push('Competition name is required.')
    }

    if (!Object.values(COMPETITION_TYPES).includes(competition.type)) {
      errors.push('Competition type is invalid.')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  },
}
