export function createRodada(data = {}) {
  return {
    id: data.id || crypto.randomUUID?.() || `rodada-${Date.now()}`,
    temporadaId: data.temporadaId || '',
    numero: Number(data.numero || 1),
    nome: data.nome || `Rodada ${data.numero || 1}`,
    inicio: data.inicio,
    fim: data.fim,
    metadata: data.metadata || {},
  }
}
