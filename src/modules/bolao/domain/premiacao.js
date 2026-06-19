export function createPremiacao(data = {}) {
  return {
    id: data.id || crypto.randomUUID?.() || `premiacao-${Date.now()}`,
    temporadaId: data.temporadaId || '',
    posicao: Number(data.posicao || 1),
    titulo: data.titulo || 'Premiacao',
    descricao: data.descricao || '',
    recompensa: data.recompensa || {},
  }
}
