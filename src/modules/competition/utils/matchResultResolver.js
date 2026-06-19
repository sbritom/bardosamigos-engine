export function resolveMatchWinner(result = {}) {
  const homeScore = Number(result.homeScore)
  const awayScore = Number(result.awayScore)

  if (result.winnerId) {
    return result.winnerId
  }

  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
    return null
  }

  if (homeScore > awayScore) {
    return 'home'
  }

  if (awayScore > homeScore) {
    return 'away'
  }

  return 'draw'
}

export function isExactResult(prediction = {}, result = {}) {
  return (
    Number(prediction.homeScore) === Number(result.homeScore) &&
    Number(prediction.awayScore) === Number(result.awayScore)
  )
}
