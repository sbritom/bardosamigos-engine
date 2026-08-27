import { useState } from 'react'
import { ArrowLeft, CalendarDays, ClipboardList, Gift, ListChecks, Medal } from 'lucide-react'
import { ActionButton } from '../../../design-system'

const STATUS_CONFIG = {
  active: { label: '🟢 ATIVO', className: 'bds-events-status--active' },
  upcoming: { label: '🟡 EM BREVE', className: 'bds-events-status--upcoming' },
  ended: { label: '🔴 ENCERRADO', className: 'bds-events-status--ended' },
}

function EventDetailSection({ icon: Icon, title, children }) {
  if (!children) return null

  return (
    <section className="bds-events-detail__section">
      <h3><Icon size={18} />{title}</h3>
      <div className="bds-events-detail__body">{children}</div>
    </section>
  )
}

function EventTextList({ value }) {
  if (Array.isArray(value)) {
    return (
      <ul>
        {value.map((item) => <li key={item}>{item}</li>)}
      </ul>
    )
  }

  return String(value || '').split('\n').filter(Boolean).map((line) => <p key={line}>{line}</p>)
}

function EventRanking({ ranking }) {
  if (!ranking) return null

  if (Array.isArray(ranking)) {
    return (
      <ol>
        {ranking.map((item) => <li key={item.name || item.label}>{item.label || item.name}{item.value ? ` - ${item.value}` : ''}</li>)}
      </ol>
    )
  }

  return <EventTextList value={ranking} />
}

function EventDetailBanner({ event }) {
  const [bannerError, setBannerError] = useState(false)
  const banner = !bannerError ? event?.banner : null
  const placeholderClass = event?.slug ? ` bds-events-detail__banner--${event.slug}` : ''

  if (banner) {
    return <img className="bds-events-detail__banner" src={banner} alt="" loading="lazy" onError={() => setBannerError(true)} />
  }

  return <div className={`bds-events-detail__banner bds-events-detail__banner--placeholder${placeholderClass}`} aria-hidden="true" />
}

export function EventDetails({ event, onBack }) {
  const status = STATUS_CONFIG[event?.status] || STATUS_CONFIG.upcoming

  return (
    <section className="bds-events-detail">
      <div className="bds-events-detail__top">
        <ActionButton icon={<ArrowLeft size={16} />} onClick={onBack}>Voltar</ActionButton>
      </div>

      <article className="bds-events-detail__card">
        <div className="bds-events-detail__header">
          <div>
            <h2>{event?.title || 'Evento'}</h2>
            {event?.description && <p>{event.description}</p>}
          </div>
          <span className={`bds-events-status ${status.className}`}>{status.label}</span>
        </div>

        <EventDetailBanner event={event} />

        <div className="bds-events-detail__grid">
          <EventDetailSection icon={CalendarDays} title="Período">
            <EventTextList value={event?.period} />
          </EventDetailSection>

          <EventDetailSection icon={Gift} title="Premiação">
            <EventTextList value={event?.prizes} />
          </EventDetailSection>

          <EventDetailSection icon={ClipboardList} title="Como Participar">
            <EventTextList value={event?.howToParticipate} />
          </EventDetailSection>

          <EventDetailSection icon={ListChecks} title="Regulamento">
            <EventTextList value={event?.rules} />
          </EventDetailSection>

          {event?.ranking && (
            <EventDetailSection icon={Medal} title={event.rankingTitle || 'Ranking Atual'}>
              <EventRanking ranking={event.ranking} />
            </EventDetailSection>
          )}
        </div>
      </article>
    </section>
  )
}
