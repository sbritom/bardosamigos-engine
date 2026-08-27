export const GNEWS_BASE_URL = 'https://gnews.io/api/v4'

export const GNEWS_ENDPOINTS = Object.freeze({
  SEARCH: '/search',
})

export const GNEWS_CATEGORIES = Object.freeze({
  FUTEBOL: 'Futebol',
  ESPORTES: 'Esportes',
  BRASIL: 'Brasil',
})

export const GNEWS_QUERIES = Object.freeze({
  [GNEWS_CATEGORIES.FUTEBOL]: 'futebol',
  [GNEWS_CATEGORIES.ESPORTES]: 'esportes',
  [GNEWS_CATEGORIES.BRASIL]: 'brasil',
})

export const GNEWS_DEFAULT_LANG = 'pt'
export const GNEWS_DEFAULT_COUNTRY = 'br'
export const GNEWS_DEFAULT_MAX = 10
