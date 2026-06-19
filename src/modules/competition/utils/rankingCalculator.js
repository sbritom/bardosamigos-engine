export function createRankingItem(userId, overrides = {}) {
  return {
    userId,
    points: 0,
    exactHits: 0,
    resultHits: 0,
    predictions: 0,
    position: 0,
    ...overrides,
  }
}

export function sortRanking(items = []) {
  return [...items]
    .sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points
      }

      if (b.exactHits !== a.exactHits) {
        return b.exactHits - a.exactHits
      }

      if (b.resultHits !== a.resultHits) {
        return b.resultHits - a.resultHits
      }

      return a.userId.localeCompare(b.userId)
    })
    .map((item, index) => ({
      ...item,
      position: index + 1,
    }))
}

export function calculateRankingItems(scoredPredictions = []) {
  const itemsByUser = new Map()

  scoredPredictions.forEach((prediction) => {
    const item = itemsByUser.get(prediction.userId) || createRankingItem(prediction.userId)
    item.points += Number(prediction.points || 0)
    item.predictions += 1
    item.exactHits += prediction.metadata?.exactResult ? 1 : 0
    item.resultHits += prediction.metadata?.resultHit ? 1 : 0
    itemsByUser.set(prediction.userId, item)
  })

  return sortRanking(Array.from(itemsByUser.values()))
}
