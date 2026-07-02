import { nowUtcIso } from '../../../../core/time'

export const nextMatch = {
  championship: 'Brasileirao Serie A',
  homeTeam: 'Flamengo',
  awayTeam: 'Palmeiras',
  homeShield: 'FLA',
  awayShield: 'PAL',
  startsAt: nowUtcIso(),
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
    date: '20/06/2026',
  },
  {
    id: 'news-2',
    title: 'Agenda do fim de semana no Bar dos Amigos',
    category: 'Eventos',
    date: '20/06/2026',
  },
  {
    id: 'news-3',
    title: 'Novidades chegam ao Bar Competition',
    category: 'Comunidade',
    date: '19/06/2026',
  },
]

export const communityEvents = [
  { id: 'event-1', title: 'Noite do Bolao', date: 'Hoje, 21:00', category: 'Competicao' },
  { id: 'event-2', title: 'Resenha da Rodada', date: 'Amanha, 19:30', category: 'Comunidade' },
  { id: 'event-3', title: 'Especial Radio Bar', date: 'Domingo, 18:00', category: 'Radio' },
]

export const latestResults = [
  { id: 'result-1', game: 'Santos 1 x 2 Corinthians', championship: 'Copa do Bar' },
  { id: 'result-2', game: 'Bahia 0 x 0 Vitoria', championship: 'Classico da Comunidade' },
]

export const barStudioTools = [
  'Cortar Foto Redonda',
  'NameGrad',
  'NameWave',
  'Pedir Musica',
  'Redimensionar Imagem',
  'Remover Fundo (Em breve)',
  'Criador de Avatar (Em breve)',
]
