export function createRanking(data = {}) {
  return {
    id: data.id || crypto.randomUUID?.() || `ranking-${Date.now()}`,
    temporadaId: data.temporadaId || '',
    itens: data.itens || [],
    atualizadoEm: data.atualizadoEm || new Date().toISOString(),
  }
}
