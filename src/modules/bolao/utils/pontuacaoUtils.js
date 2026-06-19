import { DEFAULT_PONTUACAO_RULES, PONTUACAO_TIPOS } from '../constants'
import { calcularVencedor, placarExato } from './resultadoUtils'

export function calcularPontuacao(palpite, jogo, regras = DEFAULT_PONTUACAO_RULES) {
  if (!palpite?.placar || !jogo?.placar) {
    return 0
  }

  const vencedorPalpite = calcularVencedor(palpite.placar)
  const vencedorJogo = calcularVencedor(jogo.placar)

  if (!vencedorPalpite || !vencedorJogo) {
    return 0
  }

  if (placarExato(palpite.placar, jogo.placar)) {
    return regras[PONTUACAO_TIPOS.PLACAR_EXATO]
  }

  if (vencedorPalpite === vencedorJogo && vencedorJogo === 'empate') {
    return regras[PONTUACAO_TIPOS.EMPATE]
  }

  if (vencedorPalpite === vencedorJogo) {
    return regras[PONTUACAO_TIPOS.VENCEDOR]
  }

  return regras[PONTUACAO_TIPOS.PARTICIPACAO]
}
