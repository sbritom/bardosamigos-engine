import { useState } from 'react'
import { ArrowRight, CalendarDays, Clock, Gift, MapPin, PartyPopper, Repeat2, Sparkles, Trophy } from 'lucide-react'
import { ActionButton } from '../../../design-system'
import {
  formatEventDate,
  formatEventTime,
  getEventImage,
  getEventRecurrenceLabel,
  getEventSummary,
  getEventTimeLabel,
  getEventType,
  isRecurringEvent,
} from '../services/eventsService'

const CARD_PRESETS = {
  'ranking-de-barcoins': {
    title: '🏆 Ranking de BarCoins',
    status: '🟢 ATIVO',
    statusClassName: 'bds-events-status--active',
    primaryInfo: { icon: CalendarDays, label: '23/07/2026 → 23/08/2026' },
    secondaryInfo: { icon: Trophy, label: 'Premiação' },
    highlight: '🥇 2.000 xats',
  },
  'bingo-do-bar-dos-amigos': {
    title: '🎉 Bingo do Bar dos Amigos',
    status: '🟢 ATIVO',
    statusClassName: 'bds-events-status--active',
    primaryInfo: { icon: Clock, label: 'Todos os dias às 20:30' },
    secondaryInfo: { icon: Gift, label: 'Premiações variadas' },
  },
  'bingos-e-brincadeiras-do-bar': {
    title: '🎉 Bingo do Bar dos Amigos',
    status: '🟢 ATIVO',
    statusClassName: 'bds-events-status--active',
    primaryInfo: { icon: Clock, label: 'Todos os dias às 20:30' },
    secondaryInfo: { icon: Gift, label: 'Premiações variadas' },
  },
}

function EventMedia({ event }) {
  const [bannerError, setBannerError] = useState(false)
  const banner = event.banner || event.metadata?.banner || null
  const image = !bannerError ? banner || getEventImage(event) : null
  const preset = getCardPreset(event)
  const placeholderClass = preset ? ` bds-events-card__placeholder--${event.slug}` : ''

  if (image) {
    return <img className="bds-events-card__image" src={image} alt={event.title || 'Evento'} loading="lazy" onError={() => setBannerError(true)} />
  }

  return (
    <div className={`bds-events-card__placeholder${placeholderClass}`} aria-hidden="true">
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

function normalizePresetKey(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getCardPreset(event = {}) {
  return CARD_PRESETS[event.slug] || CARD_PRESETS[normalizePresetKey(event.title)] || null
}

function EventPresetMeta({ preset }) {
  if (!preset) return null

  const PrimaryIcon = preset.primaryInfo?.icon
  const SecondaryIcon = preset.secondaryInfo?.icon

  return (
    <div className="bds-events-card__meta">
      {PrimaryIcon && preset.primaryInfo?.label && <span><PrimaryIcon size={14} />{preset.primaryInfo.label}</span>}
      {SecondaryIcon && preset.secondaryInfo?.label && <span><SecondaryIcon size={14} />{preset.secondaryInfo.label}</span>}
    </div>
  )
}

export function EventCard({ event, featured = false, onSelect }) {
  const preset = getCardPreset(event)
  const summary = getEventSummary(event)
  const recurring = isRecurringEvent(event)

  function openDetails(clickEvent) {
    clickEvent.stopPropagation()
    onSelect?.(event)
  }

  function handleKeyDown(keyEvent) {
    if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
      keyEvent.preventDefault()
      onSelect?.(event)
    }
  }

  return (
    <article
      className={`bds-events-card ${featured ? 'bds-events-card--featured' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(event)}
      onKeyDown={handleKeyDown}
    >
      <EventMedia event={event} />
      <div className="bds-events-card__content">
        <h3>{preset?.title || event.title || 'Evento sem titulo'}</h3>
        <div className="bds-events-card__topline">
          {preset ? (
            <span className={`bds-events-status ${preset.statusClassName}`}>{preset.status}</span>
          ) : recurring ? (
            <span className="bds-events-recurring">
              <Repeat2 size={13} />
              Recorrente
            </span>
          ) : null}
        </div>
        {preset ? <EventPresetMeta preset={preset} /> : <EventMeta event={event} />}
        {!preset && summary && <p>{summary}</p>}
        {preset?.highlight && <p>{preset.highlight}</p>}
        <div className="bds-events-card__actions">
          <ActionButton icon={<ArrowRight size={16} />} onClick={openDetails}>Ver detalhes</ActionButton>
        </div>
      </div>
    </article>
  )
}
