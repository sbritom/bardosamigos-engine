import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPin,
  MessageCircle,
  PartyPopper,
  RefreshCw,
  Sparkles,
} from 'lucide-react'

import { WorkspaceSkeleton } from '../../../shared/workspace'
import {
  getEventActionUrl,
  getEventRecurrenceLabel,
  getEventSummary,
  getEventTimeLabel,
  getEventType,
  getParticipationRule,
  listPublishedEvents,
} from '../services/eventsService'

function temporalStatus(event = {}) {
  const now = Date.now()
  const startsAt = event.startsAt || event.starts_at
  const endsAt = event.endsAt || event.ends_at
  const start = startsAt ? new Date(startsAt).getTime() : null
  const end = endsAt ? new Date(endsAt).getTime() : null

  if (Number.isFinite(end) && end < now) return { id: 'ended', label: 'Encerrado' }
  if (Number.isFinite(start) && start > now) return { id: 'upcoming', label: 'Em breve' }
  return { id: 'active', label: 'Ativo' }
}

function eventPeriod(event = {}) {
  const recurrence = getEventRecurrenceLabel(event)
  const date = event.dateLabel || ''
  const time = getEventTimeLabel(event) || event.timeLabel || ''

  return [recurrence || date, time].filter(Boolean).join(' • ') || 'Programação a definir'
}

function toList(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') return value.split('\n').map((item) => item.trim()).filter(Boolean)
  return []
}

function EventCard({ event, onOpen }) {
  const status = temporalStatus(event)
  const type = getEventType(event) || 'Evento'
  const summary = getEventSummary(event) || 'Confira os detalhes deste evento do IMORTAL0800.'
  const image = event.image || event.metadata?.imageUrl || event.metadata?.banner || ''

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-[var(--surface)] shadow-sm">
      {image ? (
        <div className="aspect-[16/6] overflow-hidden border-b border-white/10 bg-black/20">
          <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
      ) : null}

      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">
            {type}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold text-[var(--text-secondary)]">
            {status.label}
          </span>
        </div>

        <h2 className="mt-3 text-lg font-black text-[var(--text)]">{event.title || 'Evento IMORTAL0800'}</h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">{summary}</p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            <Clock3 size={13} />
            {eventPeriod(event)}
          </span>
          {event.location ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <MapPin size={13} />
              {event.location}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onOpen(event)}
          className="mt-5 w-full rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
        >
          Ver detalhes
        </button>
      </div>
    </article>
  )
}

function EventDetails({ event, onBack }) {
  const rules = toList(event.metadata?.rules)
  const prizes = toList(event.metadata?.prizes)
  const participation = getParticipationRule(event)
  const actionUrl = getEventActionUrl(event)
  const type = getEventType(event) || 'Evento'

  return (
    <section className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6 shadow-xl md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">{type}</span>
          <h2 className="mt-2 text-2xl font-black text-[var(--text)]">{event.title || 'Evento IMORTAL0800'}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
            {getEventSummary(event) || event.description || 'Confira as informações do evento.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-[var(--text)] transition hover:bg-white/10"
        >
          Voltar
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Quando</span>
          <strong className="mt-2 block text-[var(--text)]">{eventPeriod(event)}</strong>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Onde</span>
          <strong className="mt-2 block text-[var(--text)]">{event.location || 'Local informado pela equipe'}</strong>
        </div>
      </div>

      {participation ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Como participar</span>
          <p className="mt-2 text-sm leading-6 text-[var(--text)]">{participation}</p>
        </div>
      ) : null}

      {prizes.length ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Premiação</span>
          <ul className="mt-2 grid gap-2 text-sm text-[var(--text)]">
            {prizes.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      ) : null}

      {rules.length ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Regulamento</span>
          <ul className="mt-2 grid gap-2 text-sm text-[var(--text)]">
            {rules.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      ) : null}

      {actionUrl ? (
        <a
          href={actionUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white transition hover:brightness-110"
        >
          <ExternalLink size={16} />
          Abrir participação
        </a>
      ) : null}
    </section>
  )
}

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  async function load() {
    setLoading(true)
    setError('')

    try {
      const result = await listPublishedEvents()
      setEvents(Array.isArray(result.data) ? result.data : [])
      if (result.error) setError('Não foi possível atualizar todos os eventos agora.')
    } catch {
      setEvents([])
      setError('Não foi possível carregar os eventos agora.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const counts = useMemo(() => {
    return events.reduce((acc, event) => {
      const status = temporalStatus(event).id
      acc[status] += 1
      return acc
    }, { active: 0, upcoming: 0, ended: 0 })
  }, [events])

  if (selected) {
    return (
      <main className="mx-auto w-full max-w-[1180px] px-4 py-4">
        <EventDetails event={selected} onBack={() => setSelected(null)} />
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 py-4">
      <header className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6 shadow-xl md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--primary)]">
              <PartyPopper size={15} />
              IMORTAL0800
            </span>
            <h1 className="mt-2 text-3xl font-black text-[var(--text)] md:text-4xl">Eventos do IMORTAL0800</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Agenda oficial de atividades, encontros e eventos da comunidade.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-[var(--text)] transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <Sparkles size={17} className="text-[var(--primary)]" />
            <strong className="mt-2 block text-xl text-[var(--text)]">{counts.active}</strong>
            <span className="text-xs text-[var(--text-secondary)]">Ativos</span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <CalendarDays size={17} className="text-[var(--primary)]" />
            <strong className="mt-2 block text-xl text-[var(--text)]">{counts.upcoming}</strong>
            <span className="text-xs text-[var(--text-secondary)]">Próximos</span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <Clock3 size={17} className="text-[var(--primary)]" />
            <strong className="mt-2 block text-xl text-[var(--text)]">{counts.ended}</strong>
            <span className="text-xs text-[var(--text-secondary)]">Encerrados</span>
          </div>
        </div>
      </header>

      {error ? (
        <p className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </p>
      ) : null}

      <section className="mt-5">
        {loading ? (
          <WorkspaceSkeleton rows={4} />
        ) : events.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => <EventCard key={event.id} event={event} onOpen={setSelected} />)}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-[var(--surface)] p-8 text-center">
            <MessageCircle size={26} className="mx-auto text-[var(--primary)]" />
            <h2 className="mt-3 text-lg font-black text-[var(--text)]">Nenhum evento publicado agora</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Quando a equipe publicar um novo evento, ele aparecerá aqui automaticamente.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
