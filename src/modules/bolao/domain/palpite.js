import { PALPITE_STATUS } from '../constants'

export function createPalpite(data = {}) {
  return {
    id: data.id || crypto.randomUUID?.() || `palpite-${Date.now()}`,
    jogoId: data.jogoId || '',
    usuarioId: data.usuarioId || '',
    placar: {
      mandante: data.placar?.mandante ?? null,
      visitante: data.placar?.visitante ?? null,
    },
    status: data.status || PALPITE_STATUS.CONFIRMADO,
    pontos: Number(data.pontos || 0),
    criadoEm: data.criadoEm || new Date().toISOString(),
    metadata: data.metadata || {},
  }
}
