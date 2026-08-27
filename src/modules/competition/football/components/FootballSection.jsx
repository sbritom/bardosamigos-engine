import { FootballEmptyState, FootballPanel } from './FootballCommon'
import { FootballMatchCard } from './FootballMatchCard'

export function FootballSection({ title, eyebrow, icon, matches, onOpen, emptyTitle, emptyDescription, limit = 8, columns = true, favoriteKeys, onFavorite, onClear }) {
  return (
    <FootballPanel title={title} eyebrow={eyebrow} icon={icon}>
      {matches.length ? <div className={`overflow-hidden border-y border-[color-mix(in_srgb,var(--bds-color-border)_52%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-surface)_12%,transparent)] ${columns ? '' : ''}`}>{matches.slice(0, limit).map((match) => <FootballMatchCard key={match.id} match={match} onOpen={onOpen} compact favorited={favoriteKeys?.has(`match:${match.id}`)} onFavorite={onFavorite} />)}</div> : <FootballEmptyState compact title={emptyTitle} description={emptyDescription} actionLabel={onClear ? 'Limpar filtros' : undefined} onAction={onClear} />}
    </FootballPanel>
  )
}
