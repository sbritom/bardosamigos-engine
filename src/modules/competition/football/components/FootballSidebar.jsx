import { Activity, Heart, LayoutGrid, X } from 'lucide-react'
import { FOOTBALL_COMPETITION_NAV } from '../constants/footballCenterConstants'
import { footballMatchBelongsToCompetition } from '../utils/footballCenterUtils'

const SIDEBAR_GROUPS = [
  { title: 'Nacionais', ids: ['BSA'] },
  { title: 'Continentais', ids: ['CLI', 'CL'] },
  { title: 'Internacionais', ids: ['PL', 'PD', 'SA', 'BL1', 'FL1'] },
  { title: 'Selecoes', ids: ['WC'] },
]

function FootballSidebarItem({ active, children, count, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`relative flex w-full items-center gap-[var(--bds-space-9)] rounded-[var(--bds-radius-sm)] px-[var(--bds-space-10)] py-[var(--bds-space-8)] text-left transition duration-[var(--bds-transition-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)] ${active ? 'bg-[color-mix(in_srgb,var(--bds-color-primary)_42%,transparent)] text-[var(--bds-color-text)] shadow-[inset_2px_0_0_var(--bds-color-primary-hover)]' : 'text-[var(--bds-color-text-secondary)] hover:bg-[color-mix(in_srgb,var(--bds-color-surface)_48%,transparent)] hover:text-[var(--bds-color-text)]'}`}
    >
      <Icon size={15} className="shrink-0 text-[var(--bds-color-primary-hover)]" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-sm font-black">{children}</span>
      {count !== undefined ? <span className="rounded-full bg-[color-mix(in_srgb,var(--bds-color-background)_62%,transparent)] px-[var(--bds-space-7)] py-[var(--bds-space-2)] text-[var(--bds-font-micro)] font-black tabular-nums text-[var(--bds-color-text-secondary)]">{count}</span> : null}
    </button>
  )
}

function FootballSidebarContent({ matches, activeCompetition, favoriteCount, onSelect, onClose }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[color-mix(in_srgb,var(--bds-color-border)_58%,transparent)] px-[var(--bds-space-14)] py-[var(--bds-space-14)]">
        <div>
          <p className="text-[var(--bds-font-micro)] font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text-muted)]">Navegacao</p>
          <h2 className="mt-[var(--bds-space-2)] text-base font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text)]">Futebol</h2>
        </div>
        {onClose ? (
          <button type="button" onClick={onClose} aria-label="Fechar menu" className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--bds-color-border)] text-[var(--bds-color-text-secondary)] transition hover:border-[var(--bds-color-primary-hover)] hover:text-[var(--bds-color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)]">
            <X size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-[var(--bds-space-12)] overflow-y-auto p-[var(--bds-space-10)]" aria-label="Competicoes de futebol">
        <section className="space-y-[var(--bds-space-5)]" aria-labelledby="football-sidebar-navigation">
          <h3 id="football-sidebar-navigation" className="px-[var(--bds-space-8)] text-[var(--bds-font-micro)] font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text-muted)]">Geral</h3>
          <FootballSidebarItem active={activeCompetition === 'all'} count={matches.length} icon={LayoutGrid} onClick={() => onSelect('all')}>Visao geral</FootballSidebarItem>
          <FootballSidebarItem active={activeCompetition === 'favorites'} count={favoriteCount} icon={Heart} onClick={() => onSelect('favorites')}>Favoritos</FootballSidebarItem>
        </section>

        {SIDEBAR_GROUPS.map((group) => (
          <section key={group.title} className="space-y-[var(--bds-space-5)] border-t border-[color-mix(in_srgb,var(--bds-color-border)_58%,transparent)] pt-[var(--bds-space-10)]" aria-label={group.title}>
            <h3 className="px-[var(--bds-space-8)] text-[var(--bds-font-micro)] font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text-muted)]">{group.title}</h3>
            {group.ids.map((id) => {
              const item = FOOTBALL_COMPETITION_NAV.find((navItem) => navItem.id === id)
              if (!item) return null
              const count = matches.filter((match) => footballMatchBelongsToCompetition(match, item)).length
              return <FootballSidebarItem key={item.id} active={activeCompetition === item.id} count={count} icon={item.icon} onClick={() => onSelect(item.id)}>{item.label}</FootballSidebarItem>
            })}
          </section>
        ))}
      </nav>

      <div className="border-t border-[color-mix(in_srgb,var(--bds-color-border)_58%,transparent)] p-[var(--bds-space-10)]">
        <div className="flex items-center gap-[var(--bds-space-8)] rounded-[var(--bds-radius-sm)] bg-[color-mix(in_srgb,var(--bds-color-surface)_26%,transparent)] px-[var(--bds-space-10)] py-[var(--bds-space-8)] text-xs text-[var(--bds-color-text-secondary)]">
          <Activity size={14} className="text-[var(--bds-color-success)]" aria-hidden="true" />
          <span className="font-black">Dados sincronizados</span>
        </div>
      </div>
    </div>
  )
}

export function FootballSidebar(props) {
  return (
    <aside className="sticky top-[var(--bds-space-16)] hidden max-h-[calc(100vh-var(--bds-space-32))] overflow-hidden rounded-[var(--bds-radius-md)] border border-[color-mix(in_srgb,var(--bds-color-border)_62%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-background)_72%,transparent)] shadow-none backdrop-blur-md lg:block">
      <FootballSidebarContent {...props} />
    </aside>
  )
}

export function FootballDrawer({ open, onClose, ...props }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navegacao por competicoes">
      <button type="button" aria-label="Fechar navegacao" onClick={onClose} className="absolute inset-0 bg-[color-mix(in_srgb,var(--bds-color-background)_76%,transparent)] backdrop-blur-sm" />
      <aside className="absolute inset-y-0 left-0 w-[min(88vw,22rem)] border-r border-[var(--bds-color-border)] bg-[var(--bds-color-background)] shadow-[var(--bds-shadow-modal)]">
        <FootballSidebarContent {...props} onClose={onClose} />
      </aside>
    </div>
  )
}
