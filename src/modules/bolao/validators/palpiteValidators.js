import { validarHorario } from '../utils/horarioUtils'

export function validatePalpiteDuplicado(palpites = [], usuarioId, jogoId) {
  const duplicado = palpites.some(
    (palpite) => palpite.usuarioId === usuarioId && palpite.jogoId === jogoId,
  )

  return {
    valido: !duplicado,
    motivo: duplicado ? 'Usuario ja possui palpite para este jogo.' : null,
  }
}

export function validateHorarioEncerrado(jogo, agora = new Date()) {
  return validarHorario(jogo?.dataHora, agora)
}

export function validatePlacarValido(placar = {}) {
  const mandante = Number(placar.mandante)
  const visitante = Number(placar.visitante)
  const valido =
    Number.isInteger(mandante) &&
    Number.isInteger(visitante) &&
    mandante >= 0 &&
    visitante >= 0

  return {
    valido,
    motivo: valido ? null : 'Placar deve conter gols inteiros e nao negativos.',
  }
}

export function validateUsuarioElegivel(usuario = {}) {
  const elegivel = Boolean(usuario.id || usuario.usuarioId) && usuario.bloqueado !== true

  return {
    valido: elegivel,
    motivo: elegivel ? null : 'Usuario nao elegivel para participar do Bolao Pro.',
  }
}

export function validatePalpite({ palpite, jogo, usuario, palpites = [], agora = new Date() } = {}) {
  const validations = [
    validateUsuarioElegivel(usuario),
    validatePlacarValido(palpite?.placar),
    validateHorarioEncerrado(jogo, agora),
    validatePalpiteDuplicado(palpites, palpite?.usuarioId, palpite?.jogoId),
  ]

  return {
    valido: validations.every((validation) => validation.valido),
    erros: validations.filter((validation) => !validation.valido).map((validation) => validation.motivo),
  }
}
