import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ImageIcon, Sparkles } from 'lucide-react'
import { bingoBanner, rankingBanner } from '../../../assets/events/eventBanners'
import { EmptyState, HeroCard, SectionHeader } from '../../../design-system'
import {
  formatEventDate,
  getEventRecurrenceLabel,
  getEventSummary,
  getEventTimeLabel,
  getEventType,
  getParticipationRule,
  isFeaturedEvent,
  isRecurringEvent,
  listPublishedEvents,
} from '../services/eventsService'
import { EventCard } from './EventCard'
import { EventDetails } from './EventDetails'
import { EventHighlightBanner } from './EventHighlightBanner'
import './eventsPage.css'

const HERO_TEXT = 'Bingos, brincadeiras e momentos especiais. Confira o que vem por aí e não fique de fora.'

const ACTIVE_EVENT_HIGHLIGHT = {
  slug: 'ranking-de-barcoins',
  eyebrow: 'Evento em destaque',
  title: '🏆 RANKING DE BARCOINS',
  description: 'Colete BarCoins durante 30 dias e dispute grandes premiações.',
  period: '23/07/2026 → 23/08/2026',
  prizeLabel: 'Premiação',
  prizes: ['🥇 2.000 xats', '🥈 1.500 xats', '🥉 1.000 xats'],
  actionLabel: 'Ver Regulamento',
}

const EVENT_LIST_PRESETS = [
  {
    id: 'configured-ranking-de-barcoins',
    title: '🏆 Ranking de BarCoins',
    slug: 'ranking-de-barcoins',
    description: 'Colete BarCoins, acompanhe sua posição e dispute a premiação especial do Bar dos Amigos.',
    status: 'published',
    location: 'xat.com/BarDosAmigos',
    banner: rankingBanner,
    metadata: {
      type: 'Competição',
      timeLabel: '23/07/2026 → 23/08/2026',
      summary: 'Evento de 30 dias valendo xats para os melhores colocados.',
    },
  },
  {
    id: 'configured-bingo-do-bar-dos-amigos',
    title: '🎉 Bingo do Bar dos Amigos',
    slug: 'bingo-do-bar-dos-amigos',
    description: 'Participe do bingo, siga as instruções da equipe e concorra aos prêmios preparados para a comunidade.',
    status: 'published',
    location: 'xat.com/BarDosAmigos',
    banner: bingoBanner,
    metadata: {
      type: 'Bingo',
      timeLabel: '20:30',
      summary: 'Bingo oficial do Bar dos Amigos com configuração preparada para edição futura.',
    },
  },
]

const BINGO_DETAIL = {
  title: 'Bingo do Bar dos Amigos',
  banner: bingoBanner,
  status: 'active',
  period: '20:30',
  prizes: 'Configuração preparada para edição futura.',
  howToParticipate: 'Aguarde o início do bingo e siga todas as instruções da equipe.',
  rules: [
    'Apenas 1 conta por participante.',
    'O vencedor deverá responder dentro do tempo informado.',
    'Contas alternativas não poderão receber premiação.',
    'Em caso de fraude ou descumprimento das regras, o prêmio será cancelado.',
  ],
}

const EVENT_DETAIL_PRESETS = {
  'ranking-de-barcoins': {
    title: 'Ranking de BarCoins',
    banner: rankingBanner,
    status: 'active',
    period: '23/07/2026 → 23/08/2026',
    prizes: ['🥇 2.000 xats', '🥈 1.500 xats', '🥉 1.000 xats'],
    howToParticipate: 'Colete BarCoins participando das atividades do Bar dos Amigos durante todo o período do evento.',
    rules: [
      'Apenas 1 conta por participante.',
      'Proibido utilizar scripts, bots ou qualquer tipo de automação.',
      'Necessário estar ativo no xat.com/BarDosAmigos.',
      'As BarCoins são pessoais e intransferíveis.',
      'Fraudes ou tentativa de manipulação resultarão em desclassificação.',
      'A decisão da equipe do Bar dos Amigos é soberana.',
    ],
    rankingTitle: 'Ranking Oficial',
    ranking: 'O Ranking de BarCoins é contabilizado automaticamente pelo EVOX Bot.\n\nPara consultar sua posição ou acompanhar a classificação oficial, utilize os comandos disponíveis do EVOX Bot diretamente na sala xat.com/BarDosAmigos.',
  },
  'bingo-do-bar-dos-amigos': BINGO_DETAIL,
  'bingos-e-brincadeiras-do-bar': BINGO_DETAIL,
}

function mergeConfiguredEvents(events = []) {
  const presetsBySlug = new Map(EVENT_LIST_PRESETS.map((event) => [event.slug, event]))
  const mergedEvents = events.map((event) => {
    const preset = presetsBySlug.get(event.slug)
    if (!preset) return event

    return {
      ...preset,
      ...event,
      banner: event.banner || event.metadata?.banner || preset.banner,
      metadata: {
        ...preset.metadata,
        ...event.metadata,
      },
    }
  })
  const existingSlugs = new Set(mergedEvents.map((event) => event.slug).filter(Boolean))
  const missingConfiguredEvents = EVENT_LIST_PRESETS.filter((event) => !existingSlugs.has(event.slug))

  return [...mergedEvents, ...missingConfiguredEvents]
}

function normalizePresetKey(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getDetailStatus(event = {}) {
  const status = String(event.status || '').toLowerCase()
  if (['archived', 'ended', 'finished', 'closed'].includes(status)) return 'ended'
  if (status === 'draft') return 'upcoming'
  return 'active'
}

function buildEventDetail(event = {}) {
  const presetKey = event.slug || normalizePresetKey(event.title)
  const preset = EVENT_DETAIL_PRESETS[presetKey] || EVENT_DETAIL_PRESETS[normalizePresetKey(event.title)] || {}
  const date = event.dateLabel || formatEventDate(event.starts_at || event.startsAt)
  const time = getEventTimeLabel(event)
  const recurrence = getEventRecurrenceLabel(event)
  const period = preset.period || [recurrence || date, time].filter(Boolean).join(' - ') || 'Período a definir'
  const participationRule = getParticipationRule(event)
  const summary = getEventSummary(event)
  const type = getEventType(event)

  return {
    id: event.id,
    slug: event.slug || presetKey,
    title: preset.title || event.title || 'Evento',
    description: summary || event.description || null,
    banner: preset.banner || event.banner || event.metadata?.banner || null,
    status: preset.status || getDetailStatus(event),
    period,
    howToParticipate: preset.howToParticipate || participationRule || 'Acompanhe as instruções da equipe do Bar dos Amigos.',
    prizes: preset.prizes || 'Premiação será informada pela equipe.',
    rules: preset.rules || ['Respeite as orientações da equipe.', 'A participação deve seguir as regras do Bar dos Amigos.'],
    rankingTitle: preset.rankingTitle || event.metadata?.rankingTitle || null,
    ranking: preset.ranking || event.metadata?.ranking || null,
    type,
  }
}

function EventsEmptyState() {
  return (
    <div className="bds-events-empty">
      <EmptyState
        icon={<CalendarDays size={36} />}
        title="Nenhum evento programado no momento."
        description="Fique de olho. Em breve teremos novidades por aqui."
      />
    </div>
  )
}

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)

  useEffect(() => {
    let active = true

    async function loadEvents() {
      setLoading(true)
      const result = await listPublishedEvents()

      if (result.error) {
        console.warn('[EventsPage] Falha ao carregar eventos publicados', result.error)
      }

      if (active) {
        setEvents(Array.isArray(result.data) ? result.data : [])
        setLoading(false)
      }
    }

    loadEvents()

    return () => {
      active = false
    }
  }, [])

  const displayEvents = useMemo(() => mergeConfiguredEvents(events), [events])
  const featuredEvent = useMemo(() => displayEvents.find(isFeaturedEvent) || null, [displayEvents])
  const recurringEvents = useMemo(
    () => displayEvents.filter((event) => event.id !== featuredEvent?.id && isRecurringEvent(event)),
    [displayEvents, featuredEvent],
  )
  const regularEvents = useMemo(
    () => displayEvents.filter((event) => event.id !== featuredEvent?.id && !isRecurringEvent(event)),
    [displayEvents, featuredEvent],
  )
  const highlightEvent = useMemo(
    () => displayEvents.find((event) => event.slug === ACTIVE_EVENT_HIGHLIGHT.slug) || null,
    [displayEvents],
  )
  const selectedEventDetail = useMemo(() => (selectedEvent ? buildEventDetail(selectedEvent) : null), [selectedEvent])

  return (
    <main className="bds-events-page">
      <HeroCard className="bds-events-hero" title="EVENTOS DO BAR" subtitle={HERO_TEXT} />

      {selectedEventDetail ? (
        <EventDetails event={selectedEventDetail} onBack={() => setSelectedEvent(null)} />
      ) : loading ? (
        <section className="bds-events-section" aria-live="polite">
          <div className="bds-events-loading">
            <Sparkles size={22} />
            <span>Carregando eventos...</span>
          </div>
        </section>
      ) : displayEvents.length === 0 ? (
        <EventsEmptyState />
      ) : (
        <>
          <EventHighlightBanner highlight={ACTIVE_EVENT_HIGHLIGHT} event={highlightEvent} onOpen={setSelectedEvent} />

          {featuredEvent && (
            <section className="bds-events-section">
              <SectionHeader eyebrow="Destaque" title="Evento em destaque" />
              <EventCard event={featuredEvent} featured onSelect={setSelectedEvent} />
            </section>
          )}

          {regularEvents.length > 0 && (
            <section className="bds-events-section">
              <SectionHeader eyebrow="Agenda" title="Próximos eventos" />
              <div className="bds-events-grid">
                {regularEvents.map((event) => <EventCard key={event.id} event={event} onSelect={setSelectedEvent} />)}
              </div>
            </section>
          )}

          {recurringEvents.length > 0 && (
            <section className="bds-events-section">
              <SectionHeader eyebrow="Recorrentes" title="Eventos recorrentes" />
              <div className="bds-events-grid bds-events-grid--compact">
                {recurringEvents.map((event) => <EventCard key={event.id} event={event} onSelect={setSelectedEvent} />)}
              </div>
            </section>
          )}
        </>
      )}

      {!selectedEventDetail && !loading && displayEvents.length > 0 && regularEvents.length === 0 && recurringEvents.length === 0 && !featuredEvent && (
        <section className="bds-events-section">
          <div className="bds-events-note">
            <ImageIcon size={20} />
            <span>Eventos publicados encontrados, mas sem informações suficientes para exibição detalhada.</span>
          </div>
        </section>
      )}
    </main>
  )
}
