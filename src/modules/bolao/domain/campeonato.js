import { CAMPEONATO_TIPOS } from '../constants'

export function createCampeonato(data = {}) {
  return {
    id: data.id || crypto.randomUUID?.() || `campeonato-${Date.now()}`,
    nome: data.nome || 'Campeonato sem nome',
    tipo: data.tipo || CAMPEONATO_TIPOS.LIGA,
    ativo: data.ativo ?? true,
    metadata: data.metadata || {},
  }
}
