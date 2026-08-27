export function mapExternalStandingToRankingEntry(item = {}) {
  return {
    profile_id: item.profileId || item.profile_id || null,
    position: Number(item.position || 0),
    score: Number(item.score || item.points || 0),
    metadata: {
      provider: item.provider || 'external',
      team: item.team || item.name,
      wins: item.wins,
      draws: item.draws,
      losses: item.losses,
      raw: item,
    },
  }
}
