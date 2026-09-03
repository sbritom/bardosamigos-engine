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
import './eventsPage.css'

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
    <article className="imortal-events-card">
      {image ? (
        <div className="imortal-events-card__image">
          <img src={image} alt="" loading="lazy" />
        </div>
      ) : null}

      <div className="imortal-events-card__body">
        <div className="imortal-events-card__top">
          <span>{type}</span>
          <strong>{status.label}</strong>
        </div>

        <h2>{event.title || 'Evento IMORTAL0800'}</h2>
        <p>{summary}</p>

        <div className="imortal-events-card__meta">
          <span>
            <Clock3 size={14} />
            {eventPeriod(event)}
          </span>

          {event.location ? (
            <span>
              <MapPin size={14} />
              {event.location}
            </span>
          ) : null}
        </div>

        <button type="button" onClick={() => onOpen(event)}>
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
    <section className="imortal-events-details">
      <div className="imortal-events-details__head">
        <div>
          <div className="imortal-events-details__eyebrow">
            <span>{type}</span>
            <small>{status.label}</small>
          </div>
          <h2>{event.title || 'Evento IMORTAL0800'}</h2>
          <p>{getEventSummary(event) || event.description || 'Confira as informações do evento.'}</p>
        </div>

        <button type="button" onClick={onBack} className="imortal-events-details__back">
          Voltar
        </button>
      </div>

      <div className="imortal-events-details__grid">
        <div>
          <span><CalendarDays size={14} /> Quando</span>
          <strong>{eventPeriod(event)}</strong>
        </div>

        <div>
          <span><MapPin size={14} /> Onde</span>
          <strong>{event.location || 'Local informado pela equipe'}</strong>
        </div>
      </div>

      {participation ? (
        <div className="imortal-events-details__block">
          <span>Como participar</span>
          <p>{participation}</p>
        </div>
      ) : null}

      {prizes.length ? (
        <div className="imortal-events-details__block">
          <span>Premiação</span>
          <ul>
            {prizes.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ) : null}

      {rules.length ? (
        <div className="imortal-events-details__block">
          <span>Regras</span>
          <ul>
            {rules.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ) : null}

      {actionUrl ? (
        <a href={actionUrl} target="_blank" rel="noreferrer" className="imortal-events-details__action">
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
      <main className="imortal-events-page imortal-events-page--details">
        <EventDetails event={selected} onBack={() => setSelected(null)} />
      </main>
    )
  }

  return (
    <main className="imortal-events-page">
      <header className="imortal-events-hero">
        <div>
          <span className="imortal-events-eyebrow">
            <PartyPopper size={15} />
            EVENTOS IMORTAL0800
          </span>
          <p>Agenda oficial da comunidade.</p>
        </div>

        <div className="imortal-events-hero__count">
          <CalendarDays size={18} />
          <span>{events.length || '—'}</span>
          <small>{events.length === 1 ? 'evento' : 'eventos'}</small>
        </div>
      </header>

      {error ? <p className="imortal-events-error">{error}</p> : null}

      <section className="imortal-events-section">
        {loading ? (
          <WorkspaceSkeleton rows={3} />
        ) : events.length ? (
          <div className="imortal-events-grid">
            {events.map((event) => (
              <EventCard key={event.id} event={event} onOpen={setSelected} />
            ))}
          </div>
        ) : (
          <div className="imortal-events-empty">
            <MessageCircle size={24} />
            <h2>Nenhum evento publicado</h2>
            <p>Novos eventos aparecerão aqui quando forem publicados pela equipe.</p>
          </div>
        )}
      </section>
    </main>
  )
}
