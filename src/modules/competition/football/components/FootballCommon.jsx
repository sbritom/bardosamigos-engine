import { Target, Trophy } from 'lucide-react'
import { Badge, Button } from '../../../../design-system'
import { getSportsStatusLabel } from '../../../../core/sports'
import { getFootballMatchDisplayStatus, getFootballStatusTone } from '../utils/footballCenterUtils'

export function FootballStatusBadge({ status, match, children }) {
  const display = match ? getFootballMatchDisplayStatus(match) : { value: status, label: getSportsStatusLabel(status) }
  return <Badge className={`${getFootballStatusTone(display.value)} bg-[color-mix(in_srgb,currentColor_8%,transparent)] px-[var(--bds-space-7)] py-[var(--bds-space-2)] text-[var(--bds-font-micro)] font-black tracking-[var(--bds-letter-overline)] shadow-none`}>{children || display.label}</Badge>
}

export function FootballPanel({ title, eyebrow, icon: Icon = Trophy, children, action, className = '' }) {
  return (
    <section className={`border-t border-[color-mix(in_srgb,var(--bds-color-border)_62%,transparent)] pt-[var(--bds-space-12)] ${className}`}>
      <div className="mb-[var(--bds-space-8)] flex flex-wrap items-center justify-between gap-[var(--bds-space-10)]">
        <div className="flex items-center gap-[var(--bds-space-8)]">
          <span className="flex h-6 w-6 items-center justify-center text-[var(--bds-color-primary-hover)]"><Icon size={15} aria-hidden="true" /></span>
          <div>
            {eyebrow ? <p className="text-[var(--bds-font-micro)] font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-primary-hover)]">{eyebrow}</p> : null}
            <h2 className="text-base font-black uppercase leading-tight tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text)]">{title}</h2>
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
    <div className={`rounded-[var(--bds-radius-md)] border border-dashed border-[color-mix(in_srgb,var(--bds-color-border)_70%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-background)_62%,transparent)] text-center ${compact ? 'p-[var(--bds-space-12)]' : 'p-[var(--bds-space-18)]'}`}>
      <span className="mx-auto flex h-8 w-8 items-center justify-center text-[var(--bds-color-primary-hover)]"><Target size={18} aria-hidden="true" /></span>
      <h3 className="mt-[var(--bds-space-10)] font-black text-[var(--bds-color-text)]">{title}</h3>
      {description ? <p className="mt-[var(--bds-space-6)] text-sm text-[var(--bds-color-text-secondary)]">{description}</p> : null}
      {actionLabel && onAction ? <Button variant="secondary" className="mt-[var(--bds-space-16)]" onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  )
}
