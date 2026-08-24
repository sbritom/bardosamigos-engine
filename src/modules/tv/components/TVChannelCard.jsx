import { Play, Star } from 'lucide-react'
import { Card } from '../../../design-system'

export function TVChannelCard({ channel, active = false, favorite = false, onSelect, onToggleFavorite }) {
  const category = channel.category?.name || channel.language || 'Ao vivo'

  return (
    <Card as="article" className={`tv-channel-card${active ? ' tv-channel-card--active' : ''}`}>
      <button type="button" className="tv-channel-card__media" onClick={() => onSelect(channel)} aria-label={`Assistir ${channel.name}`}>
        {channel.logo ? (
          <img src={channel.logo} alt={`Logo do canal ${channel.name}`} loading="lazy" />
        ) : (
          <span>{channel.name.slice(0, 2).toUpperCase()}</span>
        )}
        <span className="tv-channel-card__play"><Play size={22} fill="currentColor" /></span>
      </button>
      <div className="tv-channel-card__body">
        <div className="min-w-0">
          <strong>{channel.name}</strong>
          <span>{category}</span>
        </div>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => onToggleFavorite(channel)}
            aria-label={favorite ? `Remover ${channel.name} dos favoritos` : `Favoritar ${channel.name}`}
            aria-pressed={favorite}
            title={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className={`ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${favorite ? 'border-[var(--primary)] bg-[var(--primary)] text-white' : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text)]'}`}
          >
            <Star size={17} fill={favorite ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
    </Card>
  )
}
