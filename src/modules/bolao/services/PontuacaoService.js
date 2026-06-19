import { DEFAULT_PONTUACAO_RULES } from '../constants'
import { calcularPontuacao } from '../utils/pontuacaoUtils'
import { calcularVencedor, placarExato } from '../utils/resultadoUtils'

export function createPontuacaoService(options = {}) {
  const regras = options.regras || DEFAULT_PONTUACAO_RULES

  return {
    calcular(palpite, jogo) {
      return calcularPontuacao(palpite, jogo, regras)
    },

    detalhar(palpite, jogo) {
      const pontos = calcularPontuacao(palpite, jogo, regras)
      const vencedorPalpite = calcularVencedor(palpite?.placar)
      const vencedorJogo = calcularVencedor(jogo?.placar)

      return {
        pontos,
        placarExato: placarExato(palpite?.placar, jogo?.placar),
        acertouResultado: Boolean(vencedorPalpite && vencedorPalpite === vencedorJogo),
      }
    },
  }
}

export const PontuacaoService = createPontuacaoService()
