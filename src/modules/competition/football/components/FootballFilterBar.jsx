import { Menu } from 'lucide-react'
import { FOOTBALL_FILTERS } from '../constants/footballCenterConstants'

export function FootballFilterBar({ activeFilter, onChange, onOpenMenu, filters = FOOTBALL_FILTERS }) {
  return (
    <div className="sticky top-[var(--bds-space-12)] z-20 rounded-[var(--bds-radius-sm)] border-y border-[color-mix(in_srgb,var(--bds-color-border)_52%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-background)_88%,transparent)] p-[var(--bds-space-4)] shadow-none backdrop-blur-md">
      <div className="flex items-center gap-[var(--bds-space-6)] overflow-x-auto">
        <button type="button" onClick={onOpenMenu} className="flex shrink-0 items-center gap-[var(--bds-space-6)] rounded-[var(--bds-radius-sm)] border border-[var(--bds-color-border)] bg-[color-mix(in_srgb,var(--bds-color-surface)_34%,transparent)] px-[var(--bds-space-10)] py-[var(--bds-space-5)] text-xs font-black uppercase text-[var(--bds-color-text)] transition hover:border-[var(--bds-color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)] xl:hidden"><Menu size={14} aria-hidden="true" /> Ligas</button>
        {filters.map(({ id, label, icon: Icon }) => {
          const active = activeFilter === id
          return <button key={id} type="button" onClick={() => onChange(id)} aria-pressed={active} className={`flex shrink-0 items-center gap-[var(--bds-space-6)] rounded-[var(--bds-radius-sm)] border px-[var(--bds-space-10)] py-[var(--bds-space-5)] text-xs font-black tracking-[var(--bds-letter-overline)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)] ${active ? 'border-[var(--bds-color-primary-hover)] bg-[color-mix(in_srgb,var(--bds-color-primary)_58%,transparent)] text-[var(--bds-color-text)] shadow-none' : 'border-transparent text-[var(--bds-color-text-secondary)] hover:border-[var(--bds-color-border)] hover:bg-[color-mix(in_srgb,var(--bds-color-surface)_34%,transparent)] hover:text-[var(--bds-color-text)]'}`}><Icon size={13} aria-hidden="true" /> {label}</button>
        })}
      </div>
    </div>
  )
}
