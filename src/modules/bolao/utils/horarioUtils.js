export function validarHorario(dataHora, agora = new Date()) {
  const dataLimite = new Date(dataHora)

  if (Number.isNaN(dataLimite.getTime())) {
    return {
      valido: false,
      encerrado: true,
      motivo: 'Horario do jogo invalido.',
    }
  }

  const horarioAtual = agora instanceof Date ? agora : new Date(agora)
  const encerrado = horarioAtual.getTime() >= dataLimite.getTime()

  return {
    valido: !encerrado,
    encerrado,
    motivo: encerrado ? 'Horario para palpites encerrado.' : null,
  }
}
