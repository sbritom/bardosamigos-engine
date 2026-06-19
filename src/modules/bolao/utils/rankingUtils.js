export function ordenarRanking(itens = []) {
  return [...itens]
    .sort((a, b) => {
      if (b.pontos !== a.pontos) {
        return b.pontos - a.pontos
      }

      if (b.acertosExatos !== a.acertosExatos) {
        return b.acertosExatos - a.acertosExatos
      }

      if (b.acertosResultado !== a.acertosResultado) {
        return b.acertosResultado - a.acertosResultado
      }

      return a.usuarioId.localeCompare(b.usuarioId)
    })
    .map((item, index) => ({
      ...item,
      posicao: index + 1,
    }))
}

export function criarItemRanking(usuarioId, overrides = {}) {
  return {
    usuarioId,
    pontos: 0,
    acertosExatos: 0,
    acertosResultado: 0,
    palpites: 0,
    posicao: 0,
    ...overrides,
  }
}
