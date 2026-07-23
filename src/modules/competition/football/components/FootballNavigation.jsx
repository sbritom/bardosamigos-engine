import { ChevronRight, Home, Menu, RefreshCw, Search, Trophy, X } from 'lucide-react'
import { FOOTBALL_COMPETITION_NAV } from '../constants/footballCenterConstants'

export function FootballBreadcrumb({ activeCompetition, onHome, onFootball }) {
  const competition = FOOTBALL_COMPETITION_NAV.find((item) => item.id === activeCompetition)
  const current = activeCompetition === 'favorites' ? 'Favoritos' : competition?.label

  return (
    <nav aria-label="Navegacao estrutural" className="sr-only">
      <button type="button" onClick={onHome}>
        <Home size={14} aria-hidden="true" /> Home
      </button>
      <ChevronRight size={13} aria-hidden="true" />
      <button type="button" onClick={onFootball} aria-current={current ? undefined : 'page'}>
        Futebol
      </button>
      {current ? <span aria-current="page">{current}</span> : null}
    </nav>
  )
}

export function FootballExperienceBar({
  searchTerm,
  onSearch,
  onClear,
  lastUpdatedAt,
  totalMatches,
  onOpenMenu,
  onRefresh,
}) {
  return (
    <section
      className="flex flex-wrap items-center justify-between gap-[var(--bds-space-12)] border-b border-[color-mix(in_srgb,var(--bds-color-border)_76%,transparent)] pb-[var(--bds-space-12)]"
      aria-label="Busca e sincronizacao"
    >
      <div className="flex min-w-max items-center gap-[var(--bds-space-10)]">
        <span className="flex h-9 w-9 items-center justify-center text-[var(--bds-color-primary-hover)]">
          <Trophy size={20} aria-hidden="true" />
        </span>
        <div>
          <p className="text-[var(--bds-font-micro)] font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text-muted)]">
            Central
          </p>
          <h1 className="text-xl font-black uppercase tracking-[var(--bds-letter-overline)] text-[var(--bds-color-text)]">
            Futebol
          </h1>
        </div>
      </div>

      <div className="relative min-w-[min(100%,22rem)] flex-1 rounded-full border border-[color-mix(in_srgb,var(--bds-color-border)_82%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-surface)_62%,transparent)] px-[var(--bds-space-16)] py-[var(--bds-space-10)] transition duration-[var(--bds-transition-fast)] focus-within:border-[var(--bds-color-primary-hover)]">
        <label htmlFor="football-search" className="sr-only">Buscar na central</label>
        <div className="flex items-center gap-[var(--bds-space-10)]">
          <Search size={18} className="shrink-0 text-[var(--bds-color-text-muted)]" aria-hidden="true" />
          <input
            id="football-search"
            type="search"
            value={searchTerm}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Pesquisar competicoes, times..."
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[var(--bds-color-text)] outline-none placeholder:text-[var(--bds-color-text-muted)]"
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={onClear}
              aria-label="Limpar busca"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--bds-color-text-secondary)] transition hover:text-[var(--bds-color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)]"
            >
              <X size={15} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        className="flex min-w-max items-center gap-[var(--bds-space-8)] rounded-full bg-[color-mix(in_srgb,var(--bds-color-surface)_50%,transparent)] px-[var(--bds-space-12)] py-[var(--bds-space-8)] text-xs text-[var(--bds-color-text-secondary)] transition hover:bg-[color-mix(in_srgb,var(--bds-color-primary)_24%,transparent)] hover:text-[var(--bds-color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)]"
        aria-label="Atualizar central"
      >
        <RefreshCw size={14} className="text-[var(--bds-color-primary-hover)]" aria-hidden="true" />
        <span>{totalMatches} jogos</span>
        <span className="hidden sm:inline">- {lastUpdatedAt || 'Atualizacao recente'}</span>
      </button>

      <button
        type="button"
        onClick={onOpenMenu}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--bds-color-border)] text-[var(--bds-color-text-secondary)] transition hover:border-[var(--bds-color-primary-hover)] hover:text-[var(--bds-color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)] lg:hidden"
        aria-label="Abrir menu de competicoes"
      >
        <Menu size={18} aria-hidden="true" />
      </button>
    </section>
  )
}
