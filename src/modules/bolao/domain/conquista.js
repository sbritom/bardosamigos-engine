export function createConquista(data = {}) {
  return {
    id: data.id || crypto.randomUUID?.() || `conquista-${Date.now()}`,
    usuarioId: data.usuarioId || '',
    titulo: data.titulo || 'Conquista',
    descricao: data.descricao || '',
    desbloqueadaEm: data.desbloqueadaEm || new Date().toISOString(),
    metadata: data.metadata || {},
  }
}
