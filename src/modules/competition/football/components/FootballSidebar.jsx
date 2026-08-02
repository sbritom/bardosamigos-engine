import { CalendarDays, ChevronDown, Heart, LayoutGrid, Radio, Shield, SlidersHorizontal, Trophy, X } from 'lucide-react'
import { isLiveStatus } from '../../../../core/time'
import { FOOTBALL_COMPETITION_NAV } from '../constants/footballCenterConstants'
import { footballMatchBelongsToCompetition } from '../utils/footballCenterUtils'

const SIDEBAR_GROUPS = [
  { title: 'Brasil', ids: ['BSA', 'CDB'] },
  { title: 'America', ids: ['CLI', 'CSA'] },
  { title: 'Europa', ids: ['PL', 'PD', 'SA', 'BL1', 'FL1', 'CL'] },
  { title: 'Mundo', ids: ['WC'] },
]

const SIDEBAR_FILTERS = [
  { id: 'all', label: 'Todos', icon: LayoutGrid, type: 'competition' },
  { id: 'today', label: 'Hoje', icon: CalendarDays, type: 'filter' },
  { id: 'live', label: 'Ao Vivo', icon: Radio, type: 'filter' },
  { id: 'BSA', label: 'Brasileirao Serie A', icon: Shield, type: 'competition' },
]

function SidebarSection({ title, icon: Icon, children }) {
  return (
    <section className="space-y-[var(--bds-space-6)]">
      <div className="flex items-center gap-[var(--bds-space-7)] px-[var(--bds-space-8)] text-sm font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text)]">
        <Icon size={15} className="text-[var(--bds-color-primary-hover)]" aria-hidden="true" />
        <span>{title}</span>
      </div>
      {children}
    </section>
  )
}

function SidebarButton({ active, children, count, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`relative flex w-full items-center gap-[var(--bds-space-8)] rounded-[var(--bds-radius-sm)] px-[var(--bds-space-10)] py-[var(--bds-space-7)] text-left text-[0.9375rem] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)] ${active ? 'bg-[color-mix(in_srgb,var(--bds-color-primary)_30%,transparent)] text-[var(--bds-color-text)] shadow-[inset_3px_0_0_var(--bds-color-primary-hover)]' : 'text-[var(--bds-color-text-secondary)] hover:bg-[color-mix(in_srgb,var(--bds-color-surface)_32%,transparent)] hover:text-[var(--bds-color-text)]'}`}
    >
      <Icon size={15} className="shrink-0 text-[var(--bds-color-primary-hover)]" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate font-black">{children}</span>
      {count ? <span className="rounded-full border border-[color-mix(in_srgb,var(--bds-color-border)_58%,transparent)] px-[var(--bds-space-6)] py-[var(--bds-space-1)] text-[0.6875rem] font-black tabular-nums text-[var(--bds-color-text-secondary)]">{count}</span> : null}
    </button>
  )
}

function CompetitionGroup({ group, matches, activeCompetition, onSelect }) {
  const items = group.ids
    .map((id) => {
      const item = FOOTBALL_COMPETITION_NAV.find((navItem) => navItem.id === id)
      if (!item) return null
      const count = matches.filter((match) => footballMatchBelongsToCompetition(match, item)).length
      if (!count && activeCompetition !== item.id) return null
      return { ...item, count }
    })
    .filter(Boolean)

  if (!items.length) return null

  const active = items.some((item) => item.id === activeCompetition)

  return (
    <details open={active} className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-[var(--bds-space-8)] rounded-[var(--bds-radius-sm)] px-[var(--bds-space-10)] py-[var(--bds-space-7)] text-[0.9375rem] font-bold text-[var(--bds-color-text-secondary)] transition hover:bg-[color-mix(in_srgb,var(--bds-color-surface)_32%,transparent)] hover:text-[var(--bds-color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)]">
        <span>{group.title}</span>
        <ChevronDown size={14} className="transition group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="bds-football-accordion-content">
        <div className="mt-[var(--bds-space-4)] space-y-[var(--bds-space-3)] pl-[var(--bds-space-4)]">
          {items.map((item) => (
            <SidebarButton key={item.id} active={activeCompetition === item.id} count={item.count} icon={item.icon} onClick={() => onSelect(item.id)}>{item.label}</SidebarButton>
          ))}
        </div>
      </div>
    </details>
  )
}

function FootballSidebarContent({ matches, activeCompetition, favoriteCount, activeFilter, onSelect, onFilter, onClose }) {
  const liveCount = matches.filter((match) => isLiveStatus(match.status || match.standardStatus)).length

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[color-mix(in_srgb,var(--bds-color-border)_48%,transparent)] px-[var(--bds-space-12)] py-[var(--bds-space-10)]">
        <h2 className="text-base font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text)]">Futebol</h2>
        {onClose ? (
          <button type="button" onClick={onClose} aria-label="Fechar menu" className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--bds-color-border)] text-[var(--bds-color-text-secondary)] transition hover:border-[var(--bds-color-primary-hover)] hover:text-[var(--bds-color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)]">
            <X size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-[var(--bds-space-12)] overflow-y-auto p-[var(--bds-space-10)] [scrollbar-color:color-mix(in_srgb,var(--bds-color-primary-hover)_45%,transparent)_transparent] [scrollbar-width:thin]" aria-label="Navegacao de futebol">
        {liveCount ? (
          <button
            type="button"
            onClick={() => onFilter('live')}
            className="flex w-full items-center gap-[var(--bds-space-7)] rounded-[var(--bds-radius-sm)] border border-[color-mix(in_srgb,var(--bds-color-danger)_32%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-danger)_7%,transparent)] px-[var(--bds-space-10)] py-[var(--bds-space-7)] text-left text-sm font-bold text-[var(--bds-color-text)] transition hover:bg-[color-mix(in_srgb,var(--bds-color-danger)_10%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-danger)]"
          >
            <span className="bds-football-live-dot" aria-hidden="true" />
            {liveCount} {liveCount === 1 ? 'partida ao vivo' : 'partidas ao vivo'}
          </button>
        ) : null}

        <SidebarSection title="Favoritos" icon={Heart}>
          <div className="space-y-[var(--bds-space-3)]">
            <SidebarButton active={activeCompetition === 'favorites'} count={favoriteCount} icon={Heart} onClick={() => onSelect('favorites')}>Times e competicoes</SidebarButton>
          </div>
        </SidebarSection>

        <SidebarSection title="Competicoes" icon={Trophy}>
          <div className="space-y-[var(--bds-space-4)]">
            {SIDEBAR_GROUPS.map((group) => (
              <CompetitionGroup key={group.title} group={group} matches={matches} activeCompetition={activeCompetition} onSelect={onSelect} />
            ))}
          </div>
        </SidebarSection>

        <SidebarSection title="Filtros" icon={SlidersHorizontal}>
          <div className="space-y-[var(--bds-space-3)]">
            {SIDEBAR_FILTERS.map(({ id, label, icon: Icon, type }) => {
              const active = type === 'competition' ? activeCompetition === id && activeFilter === 'all' : activeFilter === id
              const action = type === 'competition' ? () => onSelect(id) : () => onFilter(id)
              return <SidebarButton key={id} active={active} icon={Icon} onClick={action}>{label}</SidebarButton>
            })}
          </div>
        </SidebarSection>
      </nav>
    </div>
  )
}

export function FootballSidebar(props) {
  return (
    <aside className="sticky top-[var(--bds-space-16)] hidden max-h-[calc(100vh-var(--bds-space-32))] overflow-hidden rounded-[var(--bds-radius-md)] border border-[color-mix(in_srgb,var(--bds-color-border)_44%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-background)_82%,transparent)] shadow-none backdrop-blur-md lg:block">
      <FootballSidebarContent {...props} />
    </aside>
  )
}

export function FootballDrawer({ open, onClose, ...props }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navegacao de futebol">
      <button type="button" aria-label="Fechar navegacao" onClick={onClose} className="absolute inset-0 bg-[color-mix(in_srgb,var(--bds-color-background)_76%,transparent)] backdrop-blur-sm" />
      <aside className="absolute inset-y-0 left-0 w-[min(88vw,22rem)] border-r border-[var(--bds-color-border)] bg-[var(--bds-color-background)] shadow-[var(--bds-shadow-modal)]">
        <FootballSidebarContent {...props} onClose={onClose} />
      </aside>
    </div>
  )
}
