import { useState } from 'react'
import { ArrowRight, CalendarDays, Trophy } from 'lucide-react'
import { ActionButton } from '../../../design-system'

export function EventHighlightBanner({ highlight, event, onOpen }) {
  const [bannerError, setBannerError] = useState(false)

  if (!highlight || !event) return null

  const banner = !bannerError ? event.banner || event.metadata?.banner : null
  const bannerClassName = event.slug ? ` bds-events-highlight--${event.slug}` : ''

  return (
    <section className={`bds-events-highlight${bannerClassName}`} aria-label={highlight.title}>
      {banner && <img className="bds-events-highlight__banner" src={banner} alt="" loading="lazy" onError={() => setBannerError(true)} />}

      <div className="bds-events-highlight__content">
        <span className="bds-events-highlight__eyebrow">{highlight.eyebrow}</span>
        <h2>{highlight.title}</h2>
        <p>{highlight.description}</p>

        <div className="bds-events-highlight__meta">
          <span><CalendarDays size={15} />{highlight.period}</span>
          <span><Trophy size={15} />{highlight.prizeLabel}</span>
        </div>
      </div>

      <div className="bds-events-highlight__aside">
        <div className="bds-events-highlight__prizes">
          {highlight.prizes.map((prize) => <span key={prize}>{prize}</span>)}
        </div>
        <ActionButton icon={<ArrowRight size={16} />} onClick={() => onOpen(event)}>
          {highlight.actionLabel}
        </ActionButton>
      </div>
    </section>
  )
}
