export const SITE_URL = 'https://www.radiobardosamigos.com.br'
export const SITE_NAME = 'Bar dos Amigos'
export const DEFAULT_SOCIAL_IMAGE = '/social/bar-dos-amigos-social.jpg'
export const DEFAULT_SOCIAL_IMAGE_WIDTH = '1200'
export const DEFAULT_SOCIAL_IMAGE_HEIGHT = '630'
export const DEFAULT_SOCIAL_IMAGE_ALT = 'Bar dos Amigos — Rádio, TV, Futebol e Comunidade'
export const THEME_COLOR = '#010A26'

export const publicSeoPages = [
  {
    path: '/',
    title: 'Bar dos Amigos | Portal da Comunidade',
    description: 'Portal Bar dos Amigos com rádio ao vivo, TV, futebol, eventos, notícias, ferramentas e comunidade.',
  },
  {
    path: '/football',
    title: 'Central do Futebol | Bar dos Amigos',
    description: 'Acompanhe partidas ao vivo, resultados, próximos jogos, classificações e estatísticas no Bar dos Amigos.',
  },
  {
    path: '/radio',
    title: 'Rádio Bar dos Amigos | Ao Vivo',
    description: 'Ouça a Rádio Bar dos Amigos ao vivo, acompanhe a música atual e envie seu pedido musical para o locutor.',
  },
  {
    path: '/tv',
    title: 'TV Bar dos Amigos | Canais ao Vivo',
    description: 'Assista aos canais da TV Bar dos Amigos em uma experiência organizada, moderna e integrada ao portal.',
  },
  {
    path: '/events',
    title: 'Eventos do Bar | Bar dos Amigos',
    description: 'Veja a agenda de eventos do Bar dos Amigos, destaques, bingos, programações especiais e regulamentos.',
  },
  {
    path: '/news',
    title: 'Notícias | Bar dos Amigos',
    description: 'Leia as principais notícias selecionadas para a comunidade do Bar dos Amigos.',
  },
  {
    path: '/tools',
    title: 'BarStudio | Ferramentas do Bar dos Amigos',
    description: 'Acesse ferramentas do BarStudio para criar, ajustar e preparar conteúdos da comunidade.',
  },
  {
    path: '/community',
    title: 'Comunidade | Bar dos Amigos',
    description: 'Conheça os canais, atividades e espaços oficiais da comunidade Bar dos Amigos.',
  },
]

export const defaultSeo = publicSeoPages[0]

export function getCanonicalUrl(path = '/') {
  const normalizedPath = path === '/' ? '/' : `/${String(path).replace(/^\/+|\/+$/g, '')}`
  return `${SITE_URL}${normalizedPath === '/' ? '' : normalizedPath}`
}

export function getSeoForPath(pathname = '/') {
  const normalizedPath = pathname.replace(/\/+$/g, '') || '/'
  const page = publicSeoPages.find((item) => item.path === normalizedPath)

  if (page) {
    return {
      ...page,
      canonical: getCanonicalUrl(page.path),
      robots: 'index,follow',
    }
  }

  return {
    ...defaultSeo,
    canonical: getCanonicalUrl(normalizedPath),
    robots: 'noindex,nofollow',
  }
}
