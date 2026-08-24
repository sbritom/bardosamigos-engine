import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, FileText, PartyPopper, Sparkles, Trophy } from 'lucide-react'
import { bingoBanner, rankingBanner } from '../../../assets/events/eventBanners'
import { Button } from '../../../design-system'
import { WorkspaceEmptyState, WorkspaceSkeleton } from '../../../shared/workspace'
import {
  getEventRecurrenceLabel,
  getEventSummary,
  getEventTimeLabel,
  getEventType,
  getParticipationRule,
  listPublishedEvents,
} from '../services/eventsService'
import { EventDetails } from './EventDetails'
import { EventHighlightBanner } from './EventHighlightBanner'
import './eventsPage.css'

const HERO_TEXT = 'Bingos, rankings, brincadeiras e momentos especiais do Bar dos Amigos.'

const RANKING_RULES = [
  'Apenas 1 conta por participante.',
  'Proibido utilizar scripts, bots ou qualquer tipo de automacao.',
  'Necessario estar ativo no xat.com/BarDosAmigos.',
  'As BarCoins sao pessoais e intransferiveis.',
  'Fraudes ou tentativa de manipulacao resultarao em desclassificacao.',
  'A decisao da equipe do Bar dos Amigos e soberana.',
]

const BINGO_RULES = [
  'Apenas 1 conta por participante.',
  'O vencedor devera responder dentro do tempo informado.',
  'Contas alternativas nao poderao receber premiacao.',
  'Em caso de fraude ou descumprimento das regras, o premio sera cancelado.',
]

const JULY_RANKING = {
  id: 'ranking-barcoins-2026-07',
  title: 'Ranking de BarCoins',
  slug: 'ranking-de-barcoins-julho-2026',
  status: 'ended',
  banner: rankingBanner,
  location: 'xat.com/BarDosAmigos',
  metadata: { type: 'Competicao', timeLabel: '23/07/2026 → 06/08/2026', summary: 'Primeira edicao do Ranking de BarCoins, encerrada apos 15 dias.' },
}

const NEXT_RANKING = {
  id: 'ranking-barcoins-proxima-edicao',
  title: 'Ranking de BarCoins',
  slug: 'ranking-de-barcoins-proxima-edicao',
  status: 'draft',
  banner: rankingBanner,
  location: 'xat.com/BarDosAmigos',
  metadata: { type: 'Competicao', timeLabel: 'Data a definir', summary: 'Proxima edicao do Ranking de BarCoins. A data sera divulgada em breve.' },
}

const BINGO_EVENT = {
  id: 'configured-bingo-do-bar-dos-amigos',
  title: 'Bingo do Bar dos Amigos',
  slug: 'bingo-do-bar-dos-amigos',
  status: 'published',
  banner: bingoBanner,
  location: 'xat.com/BarDosAmigos',
  metadata: { type: 'Bingo', timeLabel: 'Quartas-feiras ou fins de semana • horário divulgado no dia', summary: 'Bingo oficial do Bar dos Amigos com prêmios em days, xats e powers.' },
}

const HIGHLIGHT = {
  slug: 'bingo-do-bar-dos-amigos',
  eyebrow: 'Evento em destaque',
  title: 'Bingo do Bar dos Amigos',
  description: 'Música, bingo, brincadeiras e resenha com a galera do Bar.',
  period: 'Quartas-feiras ou fins de semana • horário divulgado no dia',
  prizeLabel: 'Days, xats e powers',
  prizes: ['Days', 'Xats', 'Powers'],
  actionLabel: 'Ver regulamento',
}

const DETAILS = {
  'ranking-de-barcoins-julho-2026': {
    title: 'Ranking de BarCoins — Julho/Agosto 2026',
    banner: rankingBanner,
    status: 'ended',
    period: '23/07/2026 → 06/08/2026',
    prizes: ['1º 2.000 xats', '2º 1.500 xats', '3º 1.000 xats'],
    howToParticipate: 'Colete BarCoins participando das atividades do Bar dos Amigos durante o periodo do evento.',
    rules: RANKING_RULES,
    rankingTitle: 'Ranking Oficial',
    ranking: 'O Ranking de BarCoins foi contabilizado automaticamente pelo EVOX Bot.',
  },
  'ranking-de-barcoins-proxima-edicao': {
    title: 'Ranking de BarCoins — Próxima edição',
    banner: rankingBanner,
    status: 'upcoming',
    period: 'Data a definir',
    prizes: ['1º 5.000 xats', '2º 2.000 xats', '3º 1.000 xats'],
    howToParticipate: 'Colete BarCoins participando das atividades do Bar dos Amigos durante o periodo do evento.',
    rules: RANKING_RULES,
    rankingTitle: 'Ranking Oficial',
    ranking: 'O Ranking de BarCoins sera contabilizado automaticamente pelo EVOX Bot.',
  },
  'bingo-do-bar-dos-amigos': {
    title: 'Bingo do Bar dos Amigos',
    banner: bingoBanner,
    status: 'active',
    period: 'Quartas-feiras ou fins de semana • horário divulgado no dia',
    prizes: ['Days', 'Xats', 'Powers'],
    howToParticipate: 'Aguarde o inicio do bingo e siga as instrucoes da equipe.',
    rules: BINGO_RULES,
  },
}

function key(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function isBingo(event = {}) {
  return key(`${event.slug || ''} ${event.title || ''} ${getEventType(event) || ''}`).includes('bingo')
}

function isRanking(event = {}) {
  return key(`${event.slug || ''} ${event.title || ''}`).includes('ranking')
}

function statusOf(event = {}) {
  const status = String(event.status || '').toLowerCase()
  if (['archived', 'ended', 'finished', 'closed'].includes(status)) return 'ended'
  if (status === 'draft') return 'upcoming'
  return 'active'
}

function detailOf(event = {}) {
  const preset = DETAILS[event.slug] || {}
  const recurrence = getEventRecurrenceLabel(event)
  const time = getEventTimeLabel(event)

  return {
    id: event.id,
    slug: event.slug,
    title: preset.title || event.title || 'Evento',
    description: getEventSummary(event) || event.description || null,
    banner: preset.banner || event.banner || event.metadata?.banner || null,
    status: preset.status || statusOf(event),
    period: preset.period || [recurrence, time].filter(Boolean).join(' - ') || 'Periodo a definir',
    howToParticipate: preset.howToParticipate || getParticipationRule(event) || 'Acompanhe as instrucoes da equipe.',
    prizes: preset.prizes || 'Premiacao sera informada pela equipe.',
    rules: preset.rules || ['Respeite as orientacoes da equipe.'],
    rankingTitle: preset.rankingTitle || null,
    ranking: preset.ranking || null,
    type: getEventType(event),
  }
}

function CompactEventList({ events, onSelect, emptyTitle }) {
  if (!events.length) return <WorkspaceEmptyState title={emptyTitle} />

  return (
    <div className="bds-events-compact-list">
      {events.slice(0, 6).map((event) => {
        const detail = detailOf(event)
        return (
          <button key={event.id || event.slug} type="button" onClick={() => onSelect(event)} className="bds-events-compact-item">
            <span>
              <strong>{detail.title}</strong>
              <small>{detail.period}</small>
            </span>
            <span className={`bds-events-status bds-events-status--${detail.status}`}>
              {detail.status === 'ended' ? 'Encerrado' : detail.status === 'upcoming' ? 'Em breve' : 'Ativo'}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function Regulations({ events, onSelect }) {
  return (
    <div className="bds-events-regulations">
      {events.map((event) => {
        const detail = detailOf(event)
        return (
          <button key={event.id || event.slug} type="button" className="bds-events-regulation-card" onClick={() => onSelect(event)}>
            <FileText size={18} aria-hidden="true" />
            <span>
              <strong>{detail.title}</strong>
              <small>{detail.rules.length} regras principais</small>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default function EventsPage() {
  const [remote, setRemote] = useState([])
  const [loading, setLoading] = useState(true)
  const [remoteError, setRemoteError] = useState(null)
  const [activeView, setActiveView] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let active = true

    async function loadEvents() {
      setLoading(true)
      setRemoteError(null)
      try {
        const result = await listPublishedEvents()
        if (!active) return
        setRemote(Array.isArray(result.data) ? result.data : [])
        setRemoteError(result.error || null)
      } catch (error) {
        if (!active) return
        setRemote([])
        setRemoteError(error)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadEvents()
    return () => { active = false }
  }, [])

  const events = useMemo(() => {
    const cleaned = remote.filter((event) => !isRanking(event) && !isBingo(event))
    return [BINGO_EVENT, NEXT_RANKING, JULY_RANKING, ...cleaned]
  }, [remote])

  const bingo = events.find((event) => event.slug === BINGO_EVENT.slug)
  const activeEvents = events.filter((event) => statusOf(event) === 'active')
  const upcomingEvents = events.filter((event) => statusOf(event) === 'upcoming')
  const endedEvents = events.filter((event) => statusOf(event) === 'ended')
  const selectedDetail = selected ? detailOf(selected) : null

  function openEvent(event) {
    setSelected(event)
    setActiveView(null)
  }

  function openView(view) {
    setSelected(null)
    setActiveView((current) => current === view ? null : view)
  }

  function renderPanel() {
    if (selectedDetail) return <EventDetails event={selectedDetail} onBack={() => setSelected(null)} />
    if (!activeView) return null
    if (activeView === 'active') return <CompactEventList events={activeEvents.filter((event) => event.slug !== BINGO_EVENT.slug)} onSelect={openEvent} emptyTitle="Nenhum outro evento ativo no momento." />
    if (activeView === 'upcoming') return <CompactEventList events={upcomingEvents} onSelect={openEvent} emptyTitle="Os proximos eventos serao anunciados aqui." />
    if (activeView === 'ended') return <CompactEventList events={endedEvents} onSelect={openEvent} emptyTitle="Nenhum evento encerrado." />
    return <Regulations events={[bingo, NEXT_RANKING].filter(Boolean)} onSelect={openEvent} />
  }

  const quickActions = [
    { id: 'active', label: 'Ativos', count: activeEvents.length, icon: Sparkles },
    { id: 'upcoming', label: 'Próximos', count: upcomingEvents.length, icon: Clock3 },
    { id: 'ended', label: 'Encerrados', count: endedEvents.length, icon: CheckCircle2 },
    { id: 'rules', label: 'Regulamentos', count: 2, icon: FileText },
  ]

  return (
    <main className="bds-events-page bds-events-page--clean" aria-busy={loading}>
      <header className="bds-events-clean-header">
        <div>
          <span>Agenda do Bar</span>
          <h1>Eventos do Bar</h1>
          <p>{HERO_TEXT}</p>
        </div>
        <div className="bds-events-header-stats" aria-label="Resumo dos eventos">
          <span><PartyPopper size={15} aria-hidden="true" /> {activeEvents.length} ativo{activeEvents.length === 1 ? '' : 's'}</span>
          <span><Trophy size={15} aria-hidden="true" /> {upcomingEvents.length} próximo{upcomingEvents.length === 1 ? '' : 's'}</span>
        </div>
      </header>

      {loading ? <WorkspaceSkeleton rows={4} /> : (
        <>
          {remoteError ? (
            <p className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-100" role="status" aria-live="polite">
              Nao foi possivel atualizar a agenda publicada agora. Exibindo apenas as informacoes que ja estao disponiveis no portal.
            </p>
          ) : null}

          {bingo ? <EventHighlightBanner highlight={HIGHLIGHT} event={bingo} onOpen={openEvent} /> : null}

          <nav className="bds-events-quick-nav" aria-label="Navegação de eventos">
            {quickActions.map(({ id, label, count, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={activeView === id ? 'is-active' : ''}
                onClick={() => openView(id)}
                aria-expanded={activeView === id}
                aria-controls="events-dynamic-panel"
              >
                <Icon size={17} aria-hidden="true" />
                <span>{label}</span>
                <strong>{count}</strong>
              </button>
            ))}
          </nav>

          {(activeView || selectedDetail) ? (
            <section id="events-dynamic-panel" className="bds-events-dynamic-panel" aria-live="polite">
              <div className="bds-events-dynamic-panel__header">
                <h2>{selectedDetail ? selectedDetail.title : quickActions.find((item) => item.id === activeView)?.label}</h2>
                {activeView ? <Button variant="secondary" onClick={() => setActiveView(null)}>Fechar</Button> : null}
              </div>
              {renderPanel()}
            </section>
          ) : null}
        </>
      )}
    </main>
  )
}
