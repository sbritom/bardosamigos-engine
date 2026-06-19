import { MATCH_STATUS } from '../constants'
import { createCompetitionId } from '../utils/idGenerator'

export function createMatch(data = {}) {
  return {
    id: data.id || createCompetitionId('match'),
    roundId: data.roundId || '',
    homeParticipant: data.homeParticipant || '',
    awayParticipant: data.awayParticipant || '',
    startsAt: data.startsAt || new Date().toISOString(),
    status: data.status || MATCH_STATUS.SCHEDULED,
    result: {
      homeScore: data.result?.homeScore ?? null,
      awayScore: data.result?.awayScore ?? null,
      winnerId: data.result?.winnerId ?? null,
      position: data.result?.position ?? null,
      raw: data.result?.raw || {},
    },
    metadata: data.metadata || {},
  }
}
