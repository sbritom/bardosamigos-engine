import { getBrazilDatePayload, normalizeMatchStatus, nowUtcIso, toLegacyMatchStatus } from '../../time'

export function mapExternalGameToMatch(item = {}) {
  const matchDate = item.startsAt || item.starts_at || item.date || nowUtcIso()
  const brazilDate = getBrazilDatePayload(matchDate)
  const standardStatus = normalizeMatchStatus(item.status)

  return {
    round_id: item.roundId || item.round_id || null,
    home_participant: item.homeTeam || item.home_participant || item.home || '',
    away_participant: item.awayTeam || item.away_participant || item.away || '',
    starts_at: brazilDate.utc_date,
    utc_date: brazilDate.utc_date,
    local_date: brazilDate.local_date,
    local_date_iso: brazilDate.local_date_iso,
    local_time: brazilDate.local_time,
    standard_status: standardStatus,
    status: toLegacyMatchStatus(standardStatus),
    result: item.result || {},
    external_ref: item.externalId || item.id || null,
    metadata: {
      provider: item.provider || 'external',
      homeShield: item.homeShield,
      awayShield: item.awayShield,
      raw: item,
    },
  }
}
