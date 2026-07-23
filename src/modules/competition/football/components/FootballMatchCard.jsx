import { ChevronRight, Clock3, Heart, Shield } from 'lucide-react'
import { FootballStatusBadge } from './FootballCommon'
import { formatFootballScore, getFootballMatchTime, getFootballStageLabel } from '../utils/footballCenterUtils'

function FootballMatchTeam({ name, crest, align = 'left' }) {
  return (
    <div className={`flex min-w-0 items-center gap-[var(--bds-space-8)] ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center drop-shadow-sm">
        {crest ? <img src={crest} alt="" className="h-full w-full object-contain" loading="lazy" /> : <Shield size={16} className="text-[var(--bds-color-primary-hover)]" aria-hidden="true" />}
      </span>
      <span className="truncate text-sm font-black leading-tight text-[var(--bds-color-text)]">{name || 'Time'}</span>
    </div>
  )
}

export function FootballMatchCard({ match, onOpen, compact = false, favorited = false, onFavorite }) {
  const stage = [match.competitionName, getFootballStageLabel(match.stage)].filter(Boolean).join(' - ')

  return (
    <article className={`group relative grid min-h-12 grid-cols-[minmax(0,1fr)] items-center border-b border-[color-mix(in_srgb,var(--bds-color-border)_58%,transparent)] bg-transparent px-[var(--bds-space-10)] py-[var(--bds-space-7)] transition duration-[var(--bds-transition-fast)] hover:bg-[color-mix(in_srgb,var(--bds-color-primary)_10%,transparent)] ${favorited ? 'shadow-[inset_2px_0_0_var(--bds-color-primary-hover)]' : ''}`}>
      <div className="grid items-center gap-[var(--bds-space-8)] md:grid-cols-[minmax(5rem,7rem)_minmax(0,1fr)_auto_minmax(0,1fr)_minmax(8rem,1fr)_auto]">
        <div className="flex items-center gap-[var(--bds-space-6)]">
          <FootballStatusBadge match={match} />
          <span className="hidden items-center gap-[var(--bds-space-4)] text-[var(--bds-font-micro)] font-bold text-[var(--bds-color-text-muted)] xl:flex">
            <Clock3 size={12} aria-hidden="true" />
            {getFootballMatchTime(match)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpen(match.id)}
          aria-label={`Abrir ${match.homeTeam} contra ${match.awayTeam}`}
          className="contents focus-visible:outline-none"
        >
          <FootballMatchTeam name={match.homeTeam} crest={match.homeCrest} />
          <strong className={`${compact ? 'text-base' : 'text-lg'} rounded-[var(--bds-radius-xs)] px-[var(--bds-space-8)] py-[var(--bds-space-3)] text-center font-black tabular-nums leading-none text-[var(--bds-color-text)] transition-colors group-hover:text-[var(--bds-color-primary-hover)]`}>
            {formatFootballScore(match)}
          </strong>
          <FootballMatchTeam name={match.awayTeam} crest={match.awayCrest} align="right" />
          <span className="hidden min-w-0 truncate text-xs font-bold text-[var(--bds-color-text-secondary)] md:block">{stage || 'Competicao'}</span>
          <ChevronRight size={15} className="hidden shrink-0 text-[var(--bds-color-text-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--bds-color-primary-hover)] md:block" aria-hidden="true" />
        </button>

        <div className="flex items-center justify-between gap-[var(--bds-space-8)] md:hidden">
          <span className="truncate text-xs text-[var(--bds-color-text-secondary)]">{stage || 'Competicao'}</span>
          <span className="text-xs font-bold text-[var(--bds-color-text-muted)]">{getFootballMatchTime(match)}</span>
        </div>

        {onFavorite ? (
          <button
            type="button"
            onClick={() => onFavorite(match)}
            aria-pressed={favorited}
            aria-label={favorited ? `Remover ${match.homeTeam} contra ${match.awayTeam} dos favoritos` : `Favoritar ${match.homeTeam} contra ${match.awayTeam}`}
            className={`absolute right-[var(--bds-space-8)] top-[var(--bds-space-8)] hidden h-7 w-7 items-center justify-center rounded-full border transition duration-[var(--bds-transition-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)] md:flex ${favorited ? 'border-[var(--bds-color-primary-hover)] bg-[var(--bds-color-primary)] text-[var(--bds-color-text)]' : 'border-transparent text-[var(--bds-color-text-muted)] hover:border-[var(--bds-color-border)] hover:text-[var(--bds-color-text)]'}`}
          >
            <Heart size={13} fill={favorited ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </article>
  )
}
