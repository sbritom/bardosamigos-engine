function mapCollection(items = []) {
  return new Map(items.map((item) => [item.id, item]))
}

function listCollection(collection) {
  return Array.from(collection.values())
}

export function createInMemoryCompetitionRepository(initialState = {}) {
  const state = {
    competitions: mapCollection(initialState.competitions),
    seasons: mapCollection(initialState.seasons),
    stages: mapCollection(initialState.stages),
    rounds: mapCollection(initialState.rounds),
    matches: mapCollection(initialState.matches),
    predictions: mapCollection(initialState.predictions),
    scoreRules: mapCollection(initialState.scoreRules),
    rankings: mapCollection(initialState.rankings),
    achievements: mapCollection(initialState.achievements),
    rewards: mapCollection(initialState.rewards),
  }

  return {
    save(collection, entity) {
      state[collection].set(entity.id, entity)
      return entity
    },

    findById(collection, id) {
      return state[collection].get(id) || null
    },

    list(collection, predicate = null) {
      const items = listCollection(state[collection])
      return predicate ? items.filter(predicate) : items
    },

    remove(collection, id) {
      return state[collection].delete(id)
    },

    snapshot() {
      return Object.fromEntries(
        Object.entries(state).map(([key, collection]) => [key, listCollection(collection)]),
      )
    },
  }
}

export const competitionRepository = createInMemoryCompetitionRepository()
