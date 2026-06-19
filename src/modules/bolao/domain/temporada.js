export function createTemporada(data = {}) {
  return {
    id: data.id || crypto.randomUUID?.() || `temporada-${Date.now()}`,
    campeonatoId: data.campeonatoId || '',
    nome: data.nome || 'Temporada sem nome',
    inicio: data.inicio || new Date().toISOString(),
    fim: data.fim || new Date().toISOString(),
    ativa: data.ativa ?? true,
    metadata: data.metadata || {},
  }
}
