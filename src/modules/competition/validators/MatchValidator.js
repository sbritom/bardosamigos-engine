import { MATCH_STATUS } from '../constants'

export const MatchValidator = {
  validate(match = {}) {
    const errors = []

    if (!match.roundId) {
      errors.push('Match roundId is required.')
    }

    if (!match.startsAt || Number.isNaN(new Date(match.startsAt).getTime())) {
      errors.push('Match startsAt must be a valid date.')
    }

    if (!Object.values(MATCH_STATUS).includes(match.status)) {
      errors.push('Match status is invalid.')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  },

  isPredictionOpen(match = {}, now = new Date()) {
    const startsAt = new Date(match.startsAt)
    return startsAt.getTime() > new Date(now).getTime()
  },
}
