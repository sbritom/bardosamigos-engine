export const SITE_URL = 'https://bardosamigos.com.br'
export const SITE_NAME = 'Bar dos Amigos'
export const DEFAULT_SOCIAL_IMAGE = '/favicon-ba.png'
export const THEME_COLOR = '#010A26'

export const publicSeoPages = [
  {
    path: '/',
    title: 'Bar dos Amigos | Portal da Comunidade',
    description: 'Portal Bar dos Amigos com radio ao vivo, TV, futebol, eventos, noticias, ferramentas e comunidade.',
  },
  {
    path: '/football',
    title: 'Central do Futebol | Bar dos Amigos',
    description: 'Acompanhe partidas ao vivo, resultados, proximos jogos, classificacoes e estatisticas no Bar dos Amigos.',
  },
  {
    path: '/radio',
    title: 'Radio Bar dos Amigos | Ao Vivo',
    description: 'Ouça a Radio Bar dos Amigos ao vivo, acompanhe a musica atual e envie seu pedido musical para o locutor.',
  },
  {
    path: '/tv',
    title: 'TV Bar dos Amigos | Canais ao Vivo',
    description: 'Assista aos canais da TV Bar dos Amigos em uma experiencia organizada, moderna e integrada ao portal.',
  },
  {
    path: '/events',
    title: 'Eventos do Bar | Bar dos Amigos',
    description: 'Veja os eventos ativos do Bar dos Amigos, incluindo Ranking de BarCoins, bingo, premios e regulamentos.',
  },
  {
    path: '/news',
    title: 'Noticias | Bar dos Amigos',
    description: 'Leia as principais noticias selecionadas para a comunidade do Bar dos Amigos.',
  },
  {
    path: '/tools',
    title: 'BarStudio | Ferramentas do Bar dos Amigos',
    description: 'Acesse ferramentas do BarStudio para criar, ajustar e preparar conteudos da comunidade.',
  },
  {
    path: '/community',
    title: 'Comunidade | Bar dos Amigos',
    description: 'Conheca os canais, atividades e espacos oficiais da comunidade Bar dos Amigos.',
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
