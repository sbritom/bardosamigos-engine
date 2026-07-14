import { Play } from 'lucide-react'
import { Card } from '../../../design-system'

export function TVChannelCard({ channel, active = false, onSelect }) {
  const category = channel.category?.name || channel.language || 'Ao vivo'

  return (
    <Card as="article" className={`tv-channel-card${active ? ' tv-channel-card--active' : ''}`}>
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
          <span>{category}</span>
        </div>
      </div>
    </Card>
  )
}
