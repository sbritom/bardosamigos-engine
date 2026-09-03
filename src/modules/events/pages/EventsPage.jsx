import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPin,
  MessageCircle,
  PartyPopper,
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
  sortEventsForHome,
} from '../services/eventsService'

function temporalStatus(event = {}) {
  if (String(event.metadata?.phase || '').toLowerCase() === 'preparing') {
    return { id: 'upcoming', label: 'Em preparação' }
  }

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
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface)]">
      {image ? (
        <div className="aspect-[16/7] overflow-hidden border-b border-white/10 bg-black/20">
          <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
      ) : null}

      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--primary)]">
            {type}
          </span>
          <span className="text-[10px] font-bold text-[var(--text-secondary)]">
            {status.label}
          </span>
        </div>

        <h2 className="mt-2 text-lg font-black text-[var(--text)]">
          {event.title || 'Evento IMORTAL0800'}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">
          {summary}
        </p>

        <div className="mt-4 grid gap-2 text-xs font-semibold text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-2">
            <Clock3 size={14} className="text-[var(--primary)]" />
            {eventPeriod(event)}
          </span>

          {event.location ? (
            <span className="inline-flex items-center gap-2">
              <MapPin size={14} className="text-[var(--primary)]" />
              {event.location}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onOpen(event)}
          className="mt-5 inline-flex min-h-[40px] w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-[var(--text)] transition hover:bg-white/[0.07]"
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
  const status = temporalStatus(event)

  return (
    <section className="rounded-2xl border border-white/10 bg-[var(--surface)] p-5 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-[var(--primary)]">
              {type}
            </span>
            <span className="text-xs font-bold text-[var(--text-secondary)]">{status.label}</span>
          </div>

          <h2 className="mt-2 text-2xl font-black text-[var(--text)]">
            {event.title || 'Evento IMORTAL0800'}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
            {getEventSummary(event) || event.description || 'Confira as informações do evento.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-[var(--text)] transition hover:bg-white/[0.07]"
        >
          Voltar
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
            <CalendarDays size={14} className="text-[var(--primary)]" />
            Quando
          </span>
          <strong className="mt-2 block text-sm text-[var(--text)]">{eventPeriod(event)}</strong>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
            <MapPin size={14} className="text-[var(--primary)]" />
            Onde
          </span>
          <strong className="mt-2 block text-sm text-[var(--text)]">
            {event.location || 'Local informado pela equipe'}
          </strong>
        </div>
      </div>

      {participation ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.025] p-4">
          <span className="text-xs font-bold text-[var(--text-secondary)]">Como participar</span>
          <p className="mt-2 text-sm leading-6 text-[var(--text)]">{participation}</p>
        </div>
      ) : null}

      {prizes.length ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.025] p-4">
          <span className="text-xs font-bold text-[var(--text-secondary)]">Premiação</span>
          <ul className="mt-2 grid gap-2 text-sm text-[var(--text)]">
            {prizes.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      ) : null}

      {rules.length ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.025] p-4">
          <span className="text-xs font-bold text-[var(--text-secondary)]">Regras</span>
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
          Participar no Xat
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
      const published = Array.isArray(result.data) ? result.data : []
      setEvents(sortEventsForHome(published))
      if (result.error) setError('Parte da agenda não pôde ser atualizada agora.')
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

  if (selected) {
    return (
      <main className="mx-auto w-full max-w-[980px] px-4 py-5">
        <EventDetails event={selected} onBack={() => setSelected(null)} />
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-[1080px] px-4 py-5">
      <header className="mb-5 border-b border-white/10 pb-5">
        <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">
          <PartyPopper size={15} />
          IMORTAL0800
        </span>
        <h1 className="mt-2 text-2xl font-black text-[var(--text)] md:text-3xl">Eventos</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Agenda oficial da comunidade.
        </p>
      </header>

      {error ? (
        <p className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </p>
      ) : null}

      <section>
        {loading ? (
          <WorkspaceSkeleton rows={3} />
        ) : events.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => (
              <EventCard key={event.id} event={event} onOpen={setSelected} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-[var(--surface)] p-7 text-center">
            <MessageCircle size={24} className="mx-auto text-[var(--primary)]" />
            <h2 className="mt-3 text-base font-black text-[var(--text)]">Nenhum evento publicado</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Novos eventos aparecerão aqui quando forem publicados pela equipe.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
