function listFromMap(map) {
  return Array.from(map.values())
}

export function createInMemoryBolaoRepository(initialState = {}) {
  const state = {
    campeonatos: new Map((initialState.campeonatos || []).map((item) => [item.id, item])),
    temporadas: new Map((initialState.temporadas || []).map((item) => [item.id, item])),
    rodadas: new Map((initialState.rodadas || []).map((item) => [item.id, item])),
    jogos: new Map((initialState.jogos || []).map((item) => [item.id, item])),
    palpites: new Map((initialState.palpites || []).map((item) => [item.id, item])),
    rankings: new Map((initialState.rankings || []).map((item) => [item.id, item])),
    premiacoes: new Map((initialState.premiacoes || []).map((item) => [item.id, item])),
    conquistas: new Map((initialState.conquistas || []).map((item) => [item.id, item])),
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
      const items = listFromMap(state[collection])
      return predicate ? items.filter(predicate) : items
    },

    remove(collection, id) {
      return state[collection].delete(id)
    },

    getState() {
      return Object.fromEntries(
        Object.entries(state).map(([key, value]) => [key, listFromMap(value)]),
      )
    },
  }
}

export const bolaoRepository = createInMemoryBolaoRepository()
