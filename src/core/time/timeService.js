export const BRAZIL_TIME_ZONE = 'America/Sao_Paulo'
export const BRAZIL_LOCALE = 'pt-BR'

export const STANDARD_MATCH_STATUS = Object.freeze({
  AO_VIVO: 'AO_VIVO',
  AGENDADO: 'AGENDADO',
  FINALIZADO: 'FINALIZADO',
  ADIADO: 'ADIADO',
  CANCELADO: 'CANCELADO',
  INTERVALO: 'INTERVALO',
  ENCERRADO: 'ENCERRADO',
})

const DATE_FORMATTER = new Intl.DateTimeFormat(BRAZIL_LOCALE, {
  timeZone: BRAZIL_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
})

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat(BRAZIL_LOCALE, {
  timeZone: BRAZIL_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

const FULL_DATE_TIME_FORMATTER = new Intl.DateTimeFormat(BRAZIL_LOCALE, {
  timeZone: BRAZIL_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const TIME_FORMATTER = new Intl.DateTimeFormat(BRAZIL_LOCALE, {
  timeZone: BRAZIL_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const PARTS_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: BRAZIL_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

function toDate(value = new Date()) {
  return value instanceof Date ? value : new Date(value)
}

export function getUtcTimestamp(value = new Date()) {
  return toDate(value).getTime()
}

function getBrazilParts(value = new Date()) {
  const parts = PARTS_FORMATTER.formatToParts(toDate(value))

  return parts.reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value
    return acc
  }, {})
}

export function nowUtcIso() {
  return new Date().toISOString()
}

export function getBrazilDateKey(value = new Date()) {
  const parts = getBrazilParts(value)
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function getBrazilTime(value = new Date()) {
  return TIME_FORMATTER.format(toDate(value))
}

export function getBrazilDateIso(value = new Date()) {
  const parts = getBrazilParts(value)
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}-03:00`
}

export function getBrazilDatePayload(value = new Date()) {
  const date = toDate(value)

  return {
    utc_date: date.toISOString(),
    local_date: getBrazilDateKey(date),
    local_date_iso: getBrazilDateIso(date),
    local_time: getBrazilTime(date),
  }
}

export function formatBrazilDate(value) {
  if (!value) return ''
  return DATE_FORMATTER.format(toDate(value))
}

export function formatBrazilDateTime(value) {
  if (!value) return ''
  return DATE_TIME_FORMATTER.format(toDate(value))
}

export function formatBrazilFullDateTime(value) {
  if (!value) return ''
  return FULL_DATE_TIME_FORMATTER.format(toDate(value))
}

export function formatBrazilSyncDateTime(value) {
  if (!value) return '-'
  const date = toDate(value)
  return `${formatBrazilDate(date)}\n${getBrazilTime(date)}`
}

export function isSameBrazilDay(left, right = new Date()) {
  return getBrazilDateKey(left) === getBrazilDateKey(right)
}

export function getRelativeBrazilDayLabel(value, now = new Date()) {
  const date = toDate(value)
  const dateKey = getBrazilDateKey(date)
  const today = getBrazilDateKey(now)
  const tomorrow = new Date(toDate(now))
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(toDate(now))
  yesterday.setDate(yesterday.getDate() - 1)

  if (dateKey === today) return 'Hoje'
  if (dateKey === getBrazilDateKey(tomorrow)) return 'Amanhã'
  if (dateKey === getBrazilDateKey(yesterday)) return 'Ontem'
  return formatBrazilDate(date)
}

export function createBrazilDateWindow({ pastDays = 2, futureDays = 14, now = new Date() } = {}) {
  const start = new Date(toDate(now))
  start.setDate(start.getDate() - pastDays)
  const end = new Date(toDate(now))
  end.setDate(end.getDate() + futureDays)

  return {
    dateFrom: getBrazilDateKey(start),
    dateTo: getBrazilDateKey(end),
    fromIso: `${getBrazilDateKey(start)}T00:00:00-03:00`,
    toIso: `${getBrazilDateKey(end)}T23:59:59-03:00`,
  }
}

export function normalizeMatchStatus(status) {
  const value = String(status || '').toUpperCase()

  if (['LIVE', 'IN_PLAY', '1H', '2H', 'AO_VIVO'].includes(value)) return STANDARD_MATCH_STATUS.AO_VIVO
  if (['PAUSED', 'HALFTIME', 'HALF_TIME', 'HT', 'INTERVALO'].includes(value)) return STANDARD_MATCH_STATUS.INTERVALO
  if (['FINISHED', 'COMPLETED', 'FULL_TIME', 'FT', 'AFTER_EXTRA_TIME', 'PENALTY_SHOOTOUT', 'FINALIZADO'].includes(value)) return STANDARD_MATCH_STATUS.FINALIZADO
  if (['TIMED', 'SCHEDULED', 'NS', 'NOT_STARTED', 'AGENDADO'].includes(value)) return STANDARD_MATCH_STATUS.AGENDADO
  if (['POSTPONED', 'SUSPENDED', 'ADIADO'].includes(value)) return STANDARD_MATCH_STATUS.ADIADO
  if (['CANCELED', 'CANCELLED', 'CANCELADO'].includes(value)) return STANDARD_MATCH_STATUS.CANCELADO
  if (['AWARDED', 'ENCERRADO'].includes(value)) return STANDARD_MATCH_STATUS.ENCERRADO
  return STANDARD_MATCH_STATUS.AGENDADO
}

export function toLegacyMatchStatus(standardStatus) {
  if (standardStatus === STANDARD_MATCH_STATUS.AO_VIVO || standardStatus === STANDARD_MATCH_STATUS.INTERVALO) return 'live'
  if (standardStatus === STANDARD_MATCH_STATUS.FINALIZADO || standardStatus === STANDARD_MATCH_STATUS.ENCERRADO) return 'finished'
  if (standardStatus === STANDARD_MATCH_STATUS.ADIADO) return 'postponed'
  if (standardStatus === STANDARD_MATCH_STATUS.CANCELADO) return 'canceled'
  return 'scheduled'
}

export function isLiveStatus(status) {
  return [STANDARD_MATCH_STATUS.AO_VIVO, STANDARD_MATCH_STATUS.INTERVALO].includes(normalizeMatchStatus(status))
}

export function isFinishedStatus(status) {
  return [STANDARD_MATCH_STATUS.FINALIZADO, STANDARD_MATCH_STATUS.ENCERRADO].includes(normalizeMatchStatus(status))
}

export function getMatchDisplayPriority(match, now = new Date()) {
  const status = normalizeMatchStatus(match.standardStatus || match.standard_status || match.status)
  const startsAt = toDate(match.startsAt || match.starts_at || match.utc_date)

  if (isLiveStatus(status)) return 0
  if (!isFinishedStatus(status) && isSameBrazilDay(startsAt, now) && startsAt.getTime() >= toDate(now).getTime()) return 1
  if (!isFinishedStatus(status) && startsAt.getTime() > toDate(now).getTime()) return 2
  if (isFinishedStatus(status)) return 3
  return 4
}

export function compareMatchPriority(left, right, now = new Date()) {
  const priorityDiff = getMatchDisplayPriority(left, now) - getMatchDisplayPriority(right, now)
  if (priorityDiff !== 0) return priorityDiff

  const leftTime = toDate(left.startsAt || left.starts_at || left.utc_date).getTime()
  const rightTime = toDate(right.startsAt || right.starts_at || right.utc_date).getTime()

  if (isFinishedStatus(left.standardStatus || left.standard_status || left.status)) {
    return rightTime - leftTime
  }

  return leftTime - rightTime
}

export function getCountdownLabel(targetDate, now = new Date()) {
  const diffMs = toDate(targetDate).getTime() - toDate(now).getTime()
  if (diffMs <= 0) return 'Agora'

  const minutes = Math.round(diffMs / 60000)
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hora' : 'horas'}`

  const days = Math.round(hours / 24)
  if (days === 1) return 'Amanhã'
  return `${days} dias`
}

export function getCountdownParts(targetDate, now = new Date()) {
  const difference = Math.max(0, toDate(targetDate).getTime() - toDate(now).getTime())
  const hours = Math.floor(difference / 1000 / 60 / 60)
  const minutes = Math.floor((difference / 1000 / 60) % 60)
  const seconds = Math.floor((difference / 1000) % 60)

  return {
    hours,
    minutes,
    seconds,
    label: getCountdownLabel(targetDate, now),
  }
}
