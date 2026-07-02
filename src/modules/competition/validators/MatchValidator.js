import { MATCH_STATUS } from '../constants'
import { getUtcTimestamp, nowUtcIso } from '../../../core/time'

export const MatchValidator = {
  validate(match = {}) {
    const errors = []

    if (!match.roundId) {
      errors.push('Match roundId is required.')
    }

    if (!match.startsAt || Number.isNaN(getUtcTimestamp(match.startsAt))) {
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

  isPredictionOpen(match = {}, now = nowUtcIso()) {
    return getUtcTimestamp(match.startsAt) > getUtcTimestamp(now)
  },
}
