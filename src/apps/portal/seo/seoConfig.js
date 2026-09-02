export const SITE_URL = 'https://imortal0800.com'
export const SITE_NAME = 'IMORTAL0800'
export const DEFAULT_SOCIAL_IMAGE = '/banners/imortal0800-portal.webp'
export const DEFAULT_SOCIAL_IMAGE_WIDTH = '1920'
export const DEFAULT_SOCIAL_IMAGE_HEIGHT = '1080'
export const DEFAULT_SOCIAL_IMAGE_TYPE = 'image/webp'
export const DEFAULT_SOCIAL_IMAGE_ALT = 'IMORTAL0800 — Entretenimento 24h'
export const THEME_COLOR = '#010A26'

export const publicSeoPages = [
  {
    path: '/',
    title: 'IMORTAL0800 | Entretenimento 24h',
    description: 'TV, Xat, futebol, games, rádio, notícias e entretenimento em um só lugar.',
  },
  {
    path: '/football',
    title: 'Central do Futebol | IMORTAL0800',
    description: 'Acompanhe partidas ao vivo, próximos jogos, resultados, classificações, artilharia, estatísticas, escalações e bolão no IMORTAL0800.',
  },
  {
    path: '/radio',
    title: 'Rádio | IMORTAL0800',
    description: 'Ouça a rádio ao vivo, acompanhe a programação e envie seu pedido musical como usuário ou visitante.',
  },
  {
    path: '/tv',
    title: 'TV | IMORTAL0800',
    description: 'Assista aos canais e acompanhe a programação da TV no IMORTAL0800.',
  },
  {
    path: '/games',
    title: 'Games | IMORTAL0800',
    description: 'Acompanhe Free Fire, Fortnite, esports, lançamentos, campeonatos e jogos gratuitos no IMORTAL0800.',
  },
  {
    path: '/chat',
    title: 'Xat | IMORTAL0800',
    description: 'Entre no Xat oficial do IMORTAL0800 e participe da comunidade.',
  },
  {
    path: '/events',
    title: 'Eventos | IMORTAL0800',
    description: 'Confira eventos, destaques e programações especiais do IMORTAL0800.',
  },
  {
    path: '/news',
    title: 'Notícias | IMORTAL0800',
    description: 'Acompanhe notícias e destaques selecionados no IMORTAL0800.',
  },
  {
    path: '/tools',
    title: 'Ferramentas | IMORTAL0800',
    description: 'Acesse as ferramentas disponíveis no IMORTAL0800.',
  },
  {
    path: '/community',
    title: 'Comunidade | IMORTAL0800',
    description: 'Conheça os espaços, atividades e recursos da comunidade IMORTAL0800.',
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
