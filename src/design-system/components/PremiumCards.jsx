import { classNames } from '../utils'
import { ActionButton } from './ActionButton'
import { CardHeader } from './CardHeader'
import { StatusBadge } from './StatusBadge'

function MediaBlock({ src, alt = '', fallback = 'BDA', className }) {
  if (src) return <img src={src} alt={alt} className={classNames('bds-media-block__image', className)} loading="lazy" />
  return <div className={classNames('bds-media-block__fallback', className)}>{fallback}</div>
}

export function HeroCard({ eyebrow, title, subtitle, meta, action, secondaryAction, media, children, className }) {
  return (
    <section className={classNames('bds-hero-card', className)}>
      <div className="bds-hero-card__content">
        {eyebrow && <p className="bds-hero-card__eyebrow">{eyebrow}</p>}
        {title && <h1 className="bds-hero-card__title">{title}</h1>}
        {subtitle && <p className="bds-hero-card__subtitle">{subtitle}</p>}
        {meta && <div className="bds-hero-card__meta">{meta}</div>}
        {(action || secondaryAction) && (
          <div className="bds-hero-card__actions">
            {action}
            {secondaryAction}
          </div>
        )}
        {children}
      </div>
      {media && <div className="bds-hero-card__media">{media}</div>}
    </section>
  )
}

export function FeatureCard({ icon, eyebrow, title, description, action, children, className }) {
  return (
    <article className={classNames('bds-feature-card', className)}>
      <CardHeader icon={icon} eyebrow={eyebrow} title={title} subtitle={description} action={action} />
      {children && <div className="bds-feature-card__body">{children}</div>}
    </article>
  )
}

export function MatchCard({ homeTeam, awayTeam, homeCrest, awayCrest, competition, status, score = 'VS', meta, action, onOpen, className }) {
  const Element = onOpen ? 'button' : 'article'

  return (
    <Element className={classNames('bds-match-card', onOpen && 'bds-match-card--button', className)} type={onOpen ? 'button' : undefined} onClick={onOpen}>
      <div className="bds-match-card__top">
        {competition && <span className="bds-match-card__competition">{competition}</span>}
        {status && <StatusBadge status={status} />}
      </div>
      <div className="bds-match-card__teams">
        <div className="bds-match-card__team">
          <MediaBlock src={homeCrest} alt={homeTeam} fallback={(homeTeam || 'BDA').slice(0, 3).toUpperCase()} />
          <span>{homeTeam}</span>
        </div>
        <strong className="bds-match-card__score">{score}</strong>
        <div className="bds-match-card__team bds-match-card__team--away">
          <MediaBlock src={awayCrest} alt={awayTeam} fallback={(awayTeam || 'BDA').slice(0, 3).toUpperCase()} />
          <span>{awayTeam}</span>
        </div>
      </div>
      {(meta || action) && (
        <div className="bds-match-card__footer">
          {meta && <span>{meta}</span>}
          {action}
        </div>
      )}
    </Element>
  )
}

export function NewsCard({ image, category, title, date, source, action, onOpen, className }) {
  const Element = onOpen ? 'button' : 'article'

  return (
    <Element className={classNames('bds-news-card', onOpen && 'bds-news-card--button', className)} type={onOpen ? 'button' : undefined} onClick={onOpen}>
      <MediaBlock src={image} alt={title} fallback="NEWS" className="bds-news-card__image" />
      <div className="bds-news-card__content">
        <div className="bds-news-card__meta">
          {category && <StatusBadge status={category} />}
          {date && <span>{date}</span>}
        </div>
        <h3>{title}</h3>
        {source && <p>{source}</p>}
        {action}
      </div>
    </Element>
  )
}

export function CommunityCard({ icon, title, description, stats, action, className }) {
  return (
    <article className={classNames('bds-community-card', className)}>
      <CardHeader icon={icon} title={title} subtitle={description} action={action} />
      {stats?.length > 0 && (
        <div className="bds-community-card__stats">
          {stats.map((item) => (
            <div key={item.label} className="bds-community-card__stat">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

export function ToolCard({ icon, title, description, status, actionLabel = 'Abrir', onAction, className }) {
  return (
    <article className={classNames('bds-tool-card', className)}>
      <CardHeader icon={icon} title={title} subtitle={description} action={status && <StatusBadge status={status} />} />
      {onAction && <ActionButton variant="outline" onClick={onAction}>{actionLabel}</ActionButton>}
    </article>
  )
}

export function PlayerCard({ icon, title, subtitle, status, controls, progress, meta, className }) {
  return (
    <article className={classNames('bds-player-card', className)}>
      <CardHeader icon={icon} title={title} subtitle={subtitle} action={status && <StatusBadge status={status} />} />
      {progress}
      {controls && <div className="bds-player-card__controls">{controls}</div>}
      {meta && <div className="bds-player-card__meta">{meta}</div>}
    </article>
  )
}

export function StatsCard({ label, value, hint, icon, trend, className }) {
  return (
    <article className={classNames('bds-stats-card', className)}>
      <div className="bds-stats-card__top">
        {icon}
        {trend && <StatusBadge status={trend} />}
      </div>
      <strong>{value}</strong>
      <span>{label}</span>
      {hint && <p>{hint}</p>}
    </article>
  )
}
