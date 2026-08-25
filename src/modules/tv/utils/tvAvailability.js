export const TV_AVAILABILITY_SCOPE = Object.freeze({
  GLOBAL: 'GLOBAL',
  BR_ONLY: 'BR_ONLY',
  COUNTRY_LIST: 'COUNTRY_LIST',
})

export function normalizeTVCountryCode(value) {
  const country = String(value || '').trim().toUpperCase()
  return /^[A-Z]{2}$/.test(country) ? country : ''
}

export function getTVChannelAvailabilityScope(channel) {
  const configured = String(channel?.availabilityScope || '').trim().toUpperCase()
  if (Object.values(TV_AVAILABILITY_SCOPE).includes(configured)) return configured

  // Compatibilidade com catálogos antigos: o provedor brasileiro atual é BR-only.
  if (channel?.provider === 'embed-canais-tv') return TV_AVAILABILITY_SCOPE.BR_ONLY
  return TV_AVAILABILITY_SCOPE.GLOBAL
}

export function isTVChannelAvailableInCountry(channel, countryCode) {
  const country = normalizeTVCountryCode(countryCode)
  const scope = getTVChannelAvailabilityScope(channel)

  // Em desenvolvimento ou quando a infraestrutura não fornece o país,
  // não bloqueamos o player para evitar falso positivo.
  if (!country) return true
  if (scope === TV_AVAILABILITY_SCOPE.GLOBAL) return true
  if (scope === TV_AVAILABILITY_SCOPE.BR_ONLY) return country === 'BR'

  if (scope === TV_AVAILABILITY_SCOPE.COUNTRY_LIST) {
    const allowed = Array.isArray(channel?.allowedCountries)
      ? channel.allowedCountries.map(normalizeTVCountryCode).filter(Boolean)
      : []
    return allowed.includes(country)
  }

  return true
}

export function sortTVChannelsForCountry(channels, countryCode) {
  const list = Array.isArray(channels) ? [...channels] : []
  if (!normalizeTVCountryCode(countryCode)) return list

  return list.sort((left, right) => {
    const leftAvailable = isTVChannelAvailableInCountry(left, countryCode)
    const rightAvailable = isTVChannelAvailableInCountry(right, countryCode)
    if (leftAvailable === rightAvailable) return 0
    return leftAvailable ? -1 : 1
  })
}
