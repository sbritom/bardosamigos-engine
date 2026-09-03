import { Globe2, LoaderCircle, Play, Star } from 'lucide-react'
import { Card } from '../../../design-system'

export function TVChannelCard({
  channel,
  active = false,
  favorite = false,
  favoriteBusy = false,
  unavailable = false,
  onSelect,
  onToggleFavorite,
}) {
  const category = channel.category?.name || channel.language || 'Ao vivo'
  const isGlobal = channel.availabilityScope === 'GLOBAL'

  return (
    <Card as="article" className={`tv-channel-card${active ? ' tv-channel-card--active' : ''}${unavailable ? ' opacity-70' : ''}`}>
      <button
        type="button"
        className="tv-channel-card__media"
        onClick={() => onSelect(channel)}
        aria-label={unavailable ? `Ver disponibilidade de ${channel.name}` : `Assistir ${channel.name}`}
      >
        {channel.logo ? (
          <img src={channel.logo} alt={`Logo do canal ${channel.name}`} loading="lazy" />
        ) : (
          <span>{channel.name.slice(0, 2).toUpperCase()}</span>
        )}
        <span className="tv-channel-card__play">
          {unavailable ? <Globe2 size={22} /> : <Play size={22} fill="currentColor" />}
        </span>
      </button>
      <div className="tv-channel-card__body">
        <div className="min-w-0">
          <strong>{channel.name}</strong>
          <span>{category}</span>
          {(isGlobal || unavailable) && (
            <small className="mt-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
              {unavailable ? 'Somente Brasil' : 'Global'}
            </small>
          )}
        </div>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => onToggleFavorite(channel)}
            disabled={favoriteBusy}
            aria-label={favorite ? `Remover ${channel.name} dos favoritos` : `Favoritar ${channel.name}`}
            aria-pressed={favorite}
            aria-busy={favoriteBusy}
            title={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className={`ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition disabled:cursor-wait disabled:opacity-70 ${favorite ? 'border-[var(--primary)] bg-[var(--primary)] text-white' : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text)]'}`}
          >
            {favoriteBusy ? (
              <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
            ) : (
              <Star size={17} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </Card>
  )
}
