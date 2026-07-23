import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flag,
  Globe2,
  Heart,
  LayoutGrid,
  Radio,
  Shield,
  Star,
  Trophy,
} from 'lucide-react'

export const FOOTBALL_FILTERS = [
  { id: 'all', label: 'Todos', icon: LayoutGrid },
  { id: 'today', label: 'Hoje', icon: CalendarDays },
  { id: 'tomorrow', label: 'Amanhã', icon: Clock3 },
  { id: 'week', label: 'Esta semana', icon: CalendarDays },
  { id: 'live', label: 'Ao Vivo', icon: Radio },
  { id: 'finished', label: 'Finalizados', icon: CheckCircle2 },
  { id: 'favorites', label: 'Favoritos', icon: Heart },
]

export const FOOTBALL_COMPETITION_FILTERS = [
  { id: 'all', label: 'Todos', icon: LayoutGrid },
  { id: 'today', label: 'Hoje', icon: CalendarDays },
  { id: 'live', label: 'Ao Vivo', icon: Radio },
  { id: 'upcoming', label: 'Próximos', icon: Clock3 },
  { id: 'results', label: 'Resultados', icon: CheckCircle2 },
  { id: 'favorites', label: 'Favoritos', icon: Heart },
]

export const FOOTBALL_COMPETITION_NAV = [
  { id: 'WC', slug: 'world-cup', label: 'Copa do Mundo', icon: Globe2, codes: ['wc'], patterns: ['copa do mundo', 'world cup'] },
  { id: 'BSA', slug: 'brasileirao', label: 'Brasileirão', icon: Shield, codes: ['bsa'], patterns: ['brasileir', 'série a brasil'] },
  { id: 'CLI', slug: 'libertadores', label: 'Libertadores', icon: Trophy, codes: ['cli'], patterns: ['libertadores'] },
  { id: 'CL', slug: 'champions', label: 'Champions League', icon: Star, codes: ['cl'], patterns: ['champions'] },
  { id: 'PL', slug: 'premier-league', label: 'Premier League', icon: Flag, codes: ['pl'], patterns: ['premier'] },
  { id: 'PD', slug: 'la-liga', label: 'La Liga', icon: Flag, codes: ['pd'], patterns: ['la liga', 'primera division'] },
  { id: 'SA', slug: 'serie-a', label: 'Serie A', icon: Flag, codes: ['sa'], patterns: ['serie a italiana', 'serie a tim'] },
  { id: 'FL1', slug: 'ligue-1', label: 'Ligue 1', icon: Flag, codes: ['fl1'], patterns: ['ligue 1'] },
  { id: 'BL1', slug: 'bundesliga', label: 'Bundesliga', icon: Flag, codes: ['bl1'], patterns: ['bundesliga'] },
]

export const FOOTBALL_WORLD_CUP_STAGES = ['Grupos', '16 avos', 'Oitavas', 'Quartas', 'Semifinais', 'Final']

export const FOOTBALL_FOCUSED_VIEWS = {
  today: { title: 'Jogos de Hoje', eyebrow: 'Agenda do dia', icon: CalendarDays },
  tomorrow: { title: 'Jogos de Amanhã', eyebrow: 'Próxima agenda', icon: Clock3 },
  week: { title: 'Esta Semana', eyebrow: 'Próximos sete dias', icon: CalendarDays },
  live: { title: 'Ao Vivo', eyebrow: 'Em andamento', icon: Radio },
  finished: { title: 'Finalizados', eyebrow: 'Placares confirmados', icon: CheckCircle2 },
  results: { title: 'Últimos Resultados', eyebrow: 'Placares confirmados', icon: CheckCircle2 },
  upcoming: { title: 'Próximos Jogos', eyebrow: 'Agenda da competição', icon: Clock3 },
  favorites: { title: 'Favoritos', eyebrow: 'Sua seleção', icon: Heart },
}

export const FOOTBALL_STATUS_LEGEND = [
  { status: 'AO_VIVO', label: 'AO VIVO' },
  { status: 'FINALIZADO', label: 'FINALIZADO' },
  { status: 'INTERVALO', label: 'INTERVALO' },
  { status: 'EXTRA_TIME', label: 'PRORROGAÇÃO' },
  { status: 'PENALTY_SHOOTOUT', label: 'PÊNALTIS' },
  { status: 'ADIADO', label: 'ADIADO' },
  { status: 'CANCELADO', label: 'CANCELADO' },
]
