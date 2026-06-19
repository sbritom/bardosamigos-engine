/**
 * @typedef {'liga' | 'copa' | 'torneio' | 'personalizado'} CampeonatoTipo
 */

/**
 * @typedef {'agendado' | 'ao_vivo' | 'encerrado' | 'cancelado' | 'adiado'} JogoStatus
 */

/**
 * @typedef {'rascunho' | 'confirmado' | 'bloqueado' | 'pontuado' | 'cancelado'} PalpiteStatus
 */

/**
 * @typedef {Object} Campeonato
 * @property {string} id
 * @property {string} nome
 * @property {CampeonatoTipo} tipo
 * @property {boolean} ativo
 * @property {Record<string, unknown>} metadata
 */

/**
 * @typedef {Object} Temporada
 * @property {string} id
 * @property {string} campeonatoId
 * @property {string} nome
 * @property {string} inicio
 * @property {string} fim
 * @property {boolean} ativa
 * @property {Record<string, unknown>} metadata
 */

/**
 * @typedef {Object} Rodada
 * @property {string} id
 * @property {string} temporadaId
 * @property {number} numero
 * @property {string} nome
 * @property {string=} inicio
 * @property {string=} fim
 * @property {Record<string, unknown>} metadata
 */

/**
 * @typedef {Object} Placar
 * @property {number | null} mandante
 * @property {number | null} visitante
 */

/**
 * @typedef {Object} Jogo
 * @property {string} id
 * @property {string} rodadaId
 * @property {string} mandante
 * @property {string} visitante
 * @property {string} dataHora
 * @property {JogoStatus} status
 * @property {Placar} placar
 * @property {Record<string, unknown>} metadata
 */

/**
 * @typedef {Object} Palpite
 * @property {string} id
 * @property {string} jogoId
 * @property {string} usuarioId
 * @property {Placar} placar
 * @property {PalpiteStatus} status
 * @property {number} pontos
 * @property {string} criadoEm
 * @property {Record<string, unknown>} metadata
 */

/**
 * @typedef {Object} RankingItem
 * @property {string} usuarioId
 * @property {number} pontos
 * @property {number} acertosExatos
 * @property {number} acertosResultado
 * @property {number} palpites
 * @property {number} posicao
 */

/**
 * @typedef {Object} Ranking
 * @property {string} id
 * @property {string} temporadaId
 * @property {RankingItem[]} itens
 * @property {string} atualizadoEm
 */

/**
 * @typedef {Object} Premiacao
 * @property {string} id
 * @property {string} temporadaId
 * @property {number} posicao
 * @property {string} titulo
 * @property {string} descricao
 * @property {Record<string, unknown>} recompensa
 */

/**
 * @typedef {Object} Conquista
 * @property {string} id
 * @property {string} usuarioId
 * @property {string} titulo
 * @property {string} descricao
 * @property {string} desbloqueadaEm
 * @property {Record<string, unknown>} metadata
 */

export {}
