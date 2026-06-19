export const JOGO_STATUS = Object.freeze({
  AGENDADO: 'agendado',
  AO_VIVO: 'ao_vivo',
  ENCERRADO: 'encerrado',
  CANCELADO: 'cancelado',
  ADIADO: 'adiado',
})

export const CAMPEONATO_TIPOS = Object.freeze({
  LIGA: 'liga',
  COPA: 'copa',
  TORNEIO: 'torneio',
  PERSONALIZADO: 'personalizado',
})

export const PONTUACAO_TIPOS = Object.freeze({
  PLACAR_EXATO: 'placar_exato',
  VENCEDOR: 'vencedor',
  EMPATE: 'empate',
  PARTICIPACAO: 'participacao',
})

export const PALPITE_STATUS = Object.freeze({
  RASCUNHO: 'rascunho',
  CONFIRMADO: 'confirmado',
  BLOQUEADO: 'bloqueado',
  PONTUADO: 'pontuado',
  CANCELADO: 'cancelado',
})

export const BOLAO_FUTURE_INTEGRATIONS = Object.freeze({
  BARAI: 'barai',
  BARCOINS: 'barcoins',
  PERFIL: 'perfil',
  LOJA: 'loja',
})

export const DEFAULT_PONTUACAO_RULES = Object.freeze({
  [PONTUACAO_TIPOS.PLACAR_EXATO]: 5,
  [PONTUACAO_TIPOS.VENCEDOR]: 3,
  [PONTUACAO_TIPOS.EMPATE]: 3,
  [PONTUACAO_TIPOS.PARTICIPACAO]: 1,
})
