import { Heart, Search, Shield } from 'lucide-react'
import { Badge, Button } from '../../../../design-system'
import { FootballEmptyState, FootballPanel } from './FootballCommon'
import { FootballMatchCard } from './FootballMatchCard'

export function FootballSearchResults({ query, teams, competitions, matches, favoriteKeys, onTeam, onFavoriteTeam, onOpen, onFavoriteMatch, onClear }) {
  if (!query) return null
  const total = teams.length + competitions.length + matches.length

  return (
    <FootballPanel title={`Resultados para "${query}"`} eyebrow={`${total} itens encontrados`} icon={Search} action={<Button variant="secondary" onClick={onClear}>Limpar busca</Button>}>
      {!total ? <FootballEmptyState compact title="Nenhum resultado encontrado." actionLabel="Limpar filtros" onAction={onClear} /> : null}

      {teams.length ? (
        <div className="mb-[var(--bds-space-18)]">
          <h3 className="mb-[var(--bds-space-8)] text-sm font-black text-[var(--bds-color-text-secondary)]">Times</h3>
          <div className="grid gap-[var(--bds-space-8)] sm:grid-cols-2 xl:grid-cols-3">
            {teams.slice(0, 6).map((team) => {
              const favorited = favoriteKeys.has(`team:${team.id}`)
              return (
                <div key={team.id} className="flex items-center gap-[var(--bds-space-10)] rounded-[var(--bds-radius-sm)] border border-[color-mix(in_srgb,var(--bds-color-border)_44%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-surface)_14%,transparent)] px-[var(--bds-space-10)] py-[var(--bds-space-8)] shadow-none">
                  <button type="button" onClick={() => onTeam(team)} className="flex min-w-0 flex-1 items-center gap-[var(--bds-space-8)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)]">
                    {team.crest ? <img src={team.crest} alt="" className="h-9 w-9 object-contain" /> : <Shield size={20} className="text-[var(--bds-color-primary-hover)]" aria-hidden="true" />}
                    <span className="truncate text-sm font-bold text-[var(--bds-color-text)]">{team.name}</span>
                  </button>
                  <button type="button" onClick={() => onFavoriteTeam(team)} aria-pressed={favorited} aria-label={favorited ? `Remover ${team.name} dos favoritos` : `Favoritar ${team.name}`} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)] ${favorited ? 'border-[var(--bds-color-primary-hover)] bg-[color-mix(in_srgb,var(--bds-color-primary)_24%,transparent)] text-[var(--bds-color-primary-hover)]' : 'border-[var(--bds-color-border)] text-[var(--bds-color-text-secondary)] hover:text-[var(--bds-color-text)]'}`}>
                    <Heart size={14} fill={favorited ? 'currentColor' : 'none'} aria-hidden="true" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {competitions.length ? (
        <div className="mb-[var(--bds-space-18)]">
          <h3 className="mb-[var(--bds-space-8)] text-sm font-black text-[var(--bds-color-text-secondary)]">Competições</h3>
          <div className="flex flex-wrap gap-[var(--bds-space-6)]">
            {competitions.slice(0, 8).map((competition) => <Badge key={competition.id} className="rounded-[var(--bds-radius-xs)] border-[color-mix(in_srgb,var(--bds-color-primary-hover)_60%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-primary)_18%,transparent)] text-[var(--bds-color-text)] shadow-none">{competition.name} &bull; {competition.matches} jogos</Badge>)}
          </div>
        </div>
      ) : null}

      {matches.length ? (
        <div>
          <h3 className="mb-[var(--bds-space-8)] text-sm font-black text-[var(--bds-color-text-secondary)]">Partidas</h3>
          <div className="overflow-hidden border-y border-[color-mix(in_srgb,var(--bds-color-border)_46%,transparent)] bg-[color-mix(in_srgb,var(--bds-color-surface)_12%,transparent)]">
            {matches.slice(0, 8).map((match) => <FootballMatchCard key={match.id} match={match} onOpen={onOpen} favorited={favoriteKeys.has(`match:${match.id}`)} onFavorite={onFavoriteMatch} />)}
          </div>
        </div>
      ) : null}
    </FootballPanel>
  )
}
