import { createCampeonato } from '../domain/campeonato'
import { createJogo } from '../domain/jogo'
import { createRodada } from '../domain/rodada'
import { createTemporada } from '../domain/temporada'
import { createInMemoryBolaoRepository } from '../repositories/bolaoRepository'
import { createPalpiteService } from './PalpiteService'
import { createPontuacaoService } from './PontuacaoService'
import { createPremiacaoService } from './PremiacaoService'
import { createRankingService } from './RankingService'

export function createBolaoService(options = {}) {
  const repository = options.repository || createInMemoryBolaoRepository()
  const pontuacaoService = options.pontuacaoService || createPontuacaoService()
  const palpiteService = options.palpiteService || createPalpiteService({ repository })
  const rankingService = options.rankingService || createRankingService({ repository })
  const premiacaoService = options.premiacaoService || createPremiacaoService({ repository })

  return {
    repository,
    palpiteService,
    rankingService,
    pontuacaoService,
    premiacaoService,

    criarCampeonato(data = {}) {
      return repository.save('campeonatos', createCampeonato(data))
    },

    criarTemporada(data = {}) {
      return repository.save('temporadas', createTemporada(data))
    },

    criarRodada(data = {}) {
      return repository.save('rodadas', createRodada(data))
    },

    criarJogo(data = {}) {
      return repository.save('jogos', createJogo(data))
    },

    listarCampeonatos() {
      return repository.list('campeonatos')
    },

    listarTemporadas(campeonatoId) {
      return repository.list(
        'temporadas',
        (temporada) => !campeonatoId || temporada.campeonatoId === campeonatoId,
      )
    },

    listarRodadas(temporadaId) {
      return repository.list(
        'rodadas',
        (rodada) => !temporadaId || rodada.temporadaId === temporadaId,
      )
    },

    listarJogos(rodadaId) {
      return repository.list('jogos', (jogo) => !rodadaId || jogo.rodadaId === rodadaId)
    },

    getFutureIntegrations() {
      return {
        barAi: { prepared: true, enabled: false },
        barCoins: { prepared: true, enabled: false },
        perfil: { prepared: true, enabled: false },
        loja: { prepared: true, enabled: false },
      }
    },
  }
}

export const BolaoService = createBolaoService()
