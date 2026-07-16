import { CheckCircle2, Play } from 'lucide-react'
import { Card, IconButton } from '../../../design-system'

export function TVChannelCard({ channel, onSelect }) {
  return (
    <Card as="article" className="tv-channel-card">
      <button type="button" className="tv-channel-card__media" onClick={() => onSelect(channel)}>
        {channel.logo ? (
          <img src={channel.logo} alt="" loading="lazy" />
        ) : (
          <span>{channel.name.slice(0, 2).toUpperCase()}</span>
        )}
        <span className="tv-channel-card__play"><Play size={22} fill="currentColor" /></span>
      </button>
      <div className="tv-channel-card__body">
        <div>
          <strong>{channel.name}</strong>
          {channel.verified && <CheckCircle2 size={15} aria-label="Canal verificado" />}
        </div>
        <span>{channel.category?.name || channel.language || 'Ao vivo'}</span>
        <IconButton aria-label={`Assistir ${channel.name}`} title="Assistir" onClick={() => onSelect(channel)}>
          <Play size={17} />
        </IconButton>
      </div>
    </Card>
  )
}
