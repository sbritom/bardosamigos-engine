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
  { id: 'tomorrow', label: 'Amanha', icon: Clock3 },
  { id: 'week', label: 'Esta semana', icon: CalendarDays },
  { id: 'live', label: 'Ao Vivo', icon: Radio },
  { id: 'finished', label: 'Finalizados', icon: CheckCircle2 },
  { id: 'favorites', label: 'Favoritos', icon: Heart },
]

export const FOOTBALL_COMPETITION_FILTERS = [
  { id: 'all', label: 'Todos', icon: LayoutGrid },
  { id: 'today', label: 'Hoje', icon: CalendarDays },
  { id: 'live', label: 'Ao Vivo', icon: Radio },
  { id: 'upcoming', label: 'Proximos', icon: Clock3 },
  { id: 'results', label: 'Resultados', icon: CheckCircle2 },
  { id: 'favorites', label: 'Favoritos', icon: Heart },
]

export const FOOTBALL_COMPETITION_NAV = [
  { id: 'WC', slug: 'world-cup', label: 'FIFA World Cup', icon: Globe2, codes: ['wc'], patterns: ['copa do mundo', 'world cup'] },
  { id: 'CL', slug: 'champions', label: 'UEFA Champions League', icon: Star, codes: ['cl'], patterns: ['champions'] },
  { id: 'BL1', slug: 'bundesliga', label: 'Bundesliga', icon: Flag, codes: ['bl1'], patterns: ['bundesliga'] },
  { id: 'DED', slug: 'eredivisie', label: 'Eredivisie', icon: Flag, codes: ['ded'], patterns: ['eredivisie'] },
  { id: 'BSA', slug: 'brasileirao', label: 'Brasileirão Série A', icon: Shield, codes: ['bsa'], patterns: ['brasileir', 'serie a brasil', 'série a brasil'] },
  { id: 'PD', slug: 'primera-division', label: 'Primera Division', icon: Flag, codes: ['pd'], patterns: ['la liga', 'primera division'] },
  { id: 'FL1', slug: 'ligue-1', label: 'Ligue 1', icon: Flag, codes: ['fl1'], patterns: ['ligue 1'] },
  { id: 'ELC', slug: 'championship', label: 'Championship', icon: Flag, codes: ['elc'], patterns: ['championship'] },
  { id: 'PPL', slug: 'primeira-liga', label: 'Primeira Liga', icon: Flag, codes: ['ppl'], patterns: ['primeira liga'] },
  { id: 'EC', slug: 'european-championship', label: 'European Championship', icon: Trophy, codes: ['ec'], patterns: ['european championship', 'euro'] },
  { id: 'SA', slug: 'serie-a', label: 'Serie A', icon: Flag, codes: ['sa'], patterns: ['serie a italiana', 'serie a tim'] },
  { id: 'PL', slug: 'premier-league', label: 'Premier League', icon: Flag, codes: ['pl'], patterns: ['premier'] },
]

export const FOOTBALL_WORLD_CUP_STAGES = ['Grupos', '16 avos', 'Oitavas', 'Quartas', 'Semifinais', 'Final']

export const FOOTBALL_FOCUSED_VIEWS = {
  today: { title: 'Jogos de Hoje', eyebrow: 'Agenda do dia', icon: CalendarDays },
  tomorrow: { title: 'Jogos de Amanha', eyebrow: 'Proxima agenda', icon: Clock3 },
  week: { title: 'Esta Semana', eyebrow: 'Proximos sete dias', icon: CalendarDays },
  live: { title: 'Ao Vivo', eyebrow: 'Em andamento', icon: Radio },
  finished: { title: 'Finalizados', eyebrow: 'Placares confirmados', icon: CheckCircle2 },
  results: { title: 'Ultimos Resultados', eyebrow: 'Placares confirmados', icon: CheckCircle2 },
  upcoming: { title: 'Proximos Jogos', eyebrow: 'Agenda da competicao', icon: Clock3 },
  favorites: { title: 'Favoritos', eyebrow: 'Sua selecao', icon: Heart },
}

export const FOOTBALL_STATUS_LEGEND = [
  { status: 'AO_VIVO', label: 'AO VIVO' },
  { status: 'FINALIZADO', label: 'FINALIZADO' },
  { status: 'INTERVALO', label: 'INTERVALO' },
  { status: 'EXTRA_TIME', label: 'PRORROGACAO' },
  { status: 'PENALTY_SHOOTOUT', label: 'PENALTIS' },
  { status: 'ADIADO', label: 'ADIADO' },
  { status: 'CANCELADO', label: 'CANCELADO' },
]
