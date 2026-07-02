import { nowUtcIso } from '../../../core/time'

export function prepareCompetitionReward({ profileId, predictionId, points, reason }) {
  return {
    prepared: true,
    distributed: false,
    profileId,
    predictionId,
    points,
    reason,
    integration: 'barcoins',
    createdAt: nowUtcIso(),
  }
}
