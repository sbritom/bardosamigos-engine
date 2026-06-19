import { JOGO_STATUS } from '../constants'

export function createJogo(data = {}) {
  return {
    id: data.id || crypto.randomUUID?.() || `jogo-${Date.now()}`,
    rodadaId: data.rodadaId || '',
    mandante: data.mandante || '',
    visitante: data.visitante || '',
    dataHora: data.dataHora || new Date().toISOString(),
    status: data.status || JOGO_STATUS.AGENDADO,
    placar: {
      mandante: data.placar?.mandante ?? null,
      visitante: data.placar?.visitante ?? null,
    },
    metadata: data.metadata || {},
  }
}
