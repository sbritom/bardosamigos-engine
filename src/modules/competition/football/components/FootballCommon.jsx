import { Target, Trophy } from 'lucide-react'
import { Badge, Button } from '../../../../design-system'
import { getSportsStatusLabel } from '../../../../core/sports'
import { isLiveStatus } from '../../../../core/time'
import { getFootballMatchDisplayStatus, getFootballStatusTone } from '../utils/footballCenterUtils'
import { FootballLiveValue } from './FootballLiveMotion'

export function FootballStatusBadge({ status, match, children }) {
  const display = match ? getFootballMatchDisplayStatus(match) : { value: status, label: getSportsStatusLabel(status) }
  const label = children || display.label
  const live = isLiveStatus(display.value) || String(label || '').toUpperCase().startsWith('AO VIVO')

  return (
    <Badge className={`bds-football-status-motion ${live ? 'bds-football-status-motion--live' : ''} ${getFootballStatusTone(display.value)} inline-flex items-center gap-[var(--bds-space-4)] rounded-[var(--bds-radius-xs)] bg-[color-mix(in_srgb,currentColor_6%,transparent)] px-[var(--bds-space-6)] py-[var(--bds-space-2)] text-[var(--bds-font-micro)] font-bold uppercase tracking-[var(--bds-letter-overline)] shadow-none`}>
      {live ? <span className="bds-football-live-dot" aria-hidden="true" /> : null}
      <FootballLiveValue as="span" value={`${display.value || ''}:${label || ''}`} ariaLive="polite">
        {label}
      </FootballLiveValue>
    </Badge>
  )
}

export function FootballPanel({ title, eyebrow, icon: Icon = Trophy, children, action, className = '' }) {
  return (
    <section className={`bds-football-section-motion border-t border-[color-mix(in_srgb,var(--bds-color-border)_54%,transparent)] pt-[var(--bds-space-10)] ${className}`}>
      <div className="mb-[var(--bds-space-7)] flex flex-wrap items-center justify-between gap-[var(--bds-space-8)]">
        <div className="flex items-center gap-[var(--bds-space-7)]">
          <span className="flex h-6 w-6 items-center justify-center text-[var(--bds-color-primary-hover)]"><Icon size={14} aria-hidden="true" /></span>
          <div>
            {eyebrow ? <p className="text-[var(--bds-font-micro)] font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-primary-hover)]">{eyebrow}</p> : null}
            <h2 className="text-lg font-black leading-tight text-[var(--bds-color-text)]">{title}</h2>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function FootballEmptyState({ title, description, compact = false, actionLabel, onAction }) {
  return (
    <div className={`bds-football-empty-motion rounded-[var(--bds-radius-sm)] border border-dashed border-[color-mix(in_srgb,var(--bds-color-border)_46%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-background)_44%,transparent)] text-center ${compact ? 'p-[var(--bds-space-8)]' : 'p-[var(--bds-space-10)]'}`}>
      <span className="mx-auto flex h-5 w-5 items-center justify-center text-[var(--bds-color-text-muted)]"><Target size={14} aria-hidden="true" /></span>
      <h3 className="mt-[var(--bds-space-5)] text-sm font-bold text-[var(--bds-color-text-secondary)]">{title}</h3>
      {description ? <p className="mt-[var(--bds-space-4)] text-xs text-[var(--bds-color-text-muted)]">{description}</p> : null}
      {actionLabel && onAction ? <Button variant="secondary" className="mt-[var(--bds-space-10)]" onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  )
}
