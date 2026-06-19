export function calcularVencedor(placar = {}) {
  const mandante = Number(placar.mandante)
  const visitante = Number(placar.visitante)

  if (!Number.isInteger(mandante) || !Number.isInteger(visitante)) {
    return null
  }

  if (mandante > visitante) {
    return 'mandante'
  }

  if (visitante > mandante) {
    return 'visitante'
  }

  return 'empate'
}

export function placarExato(palpitePlacar = {}, jogoPlacar = {}) {
  return (
    Number(palpitePlacar.mandante) === Number(jogoPlacar.mandante) &&
    Number(palpitePlacar.visitante) === Number(jogoPlacar.visitante)
  )
}
