import { createRanking } from '../domain/ranking'
import { criarItemRanking, ordenarRanking } from '../utils/rankingUtils'

export function createRankingService(options = {}) {
  const repository = options.repository

  return {
    gerarRanking({ temporadaId, palpitesPontuados = [] } = {}) {
      const itensPorUsuario = new Map()

      palpitesPontuados.forEach((palpite) => {
        const item = itensPorUsuario.get(palpite.usuarioId) || criarItemRanking(palpite.usuarioId)
        item.pontos += Number(palpite.pontos || 0)
        item.palpites += 1
        item.acertosExatos += palpite.metadata?.placarExato ? 1 : 0
        item.acertosResultado += palpite.metadata?.acertouResultado ? 1 : 0
        itensPorUsuario.set(palpite.usuarioId, item)
      })

      return createRanking({
        temporadaId,
        itens: ordenarRanking(Array.from(itensPorUsuario.values())),
      })
    },

    salvarRanking(ranking) {
      return repository?.save('rankings', ranking) || ranking
    },

    listarRankings() {
      return repository?.list('rankings') || []
    },
  }
}
