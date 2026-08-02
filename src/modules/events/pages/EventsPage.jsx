import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, FileText, Gift, PartyPopper, ScrollText, Sparkles, Star, Trophy } from 'lucide-react'
import { bingoBanner, rankingBanner } from '../../../assets/events/eventBanners'
import { Button, EmptyState, HeroCard } from '../../../design-system'
import { PortalWorkspace, WorkspaceEmptyState, WorkspaceSkeleton } from '../../../shared/workspace'
import {
  formatEventDate,
  getEventRecurrenceLabel,
  getEventSummary,
  getEventTimeLabel,
  getEventType,
  getParticipationRule,
  isFeaturedEvent,
  listPublishedEvents,
} from '../services/eventsService'
import { EventCard } from './EventCard'
import { EventDetails } from './EventDetails'
import { EventHighlightBanner } from './EventHighlightBanner'
import './eventsPage.css'

const HERO_TEXT = 'Bingos, brincadeiras e momentos especiais. Confira o que vem por ai e nao fique de fora.'

const ACTIVE_EVENT_HIGHLIGHT = {
  slug: 'ranking-de-barcoins',
  eyebrow: 'Evento em destaque',
  title: 'Ranking de BarCoins',
  description: 'Colete BarCoins durante 30 dias e dispute grandes premiacoes.',
  period: '23/07/2026 -> 23/08/2026',
  prizeLabel: 'Premiacao',
  prizes: ['1o 2.000 xats', '2o 1.500 xats', '3o 1.000 xats'],
  actionLabel: 'Ver Regulamento',
}

const EVENT_LIST_PRESETS = [
  {
    id: 'configured-ranking-de-barcoins',
    title: 'Ranking de BarCoins',
    slug: 'ranking-de-barcoins',
    description: 'Colete BarCoins, acompanhe sua posicao e dispute a premiacao especial do Bar dos Amigos.',
    status: 'published',
    location: 'xat.com/BarDosAmigos',
    banner: rankingBanner,
    metadata: {
      type: 'Competicao',
      timeLabel: '23/07/2026 -> 23/08/2026',
      summary: 'Evento de 30 dias valendo xats para os melhores colocados.',
    },
  },
  {
    id: 'configured-bingo-do-bar-dos-amigos',
    title: 'Bingo do Bar dos Amigos',
    slug: 'bingo-do-bar-dos-amigos',
    description: 'Participe do bingo, siga as instrucoes da equipe e concorra aos premios preparados para a comunidade.',
    status: 'published',
    location: 'xat.com/BarDosAmigos',
    banner: bingoBanner,
    metadata: {
      type: 'Bingo',
      timeLabel: '20:30',
      summary: 'Bingo oficial do Bar dos Amigos com configuracao preparada para edicao futura.',
    },
  },
]

const BINGO_DETAIL = {
  title: 'Bingo do Bar dos Amigos',
  banner: bingoBanner,
  status: 'active',
  period: '20:30',
  prizes: 'Configuracao preparada para edicao futura.',
  howToParticipate: 'Aguarde o inicio do bingo e siga todas as instrucoes da equipe.',
  rules: [
    'Apenas 1 conta por participante.',
    'O vencedor devera responder dentro do tempo informado.',
    'Contas alternativas nao poderao receber premiacao.',
    'Em caso de fraude ou descumprimento das regras, o premio sera cancelado.',
  ],
}

const EVENT_DETAIL_PRESETS = {
  'ranking-de-barcoins': {
    title: 'Ranking de BarCoins',
    banner: rankingBanner,
    status: 'active',
    period: '23/07/2026 -> 23/08/2026',
    prizes: ['1o 2.000 xats', '2o 1.500 xats', '3o 1.000 xats'],
    howToParticipate: 'Colete BarCoins participando das atividades do Bar dos Amigos durante todo o periodo do evento.',
    rules: [
      'Apenas 1 conta por participante.',
      'Proibido utilizar scripts, bots ou qualquer tipo de automacao.',
      'Necessario estar ativo no xat.com/BarDosAmigos.',
      'As BarCoins sao pessoais e intransferiveis.',
      'Fraudes ou tentativa de manipulacao resultarao em desclassificacao.',
      'A decisao da equipe do Bar dos Amigos e soberana.',
    ],
    rankingTitle: 'Ranking Oficial',
    ranking: 'O Ranking de BarCoins e contabilizado automaticamente pelo EVOX Bot.\n\nPara consultar sua posicao ou acompanhar a classificacao oficial, utilize os comandos disponiveis do EVOX Bot diretamente na sala xat.com/BarDosAmigos.',
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
  const period = preset.period || [recurrence || date, time].filter(Boolean).join(' - ') || 'Periodo a definir'
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
    howToParticipate: preset.howToParticipate || participationRule || 'Acompanhe as instrucoes da equipe do Bar dos Amigos.',
    prizes: preset.prizes || 'Premiacao sera informada pela equipe.',
    rules: preset.rules || ['Respeite as orientacoes da equipe.', 'A participacao deve seguir as regras do Bar dos Amigos.'],
    rankingTitle: preset.rankingTitle || event.metadata?.rankingTitle || null,
    ranking: preset.ranking || event.metadata?.ranking || null,
    type,
  }
}

function isRankingEvent(event = {}) {
  return normalizePresetKey(`${event.slug || ''} ${event.title || ''}`).includes('ranking')
}

function isBingoEvent(event = {}) {
  return normalizePresetKey(`${event.slug || ''} ${event.title || ''} ${getEventType(event) || ''}`).includes('bingo')
}

function isEventActive(event = {}) {
  return getDetailStatus(event) === 'active'
}

function isEventUpcoming(event = {}) {
  const startsAt = new Date(event.starts_at || event.startsAt || 0).getTime()
  return getDetailStatus(event) === 'upcoming' || (Number.isFinite(startsAt) && startsAt > Date.now())
}

function isEventEnded(event = {}) {
  return getDetailStatus(event) === 'ended'
}

function EventGrid({ events, onSelect, emptyTitle }) {
  if (!events.length) return <WorkspaceEmptyState title={emptyTitle} />

  return (
    <div className="bds-events-grid">
      {events.map((event) => <EventCard key={event.id || event.slug} event={event} onSelect={onSelect} />)}
    </div>
  )
}

function CompactEventList({ events, onSelect, emptyTitle, mode = 'upcoming' }) {
  if (!events.length) return <WorkspaceEmptyState title={emptyTitle} />

  return (
    <div className="grid gap-[var(--bds-space-8)]">
      {events.map((event) => {
        const detail = buildEventDetail(event)
        const time = getEventTimeLabel(event)
        const result = event.metadata?.result || event.metadata?.winner || ''
        return (
          <button
            key={event.id || event.slug}
            type="button"
            onClick={() => onSelect(event)}
            className="flex flex-wrap items-center justify-between gap-[var(--bds-space-10)] rounded-[var(--bds-radius-md)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-[var(--bds-space-12)] text-left transition hover:border-[var(--bds-color-primary-hover)] hover:bg-[var(--bds-color-background-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)]"
          >
            <span className="grid min-w-0 gap-[var(--bds-space-4)]">
              <strong className="truncate text-[var(--bds-color-text)]">{detail.title}</strong>
              <small className="text-[var(--bds-color-text-secondary)]">{mode === 'ended' ? detail.period : [detail.period, time].filter(Boolean).join(' - ')}</small>
              {mode === 'ended' && result ? <small className="text-[var(--bds-color-text-secondary)]">{result}</small> : null}
            </span>
            <span className="bds-events-status bds-events-status--active">{detail.status === 'ended' ? 'Encerrado' : detail.status === 'upcoming' ? 'Em breve' : 'Ativo'}</span>
          </button>
        )
      })}
    </div>
  )
}

function RankingPanel({ event, onOpen }) {
  if (!event) return <WorkspaceEmptyState title="Nenhum ranking disponivel." />
  const detail = buildEventDetail(event)

  return (
    <div className="grid gap-[var(--bds-space-14)]">
      <EventCard event={event} featured onSelect={onOpen} />
      <section className="bds-events-detail__section">
        <h3><Trophy size={18} />Periodo</h3>
        <div className="bds-events-detail__body"><p>{detail.period}</p></div>
      </section>
      <section className="bds-events-detail__section">
        <h3><Gift size={18} />Premiacao</h3>
        <div className="bds-events-detail__body">
          {Array.isArray(detail.prizes) ? <ul>{detail.prizes.map((item) => <li key={item}>{item}</li>)}</ul> : <p>{detail.prizes}</p>}
        </div>
      </section>
      <section className="bds-events-detail__section">
        <h3><ScrollText size={18} />Regras principais</h3>
        <div className="bds-events-detail__body">
          {Array.isArray(detail.rules) ? <ul>{detail.rules.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul> : <p>{detail.rules}</p>}
        </div>
      </section>
      <Button onClick={() => onOpen(event)}>Ver Regulamento</Button>
    </div>
  )
}

function BingoPanel({ events, onOpen }) {
  if (!events.length) return <WorkspaceEmptyState title="Nenhum bingo disponivel." />

  return (
    <div className="bds-events-grid">
      {events.map((event) => {
        const detail = buildEventDetail(event)
        return (
          <article key={event.id || event.slug} className="bds-events-card">
            <EventCard event={event} onSelect={onOpen} />
            <div className="bds-events-detail__body">
              <p>{detail.period}</p>
              {Array.isArray(detail.rules) ? <ul>{detail.rules.slice(0, 3).map((rule) => <li key={rule}>{rule}</li>)}</ul> : null}
            </div>
          </article>
        )
      })}
    </div>
  )
}

function RegulationsPanel({ events, onOpen }) {
  const regulations = events
    .map((event) => ({ event, detail: buildEventDetail(event) }))
    .filter(({ detail }) => detail.rules)

  if (!regulations.length) return <WorkspaceEmptyState title="Nenhum regulamento disponivel." />

  return (
    <div className="grid gap-[var(--bds-space-10)]">
      {regulations.map(({ event, detail }) => (
        <button
          key={event.id || event.slug}
          type="button"
          onClick={() => onOpen(event)}
          className="rounded-[var(--bds-radius-md)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-[var(--bds-space-12)] text-left transition hover:border-[var(--bds-color-primary-hover)] hover:bg-[var(--bds-color-background-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)]"
        >
          <strong className="block text-[var(--bds-color-text)]">{detail.title}</strong>
          <span className="mt-[var(--bds-space-4)] block text-sm text-[var(--bds-color-text-secondary)]">Abrir regulamento no workspace</span>
        </button>
      ))}
    </div>
  )
}

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('featured')
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
  const highlightEvent = useMemo(
    () => displayEvents.find((event) => event.slug === ACTIVE_EVENT_HIGHLIGHT.slug) || null,
    [displayEvents],
  )
  const featuredEvents = useMemo(() => {
    const featured = displayEvents.filter(isFeaturedEvent)
    if (highlightEvent && !featured.some((event) => event.id === highlightEvent.id || event.slug === highlightEvent.slug)) return [highlightEvent, ...featured]
    return featured
  }, [displayEvents, highlightEvent])
  const rankingEvent = useMemo(() => displayEvents.find(isRankingEvent) || null, [displayEvents])
  const bingoEvents = useMemo(() => displayEvents.filter(isBingoEvent), [displayEvents])
  const activeEvents = useMemo(() => displayEvents.filter(isEventActive), [displayEvents])
  const upcomingEvents = useMemo(() => displayEvents.filter(isEventUpcoming), [displayEvents])
  const endedEvents = useMemo(() => displayEvents.filter(isEventEnded), [displayEvents])
  const selectedEventDetail = useMemo(() => (selectedEvent ? buildEventDetail(selectedEvent) : null), [selectedEvent])

  function openEvent(event) {
    setSelectedEvent(event)
  }

  function closeEvent() {
    setSelectedEvent(null)
  }

  function selectView(item) {
    setActiveView(item.id)
    setSelectedEvent(null)
  }

  function renderWorkspaceContent() {
    if (selectedEventDetail) return <EventDetails event={selectedEventDetail} onBack={closeEvent} />
    if (loading) return <WorkspaceSkeleton rows={5} />
    if (!displayEvents.length) return <WorkspaceEmptyState title="Nenhum evento disponivel." />

    if (activeView === 'featured') {
      return (
        <div className="grid gap-[var(--bds-space-16)]">
          {highlightEvent ? <EventHighlightBanner highlight={ACTIVE_EVENT_HIGHLIGHT} event={highlightEvent} onOpen={openEvent} /> : null}
          <EventGrid events={featuredEvents} onSelect={openEvent} emptyTitle="Nenhum evento em destaque." />
        </div>
      )
    }

    if (activeView === 'ranking') return <RankingPanel event={rankingEvent} onOpen={openEvent} />
    if (activeView === 'bingo') return <BingoPanel events={bingoEvents} onOpen={openEvent} />
    if (activeView === 'active') return <EventGrid events={activeEvents} onSelect={openEvent} emptyTitle="Nenhum evento ativo." />
    if (activeView === 'upcoming') return <CompactEventList events={upcomingEvents} onSelect={openEvent} emptyTitle="Nenhum proximo evento." />
    if (activeView === 'ended') return <CompactEventList events={endedEvents} onSelect={openEvent} emptyTitle="Nenhum evento encerrado." mode="ended" />
    return <RegulationsPanel events={displayEvents} onOpen={openEvent} />
  }

  const activeTitle = selectedEventDetail ? selectedEventDetail.title : {
    featured: 'Destaques',
    ranking: 'Ranking BarCoins',
    bingo: 'Bingos',
    active: 'Eventos Ativos',
    upcoming: 'Proximos Eventos',
    ended: 'Eventos Encerrados',
    rules: 'Regulamentos',
  }[activeView]

  const sidebarItems = [
    { id: 'featured', icon: Star, name: 'Destaques', badge: featuredEvents.length || undefined },
    { id: 'ranking', icon: Trophy, name: 'Ranking BarCoins', badge: rankingEvent ? 1 : undefined, status: rankingEvent ? 'ATIVO' : undefined },
    { id: 'bingo', icon: PartyPopper, name: 'Bingos', badge: bingoEvents.length || undefined },
    { id: 'active', icon: Sparkles, name: 'Eventos Ativos', badge: activeEvents.length || undefined },
    { id: 'upcoming', icon: Clock3, name: 'Proximos Eventos', badge: upcomingEvents.length || undefined },
    { id: 'ended', icon: CheckCircle2, name: 'Eventos Encerrados', badge: endedEvents.length || undefined },
    { id: 'rules', icon: FileText, name: 'Regulamentos', badge: displayEvents.length || undefined },
  ]

  return (
    <main className="bds-events-page">
      <HeroCard className="bds-events-hero" title="EVENTOS DO BAR" subtitle={HERO_TEXT} />

      <PortalWorkspace
        className="bds-portal-workspace--compact"
        sidebar={{
          title: 'Eventos',
          items: sidebarItems,
          selectedId: activeView,
          onSelect: selectView,
        }}
        content={{ title: activeTitle, description: selectedEventDetail ? 'Detalhes do evento selecionado.' : 'Conteudo organizado pela sidebar.' }}
      >
        {renderWorkspaceContent()}
      </PortalWorkspace>

      {!loading && displayEvents.length > 0 && !activeEvents.length && !upcomingEvents.length && !endedEvents.length && (
        <section className="sr-only">
          <EmptyState title="Eventos disponiveis" />
        </section>
      )}
    </main>
  )
}
