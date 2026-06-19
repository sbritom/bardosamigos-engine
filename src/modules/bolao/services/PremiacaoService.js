import { createConquista } from '../domain/conquista'
import { createPremiacao } from '../domain/premiacao'

export function createPremiacaoService(options = {}) {
  const repository = options.repository

  return {
    criarPremiacao(data = {}) {
      const premiacao = createPremiacao(data)
      return repository?.save('premiacoes', premiacao) || premiacao
    },

    listarPremiacoes(temporadaId) {
      return repository?.list(
        'premiacoes',
        (premiacao) => !temporadaId || premiacao.temporadaId === temporadaId,
      ) || []
    },

    concederConquista(data = {}) {
      const conquista = createConquista(data)
      return repository?.save('conquistas', conquista) || conquista
    },

    listarConquistas(usuarioId) {
      return repository?.list(
        'conquistas',
        (conquista) => !usuarioId || conquista.usuarioId === usuarioId,
      ) || []
    },
  }
}
