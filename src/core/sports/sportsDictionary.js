import { STANDARD_MATCH_STATUS, normalizeMatchStatus } from '../time/timeService.js'

export const SPORTS_COUNTRY_TRANSLATIONS = Object.freeze({
  Algeria: 'Argélia',
  Argentina: 'Argentina',
  Australia: 'Austrália',
  Austria: 'Áustria',
  Belgium: 'Bélgica',
  'Bosnia and Herzegovina': 'Bósnia e Herzegovina',
  Brazil: 'Brasil',
  Cameroon: 'Camarões',
  Canada: 'Canadá',
  'Cape Verde': 'Cabo Verde',
  Chile: 'Chile',
  Colombia: 'Colômbia',
  'Costa Rica': 'Costa Rica',
  Croatia: 'Croácia',
  Curacao: 'Curaçao',
  Czechia: 'Tchéquia',
  Denmark: 'Dinamarca',
  'DR Congo': 'República Democrática do Congo',
  Ecuador: 'Equador',
  Egypt: 'Egito',
  England: 'Inglaterra',
  France: 'França',
  Germany: 'Alemanha',
  Ghana: 'Gana',
  Greece: 'Grécia',
  Haiti: 'Haiti',
  Honduras: 'Honduras',
  Iran: 'Irã',
  Iraq: 'Iraque',
  Italy: 'Itália',
  'Ivory Coast': 'Costa do Marfim',
  Japan: 'Japão',
  Jordan: 'Jordânia',
  Mexico: 'México',
  Morocco: 'Marrocos',
  Netherlands: 'Países Baixos',
  'New Zealand': 'Nova Zelândia',
  Nigeria: 'Nigéria',
  Norway: 'Noruega',
  Panama: 'Panamá',
  Paraguay: 'Paraguai',
  Peru: 'Peru',
  Poland: 'Polônia',
  Portugal: 'Portugal',
  Qatar: 'Catar',
  Romania: 'Romênia',
  'Saudi Arabia': 'Arábia Saudita',
  Scotland: 'Escócia',
  Senegal: 'Senegal',
  Serbia: 'Sérvia',
  Slovakia: 'Eslováquia',
  Slovenia: 'Eslovênia',
  'South Africa': 'África do Sul',
  'South Korea': 'Coreia do Sul',
  Spain: 'Espanha',
  Sweden: 'Suécia',
  Switzerland: 'Suíça',
  Tunisia: 'Tunísia',
  Turkey: 'Turquia',
  Ukraine: 'Ucrânia',
  'United States': 'Estados Unidos',
  Uruguay: 'Uruguai',
  Uzbekistan: 'Uzbequistão',
  Wales: 'País de Gales',
})

export const SPORTS_COMPETITION_TRANSLATIONS = Object.freeze({
  BSA: 'Campeonato Brasileiro Série A',
  CL: 'Liga dos Campeões da UEFA',
  CLI: 'Copa Libertadores da América',
  CDB: 'Copa do Brasil',
  PL: 'Campeonato Inglês',
  WC: 'Copa do Mundo FIFA 2026',
  'Campeonato Brasileiro Série A': 'Campeonato Brasileiro Série A',
  'FIFA World Cup': 'Copa do Mundo FIFA 2026',
  'Premier League': 'Campeonato Inglês',
  'UEFA Champions League': 'Liga dos Campeões da UEFA',
  'Copa Libertadores': 'Copa Libertadores da América',
})

export const SPORTS_STAGE_TRANSLATIONS = Object.freeze({
  Final: 'Final',
  'Group Stage': 'Fase de Grupos',
  'Quarter Finals': 'Quartas de Final',
  'Round of 16': 'Oitavas de Final',
  'Round of 32': 'Dezesseis Avos de Final',
  'Semi Finals': 'Semifinais',
  'Third Place': 'Disputa de 3º Lugar',
})

export const SPORTS_STATUS_LABELS = Object.freeze({
  [STANDARD_MATCH_STATUS.AO_VIVO]: 'AO VIVO',
  [STANDARD_MATCH_STATUS.AGENDADO]: 'AGENDADO',
  [STANDARD_MATCH_STATUS.FINALIZADO]: 'FINALIZADO',
  [STANDARD_MATCH_STATUS.ADIADO]: 'ADIADO',
  [STANDARD_MATCH_STATUS.CANCELADO]: 'CANCELADO',
  [STANDARD_MATCH_STATUS.INTERVALO]: 'INTERVALO',
  [STANDARD_MATCH_STATUS.ENCERRADO]: 'ENCERRADO',
})

export function translateCountry(value) {
  if (!value) return ''

  const aliases = {
    netherlands: 'Holanda',
    usa: 'Estados Unidos',
  }
  const direct = SPORTS_COUNTRY_TRANSLATIONS[value]
  if (direct) return direct

  const normalizedValue = String(value).trim()
  const normalizedKey = normalizedValue
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (aliases[normalizedKey]) return aliases[normalizedKey]

  const entry = Object.entries(SPORTS_COUNTRY_TRANSLATIONS).find(([key]) => {
    const normalizedTranslationKey = key
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    return normalizedTranslationKey === normalizedKey
  })

  return entry?.[1] || normalizedValue
}

export function translateCompetition(value, code) {
  return SPORTS_COMPETITION_TRANSLATIONS[code] || SPORTS_COMPETITION_TRANSLATIONS[value] || value || code || ''
}

export function translateStage(value) {
  return SPORTS_STAGE_TRANSLATIONS[value] || value || ''
}

export function getSportsStatusLabel(status) {
  const normalizedStatus = normalizeMatchStatus(status)
  return SPORTS_STATUS_LABELS[normalizedStatus] || SPORTS_STATUS_LABELS[STANDARD_MATCH_STATUS.AGENDADO]
}
