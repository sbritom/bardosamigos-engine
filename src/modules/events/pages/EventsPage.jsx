import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock, ExternalLink, ImageIcon, MapPin, PartyPopper, Repeat2, Sparkles } from 'lucide-react'
import { ActionButton, EmptyState, HeroCard, SectionHeader } from '../../../design-system'
import {
  formatEventDate,
  formatEventTime,
  getEventActionUrl,
  getEventImage,
  getEventRecurrenceLabel,
  getEventSummary,
  getEventTimeLabel,
  getEventType,
  getParticipationRule,
  isFeaturedEvent,
  isRecurringEvent,
  listPublishedEvents,
} from '../services/eventsService'
import './eventsPage.css'

const HERO_TEXT = 'Bingos, brincadeiras e momentos especiais. Confira o que vem por aí e não fique de fora.'

function EventMedia({ event }) {
  const image = getEventImage(event)

  if (image) {
    return <img className="bds-events-card__image" src={image} alt={event.title || 'Evento'} loading="lazy" />
  }

  return (
    <div className="bds-events-card__placeholder" aria-hidden="true">
      <PartyPopper size={32} />
    </div>
  )
}

function EventMeta({ event }) {
  const date = event.dateLabel || formatEventDate(event.starts_at || event.startsAt)
  const time = getEventTimeLabel(event) || formatEventTime(event.starts_at || event.startsAt)
  const type = getEventType(event)
  const recurrence = getEventRecurrenceLabel(event)

  return (
    <div className="bds-events-card__meta">
      {type && <span><Sparkles size={14} />{type}</span>}
      {recurrence && <span><Repeat2 size={14} />{recurrence}</span>}
      {date && <span><CalendarDays size={14} />{date}</span>}
      {time && <span><Clock size={14} />{time}</span>}
      {event.location && <span><MapPin size={14} />{event.location}</span>}
    </div>
  )
}

function EventCard({ event, featured = false }) {
  const summary = getEventSummary(event)
  const participationRule = getParticipationRule(event)
  const actionUrl = getEventActionUrl(event)
  const recurring = isRecurringEvent(event)

  function openEventAction() {
    if (!actionUrl) return
    window.open(actionUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <article className={`bds-events-card ${featured ? 'bds-events-card--featured' : ''}`}>
      <EventMedia event={event} />
      <div className="bds-events-card__content">
        {recurring && (
          <div className="bds-events-card__topline">
            <span className="bds-events-recurring">
              <Repeat2 size={13} />
              Recorrente
            </span>
          </div>
        )}
        <h3>{event.title || 'Evento sem titulo'}</h3>
        {summary && <p>{summary}</p>}
        <EventMeta event={event} />
        {participationRule && (
          <div className="bds-events-rule">
            <strong>Regra de participação</strong>
            <span>{participationRule}</span>
          </div>
        )}
        {actionUrl && (
          <div className="bds-events-card__actions">
            <ActionButton icon={<ExternalLink size={16} />} onClick={openEventAction}>IR PARA O BAR</ActionButton>
          </div>
        )}
      </div>
    </article>
  )
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

  const featuredEvent = useMemo(() => events.find(isFeaturedEvent) || null, [events])
  const recurringEvents = useMemo(
    () => events.filter((event) => event.id !== featuredEvent?.id && isRecurringEvent(event)),
    [events, featuredEvent],
  )
  const regularEvents = useMemo(
    () => events.filter((event) => event.id !== featuredEvent?.id && !isRecurringEvent(event)),
    [events, featuredEvent],
  )

  return (
    <main className="bds-events-page">
      <HeroCard className="bds-events-hero" title="EVENTOS DO BAR" subtitle={HERO_TEXT} />

      {loading ? (
        <section className="bds-events-section" aria-live="polite">
          <div className="bds-events-loading">
            <Sparkles size={22} />
            <span>Carregando eventos...</span>
          </div>
        </section>
      ) : events.length === 0 ? (
        <EventsEmptyState />
      ) : (
        <>
          {featuredEvent && (
            <section className="bds-events-section">
              <SectionHeader eyebrow="Destaque" title="Evento em destaque" />
              <EventCard event={featuredEvent} featured />
            </section>
          )}

          {regularEvents.length > 0 && (
            <section className="bds-events-section">
              <SectionHeader eyebrow="Agenda" title="Proximos eventos" />
              <div className="bds-events-grid">
                {regularEvents.map((event) => <EventCard key={event.id} event={event} />)}
              </div>
            </section>
          )}

          {recurringEvents.length > 0 && (
            <section className="bds-events-section">
              <SectionHeader eyebrow="Recorrentes" title="Eventos recorrentes" />
              <div className="bds-events-grid bds-events-grid--compact">
                {recurringEvents.map((event) => <EventCard key={event.id} event={event} />)}
              </div>
            </section>
          )}
        </>
      )}

      {!loading && events.length > 0 && regularEvents.length === 0 && recurringEvents.length === 0 && !featuredEvent && (
        <section className="bds-events-section">
          <div className="bds-events-note">
            <ImageIcon size={20} />
            <span>Eventos publicados encontrados, mas sem informacoes suficientes para exibicao detalhada.</span>
          </div>
        </section>
      )}
    </main>
  )
}
