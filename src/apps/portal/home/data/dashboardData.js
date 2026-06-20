export const nextMatch = {
  championship: 'Brasileirao Serie A',
  homeTeam: 'Flamengo',
  awayTeam: 'Palmeiras',
  homeShield: 'FLA',
  awayShield: 'PAL',
  startsAt: new Date(Date.now() + 1000 * 60 * 60 * 7 + 1000 * 60 * 22).toISOString(),
  predictions: 1284,
  lastPrediction: 'Flamengo 2 x 1 Palmeiras',
}

export const tvEvent = {
  title: 'Futebol ao vivo',
  category: 'Esportes',
  status: 'AO VIVO',
}

export const latestNews = [
  {
    id: 'news-1',
    title: 'Rodada decisiva movimenta a comunidade',
    category: 'Esportes',
    date: '19/06/2026',
    thumbnail: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=320&q=80',
  },
  {
    id: 'news-2',
    title: 'Agenda do fim de semana no Bar dos Amigos',
    category: 'Eventos',
    date: '19/06/2026',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=320&q=80',
  },
  {
    id: 'news-3',
    title: 'Novidades chegam ao ranking da plataforma',
    category: 'Comunidade',
    date: '18/06/2026',
    thumbnail: 'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=320&q=80',
  },
]

export const ranking = [
  ['AlambiqueXP', 9820],
  ['GIAN', 9340],
  ['BiaLinda', 8910],
  ['Silent', 8400],
  ['Garcom', 8150],
  ['Mayara', 7900],
  ['NoobMaster', 7410],
  ['RafaGol', 7200],
  ['DudaPlay', 6880],
  ['BarLover', 6400],
]

export const communityEvents = [
  { id: 'event-1', title: 'Noite do Bolao', date: 'Hoje, 21:00', category: 'Competicao' },
  { id: 'event-2', title: 'Resenha da Rodada', date: 'Amanha, 19:30', category: 'Comunidade' },
  { id: 'event-3', title: 'Especial Radio Bar', date: 'Domingo, 18:00', category: 'Radio' },
]
